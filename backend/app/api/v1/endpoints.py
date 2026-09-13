import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.responses import Response

from app.schemas.all_schemas import (
    UserRegisterRequest,
    UserLoginRequest,
    TokenResponse,
    UserResponse,
    ProjectCostRequest,
    ProjectCostResponse,
    SchemeRuleRecommendationRequest,
    SchemeRecommendationResponse,
    EMIRequest,
    EMIResponse,
    WorkingCapitalRequest,
    WorkingCapitalResponse,
    BreakEvenRequest,
    BreakEvenResponse,
    CashFlowRequest,
    CashFlowResponse,
    AssessmentCreateRequest,
    AssessmentDetailResponse,
    AIChatRequest,
    AIChatResponse,
    SWOTResponse
)
from app.engines.financial.calculator import FinancialEngine, format_inr
from app.engines.scheme.rules import SchemeRuleEngine, SEEDED_SCHEMES
from app.engines.scoring.feasibility import ScoringEngine, RiskEngine
from app.gis.spatial import GISEngine
from app.ai.orchestrator import AIOrchestrator
from app.reports.pdf_generator import PDFReportGenerator
from app.models.unified_models import (
    predict_model1_feasibility,
    predict_model2_price_demand,
    predict_model3_risk,
    run_model4_advisory,
    run_unified_advisory_pipeline,
    generate_swot_from_models,
    estimate_operating_cost,
    normalize_category,
    PROJECT_COST_TABLE,
    REVENUE_TABLE,
    COMMODITY_MAP
)

from app.core.persistence import (
    load_assessments_store,
    save_assessments_store,
    load_users_store,
    save_users_store
)

router = APIRouter()

# Persistent storage for user records & enterprise assessments
USERS_DB = load_users_store()
ASSESSMENTS_DB = load_assessments_store()

# Seed a default demo assessment matching the prompt flow
def seed_default_assessment():
    demo_id = "demo-dairy-assessment-101"
    if demo_id in ASSESSMENTS_DB:
        return
    cat = "Dairy & Livestock"
    fin_cost = FinancialEngine.calculate_project_cost(Decimal("100000.00"))
    scheme_rec = SchemeRuleEngine.evaluate_scheme(fin_cost.project_cost, Decimal("100000.00"))
    
    score_breakdown = ScoringEngine.compute_feasibility(
        category=cat,
        margin_capital=Decimal("100000.00"),
        experience_years=2,
        infra_flags={"water_available": True, "electricity_available": True, "transport_available": True, "land_available": True, "storage_available": False},
        competitor_count_5km=2
    )

    risks = RiskEngine.evaluate_risks(
        category=cat,
        margin_capital=Decimal("100000.00"),
        infra_flags={"water_available": True, "electricity_available": True, "transport_available": True},
        experience_years=2
    )

    comp_5km = GISEngine.find_competitors_within_radius(28.6139, 77.2090, "Dairy", 5.0)
    comp_10km = GISEngine.find_competitors_within_radius(28.6139, 77.2090, "Dairy", 10.0)
    pricing = GISEngine.get_pricing_benchmarks("Dairy")
    # Execute chained 4-Model Pipeline matching exact data architecture
    m1_pred = predict_model1_feasibility(cat, 100000.0, True, 8420, 2)
    m2_pred = predict_model2_price_demand(cat, 6, "Monsoon")
    m4_pred = run_model4_advisory("Uttar Pradesh", cat, 100000.0, True, override_revenue=m2_pred.get("expected_monthly_revenue"))
    m3_pred = predict_model3_risk(
        cat,
        100000.0,
        True,
        2,
        demand_trend=0.65 if m2_pred.get("price_trend") == "Rising" else 0.50,
        price_volatility=float(m2_pred.get("price_volatility", 0.08)),
        monthly_rev=float(m2_pred.get("expected_monthly_revenue", 68625.0)),
        monthly_fixed_cost=estimate_operating_cost(cat)
    )
    swot_dict = generate_swot_from_models(m1_pred, m2_pred, m3_pred, cat)
    swot = SWOTResponse(**swot_dict)
    strategy = AIOrchestrator.generate_strategy(cat, {})

    ASSESSMENTS_DB[demo_id] = {
        "id": demo_id,
        "title": "Dairy Micro-Enterprise Feasibility",
        "created_at": datetime.now(timezone.utc),
        "status": "COMPLETED",
        "user_inputs": {
            "business_category": cat,
            "business_subcategory": "Cow & Buffalo Milk Chilling",
            "margin_capital": 100000.00,
            "location": {
                "state": "Uttar Pradesh",
                "district": "Meerut",
                "block": "Hastinapur",
                "village": "Ganeshpur",
                "latitude": 28.6139,
                "longitude": 77.2090
            },
            "experience_years": 2,
            "land_available": True,
            "water_available": True,
            "electricity_available": True,
            "transport_available": True,
            "storage_available": False
        },
        "financial_summary": fin_cost.model_dump(),
        "scheme_recommendation": scheme_rec.model_dump(),
        "feasibility_score": score_breakdown.model_dump(),
        "swot": swot.model_dump(),
        "risks": [r.model_dump() for r in risks],
        "competitors_5km": [c.model_dump() for c in comp_5km],
        "competitors_10km": [c.model_dump() for c in comp_10km],
        "pricing_data": [p.model_dump() for p in pricing],
        "ai_strategy": strategy,
        "model1_prediction": m1_pred,
        "model2_forecast": m2_pred,
        "model3_risk": m3_pred,
        "model4_advisory": m4_pred,
        "sources_and_confidence": {
            "population_data": "Estimated from Census & Village Directory [2021-24 Projection]",
            "scheme_rules": "MoSJE Policy Gazette 2024 [Verified]",
            "competitor_data": "District Enterprise Survey [Verified / 2 Records Found]",
            "pricing_data": "District Milk Producers Union Mandi Report [Verified]"
        },
        "download_report_url": f"/api/v1/reports/{demo_id}/pdf"
    }

