'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { 
  MapPin, 
  IndianRupee, 
  Briefcase, 
  Wrench, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft,
  Info,
  Sparkles,
  Navigation,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { LocationService, VillageEntity, SelectedLocationState } from '../../../services/locationService';
import { useAuth } from '../../../context/AuthContext';
import { ApiClient } from '../../../services/apiClient';

// Dynamically import Leaflet Map to avoid SSR window errors
const InteractiveLocationMap = dynamic(
  () => import('../../../components/maps/InteractiveLocationMap'),
  { 
    ssr: false, 
    loading: () => (
      <div className="h-64 sm:h-72 w-full bg-slate-100 animate-pulse rounded-xl flex items-center justify-center text-xs text-slate-400 font-medium">
        Loading Interactive Map...
      </div>
    ) 
  }
);

const BUSINESS_CATEGORIES = [
  { id: 'Dairy & Livestock', label: '1. Dairy & Livestock', typicalCost: 110625, expectedRevenue: 68625, subs: ['Cow / Buffalo Chilling', 'Paneer & Ghee Unit', 'Cattle Feed Supply'] },
  { id: 'Poultry & Egg Production', label: '2. Poultry & Egg Production', typicalCost: 89375, expectedRevenue: 62188, subs: ['Broiler Unit (1000 birds)', 'Layer Egg Farming', 'Desi Poultry Hatchery'] },
  { id: 'Fisheries / Aquaculture', label: '3. Fisheries / Aquaculture', typicalCost: 141562, expectedRevenue: 33250, subs: ['Freshwater Fish Pond', 'Biofloc Fish Farming', 'Fish Seed Hatchery'] },
  { id: 'Agri-input & Farm Supply', label: '4. Agri-input & Farm Supply', typicalCost: 161250, expectedRevenue: 50688, subs: ['Fertilizer & Seeds Hub', 'Pesticide Retail Depot', 'Farm Machinery Tools'] },
  { id: 'Food Processing', label: '5. Food Processing', typicalCost: 137188, expectedRevenue: 46625, subs: ['Atta Chakki & Oil Expeller', 'Spice Grinding & Packaging', 'Pickle & Papad Unit'] },
  { id: 'Retail / Kirana', label: '6. Retail / Kirana', typicalCost: 97812, expectedRevenue: 86375, subs: ['General Merchant Store', 'Daily Needs & FMCG', 'Stationery & Provisions'] },
  { id: 'Tailoring & Garment Services', label: '7. Tailoring & Garment Services', typicalCost: 66250, expectedRevenue: 30688, subs: ['Garment Stitching Center', 'Embroidery & Uniform Making', 'Boutique Store'] },
  { id: 'Repair & Maintenance', label: '8. Repair & Maintenance', typicalCost: 91562, expectedRevenue: 32625, subs: ['Two-Wheeler Service Center', 'Solar / Electric Appliance Repair', 'Tractor & Pump Mechanic'] },
  { id: 'Digital / CSC / Online Services', label: '9. Digital / CSC / Online Services', typicalCost: 55312, expectedRevenue: 26750, subs: ['Common Service Center (CSC)', 'Photocopy & Online Filing', 'Banking Correspondent Kiosk'] },
  { id: 'Handicrafts / Artisan Products', label: '10. Handicrafts / Artisan Products', typicalCost: 54688, expectedRevenue: 19000, subs: ['Clay Pottery', 'Wood & Bamboo Craft', 'Handloom Weaving'] }
];

