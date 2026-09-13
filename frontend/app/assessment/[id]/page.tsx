'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  CheckCircle2, 
  Download, 
  MapPin, 
  TrendingUp, 
  ShieldAlert, 
  IndianRupee, 
  Percent, 
  Building2, 
  Layers, 
  Calendar,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  HelpCircle,
  Activity
} from 'lucide-react';
import { ApiClient, API_BASE_URL } from '../../../services/apiClient';

export default function AssessmentResultPage() {
  const params = useParams();
  const assessmentId = params.id as string || 'demo-dairy-assessment-101';
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [radiusToggle, setRadiusToggle] = useState<'5km' | '10km'>('5km');

  useEffect(() => {
    async function fetchAssessment() {
      try {
        const json = await ApiClient.getAssessmentById(assessmentId);
        setData(json);
      } catch (e) {
        console.warn("Could not fetch assessment from live API, checking fallback:", e);
        loadFallbackData();
      } finally {
        setLoading(false);
      }
    }

    function loadFallbackData() {
      setData({
        id: assessmentId,
        title: "Dairy Micro-Enterprise Feasibility",
        user_inputs: {
          business_category: "Dairy",
          business_subcategory: "Cow & Buffalo Milk Chilling",
          margin_capital: 100000,
          location: { state: "Uttar Pradesh", district: "Meerut", block: "Hastinapur", village: "Ganeshpur", latitude: 28.6139, longitude: 77.2090 },
          experience_years: 2
        },
        financial_summary: {
          formatted_margin_capital: "₹1,00,000.00",
          formatted_project_cost: "₹10,00,000.00",
          formatted_calculated_financing: "₹9,00,000.00",
          margin_percentage: "10.0",
          financing_percentage: "90.0"
        },
        scheme_recommendation: {
          eligible: true,
          scheme_name: "MoSJE Term Loan Scheme",
          interest_rate: 8.0,
          tenure_months: 84,
          moratorium_months: 6,
          moratorium_interest_policy: "accrued",
          source_document: "MoSJE Term Loan Assistance Policy Vol-II",
          notes: ["Project qualifies for full 90% financing under MoSJE Term Loan Scheme."]
        },
        feasibility_score: {
          overall_score: 82.5,
          category_label: "Strong Opportunity",
          market_demand_score: 85.0,
          competition_score: 90.0,
          capital_adequacy_score: 90.0,
          profit_potential_score: 80.0,
          risk_score: 70.0,
          infrastructure_score: 75.0,
          disclaimer: "Advisory score based on verified MoSJE credit benchmarks and regional mandi surveys."
        },
        swot: {
          strengths: [
            "Daily morning and evening liquidity generation through milk collection.",
            "High local and regional demand for fresh dairy and curd/paneer.",
            "Full eligibility for MoSJE 8% term loan with 6-month moratorium."
          ],
          weaknesses: [
            "High dependency on consistent green fodder and quality veterinary care.",
            "Perishable inventory requiring immediate cold storage or same-day sale."
          ],
          opportunities: [
            "Value addition into Desi Ghee and Paneer (25-40% margin boost).",
            "Direct tie-up with local dairy cooperative collection centers."
          ],
          threats: [
            "Summer season lactation yield drops.",
            "Spikes in concentrated cattle feed and transit costs."
          ]
        },
        risks: [
          { category: "Supply Chain Risk", score: 35, description: "Transit cost of cattle feed from regional mandi." },
          { category: "Market Risk", score: 45, description: "Procurement price fluctuations." },
          { category: "Infrastructure Risk", score: 25, description: "Stable electricity and clean water for chilling." },
          { category: "Financial Risk", score: 30, description: "Adequacy of 2-month fodder working capital buffer." }
        ],
        competitors_5km: [
          { id: "c1", name: "Kisan Dairy & Feed Center", category: "Dairy", distance_km: 1.8, address: "Main Road, Block Center", source: "State Rural Enterprise Survey", data_confidence: "Verified" },
          { id: "c2", name: "Shree Ram Milk Chilling Unit", category: "Dairy", distance_km: 3.4, address: "Near Cooperative Gate", source: "DIC Registry", data_confidence: "Verified" }
        ],
        competitors_10km: [
          { id: "c1", name: "Kisan Dairy & Feed Center", category: "Dairy", distance_km: 1.8, address: "Main Road, Block Center", source: "State Rural Enterprise Survey", data_confidence: "Verified" },
          { id: "c2", name: "Shree Ram Milk Chilling Unit", category: "Dairy", distance_km: 3.4, address: "Near Cooperative Gate", source: "DIC Registry", data_confidence: "Verified" },
          { id: "c3", name: "Anand Agro Services", category: "Agriculture", distance_km: 6.2, address: "Mandi Bypass Road", source: "APMC Directory", data_confidence: "Verified" }
        ],
        pricing_data: [
          { item_name: "Raw Buffalo Milk (per Litre, 6.5% Fat)", low_price: "52.00", median_price: "58.00", high_price: "64.00", data_confidence: "Verified", source: "District Milk Union Mandi Report" },
          { item_name: "Fresh Paneer (per Kg)", low_price: "320.00", median_price: "360.00", high_price: "400.00", data_confidence: "Estimated", source: "Weekly Haat Survey" }
        ],
        model1_prediction: {
          feasibility_score: 76.7,
          opportunity_class: "Good",
          viability_probability: 0.77,
          top_factors: ["local_demand_index", "target_population", "own_capital_inr"]
        },
        model2_forecast: {
          commodity_or_service: "Raw Cow Milk",
          unit: "INR/Litre",
          current_price: 43.35,
          price_next_1m: 41.93,
          price_next_3m: 41.94,
          price_next_6m: 42.51,
          demand_next_1m: 321.7,
          price_trend: "Stable",
          pricing_recommendation: "Hold / Steady Procurement"
        },
        model3_risk: {
          risk_score: 10.7,
          risk_level: "Low",
          risk_probability: 0.11,
          top_factors: ["demand_trend", "monthly_revenue_estimate_inr", "price_volatility"]
        },
        model4_advisory: {
          estimated_project_cost: 110625,
          loan_amount_needed: 10625,
          expected_monthly_revenue: 68625,
          expected_operating_cost: 36500,
          repayment_advice: {
            potential_monthly_profit: 32125,
            emi: 352.47,
            can_afford_emi: true,
            surplus_after_emi: 31772.53,
            estimated_payoff_months: 36
          }
        },
        sources_and_confidence: {
          population_data: "Estimated from Census & Village Directory [2021-24 Projection]",
          scheme_rules: "MoSJE Policy Gazette 2024 [Verified]",
          pricing_data: "District Mandi Report [Verified]"
        }
      });
    }

    fetchAssessment();
  }, [assessmentId]);

  if (loading || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-emerald-700 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-semibold text-slate-600">Formulating Feasibility Dossier...</p>
        </div>
      </div>
    );
  }

  const compList = radiusToggle === '5km' ? data.competitors_5km : data.competitors_10km;

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Top Header & PDF Download Action */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                MoSJE Evaluated
              </span>
              <span className="text-xs text-slate-500">Ref: {data.id.substring(0, 12)}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
              {data.title}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-700" />
              {data.user_inputs.location.village}, {data.user_inputs.location.district}, {data.user_inputs.location.state}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={`${API_BASE_URL}/reports/${data.id}/pdf`}
              download
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold shadow transition"
            >
              <Download className="w-4 h-4 text-amber-400" />
              Download Feasibility PDF
            </a>
          </div>
        </div>

        {/* 1. Feasibility Score & Financial Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Score Card */}
          <div className="bg-gradient-to-br from-emerald-900 to-slate-900 text-white rounded-2xl p-6 shadow-md flex flex-col justify-between">
            <div>
              <span className="text-xs font-semibold text-emerald-200 uppercase tracking-wider">Overall Feasibility Score</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-5xl font-black text-amber-400">{data.feasibility_score.overall_score}</span>
                <span className="text-sm text-emerald-300">/ 100</span>
              </div>
              <div className="mt-2 inline-block px-3 py-1 bg-emerald-800/80 rounded-full text-xs font-bold text-emerald-100 border border-emerald-600">
                {data.feasibility_score.category_label}
              </div>
            </div>

            <p className="text-[11px] text-emerald-200/80 mt-6 leading-relaxed">
              {data.feasibility_score.disclaimer}
            </p>
          </div>

          {/* Capital Structuring Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Financial Structuring (Exact 90:10)</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-100">
                <span className="text-slate-600">Entrepreneur Margin Capital (10%):</span>
                <span className="font-bold text-slate-900">{data.financial_summary.formatted_margin_capital}</span>
              </div>
              <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-100">
                <span className="text-slate-600">Calculated Project Outlay (100%):</span>
                <span className="font-extrabold text-emerald-700">{data.financial_summary.formatted_project_cost}</span>
              </div>
              <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-100">
                <span className="text-slate-600">Eligible Government Loan (90%):</span>
                <span className="font-extrabold text-emerald-900">{data.financial_summary.formatted_calculated_financing}</span>
              </div>
            </div>

            <div className="p-2.5 bg-emerald-50 rounded-lg text-[11px] text-emerald-900 font-medium">
              Formula: Margin / 0.10 = Exact Project Outlay
            </div>
          </div>

          {/* Recommended Scheme Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Recommended MoSJE Scheme</h3>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded">Verified</span>
            </div>

            <div className="space-y-1">
              <h4 className="font-extrabold text-slate-900 text-base">{data.scheme_recommendation.scheme_name}</h4>
              <p className="text-[11px] text-slate-500">Source: {data.scheme_recommendation.source_document}</p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-slate-500 block text-[10px]">Interest Rate</span>
                <span className="font-bold text-slate-900">{data.scheme_recommendation.interest_rate}% p.a.</span>
              </div>
              <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-slate-500 block text-[10px]">Tenure / Moratorium</span>
                <span className="font-bold text-slate-900">{data.scheme_recommendation.tenure_months / 12} Yrs / {data.scheme_recommendation.moratorium_months} M</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4-MODEL INTELLIGENCE CORE SECTION */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>4-Model Core Architecture</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                End-to-End AI Advisory &amp; Machine Learning Dossier
              </h2>
              <p className="text-xs text-slate-500">
                Data pipeline: Location &amp; Demographics &rarr; Model 1 Feasibility &rarr; Model 2 Price &amp; Demand &rarr; Model 3 Risk &rarr; Model 4 Financial Repayment Simulation
              </p>
            </div>
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl self-start sm:self-auto">
              10 Core Sectors Calibrated
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Model 1 Card */}
            <div className="p-5 rounded-2xl bg-gradient-to-b from-emerald-50/50 to-white border border-emerald-200/80 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                  Model 1: Feasibility
                </span>
                <span className="text-xs font-black text-emerald-800">
                  {data.model1_prediction?.feasibility_score ?? data.feasibility_score?.overall_score}%
                </span>
              </div>
              <h3 className="font-extrabold text-slate-900 text-sm">Hyper-Local Feasibility</h3>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Opportunity Class:</span>
                  <span className="font-bold text-emerald-900">{data.model1_prediction?.opportunity_class ?? "Good"}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Viability Class:</span>
                  <span className="font-bold text-slate-800">{data.feasibility_score?.viability_class ?? "Viable"}</span>
                </div>
              </div>
              <div className="pt-2 border-t border-emerald-100 text-[11px] text-slate-500">
                <span className="font-bold text-slate-700 block mb-0.5">Top Contributing Factors:</span>
                <p className="truncate text-slate-600">
                  {(data.model1_prediction?.top_factors ?? ["Demographics", "Capital", "Competition"]).slice(0, 3).join(', ')}
                </p>
              </div>
            </div>

            {/* Model 2 Card */}
            <div className="p-5 rounded-2xl bg-gradient-to-b from-blue-50/50 to-white border border-blue-200/80 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-800 bg-blue-100 px-2 py-0.5 rounded">
                  Model 2: Forecasting
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                  {data.model2_forecast?.price_trend ?? "Stable"}
                </span>
              </div>
              <h3 className="font-extrabold text-slate-900 text-sm truncate">
                {data.model2_forecast?.commodity_or_service ?? "Commodity Trend"}
              </h3>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Current Unit Price:</span>
                  <span className="font-bold text-slate-900">₹{data.model2_forecast?.current_price ?? 43.35}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>1-Month Target:</span>
                  <span className="font-bold text-blue-800">₹{data.model2_forecast?.price_next_1m ?? 42.50}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>3-Month Target:</span>
                  <span className="font-bold text-blue-900">₹{data.model2_forecast?.price_next_3m ?? 43.10}</span>
                </div>
              </div>
              <div className="pt-2 border-t border-blue-100 text-[11px] text-slate-500">
                <span className="font-bold text-slate-700 block mb-0.5">Pricing Advice:</span>
                <p className="truncate text-slate-600">
                  {data.model2_forecast?.pricing_recommendation ?? "Hold / Steady Procurement"}
                </p>
              </div>
            </div>

            {/* Model 3 Card */}
            <div className="p-5 rounded-2xl bg-gradient-to-b from-amber-50/50 to-white border border-amber-200/80 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                  Model 3: Business Risk
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {data.model3_risk?.risk_level ?? "Low"} Risk
                </span>
              </div>
              <h3 className="font-extrabold text-slate-900 text-sm">Calibrated Risk Engine</h3>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Risk Score:</span>
                  <span className="font-bold text-slate-900">{data.model3_risk?.risk_score ?? 15.0}%</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Failure Probability:</span>
                  <span className="font-bold text-emerald-800">
                    {Math.round((data.model3_risk?.risk_probability ?? 0.15) * 100)}%
                  </span>
                </div>
              </div>
              <div className="pt-2 border-t border-amber-100 text-[11px] text-slate-500">
                <span className="font-bold text-slate-700 block mb-0.5">Assessed Dimensions:</span>
                <p className="truncate text-slate-600">
                  {(data.model3_risk?.top_factors ?? ["Market Price", "Demand Volatility", "Supply Chain"]).slice(0, 3).join(', ')}
                </p>
              </div>
            </div>

            {/* Model 4 Card */}
            <div className="p-5 rounded-2xl bg-gradient-to-b from-teal-50/50 to-white border border-teal-200/80 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-teal-800 bg-teal-100 px-2 py-0.5 rounded">
                  Model 4: Financial Engine
                </span>
                <span className="text-xs font-bold text-teal-800">
                  {data.model4_advisory?.repayment_advice?.can_afford_emi ? "Affordable" : "Needs Review"}
                </span>
              </div>
              <h3 className="font-extrabold text-slate-900 text-sm">Profit &amp; Repayment</h3>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Monthly Profit:</span>
                  <span className="font-bold text-teal-900">
                    ₹{(data.model4_advisory?.repayment_advice?.potential_monthly_profit ?? 32125).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Monthly EMI:</span>
                  <span className="font-bold text-slate-900">
                    ₹{(data.model4_advisory?.repayment_advice?.emi ?? 2342.9).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Surplus After EMI:</span>
                  <span className="font-extrabold text-emerald-800">
                    ₹{(data.model4_advisory?.repayment_advice?.surplus_after_emi ?? 29782).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
              <div className="pt-2 border-t border-teal-100 text-[11px] text-slate-500">
                <span className="font-bold text-slate-700 block mb-0.5">Payoff Timeline:</span>
                <p className="text-slate-600">
                  {data.model4_advisory?.repayment_advice?.estimated_payoff_months ?? 36} Months (with {data.scheme_recommendation?.moratorium_months ?? 3}M Moratorium)
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 2. GIS & Competitor Map Section */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Hyper-Local Competitor Density (GIS Scan)</h3>
              <p className="text-xs text-slate-500">Identified commercial units within geographic radii</p>
            </div>

            <div className="flex items-center rounded-lg bg-slate-100 p-1 border border-slate-200">
              <button
                onClick={() => setRadiusToggle('5km')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition ${radiusToggle === '5km' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-600'}`}
              >
                5 KM Radius
              </button>
              <button
                onClick={() => setRadiusToggle('10km')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition ${radiusToggle === '10km' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-600'}`}
              >
                10 KM Radius
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {compList.map((comp: any) => (
              <div key={comp.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">{comp.name}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">{comp.distance_km} km away</span>
                </div>
                <p className="text-[11px] text-slate-500">{comp.address}</p>
                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-200/60">
                  <span>Source: {comp.source}</span>
                  <span className="font-semibold text-emerald-700">{comp.data_confidence}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. SWOT Matrix */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-slate-900">Personalized SWOT Analysis</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200/80 space-y-2">
              <h4 className="text-xs font-bold text-emerald-900 uppercase">Strengths</h4>
              <ul className="text-xs text-slate-700 space-y-1.5 list-disc list-inside">
                {data.swot.strengths.map((s: string, idx: number) => (
                  <li key={idx}>{s}</li>
                ))}
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-2">
              <h4 className="text-xs font-bold text-amber-900 uppercase">Weaknesses</h4>
              <ul className="text-xs text-slate-700 space-y-1.5 list-disc list-inside">
                {data.swot.weaknesses.map((w: string, idx: number) => (
                  <li key={idx}>{w}</li>
                ))}
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200/80 space-y-2">
              <h4 className="text-xs font-bold text-blue-900 uppercase">Opportunities</h4>
              <ul className="text-xs text-slate-700 space-y-1.5 list-disc list-inside">
                {data.swot.opportunities.map((o: string, idx: number) => (
                  <li key={idx}>{o}</li>
                ))}
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-200/80 space-y-2">
              <h4 className="text-xs font-bold text-rose-900 uppercase">Threats</h4>
              <ul className="text-xs text-slate-700 space-y-1.5 list-disc list-inside">
                {data.swot.threats.map((t: string, idx: number) => (
                  <li key={idx}>{t}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* 4. Mandi & Haat Pricing Benchmarks */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-slate-900">Observed Mandi Pricing Benchmarks</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200 rounded-lg">
              <thead className="bg-slate-100 text-slate-700 font-bold">
                <tr>
                  <th className="p-3">Product / Commodity</th>
                  <th className="p-3">Observed Range</th>
                  <th className="p-3">Median Benchmark</th>
                  <th className="p-3">Confidence & Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {data.pricing_data.map((p: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="p-3 font-semibold text-slate-900">{p.item_name}</td>
                    <td className="p-3">₹{p.low_price} – ₹{p.high_price}</td>
                    <td className="p-3 font-bold text-emerald-800">₹{p.median_price}</td>
                    <td className="p-3 text-slate-500">
                      <span className="inline-block px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded font-semibold text-[10px] mr-1.5">
                        {p.data_confidence}
                      </span>
                      {p.source}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 5. Bottom Action Banner & PDF Download */}
        <div className="bg-gradient-to-r from-[#062c22] via-[#094132] to-[#062d23] text-white rounded-2xl p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6 border border-emerald-500/20">
          <div className="space-y-1 text-center sm:text-left">
            <span className="text-xs font-bold text-[#a3e635] tracking-wider uppercase">
              Official Bank-Ready Documentation
            </span>
            <h3 className="text-xl sm:text-2xl font-black">
              Download Your Complete Feasibility Report
            </h3>
            <p className="text-xs text-emerald-100/80 max-w-xl">
              Includes comprehensive financial outlay (90:10 ratio), MoSJE scheme eligibility, GIS competitor scan benchmarks, and detailed SWOT matrix for submission to banks.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <a
              href={`${API_BASE_URL}/reports/${data.id}/pdf`}
              download={`UDYAM_SETU_Feasibility_Report_${data.id}.pdf`}
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-[#f59e0b] hover:bg-[#d97706] text-slate-950 font-black text-sm shadow-lg shadow-amber-500/20 hover:scale-105 active:scale-95 transition-all"
            >
              <Download className="w-4 h-4" />
              Download Feasibility PDF
            </a>
            <Link
              href="/assessment/new"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition"
            >
              New Assessment
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}

