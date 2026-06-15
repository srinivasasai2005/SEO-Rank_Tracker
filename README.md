# SEO Rank Tracker (Rank Pilot)
**Full-Stack SaaS Architecture & Data Pipeline**

A production-grade SEO intelligence platform built to handle complex asynchronous tasks, strict quota management, and subscription monetization. Engineered to transform unstructured web data into actionable insights without blocking the user experience.

### Tech Stack
**Frontend:** React 19, TypeScript, Tailwind, Vite  
**Backend:** Node.js, Express, MongoDB  
**Services:** Browserbase (Headless Cloud), Playwright, Google Gemini API, Stripe  

---

### Core Engineering Workflows

#### 1. Asynchronous AI Auditing Pipeline
*Engineered to handle long-running headless scraping and LLM analysis without hanging the client.* `[Client Submit]` ➔ `[API Auth/Quota Validate]` ➔ `[DB Status: Processing]` ➔ `[Browserbase/Playwright Live Scrape]` ➔ `[Gemini JSON Normalization]` ➔ `[DB Save]` ➔ `[Client Polling Resolve]`

#### 2. Automated SERP Tracking Engine
*Built a reliable background job system for historical state tracking.* `[User Inputs Target]` ➔ `[Initial Playwright SERP Scrape]` ➔ `[Node-cron Daily 6AM Trigger]` ➔ `[Headless Delta Calculation]` ➔ `[MongoDB Array Append]`

#### 3. Zero-Trust Quota & Monetization
*Bypassed superficial client-side gating by enforcing all business logic at the database level.* `[API Intercepts Scan]` ➔ `[Hard Drop (403) if Free Limit Hit]` ➔ `[Stripe Checkout Session]` ➔ `[Secure Verification Route]` ➔ `[MongoDB 'Pro' Upgrade]` ➔ `[Seamless UI Refresh]`

---

### Architectural Decisions & Impact
* **Chaos to Structure:** Built a resilient pipeline capable of digesting chaotic, dynamic DOM trees and enforcing strict, predictable JSON schemas via Gemini.
* **Server-Side Source of Truth:** Eliminated client-side bypass vulnerabilities. API controllers serve as the ultimate authority for plan validation and scan limits.
* **Decoupled Presentation:** Maintained a clean React layer by isolating third-party API keys, heavy scraping mechanics, and cron jobs entirely within the Express application layer.
