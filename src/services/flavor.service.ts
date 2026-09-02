import { supabase } from '../lib/supabase';
import { Flavor } from '../types';

export const flavorService = {
  async getFlavors(onlyActive = true): Promise<Flavor[]> {
    let query = supabase.from('flavors').select('*').order('name');
    if (onlyActive) {
      query = query.eq('active', true);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching flavors from Supabase:', error);
      return [];
    }
    return data || [];
  },

  async createFlavor(name: string): Promise<{ data: Flavor | null; error: Error | null }> {
    const trimmedName = name.trim();
    if (!trimmedName) {
      return { data: null, error: new Error('El nombre del sabor es requerido') };
    }

    const { data, error } = await supabase
      .from('flavors')
      .insert([{ name: trimmedName, active: true }])
      .select()
      .single();

    if (error) {
      return { data: null, error: new Error(error.message) };
    }
    return { data, error: null };
  },

  async updateFlavor(id: string, updates: { name?: string; active?: boolean }): Promise<{ error: Error | null }> {
    const { error } = await supabase
      .from('flavors')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    return { error: error ? new Error(error.message) : null };
  },

  async toggleFlavorActive(id: string, currentActive: boolean): Promise<{ error: Error | null }> {
    return this.updateFlavor(id, { active: !currentActive });
  },

  async deleteFlavor(id: string): Promise<{ error: Error | null }> {
    const { error } = await supabase
      .from('flavors')
      .delete()
      .eq('id', id);

    return { error: error ? new Error(error.message) : null };
  },
};

