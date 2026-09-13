// Location hierarchy service & API abstraction layer for UDYAM-SETU AI
import { API_BASE_URL } from './apiClient';

export interface VillageEntity {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  population?: number;
  households?: number;
}

export interface BlockEntity {
  id: string;
  name: string;
  villages: VillageEntity[];
}

export interface DistrictEntity {
  id: string;
  name: string;
  blocks: BlockEntity[];
}

export interface StateEntity {
  id: string;
  name: string;
  districts: DistrictEntity[];
}

export interface SelectedLocationState {
  state: string;
  district: string;
  block: string;
  village: string;
  latitude: number | null;
  longitude: number | null;
  location_source: 'manual' | 'gps' | 'map';
}

export interface ReverseGeocodeResult {
  state: string | null;
  district: string | null;
  block: string | null;
  village: string | null;
  city?: string | null;
  latitude: number;
  longitude: number;
  location_source: string;
  confidence: string;
  raw_display_name?: string;
}

export const VERIFIED_LOCATION_DATA: StateEntity[] = [
  {
    id: "st_jharkhand",
    name: "Jharkhand",
    districts: [
      {
        id: "dist_dhanbad",
        name: "Dhanbad",
        blocks: [
          {
            id: "blk_govindpur",
            name: "Govindpur",
            villages: [
              { id: "v_pratappur", name: "Pratappur", latitude: 23.8340, longitude: 86.5210, population: 5357, households: 1222 },
              { id: "v_bahiyar", name: "Bahiyar", latitude: 23.8510, longitude: 86.5410, population: 6005, households: 1472 },
              { id: "v_chakradharpur", name: "Chakradharpur", latitude: 23.8110, longitude: 86.4920, population: 3247, households: 708 }
            ]
          },
          {
            id: "blk_baliapur",
            name: "Baliapur",
            villages: [
              { id: "v_gopinathpur", name: "Gopinathpur", latitude: 23.7210, longitude: 86.5820, population: 2219, households: 486 },
              { id: "v_sindri", name: "Sindri", latitude: 23.6514, longitude: 86.5125, population: 7200, households: 1200 }
            ]
          }
        ]
      },
      {
        id: "dist_ranchi",
        name: "Ranchi",
        blocks: [
          {
            id: "blk_kanke",
            name: "Kanke",
            villages: [
              { id: "v_sukurhutu", name: "Sukurhutu", latitude: 23.4410, longitude: 85.3210, population: 4765, households: 971 },
              { id: "v_gundhuria", name: "Gundhuria", latitude: 23.4620, longitude: 85.3450, population: 5818, households: 1194 }
            ]
          },
          {
            id: "blk_itki",
            name: "Itki",
            villages: [
              { id: "v_getalsud", name: "Getalsud", latitude: 23.4110, longitude: 85.5520, population: 6915, households: 1473 }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "st_bihar",
    name: "Bihar",
    districts: [
      {
        id: "dist_patna",
        name: "Patna",
        blocks: [
          {
            id: "blk_phulwari",
            name: "Phulwari",
            villages: [
              { id: "v_alampur", name: "Alampur", latitude: 25.5610, longitude: 85.0810, population: 7704, households: 1763 },
              { id: "v_akorha", name: "Akorha", latitude: 25.5780, longitude: 85.0620, population: 3105, households: 823 },
              { id: "v_akbarpur", name: "Akbarpur", latitude: 25.5410, longitude: 85.0430, population: 2504, households: 506 }
            ]
          },
          {
            id: "blk_masaurhi",
            name: "Masaurhi",
            villages: [
              { id: "v_dahia", name: "Dahia", latitude: 25.3510, longitude: 85.0310, population: 7807, households: 1560 },
              { id: "v_lakhanpura", name: "Lakhanpura", latitude: 25.3720, longitude: 85.0120, population: 6825, households: 1373 }
            ]
          }
        ]
      },
      {
        id: "dist_begusarai",
        name: "Begusarai",
        blocks: [
          {
            id: "blk_barauni",
            name: "Barauni",
            villages: [
              { id: "v_amanpur", name: "Amanpur", latitude: 25.4810, longitude: 85.9810, population: 7337, households: 1714 },
              { id: "v_birauni", name: "Birauni", latitude: 25.4620, longitude: 85.9650, population: 4335, households: 1060 }
            ]
          },
          {
            id: "blk_matihani",
            name: "Matihani",
            villages: [
              { id: "v_balakpur", name: "Balakpur", latitude: 25.3810, longitude: 86.0810, population: 5873, households: 1203 },
              { id: "v_matihani", name: "Matihani", latitude: 25.3950, longitude: 86.1020, population: 4174, households: 797 }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "st_up",
    name: "Uttar Pradesh",
    districts: [
      {
        id: "dist_meerut",
        name: "Meerut",
        blocks: [
          {
            id: "blk_hastinapur",
            name: "Hastinapur",
            villages: [
              { id: "v_ganeshpur", name: "Ganeshpur", latitude: 29.1712, longitude: 77.9942, population: 3840, households: 620 },
              { id: "v_saifpur", name: "Saifpur Firojpur", latitude: 29.1650, longitude: 78.0120, population: 4100, households: 690 }
            ]
          }
        ]
      }
    ]
  }
];

export const LocationService = {
  getStates(): Promise<string[]> {
    return Promise.resolve(VERIFIED_LOCATION_DATA.map(s => s.name));
  },

  getDistricts(stateName: string): Promise<string[]> {
    const st = VERIFIED_LOCATION_DATA.find(s => s.name.toLowerCase() === stateName.toLowerCase());
    return Promise.resolve(st ? st.districts.map(d => d.name) : []);
  },

  getBlocks(stateName: string, districtName: string): Promise<string[]> {
    const st = VERIFIED_LOCATION_DATA.find(s => s.name.toLowerCase() === stateName.toLowerCase());
    if (!st) return Promise.resolve([]);
    const dist = st.districts.find(d => d.name.toLowerCase() === districtName.toLowerCase());
    return Promise.resolve(dist ? dist.blocks.map(b => b.name) : []);
  },

  getVillages(stateName: string, districtName: string, blockName: string): Promise<VillageEntity[]> {
    const st = VERIFIED_LOCATION_DATA.find(s => s.name.toLowerCase() === stateName.toLowerCase());
    if (!st) return Promise.resolve([]);
    const dist = st.districts.find(d => d.name.toLowerCase() === districtName.toLowerCase());
    if (!dist) return Promise.resolve([]);
    const blk = dist.blocks.find(b => b.name.toLowerCase() === blockName.toLowerCase());
    return Promise.resolve(blk ? blk.villages : []);
  },

  async reverseGeocode(latitude: number, longitude: number, source: string = "gps"): Promise<ReverseGeocodeResult> {
    try {
      const res = await fetch(`${API_BASE_URL}/locations/reverse-geocode?lat=${latitude}&lon=${longitude}&source=${source}`);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn("Backend reverse-geocode failed, attempting fallback");
    }

    return {
      state: null,
      district: null,
      block: null,
      village: null,
      latitude,
      longitude,
      location_source: source,
      confidence: "Estimated"
    };
  }
};
