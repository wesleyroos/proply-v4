# Proply Partner API Documentation

Base URL: `https://proply.co.za/api/partner`

## Authentication

All requests require an API key sent via the `x-api-key` header.

```
x-api-key: your-api-key-here
```

Your API key is tied to your agency branch and scopes all requests to your listings only. Contact Proply to get your key.

---

## Endpoints

### 1. Generate Report

Triggers the full Proply valuation pipeline for a property listing and returns the report preview URL.

**Request**

```
POST /api/partner/generate-report
```

**Headers**

| Header      | Required | Description       |
|-------------|----------|-------------------|
| x-api-key   | Yes      | Your API key      |
| Content-Type| Yes      | application/json  |

**Body**

```json
{
  "propertyId": "PROSPR-12345"
}
```

| Field       | Type   | Required | Description                                                     |
|-------------|--------|----------|-----------------------------------------------------------------|
| propertyId  | string | Yes      | The property ID from your listing system (matches synced data)  |

**Response — Report Generated (200)**

```json
{
  "status": "completed",
  "reportUrl": "https://proply.co.za/report/PROSPR-12345",
  "propertyId": "PROSPR-12345",
  "generatedAt": "2026-04-10T10:30:00.000Z"
}
```

**Response — Report Already Exists (200)**

If a report was previously generated for this property, it returns the existing one immediately without re-running the pipeline.

```json
{
  "status": "existing",
  "reportUrl": "https://proply.co.za/report/PROSPR-12345",
  "propertyId": "PROSPR-12345",
  "generatedAt": "2026-04-08T14:20:00.000Z"
}
```

**Response Fields**

| Field        | Type   | Description                                                        |
|--------------|--------|--------------------------------------------------------------------|
| status       | string | `"completed"` (freshly generated) or `"existing"` (already existed)|
| reportUrl    | string | Full URL to the interactive report preview page                    |
| propertyId   | string | The property ID you sent                                           |
| generatedAt  | string | ISO 8601 timestamp of when the report was created                  |

**Error Responses**

| Status | Body                                                              | When                                    |
|--------|-------------------------------------------------------------------|-----------------------------------------|
| 400    | `{ "error": "propertyId is required" }`                           | Missing propertyId in request body      |
| 401    | `{ "error": "Missing x-api-key header" }`                        | No API key provided                     |
| 401    | `{ "error": "Invalid API key" }`                                  | API key doesn't match any agency        |
| 403    | `{ "error": "Agency is inactive" }`                               | Agency account is deactivated           |
| 404    | `{ "error": "Property not found or does not belong to your agency" }` | Property ID not found in your listings |
| 500    | `{ "error": "Report generation failed", "details": "..." }`      | Server-side error during generation     |

**Processing Time**

Report generation typically takes **15–30 seconds** as it runs:
- AI-powered property image analysis
- Comparable sales lookup (title deed records)
- Rental market analysis (short-term & long-term)
- Financial projections (cashflow, financing, appreciation)

Set your HTTP client timeout to at least **60 seconds**.

---

### 2. Check Report Status

Check whether a report has already been generated for a property.

**Request**

```
GET /api/partner/report-status/:propertyId
```

**Headers**

| Header    | Required | Description  |
|-----------|----------|--------------|
| x-api-key | Yes      | Your API key |

**Response — Report Available (200)**

```json
{
  "status": "available",
  "reportUrl": "https://proply.co.za/report/PROSPR-12345",
  "propertyId": "PROSPR-12345",
  "generatedAt": "2026-04-10T10:30:00.000Z"
}
```

**Response — No Report (200)**

```json
{
  "status": "not_generated",
  "propertyId": "PROSPR-12345"
}
```

---

### 3. List Listings

Retrieve all synced listings for your agency. Use this to discover which `propertyId` values are available for report generation.

**Request**

```
GET /api/partner/listings
```

**Headers**

| Header    | Required | Description  |
|-----------|----------|--------------|
| x-api-key | Yes      | Your API key |

**Response (200)**

```json
{
  "listings": [
    {
      "propertyId": "PROSPR-12345",
      "address": "12 Main Road, Sea Point, Cape Town",
      "price": "3500000",
      "bedrooms": 2,
      "bathrooms": 2,
      "propertyType": "Apartment",
      "status": "active"
    },
    {
      "propertyId": "PROSPR-67890",
      "address": "45 Beach Road, Camps Bay, Cape Town",
      "price": "8900000",
      "bedrooms": 3,
      "bathrooms": 2,
      "propertyType": "House",
      "status": "active"
    }
  ],
  "count": 2
}
```

---

## The Report URL

The `reportUrl` returned by the API is a fully interactive web page that includes:

- Property overview (address, price, specs)
- AI-powered valuation (Conservative / Midline / Optimistic)
- Comparable sales analysis (title deed records)
- Rental performance (short-term & long-term yields)
- Financial projections (cashflow, appreciation, financing breakdown)
- Property images
- Agency branding (your logo and colours)

The page also has a **Download PDF** button for the full report.

You can embed or link to this URL anywhere in your system — it's publicly accessible and optimised for sharing (includes Open Graph meta tags for social previews).

---

## Integration Example

### cURL

```bash
# Generate a report
curl -X POST https://proply.co.za/api/partner/generate-report \
  -H "x-api-key: your-api-key-here" \
  -H "Content-Type: application/json" \
  -d '{"propertyId": "PROSPR-12345"}'

# Check report status
curl https://proply.co.za/api/partner/report-status/PROSPR-12345 \
  -H "x-api-key: your-api-key-here"

# List your synced listings
curl https://proply.co.za/api/partner/listings \
  -H "x-api-key: your-api-key-here"
```

### JavaScript / Node.js

```javascript
const API_KEY = "your-api-key-here";
const BASE_URL = "https://proply.co.za/api/partner";

async function generateReport(propertyId) {
  const response = await fetch(`${BASE_URL}/generate-report`, {
    method: "POST",
    headers: {
      "x-api-key": API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ propertyId }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error);
  }

  // data.reportUrl is the link to embed in your listing
  return data;
}

// Usage
const result = await generateReport("PROSPR-12345");
console.log(result.reportUrl);
// → "https://proply.co.za/report/PROSPR-12345"
```

### PHP (Laravel)

```php
use Illuminate\Support\Facades\Http;

$response = Http::withHeaders([
    'x-api-key' => config('services.proply.api_key'),
])->post('https://proply.co.za/api/partner/generate-report', [
    'propertyId' => $listing->prospr_id,
]);

$data = $response->json();
$reportUrl = $data['reportUrl'];
// Store $reportUrl on the listing for agents to access
```

---

## Typical Integration Flow

1. **Agent clicks "Get Valuation Report"** on a listing in your system
2. Your backend calls `POST /api/partner/generate-report` with the listing's property ID
3. Show a loading state while waiting (15-30 seconds)
4. On success, store the `reportUrl` against the listing
5. Show the agent a **"View Report"** button that opens the `reportUrl`
6. Subsequent clicks can use `GET /api/partner/report-status/:propertyId` to check if a report already exists (instant response)

---

## Rate Limits

- **10 concurrent requests** per API key
- **100 reports per day** per agency (contact us to increase)

## Support

For API key provisioning, issues, or feature requests:
- Email: wesley@proply.co.za