export default function AssessmentWizard() {
  const router = useRouter();
  const { user } = useAuth();
  const [authChecked, setAuthChecked] = useState(false);
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('grambiz_user') : null;
    if (!user && !saved) {
      router.replace('/register?redirect=/assessment/new');
    } else {
      setAuthChecked(true);
    }
  }, [user, router]);

  // 1. SINGLE SOURCE OF TRUTH FOR LOCATION STATE
  const [selectedLocation, setSelectedLocation] = useState<SelectedLocationState>({
    state: 'Jharkhand',
    district: 'Dhanbad',
    block: 'Govindpur',
    village: 'Pratappur',
    latitude: 23.8340,
    longitude: 86.5210,
    location_source: 'manual'
  });

  // Dynamic dropdown option lists
  const [statesList, setStatesList] = useState<string[]>([]);
  const [districtsList, setDistrictsList] = useState<string[]>([]);
  const [blocksList, setBlocksList] = useState<string[]>([]);
  const [villagesList, setVillagesList] = useState<VillageEntity[]>([]);

  // Loading states
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingBlocks, setLoadingBlocks] = useState(false);
  const [loadingVillages, setLoadingVillages] = useState(false);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);

  // GPS State
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'locating' | 'active' | 'denied'>('idle');
  const [gpsMessage, setGpsMessage] = useState<string>('');

  // Step 2-5 Business Fields
  const [financialData, setFinancialData] = useState({
    margin_capital: 100000,
    existing_investment: 0,
    existing_loans: 0,
    business_category: 'Dairy',
    business_subcategory: 'Cow / Buffalo Chilling',
    prior_experience: true,
    experience_years: 2,
    land_available: true,
    water_available: true,
    electricity_available: true,
    transport_available: true,
    storage_available: false,
    primary_customers: 'Local households, Mandi collection center, Sweet shops',
    sales_channels: 'Direct collection, Daily morning delivery'
  });

  // Initial Load: States & Seed first selection
  useEffect(() => {
    LocationService.getStates().then(states => {
      setStatesList(states);
      if (states.length > 0) {
        const stateToUse = states.includes(selectedLocation.state) ? selectedLocation.state : states[0];
        loadHierarchyForState(stateToUse, selectedLocation.district, selectedLocation.block, selectedLocation.village);
      }
    });
  }, []);

  const loadHierarchyForState = async (stateName: string, targetDist?: string, targetBlk?: string, targetVil?: string) => {
    setLoadingDistricts(true);
    const districts = await LocationService.getDistricts(stateName);
    setDistrictsList(districts);
    setLoadingDistricts(false);

    const distToUse = (targetDist && districts.some(d => d.toLowerCase() === targetDist.toLowerCase())) 
      ? districts.find(d => d.toLowerCase() === targetDist.toLowerCase())! 
      : districts[0] || '';

    if (distToUse) {
      setLoadingBlocks(true);
      const blocks = await LocationService.getBlocks(stateName, distToUse);
      setBlocksList(blocks);
      setLoadingBlocks(false);

      const blkToUse = (targetBlk && blocks.some(b => b.toLowerCase() === targetBlk.toLowerCase())) 
        ? blocks.find(b => b.toLowerCase() === targetBlk.toLowerCase())! 
        : blocks[0] || '';

      if (blkToUse) {
        setLoadingVillages(true);
        const villages = await LocationService.getVillages(stateName, distToUse, blkToUse);
        setVillagesList(villages);
        setLoadingVillages(false);

        const vilToUse = (targetVil && villages.some(v => v.name.toLowerCase() === targetVil.toLowerCase()))
          ? villages.find(v => v.name.toLowerCase() === targetVil.toLowerCase())!
          : villages[0];

        if (vilToUse) {
          setSelectedLocation({
            state: stateName,
            district: distToUse,
            block: blkToUse,
            village: vilToUse.name,
            latitude: vilToUse.latitude,
            longitude: vilToUse.longitude,
            location_source: 'manual'
          });
        }
      }
    }
  };

  // ---------------- CASCADE EVENT HANDLERS ----------------
  const handleStateChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newState = e.target.value;
    setGpsStatus('idle');
    setGpsMessage('');
    
    setSelectedLocation(prev => ({
      ...prev,
      state: newState,
      district: '',
      block: '',
      village: '',
      latitude: null,
      longitude: null,
      location_source: 'manual'
    }));

    setDistrictsList([]);
    setBlocksList([]);
    setVillagesList([]);

    setLoadingDistricts(true);
    const districts = await LocationService.getDistricts(newState);
    setDistrictsList(districts);
    setLoadingDistricts(false);

    if (districts.length > 0) {
      const firstDist = districts[0];
      setLoadingBlocks(true);
      const blocks = await LocationService.getBlocks(newState, firstDist);
      setBlocksList(blocks);
      setLoadingBlocks(false);

      if (blocks.length > 0) {
        const firstBlk = blocks[0];
        setLoadingVillages(true);
        const villages = await LocationService.getVillages(newState, firstDist, firstBlk);
        setVillagesList(villages);
        setLoadingVillages(false);

        if (villages.length > 0) {
          setSelectedLocation({
            state: newState,
            district: firstDist,
            block: firstBlk,
            village: villages[0].name,
            latitude: villages[0].latitude,
            longitude: villages[0].longitude,
            location_source: 'manual'
          });
        }
      }
    }
  };

  const handleDistrictChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDistrict = e.target.value;
    setGpsStatus('idle');
    setGpsMessage('');

    setSelectedLocation(prev => ({
      ...prev,
      district: newDistrict,
      block: '',
      village: '',
      latitude: null,
      longitude: null,
      location_source: 'manual'
    }));

    setBlocksList([]);
    setVillagesList([]);

    setLoadingBlocks(true);
    const blocks = await LocationService.getBlocks(selectedLocation.state, newDistrict);
    setBlocksList(blocks);
    setLoadingBlocks(false);

    if (blocks.length > 0) {
      const firstBlk = blocks[0];
      setLoadingVillages(true);
      const villages = await LocationService.getVillages(selectedLocation.state, newDistrict, firstBlk);
      setVillagesList(villages);
      setLoadingVillages(false);

      if (villages.length > 0) {
        setSelectedLocation(prev => ({
          ...prev,
          district: newDistrict,
          block: firstBlk,
          village: villages[0].name,
          latitude: villages[0].latitude,
          longitude: villages[0].longitude,
          location_source: 'manual'
        }));
      }
    }
  };

  const handleBlockChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newBlock = e.target.value;
    setGpsStatus('idle');
    setGpsMessage('');

    setSelectedLocation(prev => ({
      ...prev,
      block: newBlock,
      village: '',
      latitude: null,
      longitude: null,
      location_source: 'manual'
    }));

    setVillagesList([]);
    setLoadingVillages(true);
    const villages = await LocationService.getVillages(selectedLocation.state, selectedLocation.district, newBlock);
    setVillagesList(villages);
    setLoadingVillages(false);

    if (villages.length > 0) {
      setSelectedLocation(prev => ({
        ...prev,
        block: newBlock,
        village: villages[0].name,
        latitude: villages[0].latitude,
        longitude: villages[0].longitude,
        location_source: 'manual'
      }));
    }
  };

  const handleVillageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newVillageName = e.target.value;
    const matched = villagesList.find(v => v.name === newVillageName);

    setGpsStatus('idle');
    setGpsMessage('');

    setSelectedLocation(prev => ({
      ...prev,
      village: newVillageName,
      latitude: matched ? matched.latitude : prev.latitude,
      longitude: matched ? matched.longitude : prev.longitude,
      location_source: 'manual'
    }));
  };

  // ---------------- REAL GPS GEOLOCATION & REVERSE GEOCODING ----------------
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGpsStatus('denied');
      setGpsMessage('Geolocation is not supported by your browser.');
      return;
    }

    setGpsStatus('locating');
    setGpsMessage('Acquiring precise GPS coordinates...');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;

        setGpsMessage('GPS acquired. Looking up village and administrative hierarchy...');
        setIsReverseGeocoding(true);

        const geoResult = await LocationService.reverseGeocode(lat, lon, 'gps');
        setIsReverseGeocoding(false);

        if (geoResult.state) {
          const matchedState = statesList.find(s => s.toLowerCase() === geoResult.state?.toLowerCase()) || geoResult.state;
          
          await loadHierarchyForState(
            matchedState,
            geoResult.district || undefined,
            geoResult.block || undefined,
            geoResult.village || undefined
          );

          setSelectedLocation({
            state: matchedState,
            district: geoResult.district || 'Meerut',
            block: geoResult.block || 'Hastinapur',
            village: geoResult.village || 'Ganeshpur',
            latitude: lat,
            longitude: lon,
            location_source: 'gps'
          });

          setGpsStatus('active');
          setGpsMessage(`GPS Active: ${geoResult.village || 'Location'}, ${geoResult.district || ''}, ${matchedState}`);
        } else {
          setSelectedLocation(prev => ({
            ...prev,
            latitude: lat,
            longitude: lon,
            location_source: 'gps'
          }));
          setGpsStatus('active');
          setGpsMessage(`GPS Active (Coordinates: ${lat.toFixed(4)}° N, ${lon.toFixed(4)}° E)`);
        }
      },
      (err) => {
        setGpsStatus('denied');
        if (err.code === 1) {
          setGpsMessage('Location access was denied. Please select your village manually from the dropdowns above.');
        } else {
          setGpsMessage('Could not retrieve GPS position. Please select your village manually.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Map coordinate drag/click handler
  const handleMapCoordinatesChange = (lat: number, lon: number) => {
    setSelectedLocation(prev => ({
      ...prev,
      latitude: lat,
      longitude: lon,
      location_source: 'map'
    }));
  };

  // Check validity for Step 1
  const isStep1Valid = Boolean(
    selectedLocation.state &&
    selectedLocation.district &&
    selectedLocation.block &&
    selectedLocation.village &&
    selectedLocation.latitude !== null &&
    selectedLocation.longitude !== null
  );

  const handleSubmitAssessment = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        location: {
          state: selectedLocation.state,
          district: selectedLocation.district,
          block: selectedLocation.block,
          village: selectedLocation.village,
          latitude: Number(selectedLocation.latitude),
          longitude: Number(selectedLocation.longitude)
        },
        margin_capital: Number(financialData.margin_capital),
        business_category: financialData.business_category,
        business_subcategory: financialData.business_subcategory,
        prior_experience: Boolean(financialData.prior_experience),
        experience_years: financialData.prior_experience ? (Number(financialData.experience_years) || 2) : 0,
        land_available: Boolean(financialData.land_available),
        water_available: Boolean(financialData.water_available),
        electricity_available: Boolean(financialData.electricity_available),
        transport_available: Boolean(financialData.transport_available),
        storage_available: Boolean(financialData.storage_available)
      };

      const data = await ApiClient.createAssessment(payload);
      if (data?.id) {
        router.push(`/assessment/${data.id}`);
      } else {
        throw new Error('No assessment ID returned');
      }
    } catch (err: any) {
      console.error("Assessment creation error:", err);
      alert(`Could not create assessment on live server: ${err.message || 'Server error'}. Please ensure the backend is running.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const estimatedProjectCost = financialData.margin_capital ? (financialData.margin_capital / 0.10) : 0;
  const estimatedLoan = estimatedProjectCost * 0.90;

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="p-8 bg-white rounded-2xl border border-slate-200 shadow-sm text-center max-w-sm w-full space-y-3">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-bold text-slate-800">Checking Entrepreneur Registration...</p>
          <p className="text-xs text-slate-500">Business assessment requires registration. Redirecting to register...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Progress Bar & Header */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-black text-emerald-800 uppercase tracking-widest">
                STEP {step} OF 5
              </span>
              <h2 className="text-2xl font-black text-slate-900">
                {step === 1 && "Geographic Location & Village Profile"}
                {step === 2 && "Proposed Business Category (10 Core Sectors)"}
                {step === 3 && "Available Margin Capital (10% Structuring)"}
                {step === 4 && "Entrepreneur Experience"}
                {step === 5 && "Review & Generate Dossier"}
              </h2>
            </div>
            <span className="text-xs font-bold px-3.5 py-1.5 bg-emerald-50 text-emerald-800 rounded-full border border-emerald-200">
              {Math.round((step / 5) * 100)}% Completed
            </span>
          </div>

          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-emerald-700 to-teal-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${(step / 5) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Wizard Form Body */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
          
          {/* STEP 1: GEOGRAPHIC LOCATION */}
          {step === 1 && (
            <div className="space-y-6">
              
              <div className="flex items-start gap-3 p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl text-xs text-emerald-950 leading-relaxed">
                <Info className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <p>
                  Select your state, district, block, and village from our verified Census & LGD database. UDYAM-SETU AI analyzes 5 km & 10 km competitor density, mandi arrivals, and local demographics automatically.
                </p>
              </div>

              {/* Hierarchy Dropdowns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* 1. State */}
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase mb-1.5">
                    State <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={selectedLocation.state}
                    onChange={handleStateChange}
                    className="w-full px-4 py-3 text-xs font-bold text-slate-800 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    {statesList.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                {/* 2. District */}
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase mb-1.5 flex items-center justify-between">
                    <span>District <span className="text-rose-500">*</span></span>
                    {loadingDistricts && <span className="text-[10px] text-slate-400 font-normal">Loading...</span>}
                  </label>
                  <select
                    value={selectedLocation.district}
                    onChange={handleDistrictChange}
                    disabled={!selectedLocation.state || loadingDistricts}
                    className="w-full px-4 py-3 text-xs font-bold text-slate-800 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    {districtsList.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                {/* 3. Block */}
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase mb-1.5 flex items-center justify-between">
                    <span>Block / Tehsil <span className="text-rose-500">*</span></span>
                    {loadingBlocks && <span className="text-[10px] text-slate-400 font-normal">Loading...</span>}
                  </label>
                  <select
                    value={selectedLocation.block}
                    onChange={handleBlockChange}
                    disabled={!selectedLocation.district || loadingBlocks}
                    className="w-full px-4 py-3 text-xs font-bold text-slate-800 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    {blocksList.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>

                {/* 4. Village */}
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase mb-1.5 flex items-center justify-between">
                    <span>Village / Settlement <span className="text-rose-500">*</span></span>
                    {loadingVillages && <span className="text-[10px] text-slate-400 font-normal">Loading...</span>}
                  </label>
                  <select
                    value={selectedLocation.village}
                    onChange={handleVillageChange}
                    disabled={!selectedLocation.block || loadingVillages}
                    className="w-full px-4 py-3 text-xs font-bold text-slate-800 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    {villagesList.map(v => (
                      <option key={v.id || v.name} value={v.name}>{v.name} {v.population ? `(Pop: ${v.population})` : ''}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* GPS Geolocation Bar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  disabled={gpsStatus === 'locating' || isReverseGeocoding}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl shadow-xs transition"
                >
                  {gpsStatus === 'locating' || isReverseGeocoding ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-700" />
                      <span>Detecting GPS Coordinates...</span>
                    </>
                  ) : (
                    <>
                      <Navigation className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Use My GPS Location</span>
                    </>
                  )}
                </button>

                <div className="text-xs">
                  {selectedLocation.latitude !== null && selectedLocation.longitude !== null ? (
                    <span className="text-slate-500 text-[11px]">
                      GPS Anchor: <span className="font-bold text-slate-800">{selectedLocation.latitude.toFixed(4)}° N, {selectedLocation.longitude.toFixed(4)}° E</span>
                    </span>
                  ) : (
                    <span className="text-slate-400 text-[11px]">Coordinates pending</span>
                  )}
                </div>
              </div>

              {/* Interactive OpenStreetMap */}
              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-700 uppercase">
                  Hyper-Local Geographic Boundary (5 KM & 10 KM Buffer Zone)
                </label>
                <InteractiveLocationMap
                  latitude={selectedLocation.latitude}
                  longitude={selectedLocation.longitude}
                  locationName={`${selectedLocation.village}, ${selectedLocation.district}, ${selectedLocation.state}`}
                  onCoordinatesChange={handleMapCoordinatesChange}
                />
              </div>

            </div>
          )}

          {/* STEP 3: CAPITAL & FINANCIAL STRUCTURING */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase mb-2">
                  Available Own Margin Capital (₹ INR) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 font-black text-xl">₹</span>
                  <input
                    type="number"
                    value={financialData.margin_capital}
                    onChange={e => setFinancialData({ ...financialData, margin_capital: Number(e.target.value) })}
                    className="w-full pl-10 pr-4 py-4 text-2xl font-black border border-slate-300 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="100000"
                  />
                </div>
                {(() => {
                  const selectedCat = BUSINESS_CATEGORIES.find(c => c.id === financialData.business_category);
                  if (selectedCat) {
                    const recommendedMargin = Math.ceil(selectedCat.typicalCost * 0.10);
                    return (
                      <div className="mt-3 p-4 bg-emerald-50/50 rounded-xl border border-emerald-100 space-y-1.5">
                        <p className="text-xs text-slate-700 font-medium leading-relaxed">
                          <span className="font-bold text-emerald-800">Category Insight:</span> A typical <strong>{selectedCat.label.replace(/^\d+\.\s*/, '')}</strong> business requires around <strong>₹{selectedCat.typicalCost.toLocaleString('en-IN')}</strong> to set up.
                        </p>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          Based on MoSJE's 10% Margin Norm, we recommend an initial margin capital of at least <strong className="text-emerald-700">₹{recommendedMargin.toLocaleString('en-IN')}</strong> to unlock the required 90% concessional loan.
                        </p>
                      </div>
                    );
                  }
                  return (
                    <p className="text-xs text-slate-500 mt-2">
                      Standard MoSJE Norm: ₹1,00,000 margin unlocks ₹10,00,000 total project size (90% loan).
                    </p>
                  );
                })()}
              </div>

              {/* Instant deterministic preview */}
              <div className="p-5 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl space-y-3">
                <div className="flex justify-between items-center text-xs text-emerald-950">
                  <span className="font-semibold">Calculated Total Project Outlay (100%):</span>
                  <span className="font-black text-base text-emerald-950">₹{estimatedProjectCost.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-emerald-950 border-t border-emerald-200/60 pt-2">
                  <span className="font-semibold">Eligible MoSJE Concessional Loan (90%):</span>
                  <span className="font-black text-base text-emerald-800">₹{estimatedLoan.toLocaleString('en-IN')}</span>
                </div>
              </div>

            </div>
          )}

          {/* STEP 2: ALL 10 BUSINESS CATEGORIES */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-black text-slate-700 uppercase">
                  Select Business Category (All 10 Core Rural Sectors Supported)
                </label>
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  10 of 10 Available
                </span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {BUSINESS_CATEGORIES.map((cat) => {
                  const isSelected = financialData.business_category === cat.id;
                  return (
                    <button
                      type="button"
                      key={cat.id}
                      onClick={() => setFinancialData({
                        ...financialData,
                        business_category: cat.id,
                        business_subcategory: cat.subs[0],
                        margin_capital: financialData.margin_capital || Math.round(cat.typicalCost * 0.10)
                      })}
                      className={`p-4 rounded-2xl border text-left transition-all duration-150 ${
                        isSelected 
                          ? 'border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-500/20 shadow-xs' 
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <span className={`text-xs font-black block mb-1 ${isSelected ? 'text-emerald-950' : 'text-slate-900'}`}>
                        {cat.label}
                      </span>
                      <div className="flex items-center gap-2 text-[10.5px] font-bold text-emerald-800 mb-1.5">
                        <span className="bg-emerald-100/80 px-1.5 py-0.5 rounded">Setup: ₹{cat.typicalCost.toLocaleString('en-IN')}</span>
                        <span className="bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">Rev: ~₹{cat.expectedRevenue.toLocaleString('en-IN')}/mo</span>
                      </div>
                      <span className="text-[11px] text-slate-500 block truncate">
                        e.g., {cat.subs.join(', ')}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="pt-2">
                <label className="block text-xs font-black text-slate-700 uppercase mb-1.5">
                  Subcategory / Specific Focus Unit
                </label>
                <input
                  type="text"
                  value={financialData.business_subcategory}
                  onChange={e => setFinancialData({ ...financialData, business_subcategory: e.target.value })}
                  className="w-full px-4 py-3 text-xs font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="e.g. Modern Cow Chilling Unit"
                />
              </div>
            </div>
          )}

          {/* STEP 4: EXPERIENCE & INFRASTRUCTURE */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase mb-2">
                  Previous Experience <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setFinancialData({ ...financialData, prior_experience: true, experience_years: 2 })}
                    className={`flex-1 sm:flex-initial sm:w-44 py-3 px-4 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
                      financialData.prior_experience
                        ? 'bg-emerald-800 text-white border-emerald-800 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <span className={`w-2.5 h-2.5 rounded-full ${financialData.prior_experience ? 'bg-amber-400' : 'bg-slate-300'}`}></span>
                    <span>Yes (Experienced)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFinancialData({ ...financialData, prior_experience: false, experience_years: 0 })}
                    className={`flex-1 sm:flex-initial sm:w-44 py-3 px-4 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
                      !financialData.prior_experience
                        ? 'bg-emerald-800 text-white border-emerald-800 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <span className={`w-2.5 h-2.5 rounded-full ${!financialData.prior_experience ? 'bg-amber-400' : 'bg-slate-300'}`}></span>
                    <span>No (First-Time)</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5">
                  {financialData.prior_experience 
                    ? "✓ Prior sector experience recorded (lowers operational risk rating)."
                    : "ℹ First-time enterprise / new sector applicant."}
                </p>
              </div>
            </div>
          )}

          {/* STEP 5: REVIEW & SUBMIT */}
          {step === 5 && (
            <div className="space-y-6">
              <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                <h3 className="font-black text-slate-900 text-sm">Assessment Summary Review</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                  <div><span className="text-slate-400 text-[10px] uppercase font-bold block">Location</span><span className="font-bold text-slate-800">{selectedLocation.village}, {selectedLocation.district}</span></div>
                  <div><span className="text-slate-400 text-[10px] uppercase font-bold block">Margin Capital</span><span className="font-bold text-emerald-800">₹{financialData.margin_capital.toLocaleString('en-IN')}</span></div>
                  <div><span className="text-slate-400 text-[10px] uppercase font-bold block">Total Outlay</span><span className="font-bold text-slate-800">₹{estimatedProjectCost.toLocaleString('en-IN')}</span></div>
                  <div><span className="text-slate-400 text-[10px] uppercase font-bold block">Category</span><span className="font-bold text-slate-800">{financialData.business_category}</span></div>
                  <div><span className="text-slate-400 text-[10px] uppercase font-bold block">Subcategory</span><span className="font-bold text-slate-800">{financialData.business_subcategory}</span></div>
                  <div><span className="text-slate-400 text-[10px] uppercase font-bold block">Previous Experience</span><span className="font-bold text-slate-800">{financialData.prior_experience ? 'Yes' : 'No'}</span></div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Controls Buttons */}
          <div className="pt-8 flex items-center justify-between border-t border-slate-100">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Previous Step</span>
              </button>
            ) : <div></div>}

            {step < 5 ? (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                disabled={step === 1 && !isStep1Valid}
                className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-gradient-to-r from-emerald-800 to-teal-800 hover:from-emerald-900 hover:to-teal-900 text-white font-bold text-xs shadow-md transition disabled:opacity-50"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmitAssessment}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-sm shadow-lg transition disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                    <span>Running 4-Model Suite...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-slate-950" />
                    <span>Generate Bank-Ready Feasibility Dossier</span>
                  </>
                )}
              </button>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
