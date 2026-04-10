import { Router } from "express";
import { db } from "../../db";
import {
  agencyBranches,
  propdataListings,
  valuationReports,
  rentalPerformanceData,
  users,
} from "../../db/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import { decrypt } from "../utils/encryption";
import { trackReportGeneration } from "../utils/report-tracker";
import { trackAgencyReportUsage } from "../utils/billing-tracker";

const router = Router();

/**
 * Middleware: authenticate partner requests via x-api-key header.
 * Resolves the agency branch and attaches it to req.agencyBranch.
 */
async function authenticatePartner(
  req: any,
  res: any,
  next: any
) {
  const apiKey = req.headers["x-api-key"];
  if (!apiKey) {
    return res.status(401).json({ error: "Missing x-api-key header" });
  }

  try {
    // Find all agency branches that have an API key set
    const branches = await db
      .select()
      .from(agencyBranches)
      .where(sql`${agencyBranches.apiKey} IS NOT NULL`);

    let matchedBranch = null;
    for (const branch of branches) {
      try {
        const decryptedKey = decrypt(branch.apiKey!);
        if (decryptedKey === apiKey) {
          matchedBranch = branch;
          break;
        }
      } catch {
        // Decryption failed for this branch — skip
        continue;
      }
    }

    if (!matchedBranch) {
      return res.status(401).json({ error: "Invalid API key" });
    }

    if (matchedBranch.status !== "active") {
      return res.status(403).json({ error: "Agency is inactive" });
    }

    (req as any).agencyBranch = matchedBranch;
    next();
  } catch (error) {
    console.error("Partner auth error:", error);
    return res.status(500).json({ error: "Authentication failed" });
  }
}

/**
 * Find (or create) a system-level user for this agency branch
 * so that DB writes to valuationReports / rentalPerformanceData have a userId.
 */
async function getAgencyUserId(branchId: number): Promise<number> {
  // Look for any user linked to this branch
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.branchId, branchId))
    .limit(1);

  if (existing.length > 0) return existing[0].id;

  // Fallback: look for any user linked to the franchise
  const byFranchise = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.franchiseId, branchId))
    .limit(1);

  if (byFranchise.length > 0) return byFranchise[0].id;

  // Last resort: use user ID 1 (system admin)
  return 1;
}

