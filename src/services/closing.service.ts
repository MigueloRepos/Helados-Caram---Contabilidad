import { supabase } from '../lib/supabase';
import { DailyClosing, DailyClosingFormData, HistoryFilterParams } from '../types';
import { getClosingPresentation } from '../lib/presentation';

export const closingService = {
  async getDailyClosings(filters?: HistoryFilterParams): Promise<DailyClosing[]> {
    let query = supabase
      .from('daily_closings')
      .select(`
        *,
        profile:profiles(id, full_name, avatar_url, role),
        flavors:daily_closing_flavors(
          id,
          flavor_id,
          quantity,
          flavor:flavors(id, name, active)
        )
      `);

    if (filters?.startDate) {
      query = query.gte('closing_date', filters.startDate);
    }
    if (filters?.endDate) {
      query = query.lte('closing_date', filters.endDate);
    }
    if (filters?.year && !filters?.startDate && !filters?.endDate) {
      const yearStart = `${filters.year}-01-01`;
      const yearEnd = `${filters.year}-12-31`;
      query = query.gte('closing_date', yearStart).lte('closing_date', yearEnd);
    }

    const sortBy = filters?.sortBy || 'recent';
    if (sortBy === 'recent') {
      query = query.order('closing_date', { ascending: false });
    } else if (sortBy === 'oldest') {
      query = query.order('closing_date', { ascending: true });
    } else if (sortBy === 'highest_sales') {
      query = query.order('total_sales', { ascending: false });
    } else if (sortBy === 'highest_expenses') {
      query = query.order('total_expenses', { ascending: false });
    } else if (sortBy === 'highest_cups') {
      query = query.order('total_cups', { ascending: false });
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching closings from Supabase:', error);
      return [];
    }

    let results = ((data || []) as DailyClosing[]).map((c) => ({
      ...c,
      presentation_type: getClosingPresentation(c),
    }));

    if (filters?.presentationType && filters.presentationType !== 'all') {
      results = results.filter((c) => c.presentation_type === filters.presentationType);
    }

    if (filters?.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      results = results.filter(c => 
        c.closing_date.includes(term) || 
        c.notes?.toLowerCase().includes(term) ||
        c.profile?.full_name?.toLowerCase().includes(term)
      );
    }

    return results;
  },

  async getDailyClosingById(id: string): Promise<DailyClosing | null> {
    const { data, error } = await supabase
      .from('daily_closings')
      .select(`
        *,
        profile:profiles(id, full_name, avatar_url, role),
        flavors:daily_closing_flavors(
          id,
          flavor_id,
          quantity,
          flavor:flavors(id, name, active)
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching closing by ID:', error);
      return null;
    }
    const closing = data as DailyClosing;
    return {
      ...closing,
      presentation_type: getClosingPresentation(closing),
    };
  },

  async getDailyClosingByDate(date: string): Promise<DailyClosing | null> {
    const { data, error } = await supabase
      .from('daily_closings')
      .select(`
        *,
        profile:profiles(id, full_name, avatar_url, role),
        flavors:daily_closing_flavors(
          id,
          flavor_id,
          quantity,
          flavor:flavors(id, name, active)
        )
      `)
      .eq('closing_date', date)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching closing by date:', error);
    }
    if (!data) return null;
    const closing = data as DailyClosing;
    return {
      ...closing,
      presentation_type: getClosingPresentation(closing),
    };
  },

  async createDailyClosing(formData: DailyClosingFormData, userId: string): Promise<{ data: DailyClosing | null; error: Error | null }> {
    const totalExpenses = Number(formData.workers_salary || 0) + Number(formData.delivery_salary || 0) + Number(formData.other_expenses || 0);
    const balance = Number(formData.total_sales || 0) - totalExpenses;
    const remainingBalance = balance - Number(formData.delivered_to_frank || 0);

    // Format notes with presentation metadata tag if tubs_4_5l
    let formattedNotes = (formData.notes || '').trim();
    if (formData.presentation_type === 'tubs_4_5l' && !formattedNotes.includes('[Tipo: Tinas 4.5L]')) {
      formattedNotes = formattedNotes ? `[Tipo: Tinas 4.5L] ${formattedNotes}` : '[Tipo: Tinas 4.5L]';
    }

    try {
      // 1. Insert daily_closing
      const { data: closing, error: closingError } = await supabase
        .from('daily_closings')
        .insert([{
          user_id: userId,
          closing_date: formData.closing_date,
          total_cups: Number(formData.total_cups),
          total_sales: Number(formData.total_sales),
          workers_salary: Number(formData.workers_salary || 0),
          delivery_salary: Number(formData.delivery_salary || 0),
          other_expenses: Number(formData.other_expenses || 0),
          total_expenses: totalExpenses,
          delivered_to_frank: Number(formData.delivered_to_frank || 0),
          balance: balance,
          remaining_balance: remainingBalance,
          notes: formattedNotes || null,
        }])
        .select()
        .single();

      if (closingError) {
        if (closingError.code === '23505') {
          return { data: null, error: new Error('Ya existe un cierre registrado para esta fecha.') };
        }
        return { data: null, error: new Error(closingError.message) };
      }

      // 2. Insert flavors
      if (formData.flavors && formData.flavors.length > 0) {
        const flavorsToInsert = formData.flavors
          .filter(f => f.flavor_id && f.quantity > 0)
          .map(f => ({
            closing_id: closing.id,
            flavor_id: f.flavor_id,
            quantity: Number(f.quantity),
          }));

        if (flavorsToInsert.length > 0) {
          const { error: flavorsError } = await supabase
            .from('daily_closing_flavors')
            .insert(flavorsToInsert);

          if (flavorsError) {
            console.error('Error inserting flavors:', flavorsError);
          }
        }
      }

      const completeClosing = await this.getDailyClosingById(closing.id);
      return { data: completeClosing || { ...closing, presentation_type: formData.presentation_type || 'cups' }, error: null };
    } catch (err: unknown) {
      return { data: null, error: err instanceof Error ? err : new Error('Error al guardar cierre') };
    }
  },

  async updateDailyClosing(id: string, formData: Partial<DailyClosingFormData>): Promise<{ error: Error | null }> {
    const totalExpenses = Number(formData.workers_salary ?? 0) + Number(formData.delivery_salary ?? 0) + Number(formData.other_expenses ?? 0);
    const balance = Number(formData.total_sales ?? 0) - totalExpenses;
    const remainingBalance = balance - Number(formData.delivered_to_frank ?? 0);

    let formattedNotes = formData.notes !== undefined ? (formData.notes || '').trim() : undefined;
    if (formData.presentation_type === 'tubs_4_5l' && formattedNotes !== undefined) {
      if (!formattedNotes.includes('[Tipo: Tinas 4.5L]')) {
        formattedNotes = formattedNotes ? `[Tipo: Tinas 4.5L] ${formattedNotes}` : '[Tipo: Tinas 4.5L]';
      }
    } else if (formData.presentation_type === 'cups' && formattedNotes !== undefined) {
      formattedNotes = formattedNotes.replace(/\[Tipo: Tinas 4\.5L\]\s*/g, '').trim();
    }

    try {
      const updatePayload: Record<string, unknown> = {
        total_cups: Number(formData.total_cups),
        total_sales: Number(formData.total_sales),
        workers_salary: Number(formData.workers_salary ?? 0),
        delivery_salary: Number(formData.delivery_salary ?? 0),
        other_expenses: Number(formData.other_expenses ?? 0),
        total_expenses: totalExpenses,
        delivered_to_frank: Number(formData.delivered_to_frank ?? 0),
        balance: balance,
        remaining_balance: remainingBalance,
        updated_at: new Date().toISOString(),
      };

      if (formattedNotes !== undefined) {
        updatePayload.notes = formattedNotes || null;
      }

      const { error: closingError } = await supabase
        .from('daily_closings')
        .update(updatePayload)
        .eq('id', id);

      if (closingError) {
        return { error: new Error(closingError.message) };
      }

      if (formData.flavors) {
        // Delete old flavors and reinsert
        await supabase.from('daily_closing_flavors').delete().eq('closing_id', id);

        const flavorsToInsert = formData.flavors
          .filter(f => f.flavor_id && f.quantity > 0)
          .map(f => ({
            closing_id: id,
            flavor_id: f.flavor_id,
            quantity: Number(f.quantity),
          }));

        if (flavorsToInsert.length > 0) {
          await supabase.from('daily_closing_flavors').insert(flavorsToInsert);
        }
      }

      return { error: null };
    } catch (err: unknown) {
      return { error: err instanceof Error ? err : new Error('Error al actualizar cierre') };
    }
  },

  async deleteDailyClosing(id: string): Promise<{ error: Error | null }> {
    const { error } = await supabase
      .from('daily_closings')
      .delete()
      .eq('id', id);

    return { error: error ? new Error(error.message) : null };
  },
};