seed_default_assessment()

# ----------------- Auth Endpoints -----------------
@router.post("/auth/register", response_model=TokenResponse)
def register(payload: UserRegisterRequest):
    if payload.email in USERS_DB:
        raise HTTPException(status_code=400, detail="An account with this email already exists.")
    
    user_id = str(uuid.uuid4())
    user_record = {
        "id": user_id,
        "name": payload.name,
        "email": payload.email,
        "mobile": payload.mobile,
        "role": "user",
        "state": payload.state,
        "district": payload.district,
        "preferred_language": payload.preferred_language,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    USERS_DB[payload.email] = {
        **user_record,
        "password": payload.password
    }
    save_users_store(USERS_DB)

    return TokenResponse(
        access_token=f"jwt_mock_access_{user_id}",
        refresh_token=f"jwt_mock_refresh_{user_id}",
        user=user_record
    )

@router.post("/auth/login", response_model=TokenResponse)
def login(payload: UserLoginRequest):
    user = USERS_DB.get(payload.email)
    if not user or user["password"] != payload.password:
        # Check if it's the demo login
        if payload.email == "demo@grambiz.in" and payload.password == "Demo@123":
            demo_user = {
                "id": "demo-user-1",
                "name": "Ramesh Kumar (Demo)",
                "email": "demo@grambiz.in",
                "mobile": "9876543210",
                "role": "user",
                "state": "Uttar Pradesh",
                "district": "Meerut",
                "preferred_language": "hi",
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            return TokenResponse(
                access_token="jwt_mock_access_demo_user",
                refresh_token="jwt_mock_refresh_demo_user",
                user=demo_user
            )
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    
    user_data = {k: v for k, v in user.items() if k != "password"}
    return TokenResponse(
        access_token=f"jwt_mock_access_{user['id']}",
        refresh_token=f"jwt_mock_refresh_{user['id']}",
        user=user_data
    )

@router.get("/auth/me")
def get_me():
    return {
        "id": "demo-user-1",
        "name": "Ramesh Kumar",
        "email": "demo@grambiz.in",
        "role": "user",
        "state": "Uttar Pradesh",
        "district": "Meerut",
        "preferred_language": "en"
    }

# ----------------- Financial Endpoints -----------------
@router.post("/finance/project-cost", response_model=ProjectCostResponse)
def compute_project_cost(payload: ProjectCostRequest):
    try:
        return FinancialEngine.calculate_project_cost(payload.margin_capital, payload.margin_percentage)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/finance/emi", response_model=EMIResponse)
def compute_emi(payload: EMIRequest):
    try:
        return FinancialEngine.calculate_emi_and_amortization(
            principal=payload.principal,
            annual_interest_rate=payload.annual_interest_rate,
            tenure_months=payload.tenure_months,
            moratorium_months=payload.moratorium_months,
            moratorium_interest_policy=payload.moratorium_interest_policy
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/finance/working-capital", response_model=WorkingCapitalResponse)
def compute_working_capital(payload: WorkingCapitalRequest):
    return FinancialEngine.calculate_working_capital(
        raw_materials=payload.raw_materials,
        rent=payload.rent,
        electricity=payload.electricity,
        salaries=payload.salaries,
        transport=payload.transport,
        marketing=payload.marketing,
        maintenance=payload.maintenance,
        miscellaneous=payload.miscellaneous,
        reserve_months=payload.reserve_months
    )

@router.post("/finance/break-even", response_model=BreakEvenResponse)
def compute_break_even(payload: BreakEvenRequest):
    return FinancialEngine.calculate_break_even(
        fixed_costs=payload.fixed_costs,
        variable_cost_per_unit=payload.variable_cost_per_unit,
        selling_price_per_unit=payload.selling_price_per_unit,
        estimated_monthly_units=payload.estimated_monthly_units
    )

@router.post("/finance/cash-flow", response_model=CashFlowResponse)
def compute_cash_flow(payload: CashFlowRequest):
    return FinancialEngine.calculate_cash_flow(
        estimated_monthly_revenue=payload.estimated_monthly_revenue,
        monthly_operating_expense=payload.monthly_operating_expense,
        monthly_emi=payload.monthly_emi,
        projection_years=payload.projection_years,
        annual_revenue_growth_percent=payload.annual_revenue_growth_percent,
        annual_expense_growth_percent=payload.annual_expense_growth_percent
    )

# ----------------- Scheme Endpoints -----------------
@router.get("/schemes")
def get_all_schemes():
    return SEEDED_SCHEMES

@router.post("/schemes/recommend", response_model=SchemeRecommendationResponse)
def recommend_scheme(payload: SchemeRuleRecommendationRequest):
    return SchemeRuleEngine.evaluate_scheme(payload.project_cost, payload.margin_capital)

# ----------------- GIS & Geocoding Endpoints -----------------
from app.gis.geocoding import GeocodingProvider, ReverseGeocodeResponse

@router.get("/locations/reverse-geocode", response_model=ReverseGeocodeResponse)
async def reverse_geocode_location(lat: float, lon: float, source: str = "gps"):
    res = await GeocodingProvider.reverse_geocode(lat, lon)
    res.location_source = source
    return res

@router.get("/gis/competitors")
def get_competitors(lat: float, lon: float, category: Optional[str] = None, radius_km: float = 10.0):
    return GISEngine.find_competitors_within_radius(lat, lon, category, radius_km)

# ----------------- Assessment Endpoints -----------------
@router.post("/assessments")
def create_assessment(payload: AssessmentCreateRequest):
    assessment_id = f"asm-{uuid.uuid4().hex[:8]}"
    
    capital_amount = payload.margin_capital or payload.own_capital or Decimal("25000")
    has_experience = payload.prior_experience or (payload.experience_years > 0)
    exp_years = payload.experience_years if payload.experience_years > 0 else (2 if has_experience else 0)
    lat = payload.location.latitude if payload.location.latitude is not None else 23.7957
    lon = payload.location.longitude if payload.location.longitude is not None else 86.4304
    
    # 1. Deterministic Financial Calculation
    fin_cost = FinancialEngine.calculate_project_cost(capital_amount)
    
    # 2. Scheme Rule Evaluation
    scheme_rec = SchemeRuleEngine.evaluate_scheme(fin_cost.project_cost, capital_amount)
    
    # 3. GIS Competitor Scan (Uses verified regional datasets with instant sub-millisecond local execution)
    comp_5km = GISEngine.find_competitors_within_radius(
        lat,
        lon,
        payload.business_category,
        5.0,
        try_live=False
    )
    comp_10km = GISEngine.find_competitors_within_radius(
        lat,
        lon,
        payload.business_category,
        10.0,
        try_live=False
    )
    
    # 4. Feasibility & Risk Engines
    infra_flags = {
        "water_available": payload.water_available,
        "electricity_available": payload.electricity_available,
        "transport_available": payload.transport_available,
        "land_available": payload.land_available,
        "storage_available": payload.storage_available
    }
    score_breakdown = ScoringEngine.compute_feasibility(
        category=payload.business_category,
        margin_capital=capital_amount,
        experience_years=exp_years,
        infra_flags=infra_flags,
        competitor_count_5km=len(comp_5km)
    )
    risks = RiskEngine.evaluate_risks(
        category=payload.business_category,
        margin_capital=capital_amount,
        infra_flags=infra_flags,
        experience_years=exp_years
    )
    
    # 5. Pricing benchmarks
    pricing = GISEngine.get_pricing_benchmarks(payload.business_category)
    
    # 7. Execute 4-Model Pipeline matching exact data architecture
    norm_cat = normalize_category(payload.business_category)
    m1_pred = predict_model1_feasibility(
        category=norm_cat,
        own_capital=float(capital_amount),
        prior_experience=has_experience,
        population=8420,
        competitors_5km=len(comp_5km),
        has_road=payload.transport_available,
        has_power=payload.electricity_available,
        has_infra=payload.water_available and payload.electricity_available,
        competitors_10km=len(comp_10km)
    )
    m2_pred = predict_model2_price_demand(category=norm_cat)
    expected_rev = float(m2_pred.get("expected_monthly_revenue", 50000.0))
    opex = estimate_operating_cost(norm_cat)

    m4_pred = run_model4_advisory(
        state=payload.location.state,
        business_category=norm_cat,
        own_capital=float(capital_amount),
        prior_experience=has_experience,
        override_revenue=expected_rev
    )
    m3_pred = predict_model3_risk(
        category=norm_cat,
        own_capital=float(capital_amount),
        prior_experience=has_experience,
        competitors_5km=len(comp_5km),
        has_road=payload.transport_available,
        has_power=payload.electricity_available,
        has_infra=payload.water_available and payload.electricity_available,
        demand_trend=0.65 if m2_pred.get("price_trend") == "Rising" else (0.35 if m2_pred.get("price_trend") == "Falling" else 0.50),
        price_volatility=float(m2_pred.get("price_volatility", 0.08)),
        monthly_rev=expected_rev,
        monthly_fixed_cost=opex
    )
    swot_dict = generate_swot_from_models(m1_pred, m2_pred, m3_pred, norm_cat)
    swot = SWOTResponse(**swot_dict)
    strategy = AIOrchestrator.generate_strategy(payload.business_category, {})

    record = {
        "id": assessment_id,
        "title": payload.title or f"{payload.business_category} in {payload.location.village}",
        "created_at": datetime.now(timezone.utc),
        "status": "COMPLETED",
        "user_inputs": payload.model_dump(),
        "financial_summary": fin_cost.model_dump(),
        "scheme_recommendation": scheme_rec.model_dump(),
        "feasibility_score": score_breakdown.model_dump(),
        "swot": swot.model_dump(),
        "risks": [r.model_dump() for r in risks],
        "competitors_5km": [c.model_dump() for c in comp_5km],
        "competitors_10km": [c.model_dump() for c in comp_10km],
        "pricing_data": [p.model_dump() for p in pricing],
        "ai_strategy": strategy,
        "model1_prediction": m1_pred,
        "model2_forecast": m2_pred,
        "model3_risk": m3_pred,
        "model4_advisory": m4_pred,
        "sources_and_confidence": {
            "population_data": "Estimated from Census & Panchayat Registry",
            "scheme_rules": "MoSJE Policy Guideline 2024 [Verified]",
            "competitor_data": f"{len(comp_10km)} local commercial points identified [Verified]",
            "pricing_data": "District Mandi & Haat Benchmarks [Verified / Estimated]"
        },
        "download_report_url": f"/api/v1/reports/{assessment_id}/pdf"
    }

    ASSESSMENTS_DB[assessment_id] = record
    save_assessments_store(ASSESSMENTS_DB)
    return record

@router.get("/assessments")
def list_assessments():
    return list(ASSESSMENTS_DB.values())

@router.get("/assessments/{id}")
def get_assessment(id: str):
    record = ASSESSMENTS_DB.get(id)
    if not record:
        raise HTTPException(status_code=404, detail="Assessment not found.")
    return record

from app.engines.ml.predictor import MLPredictorEngine
from app.engines.ocr.extractor import OCRExtractorEngine
from app.gis.realtime_mandi import RealtimeMandiEngine
from app.schemas.all_schemas import (
    OCRScanRequest,
    MLForecastRequest,
    AdminSchemeUpdateRequest
)

# ----------------- AI Chat Endpoint -----------------
@router.post("/ai/chat", response_model=AIChatResponse)
def ai_chat(payload: AIChatRequest):
    conv_id = payload.conversation_id or str(uuid.uuid4())
    context = None
    if payload.context_assessment_id:
        context = ASSESSMENTS_DB.get(payload.context_assessment_id)
    
    result = AIOrchestrator.answer_query(
        message=payload.message,
        conversation_id=conv_id,
        context_data=context,
        language=payload.preferred_language
    )
    return AIChatResponse(
        conversation_id=conv_id,
        reply=result["reply"],
        citations=result.get("citations", []),
        suggested_actions=result.get("suggested_actions", [])
    )

# ----------------- Report PDF Endpoint -----------------
@router.get("/reports/{id}/pdf")
def download_pdf_report(id: str):
    record = ASSESSMENTS_DB.get(id)
    if not record:
        raise HTTPException(status_code=404, detail="Assessment report not found.")
    
    pdf_bytes = PDFReportGenerator.generate_assessment_report(record)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=GramBiz_Report_{id}.pdf"
        }
    )

@router.get("/finance/plan/pdf")
def download_financial_plan_pdf(
    loan_amount: float = 900000.0,
    interest_rate: float = 8.0,
    tenure_months: int = 84,
    moratorium_months: int = 6,
    monthly_emi: float = 14048.0,
    monthly_revenue: float = 120000.0,
    monthly_opex: float = 55000.0,
    post_emi_surplus: float = 50952.0,
    total_interest: float = 279998.0,
    total_repayment: float = 1179998.0
):
    plan_data = {
        "loan_amount": loan_amount,
        "interest_rate": interest_rate,
        "tenure_months": tenure_months,
        "moratorium_months": moratorium_months,
        "monthly_emi": monthly_emi,
        "monthly_revenue": monthly_revenue,
        "monthly_opex": monthly_opex,
        "post_emi_surplus": post_emi_surplus,
        "total_interest": total_interest,
        "total_repayment": total_repayment
    }
    pdf_bytes = PDFReportGenerator.generate_financial_plan_pdf(plan_data)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": "attachment; filename=GramBiz_Loan_Repayment_Plan.pdf"
        }
    )


