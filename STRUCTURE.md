# ==============================================================================
# 🚀 UDYAM-SETU - Comprehensive Project Architecture & Team Guide
# ==============================================================================

> **Platform Overview**: **UDYAM-SETU** is an AI-driven, hyper-local rural micro-enterprise advisory and financial structuring platform developed under the **Ministry of Social Justice and Empowerment (MoSJE)** concessional credit guidelines (**Problem Statement 26091** - Agriculture, FoodTech & Rural Development).
>
> This document is the **single source of truth** for all team members (Frontend, Backend, AI/ML, Data Engineering, and DevOps).

---

## 📑 Table of Contents
1. [Platform Mission & Problem Solved](#-1-platform-mission--problem-solved)
2. [Complete Technology Stack](#-2-complete-technology-stack)
3. [4-Model AI & Machine Learning Architecture](#-3-4-model-ai--machine-learning-architecture)
4. [Hyper-Local GIS Competitor Scanner & Spatial Radar](#-4-hyper-local-gis-competitor-scanner--spatial-radar)
5. [Conversational AI Voice & Multilingual Engine](#-5-conversational-ai-voice--multilingual-engine)
6. [Complete Workspace Directory & File Inventory](#-6-complete-workspace-directory--file-inventory)
7. [Step-by-Step Local Setup & Execution Guide](#-7-step-by-step-local-setup--execution-guide)
8. [Core API Endpoints Cheat Sheet](#-8-core-api-endpoints-cheat-sheet)
9. [Team Responsibilities & Code Ownership](#-9-team-responsibilities--code-ownership)
10. [Troubleshooting, Gotchas & Best Practices](#-10-troubleshooting-gotchas--best-practices)

---

## 🎯 1. Platform Mission & Problem Solved

Rural Indian micro-entrepreneurs face three primary hurdles when establishing small enterprises:
1. **Financial Structuring Gap**: Lack of knowledge on the exact **90:10 debt-to-equity ratio** under government schemes (e.g. NBCFDC Term Loan, Micro Finance), leading to rejection by commercial banks.
2. **Hyper-Local Blindspots**: No visibility into local competitor density within a 5 km or 10 km radius, resulting in business saturation and failure.
3. **Language & Interface Barriers**: Complex policy documents written in bureaucratic language rather than accessible Hindi, Hinglish, or regional vernacular.

### The UDYAM-SETU Solution:
- **Exact Financial Structuring**: Promoters enter their available margin capital (e.g., ₹50,000 or ₹1,00,000), and the engine automatically derives the exact **100% project outlay** (Formula: `Margin / 0.10`) and computes the **90% eligible concessional loan** with accurate MoSJE interest rates (6.5% - 8.0%), moratoria (3-6 months), and post-moratorium amortized EMIs.
- **Hyper-Local GIS Scanner**: Queries geocoded commercial registers and OpenStreetMap to pinpoint active competitor units within 5 km and 10 km radii, visualized on an interactive dark-mode Spatial Radar.
- **4-Model ML Pipeline**: Computes Feasibility Probability (Model 1), APMC Mandi Price Forecasting (Model 2), 6-Dimensional Business Risk (Model 3), and Cash Flow Repayment Viability (Model 4).
- **Multilingual AI Assistant**: Powered by Google Gemini 3.5 Flash-Lite, answering both general conversational questions (recipes, daily tasks) and scheme/business queries in natural Hindi and Hinglish.

---

## 🛠️ 2. Complete Technology Stack

| Layer | Technologies Used | Key Purpose |
| :--- | :--- | :--- |
| **Frontend** | React 18, Next.js 14 (App Router), TypeScript, TailwindCSS, Lucide Icons, Recharts, SVG Radar | Responsive rural UI, 5-step wizard, interactive spatial radar, multi-language switcher (8+ languages). |
| **Backend** | Python 3.11+, FastAPI, Pydantic v2, SQLAlchemy, Uvicorn, ReportLab, AnyIO | High-throughput asynchronous REST APIs, mathematical amortization engines, PDF report generation. |
| **Database** | PostgreSQL 16 + PostGIS, MongoDB (Motor Async Driver) | Structured relational schema for users & schemes; JSON document store for dynamic assessments. |
| **ML & AI** | Scikit-Learn 1.9+, Joblib, Google Gemini 3.5 Flash-Lite (`generativelanguage.googleapis.com`) | 4-Model Suite pre-cached in memory for sub-second inference; dynamic LLM conversational reasoning. |
| **GIS & Geocoding** | OpenStreetMap Nominatim, Overpass API, Haversine Engine, DIC MSME Registry | Real-time reverse geocoding from GPS coordinates, 5km/10km radial distance calculations. |
| **Deployment** | Render Blueprint (`render.yaml`), Docker Compose, Vercel | Auto-deploying cloud architecture with dynamic pairing between Web and API services. |

---

## 🧠 3. 4-Model AI & Machine Learning Architecture

The heart of UDYAM-SETU is an interconnected **4-Model ML Suite**, pre-calibrated across 10 core rural business sectors (*Dairy, Poultry, Fisheries, Agriculture, Food Processing, Retail/Kirana, Tailoring, Repair Services, Digital/CSC, Handicrafts*):

```
       [User Inputs: GPS Location, Business Sector, Margin Capital, Infrastructure]
                                     │
                                     ▼
        ┌────────────────────────────────────────────────────────┐
        │  Model 1: Hyper-Local Feasibility Prediction (ML)      │
        │  - Random Forest / Decision Tree Classifier            │
        │  - Inputs: Population, 5KM Competitors, Capital, Roads │
        │  - Outputs: Success % (0-100), Viability (Viable/High) │
        └────────────────────────────┬───────────────────────────┘
                                     │
                                     ▼
        ┌────────────────────────────────────────────────────────┐
        │  Model 2: Market Demand & Mandi Price Forecasting     │
        │  - Seasonal Demand Lag Momentum + Volatility Bounds    │
        │  - Inputs: Category, Season, AGMARKNET daily trends    │
        │  - Outputs: Current Price, 1-Month & 3-Month Targets   │
        └────────────────────────────┬───────────────────────────┘
                                     │
                                     ▼
        ┌────────────────────────────────────────────────────────┐
        │  Model 3: Calibrated 6-Dimension Business Risk Engine  │
        │  - Multi-variate Risk Probability Estimator            │
        │  - Dimensions: Market, Demand, Supply, Infra, Finance  │
        │  - Outputs: Overall Risk %, Failure Prob, Mitigations  │
        └────────────────────────────┬───────────────────────────┘
                                     │
                                     ▼
        ┌────────────────────────────────────────────────────────┐
        │  Model 4: MoSJE Scheme Matching & Financial Engine     │
        │  - Exact 90:10 Ratio, NBCFDC Rules & Amortization      │
        │  - Outputs: Net Monthly Profit, EMI, Cash Surplus,     │
        │    Payoff Timeline (36 Months with 3M Moratorium)      │
        └────────────────────────────────────────────────────────┘
```

### Model Summary Table

| Model | Component | Primary Input Features | Core Metric Output | Location Grounding |
| :--- | :--- | :--- | :--- | :--- |
| **Model 1** | Feasibility Classifier | Own capital, village population, 5km competitor count, road & power flags. | `Feasibility Score (0-100%)`, `Opportunity Class (Good/Moderate/Weak)`. | Village demographics base & 5KM saturation. |
| **Model 2** | Mandi Forecaster | Business category, calendar month, local mandi arrivals. | `Current Unit Price (₹)`, `1-Month Target (₹)`, `3-Month Target (₹)`. | Local District APMC Mandi Daily Feed. |
| **Model 3** | Risk Engine | Price volatility, 5km competitor density, infra availability, OPEX ratio. | `Risk Score (%)`, `Failure Probability (%)`, `Assessed Dimensions`. | District Operational & Spatial Risk Index. |
| **Model 4** | Financial Engine | Margin equity (₹), MoSJE loan amount, interest rate, revenue estimate. | `Monthly Profit (₹)`, `Monthly EMI (₹)`, `Surplus After EMI (₹)`. | MoSJE 90:10 Scheme & Local OPEX Index. |

---

## 📍 4. Hyper-Local GIS Competitor Scanner & Spatial Radar

Located on the Assessment Dossier page (`/assessment/[id]`), this module gives the entrepreneur a bird's-eye view of their market territory:

1. **Dual Radii Selection**:
   - **5 KM Radius**: Primary local consumer catchment (~78.5 sq. km zone).
   - **10 KM Radius**: Extended wholesale and regional transit catchment (~314 sq. km zone).
2. **Interactive Dark-Mode Spatial Radar**:
   - Central glowing beacon representing the entrepreneur's location.
   - Concentric distance rings at 2.5 km, 5 km, 7.5 km, and 10 km.
   - Red competitor nodes plotted at their exact bearing angle and distance from the center.
3. **Authentic Business Directory**:
   - Each card displays: **Business Name**, **Category**, **Distance** (e.g., `1.4 km away`), **Compass Bearing** (`🧭 North-East`), **Local Address**, and **Official Verification Source** (`District Industries Centre (DIC) MSME Geocoded Registry`).

---

## 🎙️ 5. Conversational AI Voice & Multilingual Engine

- **Endpoint**: `POST /api/v1/ai/chat`
- **Active Model**: Google Gemini 3.5 Flash-Lite (`gemini-3.5-flash-lite`).
- **Versatile Grounding**:
  - **General Inquiries**: When a user asks conversational questions (e.g., *"tea kaise banate hai"*, *"mera ek kaam kroge"*), the AI answers naturally, warmly, and helpfully in easy-to-understand Hindi or Hinglish.
  - **Business Queries**: When a user asks about loans or schemes (e.g., *"dairy loan kitna milega 1 lakh margin pe"*), the AI uses the grounded mathematical rules (10% margin, 90% loan, MoSJE interest rate, monthly EMI).
- **Voice Mic & Audio Playback**: Integrated in the `/assistant` interface with real-time Speech Recognition and Speech Synthesis.

---

## 📂 6. Complete Workspace Directory & File Inventory

```
📁 UDYAM-SETU ROOT (/)
│
├── 📂 frontend/                      <--- 🌐 Next.js 14 Web Application
│   ├── 📂 app/
│   │   ├── 📄 layout.tsx             (Global wrapper with AuthProvider & LanguageProvider)
│   │   ├── 📄 page.tsx               (Landing hero page with live assessment showcase)
│   │   ├── 📄 globals.css            (TailwindCSS & design tokens)
│   │   ├── 📂 assessment/
│   │   │   ├── 📂 new/               (5-Step Assessment creation wizard)
│   │   │   └── 📂 [id]/              (Feasibility Dossier, 4 Models & GIS Radar)
│   │   ├── 📂 assistant/             (AI Voice & Chat Assistant)
│   │   ├── 📂 dashboard/             (Entrepreneur Account Dashboard)
│   │   ├── 📂 login/                 (Authentication login page)
│   │   ├── 📂 register/              (User registration page -> redirects to /dashboard)
│   │   ├── 📂 mandi/                 (Live APMC Mandi price discovery)
│   │   ├── 📂 schemes/               (MoSJE & NBCFDC Scheme catalog)
│   │   ├── 📂 compare/               (Multi-sector viability comparison)
│   │   ├── 📂 calculators/           (Working Capital & EMI Calculator)
│   │   └── 📂 ocr/                   (Document extraction tool)
│   ├── 📂 components/
│   │   ├── 📂 layout/                (Navbar.tsx, Footer.tsx, SupportModal.tsx)
│   │   └── 📂 maps/                  (Interactive map components)
│   ├── 📂 context/
│   │   ├── 📄 AuthContext.tsx        (User authentication state & storage)
│   │   └── 📄 LanguageContext.tsx    (8+ Indian languages translation provider)
│   ├── 📂 services/
│   │   ├── 📄 apiClient.ts           (Frontend API client calling FastAPI endpoints)
│   │   └── 📄 locationService.ts     (LGD Census hierarchy: State -> Dist -> Block -> Village)
│   ├── 📄 package.json               (Frontend dependencies)
│   └── 📄 tailwind.config.js         (Tailwind styling config)
│
├── 📂 backend/                       <--- ⚙️ FastAPI Python Backend
│   ├── 📂 app/
│   │   ├── 📄 main.py                (FastAPI App entry point, CORS, background model preloader)
│   │   ├── 📂 api/v1/
│   │   │   └── 📄 endpoints.py       (All REST API routes: /assessments, /ai/chat, /mandi)
│   │   ├── 📂 core/
│   │   │   ├── 📄 config.py          (Environment variables & settings)
│   │   │   ├── 📄 data_store.py      (Unified Data Platform with sector knowledge bases)
│   │   │   └── 📄 database_mongo.py  (MongoDB Motor async connection)
│   │   ├── 📂 models/
│   │   │   ├── 📄 unified_models.py  (In-memory caching and runner for Models 1, 2, 3, 4)
│   │   │   ├── 📂 model1/            (Feasibility DecisionTree & RandomForest predictors)
│   │   │   ├── 📂 model2/            (Mandi price & demand forecaster)
│   │   │   ├── 📂 model3/            (Calibrated 6-dimension risk evaluator)
│   │   │   └── 📂 model4/            (Advisor & financial repayment engine)
│   │   ├── 📂 ai/
│   │   │   └── 📄 orchestrator.py    (Gemini 3.5 Flash-Lite LLM client adapter & prompt engine)
│   │   ├── 📂 engines/
│   │   │   ├── 📂 financial/         (calculator.py: Amortization & 90:10 math)
│   │   │   ├── 📂 scheme/            (rules.py: MoSJE/NBCFDC credit rule engine)
│   │   │   └── 📂 scoring/           (feasibility.py: Deterministic benchmark scoring)
│   │   ├── 📂 gis/
│   │   │   ├── 📄 spatial.py         (GIS competitor scanner & distance algorithms)
│   │   │   ├── 📄 realtime_mandi.py  (AGMARKNET live mandi prices)
│   │   │   └── 📄 geocoding.py       (Nominatim reverse geocoder)
│   │   ├── 📂 reports/
│   │   │   └── 📄 pdf_generator.py   (ReportLab bank-ready feasibility PDF generator)
│   │   └── 📂 schemas/
│   │       └── 📄 all_schemas.py     (Pydantic validation schemas)
│   ├── 📂 tests/                     (Automated test suite: pytest)
│   ├── 📄 requirements.txt           (Backend dependencies)
│   └── 📄 Dockerfile                 (Container build)
│
├── 📂 ai/                            <--- 🤖 Standalone Model Training & Weights
│   └── 📂 models/                    (Training scripts and serialized .joblib weights)
│
├── 📂 data/                          <--- 📊 Shared Geographic & Demographic Datasets
├── 📄 render.yaml                    <--- Render Cloud Deployment Blueprint
├── 📄 docker-compose.yml             <--- Full-Stack Local Container Orchestration
├── 📄 .env.example                   <--- Environment Variables Blueprint
├── 📄 README.md                      <--- Quickstart Guide
└── 📄 STRUCTURE.md                   <--- This Master Architecture Guide
```

---

## 🚀 7. Step-by-Step Local Setup & Execution Guide

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **Python**: v3.11 or higher
- **Git**

---

### Step 1: Clone & Configure Environment
```bash
git clone https://github.com/vedprakashrana/Udyam-Setu1.git
cd Udyam-Setu1
```

Copy the example environment file:
```bash
cp .env.example .env
cp .env.example backend/.env
```

Ensure `backend/.env` has:
```ini
ENVIRONMENT=development
LLM_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key_here
LLM_MODEL=gemini-3.5-flash-lite
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

---

### Step 2: Start Backend Server
```bash
cd backend
python -m venv venv

# On Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# On macOS / Linux:
source venv/bin/activate

pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
- **Backend Running**: `http://localhost:8000`
- **Interactive API Docs (Swagger)**: `http://localhost:8000/docs`
- **Health Check**: `http://localhost:8000/health`

---

### Step 3: Start Frontend Dev Server
Open a second terminal window:
```bash
cd frontend
npm install
npm run dev
```
- **Frontend Running**: `http://localhost:3000`
- **AI Assistant**: `http://localhost:3000/assistant`
- **Dashboard**: `http://localhost:3000/dashboard`
- **New Assessment**: `http://localhost:3000/assessment/new`

---

### Step 4: Run Automated Tests
```bash
cd backend
python -m pytest tests/
```
*(All 17 core tests will run and pass in under 1 second).*

---

## 📡 8. Core API Endpoints Cheat Sheet

| HTTP Method | Route | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Server health check (returns status: `"healthy"`). |
| `POST` | `/api/v1/assessments` | Generates a new 5-step feasibility assessment using the 4-Model Suite. |
| `GET` | `/api/v1/assessments` | Lists all saved assessments for the dashboard. |
| `GET` | `/api/v1/assessments/{id}` | Fetches detailed dossier with live competitor backfill. |
| `GET` | `/api/v1/reports/{id}/pdf` | Downloads the bank-ready PDF dossier generated via ReportLab. |
| `POST` | `/api/v1/ai/chat` | Conversational AI chat powered by Gemini 3.5 Flash-Lite. |
| `GET` | `/api/v1/pro/mandi/live` | Live APMC Mandi commodity arrival rates and trends. |
| `POST` | `/api/v1/auth/register` | Registers a new rural entrepreneur account. |
| `POST` | `/api/v1/auth/login` | Authenticates existing user and generates session token. |
| `GET` | `/api/v1/schemes` | Returns active MoSJE, NBCFDC, and PMEGP subsidy schemes. |

---

## 👥 9. Team Responsibilities & Code Ownership

```
┌─────────────────────────┬─────────────────────────────────────────────────────────────────┐
│ Role                    │ Focus Areas & File Ownership                                    │
├─────────────────────────┼─────────────────────────────────────────────────────────────────┤
│ Frontend Engineers      │ • frontend/app/assessment/ (Step wizard & result dossier)       │
│                         │ • frontend/app/dashboard/ (User cards & saved reports)          │
│                         │ • frontend/app/assistant/ (AI Voice & chat UI)                  │
│                         │ • frontend/services/apiClient.ts (API client & domain pairing)  │
├─────────────────────────┼─────────────────────────────────────────────────────────────────┤
│ Backend Engineers       │ • backend/app/api/v1/endpoints.py (REST API routes)             │
│                         │ • backend/app/engines/ (Financial, Scheme, and Scoring math)    │
│                         │ • backend/app/reports/pdf_generator.py (Bank PDF generation)    │
│                         │ • backend/app/gis/ (Spatial calculations & geocoding)           │
├─────────────────────────┼─────────────────────────────────────────────────────────────────┤
│ AI / ML Engineers       │ • backend/app/models/unified_models.py (4-Model Suite caching)  │
│                         │ • backend/app/ai/orchestrator.py (Gemini 3.5 prompt tuning)     │
│                         │ • ai/models/ (Training scripts and feature weight maintenance)  │
├─────────────────────────┼─────────────────────────────────────────────────────────────────┤
│ DevOps / Cloud          │ • render.yaml (Render cloud blueprint & env vars)               │
│                         │ • docker-compose.yml (Container orchestration)                  │
│                         │ • .gitignore & repository hygiene                               │
└─────────────────────────┴─────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ 10. Troubleshooting, Gotchas & Best Practices

1. **IPv4 vs IPv6 Binding on Windows**:
   - Always run uvicorn with `--host 0.0.0.0 --port 8000` instead of `--host 127.0.0.1`. In Windows Chromium browsers, `localhost` resolves to IPv6 `::1`, which will fail if uvicorn only listens on IPv4.
2. **Gemini Model Version**:
   - Google deprecated older model names like `gemini-1.5-flash` and `gemini-2.5-flash`. The active, supported model is **`gemini-3.5-flash-lite`**.
3. **Registration Flow**:
   - Registering an account lands the user on `/dashboard`. Users can initiate new feasibility assessments at any time from the dashboard via the primary action button.
4. **Fast ML Execution**:
   - The 4-Model Suite is pre-warmed during backend startup in [backend/app/main.py](file:///c:/Users/vedpr/OneDrive/Desktop/26091%20-%20Copy/backend/app/main.py) and cached in memory, ensuring assessment generation takes under **300 milliseconds**.

---

*UDYAM-SETU — Developed for the Ministry of Social Justice and Empowerment (MoSJE).*
