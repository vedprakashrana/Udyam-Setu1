from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel, Field, EmailStr

# ----------------- Base / Meta -----------------
class DataConfidenceEnum(str):
    VERIFIED = "Verified"
    ESTIMATED = "Estimated"
    UNAVAILABLE = "Unavailable"

# ----------------- Auth Schemas -----------------
class UserRegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    mobile: str = Field(..., pattern=r"^[6-9]\d{9}$")
    email: EmailStr
    password: str = Field(..., min_length=6)
    state: str = Field(..., min_length=2)
    district: str = Field(..., min_length=2)
    preferred_language: str = Field(default="en")
    terms_accepted: bool = Field(default=True)

class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: dict

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    mobile: str
    role: str
    state: str
    district: str
    preferred_language: str
    created_at: datetime

# ----------------- Financial Schemas -----------------
class ProjectCostRequest(BaseModel):
    margin_capital: Decimal = Field(..., gt=0, description="Available margin capital in INR")
    margin_percentage: Decimal = Field(default=Decimal("10.0"), description="Margin contribution % (default 10%)")

class ProjectCostResponse(BaseModel):
    margin_capital: Decimal
    project_cost: Decimal
    calculated_financing: Decimal
    financing_percentage: Decimal
    margin_percentage: Decimal
    formatted_project_cost: str
    formatted_calculated_financing: str
    formatted_margin_capital: str

class SchemeRuleRecommendationRequest(BaseModel):
    project_cost: Decimal
    margin_capital: Decimal
    business_category_id: Optional[str] = None

class SchemeRecommendationResponse(BaseModel):
    eligible: bool
    scheme_code: str
    scheme_name: str
    scheme_version_id: Optional[str] = None
    project_cost: Decimal
    calculated_financing: Decimal
    actual_eligible_financing: Decimal
    interest_rate: Decimal
    tenure_months: int
    moratorium_months: int
    moratorium_interest_policy: str
    source_document: str
    effective_from: Optional[str] = None
    last_verified_at: Optional[str] = None
    notes: List[str] = []

class EMIRequest(BaseModel):
    principal: Decimal = Field(..., gt=0)
    annual_interest_rate: Decimal = Field(..., ge=0)
    tenure_months: int = Field(..., gt=0)
    moratorium_months: int = Field(default=0, ge=0)
    moratorium_interest_policy: str = Field(default="accrued", description="accrued | capitalized | serviced | waived | unknown")

class RepaymentScheduleItem(BaseModel):
    month: int
    is_moratorium: bool
    opening_balance: Decimal
    emi: Decimal
    principal_paid: Decimal
    interest_paid: Decimal
    closing_balance: Decimal

class EMIResponse(BaseModel):
    monthly_emi: Decimal
    total_principal: Decimal
    total_interest: Decimal
    total_payment: Decimal
    moratorium_months: int
    moratorium_policy_used: str
    formatted_monthly_emi: str
    formatted_total_payment: str
    formatted_total_interest: str
    schedule: List[RepaymentScheduleItem] = []
    uncertainty_note: Optional[str] = None

class WorkingCapitalRequest(BaseModel):
    raw_materials: Decimal = Field(default=Decimal("0"), ge=0)
    rent: Decimal = Field(default=Decimal("0"), ge=0)
    electricity: Decimal = Field(default=Decimal("0"), ge=0)
    salaries: Decimal = Field(default=Decimal("0"), ge=0)
    transport: Decimal = Field(default=Decimal("0"), ge=0)
    marketing: Decimal = Field(default=Decimal("0"), ge=0)
    maintenance: Decimal = Field(default=Decimal("0"), ge=0)
    miscellaneous: Decimal = Field(default=Decimal("0"), ge=0)
    reserve_months: int = Field(default=3, ge=1, le=12)

class WorkingCapitalResponse(BaseModel):
    monthly_operating_cost: Decimal
    reserve_months: int
    recommended_reserve_fund: Decimal
    formatted_monthly_operating_cost: str
    formatted_recommended_reserve_fund: str
    expense_breakdown: dict

class BreakEvenRequest(BaseModel):
    fixed_costs: Decimal = Field(..., ge=0)
    variable_cost_per_unit: Decimal = Field(..., ge=0)
    selling_price_per_unit: Decimal = Field(..., gt=0)
    estimated_monthly_units: Optional[int] = None

class BreakEvenResponse(BaseModel):
    contribution_margin_per_unit: Decimal
    contribution_margin_ratio: Decimal
    break_even_units: Decimal
    break_even_revenue: Decimal
    is_viable: bool
    formatted_break_even_revenue: str
    notes: List[str] = []

class CashFlowRequest(BaseModel):
    estimated_monthly_revenue: Decimal = Field(..., ge=0)
    monthly_operating_expense: Decimal = Field(..., ge=0)
    monthly_emi: Decimal = Field(..., ge=0)
    projection_years: int = Field(default=3, ge=1, le=5)
    annual_revenue_growth_percent: Decimal = Field(default=Decimal("5.0"), ge=0)
    annual_expense_growth_percent: Decimal = Field(default=Decimal("3.0"), ge=0)