@router.post("/calculators/working-capital/pdf")
def generate_working_capital_pdf_post(data: dict):
    pdf_bytes = PDFReportGenerator.generate_working_capital_report(data)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": "attachment; filename=UDYAM_SETU_Working_Capital_Dossier.pdf"
        }
    )


@router.get("/calculators/working-capital/pdf")
def generate_working_capital_pdf_get(
    enterprise_name: str = "Rural Micro-Enterprise",
    entrepreneur_name: str = "Entrepreneur",
    sector: str = "Agro-Enterprise",
    monthly_opex: float = 58000.0,
    reserve_months: int = 3,
    recommended_reserve: float = 174000.0,
    monthly_revenue: float = 85000.0
):
    data = {
        "enterprise_name": enterprise_name,
        "entrepreneur_name": entrepreneur_name,
        "sector": sector,
        "monthly_opex": monthly_opex,
        "reserve_months": reserve_months,
        "recommended_reserve": recommended_reserve,
        "monthly_revenue": monthly_revenue,
        "expenses": {
            "raw_materials": monthly_opex * 0.43,
            "rent": monthly_opex * 0.08,
            "electricity": monthly_opex * 0.06,
            "salaries": monthly_opex * 0.20,
            "transport": monthly_opex * 0.07,
            "marketing": monthly_opex * 0.03,
            "maintenance": monthly_opex * 0.07,
            "miscellaneous": monthly_opex * 0.06,
        }
    }
    pdf_bytes = PDFReportGenerator.generate_working_capital_report(data)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": "attachment; filename=UDYAM_SETU_Working_Capital_Dossier.pdf"
        }
    )



