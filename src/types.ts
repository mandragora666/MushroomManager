// 🍄 Mushroom Manager - TypeScript Types

// Cloudflare Bindings
export interface Env {
  DB: D1Database;
  // KV?: KVNamespace;
  // R2?: R2Bucket;
}

// Protocol Types
export interface Protocol {
  id: number;
  code: string;
  title: string;
  species_id: number;
  strain?: string;
  origin?: string;
  breeder?: string;
  genetic_age?: number;
  status: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Species {
  id: number;
  scientific_name: string;
  common_name: string;
  category: string;
  is_active: boolean;
  created_at: string;
}

export interface ProtocolPhase {
  id: number;
  protocol_id: number;
  phase_type: string;
  phase_name: string;
  start_date?: string;
  end_date?: string;
  duration_days?: number;
  temperature_min?: number;
  temperature_max?: number;
  humidity_min?: number;
  humidity_max?: number;
  co2_ppm?: number;
  light_hours?: number;
  air_exchange?: string;
  substrate_composition?: string;
  substrate_weight_g?: number;
  inoculation_method?: string;
  inoculation_amount?: string;
  container_type?: string;
  status: string;
  notes?: string;
  created_at: string;
}

export interface ProtocolPhoto {
  id: number;
  protocol_id: number;
  phase_id?: number;
  filename: string;
  url: string;
  caption?: string;
  taken_date?: string;
  file_size?: number;
  mime_type?: string;
  width?: number;
  height?: number;
  created_at: string;
}

export interface ProtocolHarvest {
  id: number;
  protocol_id: number;
  flush_number: number;
  harvest_date: string;
  weight_fresh_g?: number;
  weight_dry_g?: number;
  biological_efficiency?: number;
  quality_rating?: number;
  notes?: string;
  days_to_harvest?: number;
  created_at: string;
}

export interface DropdownOption {
  id: number;
  category: string;
  value: string;
  label: string;
  description?: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface ProtocolEvent {
  id: number;
  protocol_id: number;
  phase_id?: number;
  event_date: string;
  event_type: string;
  title: string;
  description?: string;
  temperature?: number;
  humidity?: number;
  ph_value?: number;
  created_at: string;
}

// Form Types
export interface CreateProtocolRequest {
  code: string;
  title: string;
  species_id: number;
  strain?: string;
  origin?: string;
  breeder?: string;
  genetic_age?: number;
  notes?: string;
}

export interface CreatePhaseRequest {
  protocol_id: number;
  phase_type: string;
  phase_name: string;
  start_date?: string;
  substrate_composition?: string;
  substrate_weight_g?: number;
  inoculation_method?: string;
  container_type?: string;
  temperature_min?: number;
  temperature_max?: number;
  humidity_min?: number;
  humidity_max?: number;
  notes?: string;
}