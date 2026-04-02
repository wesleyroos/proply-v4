import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { createServer } from "net";
import aiRouter from './routes/ai';
import './services/autoSync'; // Initialize auto-sync service
import { startAutomatedBilling } from './billing/automated-billing';
import fs from "fs";
import path from "path";
import { db } from "../db";
import { propdataListings } from "../db/schema";
import { eq } from "drizzle-orm";

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

// Serve static PDF files directly from the public folder
app.use('/static-assets', express.static('public'));

(async () => {
  const server = registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // ── Open Graph meta tag injection for /report/:propertyId ──
  // Must be registered before the vite/static catch-all so WhatsApp/social
  // crawlers (which don't execute JS) receive proper OG tags.
  app.get("/report/:propertyId", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { propertyId } = req.params;
      const property = await db.query.propdataListings.findFirst({
        where: eq(propdataListings.propdataId, propertyId),
      });

      // Determine index.html location (production vs dev)
      const isDev = app.get("env") === "development";
      const htmlPath = isDev
        ? path.resolve(__dirname, "..", "client", "index.html")
        : path.resolve(__dirname, "public", "index.html");

      if (!fs.existsSync(htmlPath)) return next();

      let html = fs.readFileSync(htmlPath, "utf-8");

      if (property) {
        const p = property as any;
        const isValuation = /valuation|evaluation/i.test(p.status ?? "");
        const title = isValuation
          ? `Valuation Report: ${p.address}`
          : `Property for Sale: ${p.address}`;
        const description = [
          p.bedrooms ? `${p.bedrooms} bed` : null,
          p.bathrooms ? `${p.bathrooms} bath` : null,
          p.floorSize ? `${p.floorSize}m²` : null,
          p.propertyType ?? null,
        ].filter(Boolean).join(" · ");
        const images: string[] = Array.isArray(p.images) ? p.images : [];
        const imageUrl = images[0] ?? "";
        const pageUrl = `https://app.proply.co.za/report/${propertyId}`;

        const ogTags = `
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${pageUrl}" />
    <meta property="og:title" content="${title.replace(/"/g, "&quot;")}" />
    <meta property="og:description" content="${description.replace(/"/g, "&quot;")}" />
    ${imageUrl ? `<meta property="og:image" content="${imageUrl}" />` : ""}
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title.replace(/"/g, "&quot;")}" />
    <meta name="twitter:description" content="${description.replace(/"/g, "&quot;")}" />
    ${imageUrl ? `<meta name="twitter:image" content="${imageUrl}" />` : ""}`;

        html = html.replace("</head>", `${ogTags}\n  </head>`);
      }

      res.status(200).set("Content-Type", "text/html").end(html);
    } catch (err) {
      next(err);
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
    const port = process.env.PORT || 5000;
    server.listen(Number(port), "0.0.0.0", () => {
      log(`serving on port ${port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
})();

// Start automated billing system
startAutomatedBilling();