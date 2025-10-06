// 🍄 Mushroom Manager - Database Services

import type { 
  Protocol, 
  Species, 
  ProtocolPhase, 
  ProtocolHarvest,
  DropdownOption,
  CreateProtocolRequest,
  CreatePhaseRequest
} from './types';

export class DatabaseService {
  constructor(private db: D1Database) {}

  // Species Management
  async getAllSpecies(): Promise<Species[]> {
    const result = await this.db.prepare(`
      SELECT * FROM species 
      WHERE is_active = 1 
      ORDER BY common_name
    `).all();
    
    return result.results as Species[];
  }

  async getSpeciesById(id: number): Promise<Species | null> {
    const result = await this.db.prepare(`
      SELECT * FROM species WHERE id = ? AND is_active = 1
    `).bind(id).first();
    
    return result as Species | null;
  }

  // Dropdown Options Management
  async getDropdownOptions(category: string): Promise<DropdownOption[]> {
    const result = await this.db.prepare(`
      SELECT * FROM dropdown_options 
      WHERE category = ? AND is_active = 1 
      ORDER BY sort_order, label
    `).bind(category).all();
    
    return result.results as DropdownOption[];
  }

  async createDropdownOption(option: Omit<DropdownOption, 'id' | 'created_at'>): Promise<number> {
    const result = await this.db.prepare(`
      INSERT INTO dropdown_options (category, value, label, description, sort_order, is_active)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      option.category,
      option.value,
      option.label,
      option.description || null,
      option.sort_order,
      option.is_active ? 1 : 0
    ).run();

    return result.meta.last_row_id as number;
  }

  async deleteDropdownOption(id: number): Promise<void> {
    await this.db.prepare(`
      UPDATE dropdown_options 
      SET is_active = 0 
      WHERE id = ?
    `).bind(id).run();
  }

  // Protocol Management
  async getAllProtocols(): Promise<(Protocol & { species_name: string })[]> {
    const result = await this.db.prepare(`
      SELECT 
        p.*, 
        s.common_name as species_name,
        s.scientific_name
      FROM protocols p
      JOIN species s ON p.species_id = s.id
      WHERE p.is_active = 1
      ORDER BY p.created_at DESC
    `).all();
    
    return result.results as (Protocol & { species_name: string })[];
  }

  async getProtocolById(id: number): Promise<Protocol | null> {
    const result = await this.db.prepare(`
      SELECT p.*, s.common_name as species_name, s.scientific_name
      FROM protocols p
      JOIN species s ON p.species_id = s.id
      WHERE p.id = ? AND p.is_active = 1
    `).bind(id).first();
    
    return result as Protocol | null;
  }

  async createProtocol(data: CreateProtocolRequest): Promise<number> {
    const result = await this.db.prepare(`
      INSERT INTO protocols (
        code, title, species_id, strain, origin, breeder, 
        genetic_age, status, notes, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, 'preparation', ?, datetime('now'), datetime('now'))
    `).bind(
      data.code,
      data.title,
      data.species_id,
      data.strain || null,
      data.origin || null,
      data.breeder || null,
      data.genetic_age || null,
      data.notes || null
    ).run();

    return result.meta.last_row_id as number;
  }

  async updateProtocolStatus(id: number, status: string): Promise<void> {
    await this.db.prepare(`
      UPDATE protocols 
      SET status = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(status, id).run();
  }

  // Protocol Phases Management
  async getProtocolPhases(protocolId: number): Promise<ProtocolPhase[]> {
    const result = await this.db.prepare(`
      SELECT * FROM protocol_phases 
      WHERE protocol_id = ? 
      ORDER BY start_date, created_at
    `).bind(protocolId).all();
    
    return result.results as ProtocolPhase[];
  }

  async createPhase(data: CreatePhaseRequest): Promise<number> {
    const result = await this.db.prepare(`
      INSERT INTO protocol_phases (
        protocol_id, phase_type, phase_name, start_date,
        substrate_composition, substrate_weight_g, inoculation_method,
        container_type, temperature_min, temperature_max,
        humidity_min, humidity_max, notes, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      data.protocol_id,
      data.phase_type,
      data.phase_name,
      data.start_date || null,
      data.substrate_composition || null,
      data.substrate_weight_g || null,
      data.inoculation_method || null,
      data.container_type || null,
      data.temperature_min || null,
      data.temperature_max || null,
      data.humidity_min || null,
      data.humidity_max || null,
      data.notes || null
    ).run();

    return result.meta.last_row_id as number;
  }

  // Harvest Management
  async getProtocolHarvests(protocolId: number): Promise<ProtocolHarvest[]> {
    const result = await this.db.prepare(`
      SELECT * FROM protocol_harvests 
      WHERE protocol_id = ? 
      ORDER BY flush_number
    `).bind(protocolId).all();
    
    return result.results as ProtocolHarvest[];
  }

  async createHarvest(protocolId: number, flushNumber: number, data: {
    harvest_date: string;
    weight_fresh_g?: number;
    weight_dry_g?: number;
    biological_efficiency?: number;
    quality_rating?: number;
    notes?: string;
    days_to_harvest?: number;
  }): Promise<number> {
    const result = await this.db.prepare(`
      INSERT INTO protocol_harvests (
        protocol_id, flush_number, harvest_date, weight_fresh_g,
        weight_dry_g, biological_efficiency, quality_rating,
        notes, days_to_harvest, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      protocolId,
      flushNumber,
      data.harvest_date,
      data.weight_fresh_g || null,
      data.weight_dry_g || null,
      data.biological_efficiency || null,
      data.quality_rating || null,
      data.notes || null,
      data.days_to_harvest || null
    ).run();

    return result.meta.last_row_id as number;
  }

  // Statistics
  async getProtocolStats(): Promise<{
    total_protocols: number;
    active_protocols: number;
    completed_protocols: number;
    total_harvests: number;
    total_yield_kg: number;
  }> {
    const stats = await this.db.prepare(`
      SELECT 
        COUNT(*) as total_protocols,
        SUM(CASE WHEN status IN ('colonization', 'fruiting', 'harvesting') THEN 1 ELSE 0 END) as active_protocols,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_protocols
      FROM protocols 
      WHERE is_active = 1
    `).first() as any;

    const harvestStats = await this.db.prepare(`
      SELECT 
        COUNT(*) as total_harvests,
        COALESCE(SUM(weight_fresh_g), 0) / 1000.0 as total_yield_kg
      FROM protocol_harvests
    `).first() as any;

    return {
      total_protocols: stats.total_protocols || 0,
      active_protocols: stats.active_protocols || 0,
      completed_protocols: stats.completed_protocols || 0,
      total_harvests: harvestStats.total_harvests || 0,
      total_yield_kg: harvestStats.total_yield_kg || 0
    };
  }

  // Validation helpers
  async isProtocolCodeUnique(code: string, excludeId?: number): Promise<boolean> {
    const query = excludeId 
      ? `SELECT COUNT(*) as count FROM protocols WHERE code = ? AND id != ? AND is_active = 1`
      : `SELECT COUNT(*) as count FROM protocols WHERE code = ? AND is_active = 1`;
    
    const params = excludeId ? [code, excludeId] : [code];
    const result = await this.db.prepare(query).bind(...params).first() as any;
    
    return result.count === 0;
  }
}