class CashFlowYearProjection(BaseModel):
    year: int
    annual_revenue: Decimal
    annual_opex: Decimal
    annual_debt_service: Decimal
    net_annual_cash_flow: Decimal
    cumulative_cash_flow: Decimal

class CashFlowResponse(BaseModel):
    projections: List[CashFlowYearProjection]
    average_monthly_net_cash_flow: Decimal
    debt_service_coverage_ratio: Optional[Decimal] = None

# ----------------- Assessment Schemas -----------------
class LocationInput(BaseModel):
    state: str
    district: str
    block: str
    village: str
    latitude: Optional[float] = Field(default=23.7957, ge=-90, le=90)
    longitude: Optional[float] = Field(default=86.4304, ge=-180, le=180)

class AssessmentCreateRequest(BaseModel):
    title: Optional[str] = None
    location: LocationInput
    margin_capital: Optional[Decimal] = Field(default=None)
    own_capital: Optional[Decimal] = Field(default=None)
    entrepreneur_name: Optional[str] = Field(default="Rural Entrepreneur")
    prior_experience: Optional[bool] = Field(default=False)
    annual_household_income: Optional[Decimal] = Field(default=Decimal("120000"))
    social_category: Optional[str] = Field(default="OBC")
    existing_investment: Decimal = Field(default=Decimal("0"), ge=0)
    existing_loans: Decimal = Field(default=Decimal("0"), ge=0)
    expected_monthly_income: Optional[Decimal] = None
    business_category: str
    business_subcategory: Optional[str] = None
    experience_years: int = Field(default=0, ge=0)
    land_available: bool = False
    water_available: bool = True
    electricity_available: bool = True
    transport_available: bool = True
    storage_available: bool = False
    primary_customers: Optional[str] = None
    sales_channels: Optional[str] = None

class CompetitorItem(BaseModel):
    id: str
    name: str
    category: str
    distance_km: float
    address: str
    source: str
    data_confidence: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    direction: Optional[str] = None

class ShapFeatureAttribution(BaseModel):
    feature_name: str
    feature_group: str  # Demographics | Infrastructure | Competition | Finance | Prices
    attribution_value: float  # Positive increases success, negative decreases
    impact_description: str

class FeasibilityScoreBreakdown(BaseModel):
    market_demand_score: float
    competition_score: float
    capital_adequacy_score: float
    profit_potential_score: float
    risk_score: float
    infrastructure_score: float
    overall_score: float
    category_label: str  # High Risk | Moderate | Good | Strong Opportunity
    viability_probability: float  # 0.00 to 1.00 calibrated success probability
    viability_class: str  # Viable | Uncertain | High-Risk
    model_architecture: str = "XGBoost / LightGBM Classifier + SHAP Attribution Pipeline"
    shap_feature_attributions: List[ShapFeatureAttribution] = []
    disclaimer: str


class SWOTResponse(BaseModel):
    strengths: List[str]
    weaknesses: List[str]
    opportunities: List[str]
    threats: List[str]

class RiskItem(BaseModel):
    dimension: str  # Market-price | Demand | Supply-chain | Infrastructure | Financial | Operational
    category: str
    risk_score: int  # 0 to 100
    probability: float  # 0.00 to 1.00 calibrated probability
    severity_level: str  # Low | Moderate | High | Critical
    description: str
    potential_features: List[str] = []
    mitigation_strategy: Optional[str] = None


class PricingItem(BaseModel):
    item_name: str
    low_price: Decimal
    median_price: Decimal
    high_price: Decimal
    data_confidence: str
    source: str
    date_observed: Optional[str] = None

class AssessmentDetailResponse(BaseModel):
    id: str
    title: str
    created_at: datetime
    status: str
    user_inputs: dict
    financial_summary: dict
    scheme_recommendation: dict
    feasibility_score: FeasibilityScoreBreakdown
    swot: SWOTResponse
    risks: List[RiskItem]
    competitors_5km: List[CompetitorItem]
    competitors_10km: List[CompetitorItem]
    pricing_data: List[PricingItem]
    ai_strategy: dict
    sources_and_confidence: dict
    download_report_url: str
    model1_prediction: Optional[dict] = None
    model2_forecast: Optional[dict] = None
    model3_risk: Optional[dict] = None
    model4_advisory: Optional[dict] = None

# ----------------- AI Schemas -----------------
class AIChatMessage(BaseModel):
    role: str
    content: str

class AIChatRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None
    context_assessment_id: Optional[str] = None
    preferred_language: str = "en"

class AIChatResponse(BaseModel):
    conversation_id: str
    reply: str
    citations: List[dict] = []
    suggested_actions: List[str] = []

# ----------------- Pro Schemas -----------------
class OCRScanRequest(BaseModel):
    document_name: str
    document_base64: Optional[str] = None
    sample_text: Optional[str] = None

class MLForecastRequest(BaseModel):
    category: str = "Dairy"
    current_unit_price: float = 42.0
    monthly_base_volume: int = 1500
    months_ahead: int = 6

class AdminSchemeUpdateRequest(BaseModel):
    scheme_code: str
    scheme_name: str
    interest_rate: Decimal
    max_project_cost: Decimal
    financing_ratio: Decimal = Decimal("0.90")
    moratorium_months: int
    tenure_months: int
    source_document: str

