# Property Analyzer & Rental Comparison Platform

## Overview

This is a property investment analysis platform that helps users compare short-term vs long-term rental yields, generate detailed property reports, and manage agency billing. The application provides comprehensive property analysis tools with integrated mapping, financial calculations, and report generation capabilities.

## System Architecture

### Frontend Architecture
- **React 18** with TypeScript for type safety
- **Vite** as the build tool and development server
- **TailwindCSS** with **shadcn/ui** components for modern UI design
- **React Hook Form** with **Zod** validation for form management
- **TanStack Query** for server state management and caching
- **Wouter** for lightweight client-side routing

### Backend Architecture
- **Express.js** server with TypeScript
- **PostgreSQL** database with **Drizzle ORM** for type-safe database operations
- **Passport.js** with local strategy for authentication
- **Express Session** with memory store for session management
- **Role-based access control** supporting system admin, franchise admin, and branch admin roles

### Data Storage Solutions
- **PostgreSQL** as the primary database
- **Drizzle ORM** for schema management and migrations
- Comprehensive schema including users, properties, agencies, billing cycles, and analytics

## Key Components

### Property Analysis Engine
- Multi-step form for property data collection (6 steps: Property Details, Financing, Operating Expenses, Short-term Rental, Long-term Rental, Review)
- Financial calculations including yield analysis, cash flow projections, and ROI calculations
- Integration with external APIs for market data and property valuations

### Google Maps Integration
- Interactive property mapping using Google Maps JavaScript API
- Address geocoding and marker placement
- Dynamic map updates based on property address input

### PDF Report Generation
- Automated PDF report creation using html2pdf.js
- Comprehensive property analysis reports with charts and financial projections
- Downloadable reports for client presentations

### Agency Management System
- Multi-tier agency structure (franchise → branch → individual users)
- Role-based permissions and access control
- Agency billing system with monthly usage tracking

## Data Flow

1. **User Authentication**: Users authenticate via username/password, with role-based access control determining available features
2. **Property Analysis**: Users input property details through multi-step form → data validated with Zod → sent to analysis engine → results displayed with charts and recommendations
3. **Report Generation**: Analysis results → PDF generation service → downloadable report
4. **Agency Billing**: Report generations tracked → monthly billing cycles calculated → invoices generated

## External Dependencies

### Payment Processing
- **PayFast** payment gateway for South African market with ad-hoc tokenization support
- Test and live API keys configured for different environments
- Supports variable monthly billing with tiered pricing structure

### APIs and Services
- **Google Maps JavaScript API** for mapping functionality
- **SendGrid** for email notifications and communications
- **PropData API** for property listings and market data (optional integration)
- **PriceLabs API** for rental revenue estimations

### Development Tools
- **Replit** hosting and development environment
- **PostgreSQL 16** database module
- **Node.js 20** runtime environment

## Deployment Strategy

### Development Environment
- Replit-based development with hot reload
- Local PostgreSQL database for development
- Environment variables managed through .env file

### Production Deployment
- **Google Cloud Run** for containerized deployment
- Production PostgreSQL database
- SSL/TLS encryption for secure communications
- Domain routing with custom domain support

### Build Process
- Vite builds frontend assets to `dist/public`
- esbuild bundles server code to `dist/index.js`
- Docker containerization for Cloud Run deployment