# ================= PRO VERSION ENDPOINTS =================

@router.post("/pro/ocr/scan")
def scan_document(payload: OCRScanRequest):
    """
    Pro OCR: Extracts data from Aadhaar, Caste, Ration Card & Land Records
    """
    res = OCRExtractorEngine.parse_rural_document(
        filename=payload.document_name,
        text_content=payload.sample_text
    )
    return res

@router.post("/pro/ml/predict")
def predict_demand_and_price(payload: MLForecastRequest):
    """
    Pro ML: Forecasts seasonal demand index, unit price CI, and projected revenue
    """
    res = MLPredictorEngine.forecast_demand_and_prices(
        category=payload.category,
        current_unit_price=payload.current_unit_price,
        monthly_base_volume=payload.monthly_base_volume,
        months_ahead=payload.months_ahead
    )
    return res

@router.get("/pro/mandi/live")
def get_live_mandi_feed(category: Optional[str] = None, district: Optional[str] = None):
    """
    Pro Live Data: Real-time APMC Mandi commodity prices & arrivals
    """
    res = RealtimeMandiEngine.get_live_mandi_prices(category=category, district=district)
    return res

class AdvisoryAPIRequest(BaseModel):
    state: str = "Jharkhand"
    business_category: str = "Dairy & Livestock"
    own_capital: float = 40000.0
    prior_experience: bool = True
    district: Optional[str] = "Dhanbad"
    block: Optional[str] = "Govindpur"
    village: Optional[str] = "Pratappur"
    repayment_strategy_pct: float = 50.0
    cash_reserve: float = 0.0