// ─── POST /generate-report ─────────────────────────────────────────
// Triggers the full Proply valuation pipeline for a listing and returns
// the report preview URL. This is the main endpoint James will call.
router.post("/generate-report", authenticatePartner, async (req, res) => {
  const startTime = Date.now();

  try {
    const { propertyId } = req.body;
    const branch = (req as any).agencyBranch;

    if (!propertyId) {
      return res.status(400).json({ error: "propertyId is required" });
    }

    // 1. Look up the listing — must belong to this agency's branch
    const [listing] = await db
      .select()
      .from(propdataListings)
      .where(
        and(
          eq(propdataListings.propdataId, propertyId),
          eq(propdataListings.branchId, branch.id)
        )
      )
      .limit(1);

    if (!listing) {
      return res.status(404).json({
        error: "Property not found or does not belong to your agency",
      });
    }

    // 2. Check if a valuation report already exists
    const existingReport = await db.query.valuationReports.findFirst({
      where: eq(valuationReports.propertyId, propertyId),
      orderBy: [desc(valuationReports.updatedAt)],
    });

    if (existingReport) {
      const baseUrl = process.env.APP_URL || "https://proply.co.za";
      return res.json({
        status: "existing",
        reportUrl: `${baseUrl}/report/${propertyId}`,
        propertyId,
        generatedAt: existingReport.createdAt.toISOString(),
      });
    }

    // 3. Run the full valuation pipeline
    console.log(`[Partner API] Generating report for ${propertyId} (${listing.address})`);

    const userId = await getAgencyUserId(branch.id);

    // ── 3a. Fetch comparable sales ──
    let comparableSalesData = null;
    try {
      const { getComparableSalesByCoordinates } = await import(
        "../services/knowledgeFactoryService"
      );

      const location = listing.location as any;
      let coordinates =
        location?.latitude && location?.longitude ? location : null;

      if (!coordinates) {
        // Geocode the address
        const { default: fetch } = await import("node-fetch");
        const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(listing.address)}&key=${process.env.GOOGLE_MAPS_API_KEY}`;
        const geoRes = await fetch(geocodeUrl);
        const geoData = (await geoRes.json()) as any;
        if (geoData.results?.[0]?.geometry?.location) {
          const loc = geoData.results[0].geometry.location;
          coordinates = { latitude: loc.lat, longitude: loc.lng };
        }
      }

      if (coordinates) {
        const KF_PROPERTY_TYPE_MAP: Record<string, string> = {
          sectional_title: "S",
          apartment: "S",
          flat: "S",
          house: "F",
          freehold: "F",
          townhouse: "F",
        };
        const kfType = listing.propertyType
          ? KF_PROPERTY_TYPE_MAP[listing.propertyType.toLowerCase()] ?? undefined
          : undefined;

        const kfProperties = await getComparableSalesByCoordinates(
          coordinates,
          kfType
        );
        if (kfProperties.length > 0) {
          const titleDeedProperties = kfProperties.map((p: any) => ({
            address: p.address,
            suburb: p.suburb,
            salePrice: p.salePrice,
            size: p.size,
            pricePerSqM: p.pricePerSqM,
            saleDate: p.saleDate,
            bedrooms: p.bedrooms,
            source: "knowledgeFactory",
          }));
          const validPrices = titleDeedProperties.filter(
            (p: any) => p.salePrice > 0
          );
          const averageSalePrice =
            validPrices.length > 0
              ? Math.round(
                  validPrices.reduce(
                    (sum: number, p: any) => sum + p.salePrice,
                    0
                  ) / validPrices.length
                )
              : 0;
          comparableSalesData = {
            titleDeedProperties,
            properties: [],
            averageSalePrice,
            dataSource: "knowledgeFactory",
          };
        }
      }
    } catch (compError) {
      console.warn("[Partner API] Comparable sales fetch failed (non-fatal):", compError);
    }

    // ── 3b. Generate valuation via OpenAI (reuse the existing endpoint internally) ──
    // We call the same logic as POST /api/generate-valuation-report by making
    // an internal HTTP request. This keeps the code DRY and ensures consistency.
    const { default: fetch } = await import("node-fetch");
    const internalUrl = `http://localhost:${process.env.PORT || 5000}`;

    // We need to create a temporary session for internal calls.
    // Instead, we'll directly import and call the OpenAI logic from the valuation module.
    // But the valuation endpoint requires req.user — so we'll replicate the core logic inline.

    const OpenAI = (await import("openai")).default;
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "not-configured" });

    const address = listing.address;
    const propertyType = listing.propertyType;
    const bedrooms = listing.bedrooms || 2;
    const bathrooms = listing.bathrooms || 1;
    const parkingSpaces = listing.parkingSpaces;
    const floorSize = listing.floorSize ? parseFloat(listing.floorSize.toString()) : null;
    const landSize = listing.landSize ? parseFloat(listing.landSize.toString()) : null;
    const price = listing.price ? parseFloat(listing.price.toString()) : 0;
    const images = (listing.images as string[]) || [];
    const location = listing.location as any;
    const monthlyLevy = listing.monthlyLevy ? parseFloat(listing.monthlyLevy.toString()) : undefined;

    // Normalize property type
    const normalizedPropertyType =
      propertyType === "Apartment Block" ? "Apartment" :
      propertyType === "Sectional Title" ? "Apartment" :
      propertyType === "Flat" ? "Apartment" :
      propertyType === "Freestanding" ? "House" :
      propertyType || "Property";

    // City & location detection
    const addressLower = address.toLowerCase();
    const isCapeTown = ["cape town", "mouille point", "sea point", "camps bay", "waterfront", "bantry bay", "clifton", "green point", "v&a", "tamboerskloof"].some(k => addressLower.includes(k));
    const isJohannesburg = ["johannesburg", "sandton", "rosebank", "bryanston", "hyde park", "melrose"].some(k => addressLower.includes(k));
    const isDurban = ["durban", "umhlanga", "ballito", "westville"].some(k => addressLower.includes(k));
    const isPretoria = ["pretoria", "centurion", "waterkloof"].some(k => addressLower.includes(k));

    const isPremiumLocation =
      (isCapeTown && ["mouille point", "sea point", "camps bay", "waterfront", "bantry bay", "clifton"].some(k => addressLower.includes(k))) ||
      (isJohannesburg && ["sandton", "rosebank", "hyde park"].some(k => addressLower.includes(k))) ||
      (isDurban && ["umhlanga", "ballito"].some(k => addressLower.includes(k)));

    // Location context
    const cityName = isCapeTown ? "Cape Town" : isJohannesburg ? "Johannesburg" : isDurban ? "Durban" : isPretoria ? "Pretoria" : "South Africa";
    const locationContext = isPremiumLocation
      ? `PREMIUM ${cityName.toUpperCase()} LOCATION: This property is in one of ${cityName}'s most exclusive areas with premium market positioning.`
      : `${cityName.toUpperCase()} PROPERTY: Standard ${cityName} market conditions apply.`;
    const marketRates = `Use your knowledge of current ${cityName} property market rates for similar properties in this location.`;
    const rentalGuidance = `
- Use your knowledge of current ${cityName} rental market rates for ${bedrooms}-bedroom ${normalizedPropertyType.toLowerCase()}s
- ${isPremiumLocation ? "Premium locations command significant rental premiums" : "Consider location for rental adjustments"}
- Factor in property condition, finishes, and amenities visible in images`;

    // Build comparable sales context
    let comparableSalesContext = "";
    let compSqmMin: number | null = null;
    let compSqmMax: number | null = null;
    let compSqmAvg: number | null = null;

    if (comparableSalesData) {
      const allComps: any[] = [
        ...(comparableSalesData.titleDeedProperties || []),
        ...(comparableSalesData.properties || []),
      ].filter((p: any) => p.salePrice > 0);

      if (allComps.length > 0) {
        const validSqm = allComps.filter((p: any) => p.pricePerSqM > 0);
        const sqmValues = validSqm.map((p: any) => p.pricePerSqM).sort((a: number, b: number) => a - b);

        if (sqmValues.length > 0) {
          const trimCount = Math.max(1, Math.floor(sqmValues.length * 0.1));
          const trimmed = sqmValues.length > 4 ? sqmValues.slice(trimCount, sqmValues.length - trimCount) : sqmValues;
          compSqmMin = Math.round(trimmed[0]);
          compSqmMax = Math.round(trimmed[trimmed.length - 1]);
          compSqmAvg = Math.round(trimmed.reduce((s: number, v: number) => s + v, 0) / trimmed.length);
        }

        const avgPrice = Math.round(allComps.reduce((s: number, p: any) => s + p.salePrice, 0) / allComps.length);
        const compRows = allComps.slice(0, 12).map((p: any) =>
          `  - ${p.address || "Nearby property"}: R${p.salePrice.toLocaleString("en-ZA")}, ${p.size ? `${p.size}m²` : "?m²"}, ${p.bedrooms || "?"} bed${p.pricePerSqM ? `, R${Math.round(p.pricePerSqM).toLocaleString("en-ZA")}/m²` : ""}${p.saleDate ? `, sold ${p.saleDate}` : ""}`
        ).join("\n");

        comparableSalesContext = `
COMPARABLE SALES DATA (title deed records — these are the ground truth for this property's market):
${compRows}
Average sale price: R${avgPrice.toLocaleString("en-ZA")}${compSqmAvg ? `\nR/m² range (trimmed): R${compSqmMin?.toLocaleString("en-ZA")} – R${compSqmMax?.toLocaleString("en-ZA")}/m² | Average: R${compSqmAvg.toLocaleString("en-ZA")}/m²` : ""}

HARD CONSTRAINT — YOUR R/m² MUST STAY WITHIN THE COMPARABLE RANGE:
${compSqmMin && compSqmMax ? `The comparable sales establish a market R/m² range of R${compSqmMin.toLocaleString("en-ZA")} – R${compSqmMax.toLocaleString("en-ZA")}/m² for this location. Your Conservative, Midline, and Optimistic R/m² values MUST all fall within this range.` : "Weight these comparable sales heavily."}
`;
      }
    }

    // Asking price context
    const impliedSqm = price && price > 0 && floorSize && floorSize > 0 ? Math.round(price / floorSize) : null;
    const askingPriceContext = price && price > 0
      ? `\nASKING PRICE (secondary validation):\nThe seller is asking R${price.toLocaleString("en-ZA")} for this property.${impliedSqm ? ` This implies R${impliedSqm.toLocaleString("en-ZA")}/m².` : ""}\nUse your comparable-derived valuation as the primary output.\n`
      : `\nASKING PRICE: No asking price set. Derive value entirely from comparable sales and market fundamentals.\n`;

    // Build the OpenAI prompt (same as valuation.ts)
    const prompt = `You are a professional property valuer in South Africa with expertise across all major markets. Analyze this property and provide a comprehensive valuation report.

You are providing an evidence-based valuation grounded in comparable sales. The comparable sales data is your ground truth — your R/m² must stay within the range those sales establish. The finishesRating from visual analysis determines where within that range the subject property sits.

Property Details:
- Address: ${address}
- Type: ${normalizedPropertyType} (single unit)
- Bedrooms: ${bedrooms}
- Bathrooms: ${bathrooms}
- Parking Spaces: ${parkingSpaces || "Not specified"}
- Floor Size: ${floorSize ? `${floorSize}m²` : "Not specified"}
- Land Size: ${landSize ? `${landSize}m²` : "Not specified"}
- Monthly Levy: R${monthlyLevy?.toLocaleString("en-ZA") || "Not specified"}
- Location: ${location?.suburb || ""} ${location?.city || ""} ${location?.province || ""}
${comparableSalesContext}${askingPriceContext}

${locationContext}

CRITICAL VALUATION GUIDANCE:
${marketRates}
- The finishesRating (1–5) determines your POSITION within the comparable R/m² range
- Modern finishes, secure parking, and desirable locations add substantial value — but only up to the ceiling the comparables establish

IMPORTANT: For rental estimates:${rentalGuidance}
- Modern finishes and secure parking add 15-25% to rental values

Based on current South African property market conditions, provide a comprehensive valuation and rental analysis in the following JSON format:

{
  "summary": "Brief 2-3 sentence summary",
  "valuations": [
    { "type": "Conservative", "formula": "Calculation method", "value": numeric_value },
    { "type": "Midline (Proply est.)", "formula": "Balanced approach", "value": numeric_value },
    { "type": "Optimistic", "formula": "Premium calculation", "value": numeric_value }
  ],
  "finishesRating": numeric_1_to_5,
  "finishesRatingLabel": "Basic | Standard | Good | Premium | Luxury",
  "finishesRatingJustification": "One sentence justification",
  "features": "Analysis of property features (2-3 sentences)",
  "marketContext": "Market conditions and asking price assessment",
  "rentalEstimates": {
    "longTerm": {
      "minMonthlyRental": numeric_value,
      "maxMonthlyRental": numeric_value,
      "reasoning": "Brief explanation"
    }
  },
  "propertyAppreciation": {
    "annualAppreciationRate": numeric_percentage,
    "components": {
      "baseSuburbRate": { "rate": numeric, "justification": "..." },
      "propertyTypeModifier": { "adjustment": numeric, "justification": "..." },
      "levyImpact": { "levyPerSquareMeter": numeric, "adjustment": numeric, "justification": "..." },
      "visualConditionAdjustment": { "adjustment": numeric, "justification": "..." },
      "locationPremium": { "adjustment": numeric, "justification": "..." }
    },
    "fiveYearProjection": [
      {"year": 2025, "estimatedValue": numeric},
      {"year": 2026, "estimatedValue": numeric},
      {"year": 2027, "estimatedValue": numeric},
      {"year": 2028, "estimatedValue": numeric},
      {"year": 2029, "estimatedValue": numeric}
    ],
    "summary": "Key appreciation drivers and risks"
  }
}

RENTAL BASELINE: monthly rental ≈ 0.6% of market value. Use midline valuation as basis and adjust for location, condition, amenities.`;

    // Prepare messages
    const messages: any[] = [
      { role: "system", content: "You are a professional property valuer specializing in South African real estate. Provide accurate, market-based valuations in JSON format only." },
      { role: "user", content: prompt },
    ];

    // Add image analysis if images are available
    if (images.length > 0) {
      const imageUrls = images.slice(0, 15); // Cap at 15 for single call
      const imageAnalysisPrompt = `VISUAL PROPERTY ANALYSIS: Assess quality from the images below. Score 1-5 on finishes, condition, layout, views, amenities. The finishesRating directly determines the price per m² tier.`;
      messages.push({
        role: "user",
        content: [
          { type: "text", text: imageAnalysisPrompt },
          ...imageUrls.map((url: string) => ({ type: "image_url" as const, image_url: { url } })),
        ],
      });
    }

    // Call OpenAI
    console.log(`[Partner API] Calling OpenAI for ${address}...`);
    const response = await openai.chat.completions.create({
      model: "gpt-5.1",
      messages,
      response_format: { type: "json_object" },
      max_completion_tokens: 2000,
      temperature: 0.4,
    });

    const reportContent = response.choices[0].message.content;
    if (!reportContent) {
      throw new Error("No response content from OpenAI");
    }
    const valuationReport = JSON.parse(reportContent);
    console.log(`[Partner API] OpenAI valuation complete for ${address}`);

    // ── 3c. Fetch PriceLabs short-term rental data ──
    let shortTermData = null;
    try {
      const { fetchPriceLabsData } = await import("./rental-performance");
      shortTermData = await fetchPriceLabsData(address, bedrooms as number, bathrooms as number, propertyType || "Property", userId as number);
    } catch (plError) {
      console.warn("[Partner API] PriceLabs fetch failed (non-fatal):", plError);
    }

    // ── 3d. Process rental estimates ──
    const getMidlineValuation = (valuations?: Array<{ type: string; value: number }>): number =>
      valuations?.find((v) => v.type === "Midline (Proply est.)")?.value || 0;

    const yieldBasePrice = price > 0 ? price : getMidlineValuation(valuationReport.valuations);
    const rentalPerformance = {
      shortTerm: shortTermData,
      longTerm: valuationReport.rentalEstimates?.longTerm
        ? {
            minRental: valuationReport.rentalEstimates.longTerm.minMonthlyRental,
            maxRental: valuationReport.rentalEstimates.longTerm.maxMonthlyRental,
            minYield: yieldBasePrice > 0 ? parseFloat(((valuationReport.rentalEstimates.longTerm.minMonthlyRental * 12) / yieldBasePrice * 100).toFixed(1)) : null,
            maxYield: yieldBasePrice > 0 ? parseFloat(((valuationReport.rentalEstimates.longTerm.maxMonthlyRental * 12) / yieldBasePrice * 100).toFixed(1)) : null,
            reasoning: valuationReport.rentalEstimates.longTerm.reasoning || "AI-generated rental estimate",
          }
        : null,
    };

    // ── 3e. Save rental performance data ──
    try {
      const existingRentalData = await db.execute(
        sql`SELECT id FROM rental_performance_data WHERE user_id = ${userId} AND property_id = ${propertyId} LIMIT 1`
      );

      if (existingRentalData.rows.length > 0) {
        await db.execute(sql`
          UPDATE rental_performance_data SET
            address = ${address},
            bedrooms = ${Math.round(Number(bedrooms))},
            bathrooms = ${Math.round(Number(bathrooms))},
            property_type = ${propertyType},
            price = ${price?.toString()},
            short_term_data = ${JSON.stringify(rentalPerformance.shortTerm)},
            long_term_min_rental = ${rentalPerformance.longTerm?.minRental?.toString()},
            long_term_max_rental = ${rentalPerformance.longTerm?.maxRental?.toString()},
            long_term_min_yield = ${rentalPerformance.longTerm?.minYield?.toString()},
            long_term_max_yield = ${rentalPerformance.longTerm?.maxYield?.toString()},
            long_term_reasoning = ${valuationReport.rentalEstimates?.longTerm?.reasoning},
            images_analyzed = ${images.length},
            analysis_model = 'gpt-5.1',
            updated_at = NOW()
          WHERE id = ${existingRentalData.rows[0].id}
        `);
      } else {
        await db.execute(sql`
          INSERT INTO rental_performance_data (
            user_id, property_id, address, bedrooms, bathrooms, property_type, price,
            short_term_data, long_term_min_rental, long_term_max_rental,
            long_term_min_yield, long_term_max_yield, long_term_reasoning,
            images_analyzed, analysis_model
          ) VALUES (
            ${userId}, ${propertyId}, ${address}, ${Math.round(Number(bedrooms))}, ${Math.round(Number(bathrooms))},
            ${propertyType}, ${price?.toString()}, ${JSON.stringify(rentalPerformance.shortTerm)},
            ${rentalPerformance.longTerm?.minRental?.toString()}, ${rentalPerformance.longTerm?.maxRental?.toString()},
            ${rentalPerformance.longTerm?.minYield?.toString()}, ${rentalPerformance.longTerm?.maxYield?.toString()},
            ${valuationReport.rentalEstimates?.longTerm?.reasoning}, ${images.length}, 'gpt-5.1'
          )
        `);
      }
    } catch (rentalSaveError) {
      console.error("[Partner API] Failed to save rental data:", rentalSaveError);
    }

    // ── 3f. Save valuation report ──
    const pricePerSquareMeter = price && floorSize ? price / floorSize : null;

    // Compute financial data
    const propertyPrice = price > 0 ? price : getMidlineValuation(valuationReport.valuations);
    const appreciationRate = valuationReport.propertyAppreciation?.annualAppreciationRate || 8.0;
    const depositPercentage = 20;
    const interestRate = 11.75;
    const loanTermYears = 20;
    const loanTermMonths = loanTermYears * 12;
    const depositAmount = propertyPrice * (depositPercentage / 100);
    const loanAmount = propertyPrice - depositAmount;
    const monthlyInterestRate = (interestRate / 100) / 12;
    const monthlyPayment = loanAmount > 0
      ? (loanAmount * (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, loanTermMonths))) / (Math.pow(1 + monthlyInterestRate, loanTermMonths) - 1)
      : 0;

    const annualPropertyAppreciationData = {
      baseSuburbRate: appreciationRate,
      finalAppreciationRate: appreciationRate,
      yearlyValues: [1, 2, 3, 4, 5, 10, 20].reduce((acc: any, yr) => {
        acc[`year${yr}`] = propertyPrice * Math.pow(1 + appreciationRate / 100, yr);
        return acc;
      }, {}),
      reasoning: valuationReport.propertyAppreciation?.summary || "Standard market appreciation",
    };

    const longTermRevenue = rentalPerformance.longTerm
      ? ((rentalPerformance.longTerm.minRental + rentalPerformance.longTerm.maxRental) / 2) * 12
      : null;

    const buildTrajectory = (baseAnnual: number) =>
      [1, 2, 3, 4, 5].reduce((acc: any, yr) => {
        const revenue = baseAnnual * Math.pow(1.08, yr - 1);
        acc[`year${yr}`] = { revenue, grossYield: propertyPrice > 0 ? (revenue / propertyPrice) * 100 : 0 };
        return acc;
      }, {});

    let shortTermTrajectories: any = null;
    if (rentalPerformance.shortTerm) {
      shortTermTrajectories = {};
      for (const key of ["percentile25", "percentile50", "percentile75", "percentile90"]) {
        const annual = (rentalPerformance.shortTerm as any)[key]?.annual;
        if (annual) shortTermTrajectories[key] = buildTrajectory(annual);
      }
    }

    const shortTermMedianRevenue = rentalPerformance.shortTerm?.percentile50?.annual || 0;
    const bestStrategy = shortTermMedianRevenue > (longTermRevenue || 0) ? "shortTerm" : "longTerm";

    const cashflowAnalysisData = {
      recommendedStrategy: bestStrategy,
      strategyReasoning: bestStrategy === "shortTerm"
        ? "Short-term rental offers higher revenue potential"
        : "Long-term rental provides more stable returns",
      revenueGrowthTrajectory: {
        shortTerm: shortTermTrajectories,
        longTerm: longTermRevenue && propertyPrice > 0
          ? buildTrajectory(longTermRevenue)
          : null,
      },
    };

    const financingAnalysisData = {
      financingParameters: { depositAmount, depositPercentage, loanAmount, interestRate, loanTerm: loanTermYears, monthlyPayment },
      yearlyMetrics: [1, 2, 3, 4, 5, 10, 20].reduce((acc: any, year) => {
        let remainingBalance = loanAmount;
        let totalPrincipalPaid = 0;
        for (let month = 1; month <= year * 12 && month <= loanTermMonths; month++) {
          const interestPayment = remainingBalance * monthlyInterestRate;
          const principalPayment = monthlyPayment - interestPayment;
          totalPrincipalPaid += principalPayment;
          remainingBalance -= principalPayment;
        }
        acc[`year${year}`] = { monthlyPayment, equityBuildup: totalPrincipalPaid, remainingBalance: Math.max(0, remainingBalance) };
        return acc;
      }, {}),
    };

    // Save valuation report to DB
    const [savedReport] = await db
      .insert(valuationReports)
      .values({
        userId,
        propertyId,
        address,
        price: price?.toString(),
        bedrooms: Math.floor(Number(bedrooms)),
        bathrooms: Math.floor(Number(bathrooms)),
        floorSize: floorSize?.toString(),
        landSize: landSize?.toString(),
        propertyType,
        parkingSpaces: parkingSpaces ? Number(parkingSpaces) : null,
        pricePerSquareMeter: pricePerSquareMeter?.toString(),
        valuationData: valuationReport,
        imagesAnalyzed: images.length,
        analysisModel: "gpt-5.1",
        annualPropertyAppreciationData,
        cashflowAnalysisData,
        financingAnalysisData,
        comparableSalesData,
      })
      .returning();

    // Save financial data to rental_performance_data too
    try {
      await db.execute(sql`
        UPDATE rental_performance_data SET
          annual_property_appreciation_data = ${JSON.stringify(annualPropertyAppreciationData)},
          cashflow_analysis_data = ${JSON.stringify(cashflowAnalysisData)},
          financing_analysis_data = ${JSON.stringify(financingAnalysisData)},
          current_deposit_percentage = ${depositPercentage.toString()},
          current_interest_rate = ${interestRate.toString()},
          current_loan_term = ${loanTermYears},
          current_deposit_amount = ${depositAmount.toString()},
          current_loan_amount = ${loanAmount.toString()},
          current_monthly_repayment = ${monthlyPayment.toString()},
          updated_at = NOW()
        WHERE property_id = ${propertyId} AND user_id = ${userId}
      `);
    } catch (finSaveError) {
      console.error("[Partner API] Failed to save financial data to rental_performance_data:", finSaveError);
    }

    // Track the report generation for billing
    try {
      await trackReportGeneration({ propertyId, reportType: "valuation", userId });
      await trackAgencyReportUsage(branch.id, userId, listing.address);
    } catch {
      // Non-fatal
    }

    const baseUrl = process.env.APP_URL || "https://proply.co.za";
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[Partner API] Report generated for ${propertyId} in ${elapsed}s`);

    return res.json({
      status: "completed",
      reportUrl: `${baseUrl}/report/${propertyId}`,
      propertyId,
      generatedAt: savedReport.createdAt.toISOString(),
    });
  } catch (error) {
    console.error("[Partner API] Report generation failed:", error);
    return res.status(500).json({
      error: "Report generation failed",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// ─── GET /report-status/:propertyId ────────────────────────────────
// Check if a report exists for a given property.
router.get("/report-status/:propertyId", authenticatePartner, async (req, res) => {
  try {
    const { propertyId } = req.params;
    const branch = (req as any).agencyBranch;

    // Verify the listing belongs to this agency
    const [listing] = await db
      .select({ propdataId: propdataListings.propdataId })
      .from(propdataListings)
      .where(
        and(
          eq(propdataListings.propdataId, propertyId),
          eq(propdataListings.branchId, branch.id)
        )
      )
      .limit(1);

    if (!listing) {
      return res.status(404).json({ error: "Property not found or does not belong to your agency" });
    }

    const report = await db.query.valuationReports.findFirst({
      where: eq(valuationReports.propertyId, propertyId),
      orderBy: [desc(valuationReports.updatedAt)],
    });

    if (!report) {
      return res.json({ status: "not_generated", propertyId });
    }

    const baseUrl = process.env.APP_URL || "https://proply.co.za";
    return res.json({
      status: "available",
      reportUrl: `${baseUrl}/report/${propertyId}`,
      propertyId,
      generatedAt: report.createdAt.toISOString(),
    });
  } catch (error) {
    console.error("[Partner API] Status check failed:", error);
    return res.status(500).json({ error: "Failed to check report status" });
  }
});

// ─── GET /listings ─────────────────────────────────────────────────
// List all synced listings for this agency (so they know which propertyIds to use).
router.get("/listings", authenticatePartner, async (req, res) => {
  try {
    const branch = (req as any).agencyBranch;

    const listings = await db
      .select({
        propertyId: propdataListings.propdataId,
        address: propdataListings.address,
        price: propdataListings.price,
        bedrooms: propdataListings.bedrooms,
        bathrooms: propdataListings.bathrooms,
        propertyType: propdataListings.propertyType,
        status: propdataListings.status,
      })
      .from(propdataListings)
      .where(eq(propdataListings.branchId, branch.id));

    return res.json({ listings, count: listings.length });
  } catch (error) {
    console.error("[Partner API] Listings fetch failed:", error);
    return res.status(500).json({ error: "Failed to fetch listings" });
  }
});

export default router;
