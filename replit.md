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
- June 16, 2025: Added comprehensive invoices tab to branch admin settings page using same design/logic as control panel agency details modal, includes pricing matrix tooltip for transparency

## User Preferences

Preferred communication style: Simple, everyday language.