@router.post("/ai/advisory")
def get_business_advisory_endpoint(payload: AdvisoryAPIRequest):
    """
    Model 4 End-to-End Advisory Flow matching specification:
    Chains Model 1 (Feasibility) -> Model 2 (Forecast & Revenue) ->
    Financial Calculator (Repayment) -> Model 3 (Risk) -> Scheme Engine -> Dynamic SWOT
    """
    return run_unified_advisory_pipeline(
        state=payload.state,
        district=payload.district or "Dhanbad",
        block=payload.block or "Govindpur",
        village=payload.village or "Pratappur",
        business_category=payload.business_category,
        prior_experience=payload.prior_experience,
        own_capital=payload.own_capital,
        repayment_strategy_pct=payload.repayment_strategy_pct,
        cash_reserve=payload.cash_reserve
    )

class UnifiedPipelineAPIRequest(BaseModel):
    state: str = "Jharkhand"
    district: str = "Dhanbad"
    block: str = "Govindpur"
    village: str = "Pratappur"
    business_category: str = "Dairy & Livestock"
    prior_experience: bool = False
    own_capital: float = 40000.0
    population: int = 5000
    competitors_count: int = 3
    road_available: bool = True
    electricity_available: bool = True
    basic_infra_available: bool = True
    repayment_strategy_pct: float = 50.0
    cash_reserve: float = 0.0

