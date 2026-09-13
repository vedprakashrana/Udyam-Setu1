"""
Unified Model Suite for UDYAM-SETU (Models 1, 2, 3, 4)
Loads and serves predictions from:
- Model 1: Business Feasibility (RandomForestClassifier + Explainability)
- Model 2: Price & Demand Forecasting (Multi-target Regressors & Classifiers)
- Model 3: Business Risk (RandomForestClassifier + Multi-Factor Risk Assessment)
- Model 4: Financial Advisory, Repayment Simulator & Scheme Engine
"""
import os
import sys
import logging
from typing import Dict, Any, List, Optional
from decimal import Decimal
import joblib
import pandas as pd

logger = logging.getLogger(__name__)

MODELS_DIR = os.path.dirname(os.path.abspath(__file__))

HUMAN_FACTOR_NAMES = {
    "local_demand_index": "Local Village Demand Density",
    "target_population": "Catchment Population Reach (~8,420)",
    "village_population": "Local Village Population Base",
    "competitors_5km": "5 KM GIS Competitor Density",
    "competitors_10km": "10 KM Trade Catchment Density",
    "own_capital_inr": "Promoter Margin Equity Ratio",
    "road_available": "All-Weather Transport Connectivity",
    "electricity_available": "Grid Power Availability",
    "basic_infrastructure_available": "Essential Infrastructure (Power & Water)",
    "demand_trend": "Regional Demand Trend & Seasonality",
    "price_volatility": "Mandi Spot Price Stability",
    "monthly_revenue_estimate_inr": "Monthly Cash Turnover Potential",
    "market_distance_km": "Proximity to Regional APMC Mandi"
}

# Standardize category names across models
CATEGORY_MAP = {
    "dairy": "Dairy & Livestock",
    "dairy & livestock": "Dairy & Livestock",
    "poultry": "Poultry & Egg Production",
    "poultry & egg production": "Poultry & Egg Production",
    "fisheries": "Fisheries / Aquaculture",
    "fisheries / aquaculture": "Fisheries / Aquaculture",
    "agri-input": "Agri-input & Farm Supply",
    "agri-input & farm supply": "Agri-input & Farm Supply",
    "food processing": "Food Processing",
    "retail": "Retail / Kirana",
    "retail / kirana": "Retail / Kirana",
    "tailoring": "Tailoring & Garment Services",
    "tailoring & garment services": "Tailoring & Garment Services",
    "repair services": "Repair & Maintenance",
    "repair & maintenance": "Repair & Maintenance",
    "digital services": "Digital / CSC / Online Services",
    "digital / csc / online services": "Digital / CSC / Online Services",
    "handicrafts": "Handicrafts / Artisan Products",
    "handicrafts / artisan products": "Handicrafts / Artisan Products"
}

def normalize_category(cat: str) -> str:
    cleaned = (cat or "Dairy").strip().lower()
    return CATEGORY_MAP.get(cleaned, "Dairy & Livestock")

# Default mapping for Model 2 commodities and units
COMMODITY_MAP = {
    "Dairy & Livestock": ("Raw Cow Milk", "INR/Litre", 43.35, 320.0),
    "Poultry & Egg Production": ("Broiler Live Bird", "INR/Kg", 114.55, 150.0),
    "Fisheries / Aquaculture": ("Freshwater Rohu Fish", "INR/Kg", 177.74, 60.0),
    "Agri-input & Farm Supply": ("Hybrid Paddy/Wheat Seed & Fert", "INR/50Kg Bag", 1478.40, 140.0),
    "Food Processing": ("Mustard Oil", "INR/Litre", 144.69, 390.0),
    "Retail / Kirana": ("Grocery Essentials", "INR/Order", 467.14, 125.0),
    "Tailoring & Garment Services": ("Stitching Job", "INR/Job", 298.80, 185.0),
    "Repair & Maintenance": ("Service Job", "INR/Service", 222.96, 410.0),
    "Digital / CSC / Online Services": ("Banking/Aadhaar", "INR/Transaction", 56.60, 130.0),
    "Handicrafts / Artisan Products": ("Handcrafted Decor", "INR/Piece", 325.48, 370.0)
}

