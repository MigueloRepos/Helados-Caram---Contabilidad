import { supabase } from '../lib/supabase';
import { AuditLog } from '../types';

export const auditService = {
  async getAuditLogs(limit = 50): Promise<AuditLog[]> {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching audit logs:', error);
      return [];
    }
    return data || [];
  },

  async logAction(action: 'INSERT' | 'UPDATE' | 'DELETE' | 'LOGIN', tableName: string, recordId?: string, oldData?: Record<string, unknown>, newData?: Record<string, unknown>) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('audit_logs').insert([{
        user_id: user?.id,
        action,
        table_name: tableName,
        record_id: recordId,
        old_data: oldData,
        new_data: newData,
      }]);
    } catch (e) {
      console.warn('Could not record audit log:', e);
    }
  },
};