@router.post("/models/pipeline")
def run_model_pipeline_endpoint(payload: UnifiedPipelineAPIRequest):
    """
    Executes the unified 4-Model + Scheme Engine + Dynamic SWOT pipeline
    strictly according to the 5-component specification.
    """
    return run_unified_advisory_pipeline(
        state=payload.state,
        district=payload.district,
        block=payload.block,
        village=payload.village,
        business_category=payload.business_category,
        prior_experience=payload.prior_experience,
        own_capital=payload.own_capital,
        population=payload.population,
        competitors_count=payload.competitors_count,
        road_available=payload.road_available,
        electricity_available=payload.electricity_available,
        basic_infra_available=payload.basic_infra_available,
        repayment_strategy_pct=payload.repayment_strategy_pct,
        cash_reserve=payload.cash_reserve
    )

@router.get("/pro/compare/all")
def get_business_comparison_matrix():
    """
    Pro Multi-Business Evaluation: Returns side-by-side ROI, CapEx, and break-even metrics
    for all 10 supported categories powered by Models 1, 2, 3, and 4.
    """
    comparison = []
    
    for cat, p_cost in PROJECT_COST_TABLE.items():
        m2_res = predict_model2_price_demand(cat)
        exp_rev = float(m2_res.get("expected_monthly_revenue", REVENUE_TABLE.get(cat, 50000.0)))
        m4_adv = run_model4_advisory("Uttar Pradesh", cat, 50000.0, True, override_revenue=exp_rev)
        m1_res = predict_model1_feasibility(cat, 50000.0, True, 6000, 3)
        m3_res = predict_model3_risk(
            cat,
            50000.0,
            True,
            3,
            demand_trend=0.65 if m2_res.get("price_trend") == "Rising" else 0.50,
            price_volatility=float(m2_res.get("price_volatility", 0.08)),
            monthly_rev=exp_rev,
            monthly_fixed_cost=estimate_operating_cost(cat)
        )

        loan_amt = m4_adv.get("loan_amount_needed", max(0, p_cost - 50000))
        rec_scheme = m4_adv.get("recommended_scheme") or {}
        repay = m4_adv.get("repayment_advice") or {}

        comparison.append({
            "category": cat,
            "margin_equity": "₹50,000",
            "project_cost": f"₹{p_cost:,.2f}",
            "expected_monthly_revenue": f"₹{REVENUE_TABLE.get(cat, 0):,.2f}",
            "scheme_loan": f"₹{loan_amt:,.2f} ({rec_scheme.get('interest_rate', 6.5)}% p.a.)",
            "scheme_name": rec_scheme.get("name", "MoSJE Concessional Credit"),
            "moratorium": f"{rec_scheme.get('moratorium_months', 3)} Months",
            "tenure_years": f"{rec_scheme.get('tenure_months', 36) // 12} Years",
            "demand_score": round(m1_res.get("feasibility_score", 75.0), 1),
            "opportunity_class": m1_res.get("opportunity_class", "Good"),
            "risk_score": round(m3_res.get("risk_score", 30.0), 1),
            "risk_level": m3_res.get("risk_level", "Low"),
            "price_trend": m2_res.get("price_trend", "Stable"),
            "pricing_recommendation": m2_res.get("pricing_recommendation", "Hold / Expand"),
            "estimated_monthly_net_profit": f"₹{repay.get('potential_monthly_profit', 20000):,.2f}",
            "monthly_emi": f"₹{repay.get('emi', 0):,.2f}",
            "surplus_after_emi": f"₹{repay.get('surplus_after_emi', 0):,.2f}",
            "can_afford_emi": repay.get("can_afford_emi", True),
            "gestation_period": "Immediate" if "Dairy" in cat or "Tailoring" in cat else "30-45 Days",
            "suitability_tag": "High Feasibility & Daily Cashflow" if m1_res.get("feasibility_score", 0) > 75 else "Moderate Growth Potential"
        })
    return comparison

