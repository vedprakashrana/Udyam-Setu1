'use client';

import React, { useState, useEffect } from 'react';
import { 
  Store, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  MapPin, 
  Clock, 
  RefreshCw, 
  ShieldCheck, 
  Search,
  Filter,
  Globe
} from 'lucide-react';
import { ApiClient } from '../../services/apiClient';

interface MandiRecord {
  mandi_name: string;
  state: string;
  district: string;
  commodity: string;
  category: string;
  min_price: number;
  max_price: number;
  modal_price: number;
  unit: string;
  daily_arrival: string;
  price_trend: string;
  source: string;
  last_updated: string;
}

export default function RealtimeMandiPage() {
  const [records, setRecords] = useState<MandiRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('All');
  const [selectedState, setSelectedState] = useState('All');
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchMandiData = async () => {
    setLoading(true);
    try {
      const data = await ApiClient.getLiveMandiPrices(selectedCat, undefined, selectedState);
      if (data?.data_records) {
        setRecords(data.data_records);
      }
    } catch (e) {
      console.warn("Live mandi fetch warning:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMandiData();
  }, [selectedCat, selectedState]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      ApiClient.getLiveMandiPrices(selectedCat, undefined, selectedState)
        .then(data => {
          if (data?.data_records) setRecords(data.data_records);
        })
        .catch(() => {});
    }, 15000);
    return () => clearInterval(interval);
  }, [autoRefresh, selectedCat, selectedState]);


  const availableStates = ['All', ...Array.from(new Set(records.map(r => r.state)))];

  const filtered = records.filter(r => {
    const matchesSearch = r.commodity.toLowerCase().includes(search.toLowerCase()) || 
                          r.mandi_name.toLowerCase().includes(search.toLowerCase()) ||
                          r.district.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCat === 'All' || r.category === selectedCat;
    const matchesState = selectedState === 'All' || r.state === selectedState;
    return matchesSearch && matchesCat && matchesState;
  });

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-800 flex items-center justify-center text-white shadow-md">
              <Store className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold text-slate-900">Real-Time Mandi & Commodity Prices</h1>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                  AGMARKNET / APMC FEED
                </span>
              </div>
              <p className="text-xs text-slate-500">Authentic wholesale market arrivals, modal prices, and daily APMC trends</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl transition border shadow-sm ${
                autoRefresh 
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100' 
                  : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
              }`}
              title="Toggle automatic live price polling"
            >
              <span className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'}`}></span>
              <span>Live Updates: {autoRefresh ? 'ON' : 'OFF'}</span>
            </button>
            <button
              onClick={fetchMandiData}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl transition border border-slate-200 shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Sync Now</span>
            </button>
          </div>
        </div>


        {/* Filter Controls */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search commodity (e.g. Milk, Broiler, Mustard) or Mandi name..."
              className="w-full pl-9 pr-4 py-2 text-xs font-medium border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* State Filter */}
          <div className="flex items-center gap-1.5 shrink-0">
            <Globe className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedState}
              onChange={e => setSelectedState(e.target.value)}
              className="text-xs font-bold px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 focus:outline-none"
            >
              {availableStates.map(st => (
                <option key={st} value={st}>{st === 'All' ? 'All States' : st}</option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {['All', 'Dairy', 'Poultry', 'Fisheries', 'Food Processing'].map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCat(cat)}
                className={`text-xs font-bold px-3 py-2 rounded-xl whitespace-nowrap transition ${
                  selectedCat === cat
                    ? 'bg-emerald-800 text-white shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Mandi Records Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((item, idx) => (
            <div key={idx} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                    {item.category}
                  </span>
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded flex items-center gap-1 ${
                    item.price_trend.includes('UP')
                      ? 'bg-emerald-100 text-emerald-800'
                      : item.price_trend.includes('DOWN')
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {item.price_trend.includes('UP') && <TrendingUp className="w-3 h-3" />}
                    {item.price_trend.includes('DOWN') && <TrendingDown className="w-3 h-3" />}
                    {item.price_trend.includes('STABLE') && <Minus className="w-3 h-3" />}
                    {item.price_trend}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900">{item.commodity}</h3>
                  <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span>{item.mandi_name}, {item.district} ({item.state})</span>
                  </div>
                </div>

                {/* Price Display */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Modal Price</span>
                    <p className="text-xl font-extrabold text-emerald-800">
                      ₹{item.modal_price} <span className="text-xs font-normal text-slate-600">/ {item.unit}</span>
                    </p>
                  </div>
                  <div className="text-right text-[11px] text-slate-500">
                    <div>Min: ₹{item.min_price}</div>
                    <div>Max: ₹{item.max_price}</div>
                  </div>
                </div>

                <div className="flex justify-between text-xs pt-1 border-t border-slate-100 text-slate-600">
                  <span>Daily Arrival:</span>
                  <span className="font-bold text-slate-800">{item.daily_arrival}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                <span className="truncate max-w-[200px]" title={item.source}>{item.source}</span>
                <span className="shrink-0">{item.last_updated.split(' ')[0]}</span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
