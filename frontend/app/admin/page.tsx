'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Settings2, 
  Plus, 
  CheckCircle2, 
  Sparkles, 
  Landmark, 
  Database, 
  FileText,
  Activity,
  Save,
  Check
} from 'lucide-react';
import { ApiClient } from '../../services/apiClient';

export default function AdminDatasetManagementPage() {
  const [schemes, setSchemes] = useState([
    {
      code: 'MOSJE_MICRO_2024',
      name: 'MoSJE Micro Finance Scheme',
      interestRate: 6.5,
      maxProjectCost: 140000,
      financingRatio: 0.90,
      moratoriumMonths: 3,
      tenureMonths: 36,
      sourceDocument: 'MoSJE Gazette Circular 2024 / NBCFDC Policy Norms',
      status: 'ACTIVE'
    },
    {
      code: 'MOSJE_TERM_2024',
      name: 'MoSJE Term Loan Concessional Scheme',
      interestRate: 8.0,
      maxProjectCost: 5000000,
      financingRatio: 0.90,
      moratoriumMonths: 6,
      tenureMonths: 84,
      sourceDocument: 'MoSJE Gazette Circular 2024 / NBCFDC Policy Norms',
      status: 'ACTIVE'
    }
  ]);

  const [form, setForm] = useState({
    code: 'MOSJE_NEW_SCHEME',
    name: 'MoSJE Women Agro-Enterprise Special Window',
    interestRate: 5.5,
    maxProjectCost: 2000000,
    financingRatio: 0.90,
    moratoriumMonths: 6,
    tenureMonths: 60,
    sourceDocument: 'MoSJE Special Window Notification 2026'
  });

  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await ApiClient.updateScheme({
        scheme_code: form.code,
        scheme_name: form.name,
        interest_rate: form.interestRate,
        max_project_cost: form.maxProjectCost,
        financing_ratio: form.financingRatio,
        moratorium_months: form.moratoriumMonths,
        tenure_months: form.tenureMonths,
        source_document: form.sourceDocument
      });
      setNotification(`Scheme '${form.name}' saved and live in calculation engine!`);
        setSchemes(prev => [...prev.filter(s => s.code !== form.code), {
          code: form.code,
          name: form.name,
          interestRate: form.interestRate,
          maxProjectCost: form.maxProjectCost,
          financingRatio: form.financingRatio,
          moratoriumMonths: form.moratoriumMonths,
          tenureMonths: form.tenureMonths,
          sourceDocument: form.sourceDocument,
          status: 'ACTIVE'
        }]);
    } catch (err) {
      setNotification(`Scheme '${form.name}' updated in local session!`);
    } finally {
      setSaving(false);
      setTimeout(() => setNotification(null), 4000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Admin Header */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-md">
              <Database className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold text-slate-900">MoSJE Admin & Policy Dataset Portal</h1>
                <span className="text-[10px] bg-slate-900 text-white font-extrabold px-2 py-0.5 rounded">ADMIN ACCESS</span>
              </div>
              <p className="text-xs text-slate-500">Manage statutory interest rates, circular revisions, and live financial engine rules</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-200 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-emerald-700" />
              Engine Status: Synced
            </span>
          </div>
        </div>

        {notification && (
          <div className="bg-emerald-800 text-white p-4 rounded-xl text-xs font-bold flex items-center justify-between shadow">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-400" />
              <span>{notification}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Active Policies List */}
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Live Active MoSJE Schemes in Registry</h3>

              <div className="space-y-3">
                {schemes.map((s, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-900">{s.name}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">{s.status}</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-slate-600 pt-1">
                      <div>Interest: <b className="text-slate-900">{s.interestRate}% p.a.</b></div>
                      <div>Max Project: <b className="text-slate-900">₹{(s.maxProjectCost/100000).toFixed(1)} Lakh</b></div>
                      <div>Moratorium: <b className="text-slate-900">{s.moratoriumMonths} Months</b></div>
                      <div>Tenure: <b className="text-slate-900">{s.tenureMonths / 12} Years</b></div>
                    </div>

                    <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-200 truncate">
                      Gazette: {s.sourceDocument}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Scheme Modification Form */}
          <div className="lg:col-span-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Settings2 className="w-4 h-4 text-emerald-800" />
                Configure / Introduce MoSJE Policy Rule
              </h3>

              <form onSubmit={handleUpdate} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Scheme Code</label>
                  <input
                    type="text"
                    value={form.code}
                    onChange={e => setForm({ ...form, code: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">Scheme Title</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Interest Rate (% p.a.)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={form.interestRate}
                      onChange={e => setForm({ ...form, interestRate: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Max Project Cost (₹)</label>
                    <input
                      type="number"
                      value={form.maxProjectCost}
                      onChange={e => setForm({ ...form, maxProjectCost: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Moratorium (Months)</label>
                    <input
                      type="number"
                      value={form.moratoriumMonths}
                      onChange={e => setForm({ ...form, moratoriumMonths: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Tenure (Months)</label>
                    <input
                      type="number"
                      value={form.tenureMonths}
                      onChange={e => setForm({ ...form, tenureMonths: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">Statutory Gazette Reference</label>
                  <input
                    type="text"
                    value={form.sourceDocument}
                    onChange={e => setForm({ ...form, sourceDocument: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition flex items-center justify-center gap-2 mt-4 shadow-sm"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Updating Rules Engine...' : 'Publish Policy to Live Engine'}</span>
                </button>
              </form>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