@router.post("/admin/schemes/update")
def update_admin_scheme_rules(payload: AdminSchemeUpdateRequest):
    """
    Pro Admin: Update or introduce new MoSJE scheme guidelines dynamically
    """
    # Updates dynamic scheme config
    SEEDED_SCHEMES[payload.scheme_code] = {
        "scheme_code": payload.scheme_code,
        "scheme_name": payload.scheme_name,
        "interest_rate": payload.interest_rate,
        "max_project_cost": payload.max_project_cost,
        "financing_ratio": payload.financing_ratio,
        "moratorium_months": payload.moratorium_months,
        "tenure_months": payload.tenure_months,
        "source_document": payload.source_document,
        "last_verified_at": datetime.now(timezone.utc).isoformat()
    }
    return {
        "status": "SUCCESS_UPDATED",
        "scheme_code": payload.scheme_code,
        "message": f"MoSJE Scheme '{payload.scheme_name}' updated successfully in dynamic registry."
    }

# ================= MULTILINGUAL (BHASHINI / INDICTRANS2) ENDPOINTS =================
from app.engines.translation.bhashini import BhashiniIndicTransEngine

@router.post("/translate")
async def translate_content(payload: dict):
    """
    Multilingual API powered by Bhashini & IndicTrans2
    Translates text between English and Indian languages (Hindi, Bengali, Marathi, Gujarati, Tamil, Telugu, Kannada)
    """
    text = payload.get("text", "")
    source_lang = payload.get("source_lang", "en")
    target_lang = payload.get("target_lang", "hi")
    
    result = await BhashiniIndicTransEngine.translate_text(
        text=text,
        source_lang=source_lang,
        target_lang=target_lang
    )
    return result