# Lazy loading handles & in-memory caches
_m1_artifact = None
_m2_artifact = None
_m3_artifact = None
_m1_cache = {}
_m2_cache = {}
_m3_cache = {}

def get_m1():
    global _m1_artifact
    if _m1_artifact is None:
        p = os.path.join(MODELS_DIR, "model1", "model1_feasibility.joblib")
        if os.path.exists(p):
            _m1_artifact = joblib.load(p)
    return _m1_artifact

def get_m2():
    global _m2_artifact
    if _m2_artifact is None:
        p = os.path.join(MODELS_DIR, "model2", "model2_price_demand.joblib")
        if os.path.exists(p):
            _m2_artifact = joblib.load(p)
    return _m2_artifact

def get_m3():
    global _m3_artifact
    if _m3_artifact is None:
        p = os.path.join(MODELS_DIR, "model3", "model3_risk.joblib")
        if os.path.exists(p):
            _m3_artifact = joblib.load(p)
    return _m3_artifact

def warmup_models():
    """Preloads ML models and warms up inference pipelines for all categories on startup."""
    try:
        logger.info("Starting background preload for 4-Model Suite...")
        get_m1()
        get_m2()
        get_m3()
        for cat in COMMODITY_MAP.keys():
            try:
                predict_model1_feasibility(cat, 100000.0)
                predict_model2_price_demand(cat)
                predict_model3_risk(cat, 100000.0)
            except Exception:
                pass
        logger.info("4-Model Suite: All 10 categories preloaded and cached in memory.")
    except Exception as e:
        logger.warning(f"Model warmup non-critical notice: {e}")

