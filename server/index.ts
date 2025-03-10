import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { createServer } from "net";
import aiRouter from './routes/ai';
import cron from 'node-cron';
import { processSubscriptionDowngrades } from './services/cronService';

const app = express();

// Essential middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // Schedule subscription downgrade processing to run daily at 2 AM
  cron.schedule('0 2 * * *', async () => {
    try {
      log('Starting scheduled subscription downgrade processing');
      const results = await processSubscriptionDowngrades();
      log(`Completed subscription downgrade processing. Processed ${results.length} downgrades`);
    } catch (error) {
      console.error('Error in scheduled subscription downgrade processing:', error);
    }
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  try {
    // Use environment port if available, otherwise use 5000
    const port = Number(process.env.PORT) || 5000;
    server.listen(port, () => {
      log(`serving on port ${port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
})();