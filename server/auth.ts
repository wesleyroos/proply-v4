import passport from "passport";
import { IVerifyOptions, Strategy as LocalStrategy } from "passport-local";
import { type Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import createMemoryStore from "memorystore";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { users, insertUserSchema, accessCodes, type SelectUser, passwordResetTokens } from "@db/schema";
import { db } from "@db";
import { eq, and, isNull } from "drizzle-orm";
import { sendNewUserNotification, sendPasswordResetEmail, sendWelcomeEmail } from "./services/email";

// Add the requireAuth middleware export
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
};

// Role-based authentication middleware
export const requireRole = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    const user = req.user as any;
    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    
    next();
  };
};

// Admin authentication (backward compatibility)
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Authentication required" });
  }
  
  const user = req.user as any;
  // Check both new role system and legacy isAdmin for backward compatibility
  if (user.role !== 'system_admin' && !user.isAdmin) {
    return res.status(403).json({ error: "Admin access required" });
  }
  
  next();
};

const scryptAsync = promisify(scrypt);
export const crypto = {
  hash: async (password: string) => {
    const salt = randomBytes(16).toString("hex");
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${buf.toString("hex")}.${salt}`;
  },
  compare: async (suppliedPassword: string, storedPassword: string) => {
    const [hashedPassword, salt] = storedPassword.split(".");
    const hashedPasswordBuf = Buffer.from(hashedPassword, "hex");
    const suppliedPasswordBuf = (await scryptAsync(
      suppliedPassword,
      salt,
      64
    )) as Buffer;
    return timingSafeEqual(hashedPasswordBuf, suppliedPasswordBuf);
  },
};

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

export function setupAuth(app: Express) {
  const MemoryStore = createMemoryStore(session);
  const sessionSettings: session.SessionOptions = {
    secret: "proply-session-secret-stable", // Use a stable secret
    resave: true, // Force session save on each request
    saveUninitialized: true, // Save uninitialized sessions
    name: 'proply.sid',
    cookie: {
      httpOnly: false, // Allow client-side access for debugging
      sameSite: 'lax',
      secure: false,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: '/'
    },
    store: new MemoryStore({
      checkPeriod: 86400000,
    }),
  };

  if (app.get("env") === "production") {
    app.set("trust proxy", 1);
    if (sessionSettings.cookie) {
      sessionSettings.cookie.secure = true;
    }
  }

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());
  
  // Session middleware setup complete

  passport.use(
    new LocalStrategy({
      usernameField: 'email',
      passwordField: 'password'
    }, async (email, password, done) => {
      try {
        console.log("Login attempt with email:", email);

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        if (!user) {
          console.log("No user found with email:", email);
          return done(null, false, { message: "No account found with this email address." });
        }

        const isMatch = await crypto.compare(password, user.password);
        if (!isMatch) {
          console.log("Password mismatch for email:", email);
          return done(null, false, { message: "Incorrect password." });
        }

        // Update last login timestamp
        await db
          .update(users)
          .set({ lastLoginAt: new Date() })
          .where(eq(users.id, user.id));

        console.log("Login successful for user:", user.id);
        return done(null, user);
      } catch (err) {
        console.error("Login error:", err);
        return done(err);
      }
    })
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);

      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      console.log("Registration payload:", req.body);

      // Validate request body
      const result = insertUserSchema.safeParse(req.body);
      if (!result.success) {
        console.log("Validation errors:", result.error.issues);
        return res
          .status(400)
          .send("Invalid input: " + result.error.issues.map(i => i.message).join(", "));
      }

      const { 
        email: username, 
        password, 
        email, 
        userType, 
        company, 
        firstName, 
        lastName, 
        accessCode,
        subscriptionStatus = 'free'
      } = req.body;

      console.log("Processing registration with subscription status:", subscriptionStatus);

      let validCode = null;
      if (accessCode) {
        // Only validate access code if one is provided
        const [code] = await db
          .select()
          .from(accessCodes)
          .where(eq(accessCodes.code, accessCode))
          .where(eq(accessCodes.isUsed, false))
          .limit(1);

        if (!code) {
          return res.status(400).send("Invalid or already used access code");
        }

        if (code.expiresAt && new Date(code.expiresAt) < new Date()) {
          return res.status(400).send("Access code has expired");
        }

        validCode = code;
      }

      // Check if user already exists
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (existingUser) {
        return res.status(400).send("Email already exists");
      }

      // Hash the password
      const hashedPassword = await crypto.hash(password);

      // Create the new user with explicit subscription status
      const userData = {
        username,
        password: hashedPassword,
        email,
        userType,
        company,
        firstName,
        lastName,
        subscriptionStatus: validCode ? "pro" : subscriptionStatus,
        accessCodeId: validCode?.id || null,
      };

      console.log("Creating user with data:", {
        ...userData,
        password: '[REDACTED]'
      });

      const [newUser] = await db
        .insert(users)
        .values(userData)
        .returning();

      console.log("User created successfully:", {
        id: newUser.id,
        email: newUser.email,
        subscriptionStatus: newUser.subscriptionStatus
      });

      // Send welcome email to the new user
      await sendWelcomeEmail({
        email: newUser.email || '',
        firstName: newUser.firstName || 'there'
      }).catch(error => {
        console.error('Failed to send welcome email:', error);
        // Don't fail registration if email fails
      });

      // Send admin notification email
      await sendNewUserNotification({
        email: newUser.email || '',
        firstName: newUser.firstName || '',
        lastName: newUser.lastName || '',
        userType: newUser.userType || 'individual',
        subscriptionStatus: newUser.subscriptionStatus || 'free'
      }).catch(error => {
        console.error('Failed to send admin notification email:', error);
        // Don't fail registration if email fails
      });

      // Mark the access code as used if applicable
      if (validCode) {
        await db
          .update(accessCodes)
          .set({
            isUsed: true,
            usedAt: new Date(),
            usedBy: newUser.id,
          })
          .where(eq(accessCodes.id, validCode.id));
      }

      req.login(newUser, (err) => {
        if (err) {
          return next(err);
        }
        return res.json({
          message: "Registration successful",
          user: { 
            id: newUser.id, 
            username: newUser.username,
            subscriptionStatus: newUser.subscriptionStatus,
            subscriptionExpiryDate: newUser.subscriptionExpiryDate
          },
        });
      });
    } catch (error) {
      console.error("Registration error:", error);
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: Express.User, info: IVerifyOptions) => {
      if (err) {
        console.error("Login error:", err);
        return next(err);
      }

      if (!user) {
        console.log("Login failed:", info.message);
        return res.status(401).json({
          message: info.message ?? "Invalid credentials"
        });
      }

      req.logIn(user, (err) => {
        if (err) {
          console.error("Login session error:", err);
          return next(err);
        }

        return res.json({
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          userType: user.userType,
          company: user.company,
          companyLogo: user.companyLogo,
          subscriptionStatus: user.subscriptionStatus,
          subscriptionExpiryDate: user.subscriptionExpiryDate,
          isAdmin: user.isAdmin
        });
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).send("Logout failed");
      }
      res.json({ message: "Logout successful" });
    });
  });

  // GET /api/user is handled by the comprehensive endpoint in routes.ts (includes product flags, etc.)

  // Add new password reset endpoints
  app.post("/api/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      // Find user by email
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (!user) {
        // Don't reveal if user exists
        return res.status(200).json({
          message: "If an account exists with this email, you will receive a password reset link"
        });
      }

      // Create password reset token
      const [token] = await db
        .insert(passwordResetTokens)
        .values({
          userId: user.id,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
        })
        .returning();

      // Send password reset email
      await sendPasswordResetEmail(email, token.token);

      res.status(200).json({
        message: "If an account exists with this email, you will receive a password reset link"
      });
    } catch (error) {
      console.error("Password reset request error:", error);
      res.status(500).json({ message: "Failed to process password reset request" });
    }
  });

  app.post("/api/reset-password", async (req, res) => {
    try {
      const { token, password } = req.body;

      if (!token || !password) {
        return res.status(400).json({ message: "Token and password are required" });
      }

      // Find valid token
      const [resetToken] = await db
        .select()
        .from(passwordResetTokens)
        .where(
          and(
            eq(passwordResetTokens.token, token),
            isNull(passwordResetTokens.usedAt)
          )
        )
        .limit(1);

      if (!resetToken) {
        return res.status(400).json({ message: "Invalid or expired token" });
      }

      if (new Date(resetToken.expiresAt) < new Date()) {
        return res.status(400).json({ message: "Token has expired" });
      }

      // Update user's password
      const hashedPassword = await crypto.hash(password);
      await db
        .update(users)
        .set({ password: hashedPassword })
        .where(eq(users.id, resetToken.userId));

      // Mark token as used
      await db
        .update(passwordResetTokens)
        .set({ usedAt: new Date() })
        .where(eq(passwordResetTokens.id, resetToken.id));

      res.status(200).json({ message: "Password has been reset successfully" });
    } catch (error) {
      console.error("Password reset error:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  return app;
}