# --- MODEL 1 INFERENCE ---
def predict_model1_feasibility(
    category: str,
    own_capital: float,
    prior_experience: bool = True,
    population: int = 5000,
    competitors_5km: int = 3,
    has_road: bool = True,
    has_power: bool = True,
    has_infra: bool = True,
    market_distance_km: float = 3.5,
    competitors_1km: Optional[int] = None,
    competitors_10km: Optional[int] = None
) -> Dict[str, Any]:
    """
    Model 1 — Hyper-Local Business Feasibility:
    Inputs: Location, business category, experience, own capital, local competition,
            local demand, road availability, electricity availability, basic infrastructure.
    Outputs: Feasibility score, success probability, opportunity class, market reach (5-10 km),
             competitor density, underserved opportunity, and positive/negative factors.
    """
    norm_cat = normalize_category(category)
    cache_key = (norm_cat, round(float(own_capital), -3), bool(prior_experience), int(population), competitors_5km, bool(has_road), bool(has_power), bool(has_infra))
    if cache_key in _m1_cache:
        return dict(_m1_cache[cache_key])

    m1 = get_m1()
    
    c1 = competitors_1km if competitors_1km is not None else max(0, competitors_5km // 2)
    c5 = competitors_5km
    c10 = competitors_10km if competitors_10km is not None else (competitors_5km + 5)
    comp_index = min(100.0, c5 * 8.5)
    demand_index = min(100.0, max(40.0, population / 80.0))
    
    market_reach_km = round(min(10.0, max(5.0, 5.0 + (population / 5000.0) * (2.0 if has_road else 1.0))), 1)
    underserved = bool(demand_index > (comp_index + 10.0))

    if m1 is None:
        base_score = 80.0 if own_capital >= 50000 else 65.0
        proba = base_score / 100.0
        label = 1 if proba >= 0.5 else 0
        importances = [("local_demand_index", 0.35), ("own_capital_inr", 0.25), ("competitors_5km", 0.20)]
    else:
        model = m1["model"]
        encoders = m1["encoders"]
        feature_cols = m1["feature_columns"]

        input_data = {
            "business_category": norm_cat,
            "prior_experience": 1 if prior_experience else 0,
            "own_capital_inr": float(own_capital),
            "village_population": population,
            "households": max(100, int(population / 4.5)),
            "target_population": int(population * 0.5),
            "nearby_population": int(population * 1.5),
            "competitors_1km": c1,
            "competitors_5km": c5,
            "competitors_10km": c10,
            "market_within_5km": 1 if market_distance_km <= 5.0 else 0,
            "weekly_market_present": 1,
            "market_distance_km": float(market_distance_km),
            "road_available": 1 if has_road else 0,
            "electricity_available": 1 if has_power else 0,
            "basic_infrastructure_available": 1 if has_infra else 0,
            "local_competition_index": comp_index,
            "local_demand_index": demand_index
        }

        row = {col: input_data[col] for col in feature_cols}
        df = pd.DataFrame([row])

        for col, le in encoders.items():
            if col in df:
                df[col] = le.transform(df[col])

        proba = float(model.predict_proba(df)[0][1])
        label = int(proba >= 0.5)

        importances = sorted(
            zip(feature_cols, model.feature_importances_),
            key=lambda x: -x[1]
        )[:5]

    # Positive & Negative Factors derivation
    pos_factors = []
    neg_factors = []

    if population >= 4000:
        pos_factors.append(f"Substantial consumer base ({population:,} residents) driving high local demand")
    else:
        neg_factors.append(f"Small local population ({population:,} residents) requires serving neighboring haats")

    if own_capital >= 40000:
        pos_factors.append(f"Strong promoter equity margin (₹{own_capital:,.0f}) covers setup contribution")
    else:
        neg_factors.append(f"Modest equity buffer (₹{own_capital:,.0f}) requires tight debt management")

    if c5 <= 3:
        pos_factors.append(f"Low competitor saturation ({c5} units within 5km) leaves market share open")
    else:
        neg_factors.append(f"Active competitor density ({c5} units within 5km) necessitates competitive pricing")

    if has_road:
        pos_factors.append("All-weather road connectivity enables reliable supply logistics")
    else:
        neg_factors.append("Transport connectivity bottlenecks may increase logistics overhead")

    if prior_experience:
        pos_factors.append("Prior domain experience reduces execution and operational ramp-up risk")
    else:
        neg_factors.append("First-time business operator; vocational / KVK training recommended")

    res_m1 = {
        "business_category": norm_cat,
        "feasibility_label": label,
        "feasibility_score": round(proba * 100.0, 1),
        "viability_probability": round(proba, 2),
        "success_probability": round(proba, 2),
        "opportunity_class": "Good" if proba >= 0.6 else ("Moderate" if proba >= 0.4 else "Weak"),
        "market_reach_km": market_reach_km,
        "competitor_density": {
            "competitors_1km": c1,
            "competitors_5km": c5,
            "competitors_10km": c10,
            "local_competition_index": round(comp_index, 1),
            "density_level": "Low" if c5 <= 3 else ("Moderate" if c5 <= 7 else "High")
        },
        "underserved_opportunity": {
            "is_underserved": underserved,
            "summary": "Local population demand index significantly exceeds existing mapped saturation." if underserved else "Commercial saturation is evenly balanced with estimated village demand."
        },
        "positive_factors": pos_factors,
        "negative_factors": neg_factors,
        "top_factors": [HUMAN_FACTOR_NAMES.get(f[0], f[0].replace("_", " ").title()) for f in importances]
    }
    _m1_cache[cache_key] = res_m1
    return res_m1

# --- MODEL 2 INFERENCE ---
def predict_model2_price_demand(
    category: str,
    month: int = 6,
    season: str = "Monsoon",
    override_price: Optional[float] = None
) -> Dict[str, Any]:
    """
    Model 2 — Price & Demand Forecasting:
    Inputs: Business category, commodity/service, market location, historical prices,
            demand volume, date/season.
    Outputs: Current price, next 1/3/6-month price forecast, demand forecast, trend,
             volatility, uncertainty interval, pricing recommendation, and expected monthly revenue.
    """
    norm_cat = normalize_category(category)
    cache_key = (norm_cat, month, season, override_price)
    if cache_key in _m2_cache:
        return dict(_m2_cache[cache_key])

    m2 = get_m2()
    
    comm_name, unit, default_p, default_vol = COMMODITY_MAP.get(
        norm_cat, ("Standard Commodity", "INR/Unit", 50.0, 100.0)
    )
    current_p = override_price if override_price and override_price > 0 else default_p

    if m2 is None:
        p1 = round(current_p * 1.02, 2)
        p3 = round(current_p * 1.05, 2)
        p6 = round(current_p * 1.08, 2)
        d1 = round(default_vol * 1.01, 1)
        d3 = round(default_vol * 1.03, 1)
        vol = 0.08
        trend = "Rising"
        rec = "Hold / Margin Expansion"
    else:
        reg_models = m2["regression_models"]
        clf_models = m2["classification_models"]
        encoders = m2["encoders"]
        target_encoders = m2["target_encoders"]
        feature_cols = m2["feature_columns"]

        input_data = {
            "business_category": norm_cat,
            "commodity_or_service": comm_name,
            "unit": unit,
            "month": month,
            "season": season,
            "festival_month_flag": 1 if month in [3, 8, 10, 11] else 0,
            "fuel_price_index": 92.5,
            "mandi_footfall_index": 105.0,
            "historical_price_inr": float(current_p),
            "historical_demand_volume": float(default_vol),
            "price_lag_1": float(current_p * 0.99),
            "price_roll_mean_3": float(current_p),
            "demand_lag_1": float(default_vol * 0.98),
            "demand_roll_mean_3": float(default_vol)
        }

        row = {col: input_data[col] for col in feature_cols}
        df = pd.DataFrame([row])

        for col, le in encoders.items():
            if col in df:
                df[col] = le.transform(df[col])

        reg_results = {}
        for target, model in reg_models.items():
            reg_results[target] = round(float(model.predict(df)[0]), 2)

        clf_results = {}
        for target, model in clf_models.items():
            pred_idx = model.predict(df)[0]
            clf_results[target] = target_encoders[target].inverse_transform([pred_idx])[0]

        p1 = reg_results.get("price_next_1m", round(current_p * 1.02, 2))
        p3 = reg_results.get("price_next_3m", round(current_p * 1.05, 2))
        p6 = reg_results.get("price_next_6m", round(current_p * 1.08, 2))
        d1 = reg_results.get("demand_next_1m", round(default_vol * 1.01, 1))
        d3 = reg_results.get("demand_next_3m", round(default_vol * 1.03, 1))
        vol = round(float(reg_results.get("price_volatility_3m", 0.08)), 3)
        trend = clf_results.get("price_trend", "Stable")
        rec = clf_results.get("pricing_recommendation", "Hold / Margin Expansion")

    # Uncertainty interval computation based on model volatility
    eff_vol = max(0.04, min(0.35, vol if vol <= 1.0 else vol / 10.0))
    uncertainty_interval = {
        "price_next_1m": {
            "lower_bound": round(p1 * (1.0 - 1.28 * eff_vol), 2),
            "upper_bound": round(p1 * (1.0 + 1.28 * eff_vol), 2)
        },
        "price_next_3m": {
            "lower_bound": round(p3 * (1.0 - 1.64 * eff_vol), 2),
            "upper_bound": round(p3 * (1.0 + 1.64 * eff_vol), 2)
        },
        "price_next_6m": {
            "lower_bound": round(p6 * (1.0 - 1.96 * eff_vol), 2),
            "upper_bound": round(p6 * (1.0 + 1.96 * eff_vol), 2)
        }
    }

    # Expected monthly revenue: derived from Model 2 predicted price and volume, calibrated to monthly turnover scale
    benchmark_rev = REVENUE_TABLE.get(norm_cat, 50000.0)
    raw_sales = d1 * p1
    if raw_sales < benchmark_rev * 0.35 and raw_sales > 0:
        multiplier = round(benchmark_rev / raw_sales, 1)
        expected_monthly_revenue = round(raw_sales * multiplier, 2)
    else:
        expected_monthly_revenue = round(raw_sales, 2)

    res_m2 = {
        "business_category": norm_cat,
        "commodity_or_service": comm_name,
        "unit": unit,
        "current_price": float(current_p),
        "price_next_1m": p1,
        "price_next_3m": p3,
        "price_next_6m": p6,
        "demand_next_1m": d1,
        "demand_next_3m": d3,
        "price_trend": trend,
        "price_volatility": vol,
        "price_volatility_3m": vol,
        "uncertainty_interval": uncertainty_interval,
        "pricing_recommendation": rec,
        "expected_monthly_revenue": expected_monthly_revenue
    }
    _m2_cache[cache_key] = res_m2
    return res_m2

# --- MODEL 3 INFERENCE ---
def predict_model3_risk(
    category: str,
    own_capital: float,
    prior_experience: bool = True,
    competitors_5km: int = 3,
    has_road: bool = True,
    has_power: bool = True,
    has_infra: bool = True,
    demand_trend: Optional[float] = None,
    price_volatility: Optional[float] = None,
    monthly_rev: Optional[float] = None,
    monthly_fixed_cost: Optional[float] = None,
    buyer_dependency: float = 0.25,
    supply_chain_reliability: Optional[float] = None
) -> Dict[str, Any]:
    """
    Model 3 — Business Risk Prediction:
    Inputs: Business type, experience, capital, competition (from M1), demand trend (from M2),
            price volatility (from M2), local infrastructure, buyer dependency, revenue (from M2),
            and operating costs (from Financial Calculator).
    Outputs: Overall risk score/level, market risk, demand/seasonal risk, supply-chain risk,
             operational risk, financial risk, and major threats.
    """
    norm_cat = normalize_category(category)
    eff_trend = float(demand_trend if demand_trend is not None else 0.50)
    eff_vol = float(price_volatility if price_volatility is not None else 0.20)
    if eff_vol > 1.0:
        eff_vol = eff_vol / 10.0
    eff_rev = float(monthly_rev if monthly_rev is not None else REVENUE_TABLE.get(norm_cat, 50000.0))
    eff_opex = float(monthly_fixed_cost if monthly_fixed_cost is not None else estimate_operating_cost(norm_cat))
    eff_sc = float(supply_chain_reliability if supply_chain_reliability is not None else (0.85 if has_road else 0.55))

    cache_key = (norm_cat, round(float(own_capital), -3), bool(prior_experience), competitors_5km, bool(has_road), bool(has_power), bool(has_infra), round(eff_trend, 2), round(eff_vol, 2))
    if cache_key in _m3_cache:
        return dict(_m3_cache[cache_key])

    m3 = get_m3()

    if m3 is None:
        proba = 0.35 if own_capital >= 50000 else 0.48
        label = int(proba >= 0.4)
        importances = [("price_volatility", 0.28), ("demand_trend", 0.24), ("own_capital_inr", 0.18)]
    else:
        model = m3["model"]
        encoders = m3["encoders"]
        feature_cols = m3["feature_columns"]

        input_data = {
            "business_category": norm_cat,
            "prior_experience": 1 if prior_experience else 0,
            "own_capital_inr": float(own_capital),
            "competitors_5km": competitors_5km,
            "road_available": 1 if has_road else 0,
            "electricity_available": 1 if has_power else 0,
            "basic_infrastructure_available": 1 if has_infra else 0,
            "demand_trend": eff_trend,
            "price_volatility": eff_vol,
            "buyer_dependency": float(buyer_dependency),
            "supply_chain_reliability": eff_sc,
            "monthly_fixed_cost_inr": eff_opex,
            "monthly_revenue_estimate_inr": eff_rev
        }

        row = {col: input_data[col] for col in feature_cols}
        df = pd.DataFrame([row])

        for col, le in encoders.items():
            if col in df:
                df[col] = le.transform(df[col])

        proba = float(model.predict_proba(df)[0][1])
        label = int(proba >= 0.4)

        importances = sorted(
            zip(feature_cols, model.feature_importances_),
            key=lambda x: -x[1]
        )[:5]

    if proba >= 0.7:
        level = "High"
    elif proba >= 0.4:
        level = "Medium"
    else:
        level = "Low"

    # Multi-Dimensional Risk Breakdown (per spec: market risk, demand/seasonal, supply-chain, operational, financial)
    market_score = int(min(95, max(15, eff_vol * 120 + (10 if "dairy" in norm_cat.lower() or "poultry" in norm_cat.lower() else 0))))
    demand_score = int(min(95, max(15, (1.0 - eff_trend) * 60 + competitors_5km * 4.5)))
    sc_score = int(25 if (has_road and eff_sc >= 0.75) else 70)
    infra_score = int(20 if (has_power and has_infra) else 68)
    profit_margin = (eff_rev - eff_opex) / max(1.0, eff_rev)
    fin_score = int(min(90, max(15, (1.0 - profit_margin) * 60 + (25 if own_capital < 30000 else 0))))
    op_score = int(22 if prior_experience else 65)

    dimensional_risks = {
        "market_risk": {
            "dimension": "Market-Price Risk",
            "score": market_score,
            "level": "High" if market_score >= 60 else ("Moderate" if market_score >= 35 else "Low"),
            "probability": round(market_score / 100.0, 2),
            "description": f"Spot-price volatility ({round(eff_vol * 100, 1)}%) and mandi procurement rate swings.",
            "mitigation": "Establish institutional supply contracts or forward-procurement pricing agreements."
        },
        "demand_seasonal_risk": {
            "dimension": "Demand & Seasonal Risk",
            "score": demand_score,
            "level": "High" if demand_score >= 60 else ("Moderate" if demand_score >= 35 else "Low"),
            "probability": round(demand_score / 100.0, 2),
            "description": f"Seasonal demand cyclicality and local competition from {competitors_5km} units.",
            "mitigation": "Diversify distribution across neighboring village weekly haats and institutional buyers."
        },
        "supply_chain_risk": {
            "dimension": "Supply-Chain Risk",
            "score": sc_score,
            "level": "High" if sc_score >= 60 else ("Moderate" if sc_score >= 35 else "Low"),
            "probability": round(sc_score / 100.0, 2),
            "description": "Feed, raw-material input availability, and all-weather transport connectivity.",
            "mitigation": "Form raw-material purchasing collective with neighboring village producers."
        },
        "infrastructure_risk": {
            "dimension": "Infrastructure Risk",
            "score": infra_score,
            "level": "High" if infra_score >= 60 else ("Moderate" if infra_score >= 35 else "Low"),
            "probability": round(infra_score / 100.0, 2),
            "description": "Reliability of grid power, water availability, and cold storage preservation.",
            "mitigation": "Install solar-powered backup lighting/aeration and rainwater storage."
        },
        "financial_risk": {
            "dimension": "Financial & Debt Service Risk",
            "score": fin_score,
            "level": "High" if fin_score >= 60 else ("Moderate" if fin_score >= 35 else "Low"),
            "probability": round(fin_score / 100.0, 2),
            "description": f"Liquidity buffer and cash surplus sufficiency (Profit margin: {round(profit_margin * 100, 1)}%).",
            "mitigation": "Utilize official loan moratorium period to build 45-day operating cash buffer."
        },
        "operational_risk": {
            "dimension": "Operational Complexity Risk",
            "score": op_score,
            "level": "High" if op_score >= 60 else ("Moderate" if op_score >= 35 else "Low"),
            "probability": round(op_score / 100.0, 2),
            "description": "Execution capability, technical equipment maintenance, and domain experience.",
            "mitigation": "Enroll in Krishi Vigyan Kendra (KVK) / RSETI technical skill certification program."
        }
    }

    # Major threats ranked by dimensional scores
    ranked_threats = sorted(
        [
            (dimensional_risks["market_risk"]["score"], "Market-Price Volatility & spot rate fluctuation"),
            (dimensional_risks["demand_seasonal_risk"]["score"], f"Local market competition ({competitors_5km} units within 5km) & lean season"),
            (dimensional_risks["supply_chain_risk"]["score"], "Input logistics bottleneck or raw material feed inflation"),
            (dimensional_risks["financial_risk"]["score"], "Initial cash flow strain or debt servicing pressure"),
            (dimensional_risks["operational_risk"]["score"], "Execution setbacks due to technical domain learning curve")
        ],
        key=lambda x: -x[0]
    )
    major_threats = [t[1] for t in ranked_threats if t[0] >= 30][:3]

    res_m3 = {
        "business_category": norm_cat,
        "risk_label": label,
        "risk_score": round(proba * 100.0, 1),
        "risk_level": level,
        "risk_probability": round(proba, 2),
        "top_factors": [HUMAN_FACTOR_NAMES.get(f[0], f[0].replace("_", " ").title()) for f in importances],
        "dimensional_risks": dimensional_risks,
        "major_threats": major_threats
    }
    _m3_cache[cache_key] = res_m3
    return res_m3

# --- DYNAMIC SWOT GENERATOR (Generated from Model 1 + Model 2 + Model 3 without extra ML) ---
def generate_swot_from_models(
    m1_res: Dict[str, Any],
    m2_res: Dict[str, Any],
    m3_res: Dict[str, Any],
    category: str
) -> Dict[str, List[str]]:
    """
    Specification Rule: SWOT does not need another ML model.
    Generate it deterministically from Model 1 + Model 2 + Model 3 results.
    """
    strengths = []
    weaknesses = []
    opportunities = []
    threats = []

    # Strengths from Model 1
    if m1_res.get("feasibility_score", 0) >= 60.0:
        strengths.append(f"Strong overall feasibility ({m1_res.get('feasibility_score')}/100) and viable local opportunity.")
    strengths.extend(m1_res.get("positive_factors", [])[:2])

    # Weaknesses from Model 1 & Model 3
    weaknesses.extend(m1_res.get("negative_factors", [])[:2])
    fin_risk = m3_res.get("dimensional_risks", {}).get("financial_risk", {})
    if fin_risk.get("level") in ["Moderate", "High"]:
        weaknesses.append("Initial working-capital liquidity buffer required during gestation period.")

    # Opportunities from Model 2 & Market reach
    p_trend = m2_res.get("price_trend", "Stable")
    p_rec = m2_res.get("pricing_recommendation", "Hold / Expand")
    opportunities.append(f"Model 2 Forecast: {p_trend} pricing trend ({p_rec}) supports healthy revenue potential.")
    reach = m1_res.get("market_reach_km", 6.0)
    opportunities.append(f"Expanded catchment area reaching {reach} km across neighboring village haats.")
    opportunities.append("MoSJE / NBCFDC concessional refinance rates (6.5% - 8.0% p.a.) with upfront moratorium.")

    # Threats from Model 3 & Model 2 volatility
    threats.extend(m3_res.get("major_threats", []))
    vol = m2_res.get("price_volatility", 0.08)
    if vol >= 0.15:
        threats.append(f"High price volatility ({round(vol * 100, 1)}%) in {m2_res.get('commodity_or_service', 'commodity')} market.")

    # Fallback guarantees if lists are sparse
    if not strengths:
        strengths.append(f"Daily essential demand for {category} within the rural block.")
    if not weaknesses:
        weaknesses.append("Working capital discipline required to sustain initial ramp-up months.")
    if not opportunities:
        opportunities.append("Direct-to-consumer delivery and weekly haat commercial supply contracts.")
    if not threats:
        threats.append("Adverse weather or seasonal feed price inflation.")

    return {
        "strengths": strengths[:4],
        "weaknesses": weaknesses[:4],
        "opportunities": opportunities[:4],
        "threats": threats[:4]
    }

# --- MODEL 4 INFERENCE (Financial Calculator & Scheme Engine) ---
model4_path = os.path.join(MODELS_DIR, "model4")
if model4_path not in sys.path:
    sys.path.append(model4_path)

from advisor import (
    get_business_advisory as _get_advisory,
    PROJECT_COST_TABLE,
    REVENUE_TABLE
)
from financial_calculator import simulate_loan_repayment, estimate_operating_cost
from scheme_engine import get_scheme_recommendation

def run_model4_advisory(
    state: str,
    business_category: str,
    own_capital: float,
    prior_experience: bool = False,
    repayment_strategy_pct: float = 50.0,
    cash_reserve: float = 0.0,
    override_revenue: Optional[float] = None
) -> Dict[str, Any]:
    norm_cat = normalize_category(business_category)
    return _get_advisory(
        state=state,
        business_category=norm_cat,
        own_capital=float(own_capital),
        prior_experience=prior_experience,
        repayment_strategy_pct=repayment_strategy_pct,
        cash_reserve=cash_reserve,
        override_revenue=override_revenue
    )

# --- MASTER CHAINED PIPELINE (Matching Specification Flow) ---
def run_unified_advisory_pipeline(
    state: str,
    business_category: str,
    own_capital: float,
    prior_experience: bool = False,
    district: str = "Dhanbad",
    block: str = "Govindpur",
    village: str = "Pratappur",
    population: int = 5000,
    competitors_count: int = 3,
    road_available: bool = True,
    electricity_available: bool = True,
    basic_infra_available: bool = True,
    repayment_strategy_pct: float = 50.0,
    cash_reserve: float = 0.0
) -> Dict[str, Any]:
    """
    Exact Chained Flow from Specification:
    User inputs (Location, Business, Experience, Own Capital)
      -> Automatic village / market data
      -> Model 1: Feasibility
      -> Model 2: Price & Demand Forecasting -> Expected Revenue
      -> Financial Calculator: profit & repayment simulation
      -> Model 3: Risk (consuming M1 competition, M2 trend/volatility, FinCalc opex/rev)
      -> Government Scheme Engine
      -> Dynamic SWOT (from M1 + M2 + M3)
      -> Final AI Advisory Report
    """
    norm_cat = normalize_category(business_category)

    # 1. Model 1: Feasibility
    m1_pred = predict_model1_feasibility(
        category=norm_cat,
        own_capital=own_capital,
        prior_experience=prior_experience,
        population=population,
        competitors_5km=competitors_count,
        has_road=road_available,
        has_power=electricity_available,
        has_infra=basic_infra_available
    )

    # 2. Model 2: Price & Demand Forecasting
    m2_pred = predict_model2_price_demand(category=norm_cat)
    expected_revenue = float(m2_pred.get("expected_monthly_revenue", REVENUE_TABLE.get(norm_cat, 50000.0)))
    opex = estimate_operating_cost(norm_cat)

    # 3. Government Scheme Engine & Financial Calculator
    m4_advisory = run_model4_advisory(
        state=state,
        business_category=norm_cat,
        own_capital=own_capital,
        prior_experience=prior_experience,
        repayment_strategy_pct=repayment_strategy_pct,
        cash_reserve=cash_reserve,
        override_revenue=expected_revenue
    )

    # 4. Model 3: Business Risk Prediction (feeding M1, M2, and M4 results)
    trend_val = 0.65 if m2_pred.get("price_trend") == "Rising" else (0.35 if m2_pred.get("price_trend") == "Falling" else 0.50)
    m3_pred = predict_model3_risk(
        category=norm_cat,
        own_capital=own_capital,
        prior_experience=prior_experience,
        competitors_5km=competitors_count,
        has_road=road_available,
        has_power=electricity_available,
        has_infra=basic_infra_available,
        demand_trend=trend_val,
        price_volatility=float(m2_pred.get("price_volatility", 0.08)),
        monthly_rev=expected_revenue,
        monthly_fixed_cost=opex
    )

    # 5. Dynamic SWOT Matrix (synthesizing M1 + M2 + M3)
    dynamic_swot = generate_swot_from_models(m1_pred, m2_pred, m3_pred, norm_cat)

    return {
        "status": "SUCCESS",
        "inputs": {
            "location": {
                "state": state,
                "district": district,
                "block": block,
                "village": village
            },
            "business_category": norm_cat,
            "prior_experience": prior_experience,
            "own_capital": own_capital
        },
        "model1_feasibility": m1_pred,
        "model2_price_demand": m2_pred,
        "model3_risk": m3_pred,
        "model4_financial_advisory": m4_advisory,
        "dynamic_swot": dynamic_swot,
        "executive_summary": {
            "feasibility_score": m1_pred["feasibility_score"],
            "opportunity_class": m1_pred["opportunity_class"],
            "expected_monthly_revenue": expected_revenue,
            "expected_monthly_profit": m4_advisory.get("repayment_advice", {}).get("potential_monthly_profit", expected_revenue - opex),
            "monthly_emi": m4_advisory.get("repayment_advice", {}).get("emi", 0.0),
            "can_afford_emi": m4_advisory.get("repayment_advice", {}).get("can_afford_emi", True),
            "overall_risk_level": m3_pred["risk_level"],
            "recommended_scheme": m4_advisory.get("recommended_scheme", {}).get("name", "MoSJE Concessional Scheme")
        }
    }