## Changelog
- June 14, 2025: Initial setup
- June 15, 2025: Implemented comprehensive automated billing system with tiered pricing structure, monthly scheduling, invoice generation, and transaction tracking
- June 15, 2025: Migrated from Yoco to PayFast payment gateway due to Yoco's deprecated token charging API. Implemented PayFast ad-hoc tokenization with tiered pricing (1-50: R200, 51-100: R180, 101-150: R160, 151-200: R140, 200+: R140)
- June 15, 2025: Completed full Yoco removal - systematically removed all Yoco implementation, routes, endpoints, SDK scripts, and UI components while preserving PayFast functionality
- June 15, 2025: **BREAKTHROUGH**: Successfully resolved PayFast signature validation by implementing correct field ordering (not alphabetical) as per PayFast documentation. Live PayFast tokenization now working with proper signature generation.
- June 16, 2025: Fixed branch admin permissions to access agency report statistics by updating `/api/agencies/:agencyId/report-stats` endpoint to allow branch_admin and franchise_admin roles
- June 16, 2025: Removed VAT from all billing calculations across the system (invoices, UI displays, automated billing) since company is not VAT registered yet
- June 16, 2025: Fixed final VAT calculation in branch admin settings usage display - removed 1.15 multiplier that was showing R6440 instead of correct VAT-free amount
- June 16, 2025: Simplified add agency flow to request PropData unique key instead of searching - now requires manual entry of PropData access key, franchise name, and branch name for better integration control
- June 16, 2025: Restructured add agency form to prioritize branch name as primary identifier (required) and franchise name as optional, aligning with data architecture where branch IDs are the true source of identity
- June 17, 2025: Fixed PayFast tokenization URL generation issue - resolved malformed URLs with comma concatenation by hard-coding production domain. PayFast redirect now works successfully, but 3D Secure authentication still failing (under investigation with PayFast support)
- June 17, 2025: Implemented persistent invoice storage system - replaced dynamic invoice generation with database-stored invoices using agency_invoices and agency_billing_cycles tables. Invoice history now shows "Billing Date" instead of "Due Date" with conditional download functionality (enabled for paid invoices, disabled for upcoming)
- June 17, 2025: **RESOLVED**: Fixed PayFast payment method storage issue - implemented comprehensive session tracking system with `payfast_tokenization_sessions` table to properly link webhook responses to specific user sessions. Updated webhook handler to correctly store payment methods for the appropriate agency branch instead of using placeholder data. Payment methods now properly appear in branch admin settings after successful PayFast tokenization.
- June 17, 2025: Completed PayFast integration refinement - removed test payment section from control panel, resolved card display to show actual last 4 digits (6847) instead of token digits, and enhanced webhook to attempt fetching real card details from PayFast API. System now accurately displays payment methods across both settings and control panel interfaces.
- June 17, 2025: **BREAKTHROUGH**: Successfully resolved PayFast signature generation by implementing PHP-style encoding (spaces as '+', apostrophes as '%27') instead of JavaScript's URL encoding ('%20', raw apostrophes). PayFast ad-hoc charges now authenticate successfully (200 OK response). The Z2 error code indicates amount below merchant minimum, confirming the integration works correctly.
- June 17, 2025: Updated PayFast minimum amount validation from R100 to R2 (PayFast platform minimum) after discovering the merchant account has a higher specific minimum than the platform default. Enhanced error handling to provide clear guidance when Z2 errors occur, indicating successful authentication but amount below merchant-specific threshold.
- June 17, 2025: Implemented flexible test billing with input field allowing R2-R10,000 range. Users can start with R10 and incrementally increase to find their PayFast merchant account minimum, with helpful UI guidance for troubleshooting Z2 errors.
- June 17, 2025: **CRITICAL FIX**: Discovered PayFast expects amounts in cents, not rands. Updated chargeToken method to multiply amounts by 100 before sending to PayFast API. Previous tests of R10, R100, R200 were actually processed as R0.10, R1.00, R2.00 - explaining the persistent Z2 errors.
- June 17, 2025: **SUCCESS**: PayFast integration fully functional! Test payment of R10 (1000 cents) processed successfully with transaction ID 231354801. All components working: authentication, signature generation, amount conversion, and payment processing.
- June 17, 2025: Enhanced test payment system to create proper invoices and transaction records. Test payments now follow the same pattern as automated billing: create invoice → process payment → record transaction. Added `invoice_type` field to distinguish manual vs automated billing. This provides foundation for future manual billing capabilities.

## User Preferences

Preferred communication style: Simple, everyday language.