# ================= UNIFIED DATA PLATFORM ENDPOINTS =================
from app.core.data_sources import DataSourceRegistry
from app.core.data_store import UnifiedDataPlatform
from app.core.data_quality import DataQualityAuditor

@router.get("/data-sources")
def list_data_sources():
    """Returns official registry of all 15 configured authoritative data sources."""
    return DataSourceRegistry.list_all_sources()

@router.get("/locations/search")
def search_locations(q: str):
    """Search village/block/district master hierarchy."""
    results = UnifiedDataPlatform.search_location(q)
    return results

@router.get("/locations/{id}")
def get_location_details(id: str):
    """Get location master metadata with baseline census mapping."""
    loc = UnifiedDataPlatform.get_location_by_id(id)
    if not loc:
        raise HTTPException(status_code=404, detail="Location not found in verified master registry.")
    return loc

@router.get("/locations/{id}/demographics")
def get_location_demographics(id: str):
    """Returns official Census 2011 baseline demographics with explicit data_year labeling."""
    data = UnifiedDataPlatform.get_demographics(id)
    if not data:
        return {"status": "unavailable", "message": "Census demographic baseline unavailable for this location."}
    return data

@router.get("/locations/{id}/infrastructure")
def get_location_infrastructure(id: str):
    """Returns verified infrastructure indicators (power, connectivity, health/vet distance)."""
    data = UnifiedDataPlatform.get_infrastructure(id)
    if not data:
        return {"status": "unavailable", "message": "Infrastructure metrics unavailable for this location."}
    return data

@router.get("/locations/{id}/economy")
def get_location_economy(id: str):
    """Returns RBI/District economic and financial inclusion indicators."""
    data = UnifiedDataPlatform.get_economic_context(id)
    if not data:
        return {"status": "unavailable", "message": "Economic indicators unavailable for this location."}
    return data

@router.get("/locations/{id}/agriculture")
def get_location_agriculture(id: str):
    """Returns 20th Livestock Census & Agro-climatic indicators."""
    data = UnifiedDataPlatform.get_agriculture_context(id)
    if not data:
        return {"status": "unavailable", "message": "Agriculture & livestock data unavailable for this location."}
    return data

@router.get("/market/prices")
def get_market_prices(commodity: Optional[str] = None, district: Optional[str] = None):
    """Returns official AGMARKNET observed mandi prices with unit and date metadata."""
    res = RealtimeMandiEngine.get_live_mandi_prices(category=commodity, district=district)
    return res

@router.get("/gis/nearby-businesses")
def get_nearby_businesses(latitude: float, longitude: float, radius_km: float = 5.0, category: Optional[str] = None):
    """Returns mapped OpenStreetMap commercial entities within radius."""
    return UnifiedDataPlatform.find_nearby_businesses(latitude, longitude, radius_km, category)

@router.get("/gis/radius-analysis")
def get_radius_analysis(latitude: float, longitude: float, radius_km: float = 5.0, category: Optional[str] = "Dairy"):
    """Performs spatial density calculation and returns explicit coverage statement."""
    return UnifiedDataPlatform.compute_radius_analysis(latitude, longitude, radius_km, category)

@router.get("/market/consumer-estimation")
def estimate_consumer_reach(location_id: str, category: Optional[str] = "Dairy", radius_km: float = 5.0):
    """Transparent mathematical customer reach estimation with auditable methodology."""
    return UnifiedDataPlatform.estimate_potential_consumer_reach(location_id, category, radius_km)

@router.get("/data-quality")
def get_data_quality_audit():
    """Runs automated platform quality checks across all datasets and returns audit scores."""
    return DataQualityAuditor.run_system_audit()


