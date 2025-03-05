import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { createServer } from "net";
import aiRouter from './routes/ai';
import rateLimit from 'express-rate-limit';

const app = express();

// Configure different rate limiters for different routes
const standardLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 150, // limit each IP to 150 requests per windowMs
  message: { 
    error: 'Too many requests from this IP. Please try again after 15 minutes.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // limit each IP to 20 AI requests per minute
  message: { 
    error: 'AI request limit reached. Please wait a minute before trying again.',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Essential middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Apply standard rate limiting to all non-AI API routes
app.use(/^\/api\/(?!ai).+/, standardLimiter);

// Apply AI-specific rate limiting to AI routes
app.use('/api/ai', aiLimiter);

// Domain redirect middleware
app.use((req, res, next) => {
  const host = req.hostname;
  if (host === 'proply.replit.app') {
    return res.redirect(301, `https://app.proply.co.za${req.originalUrl}`);
  }
  next();
});

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Register AI routes
app.use('/api', aiRouter);

(async () => {
  const server = registerRoutes(app);

  // Enhanced error handling
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    const retryAfter = err.retryAfter || undefined;

    // Set retry-after header for rate limit errors
    if (status === 429) {
      res.set('Retry-After', retryAfter || '900'); // 15 minutes in seconds
      res.set('X-RateLimit-Reset', String(Date.now() + (parseInt(retryAfter || '900') * 1000)));
    }

    // Include more detailed error information in development
    const errorResponse = {
      message,
      retryAfter,
      ...(app.get('env') === 'development' ? { stack: err.stack } : {})
    };

    res.status(status).json(errorResponse);

    // Only log errors, don't throw them
    if (status >= 500) {
      console.error(err);
    }
  });

  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  try {
    const port = parseInt(process.env.PORT || "5000", 10);
    server.listen(port, () => {
      log(`serving on port ${port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
})();