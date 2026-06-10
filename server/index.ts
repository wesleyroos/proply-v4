import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { createServer } from "net";
import aiRouter from './routes/ai';
import './services/autoSync'; // Initialize auto-sync service
import { startAutomatedBilling } from './billing/automated-billing';
import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import { db } from "../db";
import { propdataListings } from "../db/schema";
import { eq, sql } from "drizzle-orm";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Trust Railway's load balancer so req.ip and rate limiters see real client IPs
app.set('trust proxy', 1);

// Security headers
app.use((_req, res, next) => {
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer-when-downgrade');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  res.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.payfast.co.za https://sandbox.payfast.co.za https://maps.googleapis.com https://maps.gstatic.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https: http:",
      "connect-src 'self' https://api.pricelabs.co https://api.openai.com https://maps.googleapis.com",
      "frame-src https://www.payfast.co.za https://sandbox.payfast.co.za https://www.google.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self' https://www.payfast.co.za https://sandbox.payfast.co.za",
    ].join('; ')
  );
  next();
});

// CSRF origin check on state-changing API requests
const ALLOWED_ORIGINS = ['https://app.proply.co.za', 'https://proply.co.za'];
// Server-to-server webhooks have no browser Origin — exempt them from CSRF check
const CSRF_EXEMPT_PATHS = ['/api/subscription/payfast-itn'];
app.use((req, res, next) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) && req.path.startsWith('/api')) {
    const origin = req.headers.origin ?? req.headers.referer ?? '';
    const isDev = app.get('env') === 'development';
    const isExempt = CSRF_EXEMPT_PATHS.some(p => req.path.startsWith(p));
    // CSRF-VULN-002/003/005: also reject requests with no Origin header (not just wrong origin)
    if (!isDev && !isExempt && (!origin || !ALLOWED_ORIGINS.some(o => origin.startsWith(o)))) {
      return res.status(403).json({ error: 'Forbidden: cross-origin request rejected' });
    }
  }
  next();
});

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
  // Fix users_id_seq if it has fallen behind the actual max id (can happen after manual inserts or imports)
  await db.execute(sql`SELECT setval('users_id_seq', GREATEST((SELECT COALESCE(MAX(id), 1) FROM users), nextval('users_id_seq') - 1))`);

  const server = registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = status < 500 ? (err.message || "Bad request") : "Internal Server Error";

    console.error("Unhandled error:", err instanceof Error ? err.message : err);
    res.status(status).json({ message });
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

  // ── robots.txt ──
  app.get("/robots.txt", (_req: Request, res: Response) => {
    res.type("text/plain").send(
      "User-agent: *\nAllow: /\nSitemap: https://app.proply.co.za/sitemap.xml\n"
    );
  });

  // ── sitemap.xml ──
  app.get("/sitemap.xml", async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await db.execute(sql`
        SELECT suburb, max(sale_date) AS latest_sale
        FROM comparable_sales
        WHERE suburb IS NOT NULL
        GROUP BY suburb
        ORDER BY suburb
      `);

      function slugify(str: string): string {
        return str.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      }

      const base = "https://app.proply.co.za";
      const today = new Date().toISOString().substring(0, 10);

      const suburbUrls = result.rows.map((r: any) => `
  <url>
    <loc>${base}/market/${slugify(r.suburb)}</loc>
    <lastmod>${r.latest_sale ? String(r.latest_sale).substring(0, 10) : today}</lastmod>
    <changefreq>weekly</changefreq>
  </url>`).join("");

      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${base}/market</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
  </url>${suburbUrls}
</urlset>`;

      res.type("application/xml").send(xml);
    } catch (err) {
      next(err);
    }
  });

  // ── OG meta injection for /market (index) ──
  app.get("/market", async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const isDev = app.get("env") === "development";
      const htmlPath = isDev
        ? path.resolve(__dirname, "..", "client", "index.html")
        : path.resolve(__dirname, "public", "index.html");

      if (!fs.existsSync(htmlPath)) return next();

      let html = fs.readFileSync(htmlPath, "utf-8");

      const ogTags = `
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://app.proply.co.za/market" />
    <meta property="og:title" content="South Africa Property Market Data by Suburb | Proply" />
    <meta property="og:description" content="Browse real title deed sale prices across South African suburbs. Median prices, R/m² and recent sales — all free." />
    <meta name="description" content="Browse real title deed sale prices across South African suburbs. Median prices, R/m² and recent sales — all free." />`;

      html = html.replace("</head>", `${ogTags}\n  </head>`);
      res.status(200).set("Content-Type", "text/html").end(html);
    } catch (err) {
      next(err);
    }
  });

  // ── OG meta injection for /market/:suburb ──
  app.get("/market/:suburb", async (req: Request, res: Response, next: NextFunction) => {
    try {
      function unslugify(slug: string) { return slug.replace(/-/g, " "); }

      const suburbName = unslugify(req.params.suburb);

      const result = await db.execute(sql`
        SELECT
          count(*)::int AS total_sales,
          percentile_cont(0.5) WITHIN GROUP (ORDER BY sale_price)::int AS median_price,
          percentile_cont(0.5) WITHIN GROUP (ORDER BY price_per_sqm)::int AS median_price_per_sqm
        FROM comparable_sales
        WHERE suburb ILIKE ${suburbName}
      `);

      const stats = result.rows[0] as any;

      const isDev = app.get("env") === "development";
      const htmlPath = isDev
        ? path.resolve(__dirname, "..", "client", "index.html")
        : path.resolve(__dirname, "public", "index.html");

      if (!fs.existsSync(htmlPath)) return next();

      let html = fs.readFileSync(htmlPath, "utf-8");

      const displaySuburb = suburbName.replace(/\b\w/g, (c) => c.toUpperCase());
      const safeSlug = encodeURIComponent(req.params.suburb).replace(/%2F/g, '/');
      const pageUrl = `https://app.proply.co.za/market/${safeSlug}`;

      const title = `Property Sales in ${displaySuburb} | Proply`;
      let description = `Explore recent property sales in ${displaySuburb}.`;
      if (stats?.total_sales) {
        const price = stats.median_price ? `R${Number(stats.median_price).toLocaleString("en-ZA")}` : null;
        const rpm = stats.median_price_per_sqm ? `R${Number(stats.median_price_per_sqm).toLocaleString("en-ZA")}/m²` : null;
        description = `${stats.total_sales} sales in ${displaySuburb}${price ? ` | Median ${price}` : ""}${rpm ? ` | ${rpm}` : ""}.`;
      }

      const ogTags = `
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${pageUrl.replace(/"/g, '&quot;').replace(/</g, '&lt;')}" />
    <meta property="og:title" content="${title.replace(/"/g, "&quot;")}" />
    <meta property="og:description" content="${description.replace(/"/g, "&quot;")}" />
    <meta name="description" content="${description.replace(/"/g, "&quot;")}" />`;

      html = html.replace("</head>", `${ogTags}\n  </head>`);
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