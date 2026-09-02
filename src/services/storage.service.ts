import { supabase } from '../lib/supabase';

export const storageService = {
  async uploadAvatar(userId: string, file: File): Promise<{ url: string | null; error: Error | null }> {
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${userId}/profile_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          upsert: true,
          cacheControl: '3600',
        });

      if (uploadError) {
        return { url: null, error: new Error(uploadError.message) };
      }

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      return { url: data.publicUrl, error: null };
    } catch (err: unknown) {
      return { url: null, error: err instanceof Error ? err : new Error('Error al subir archivo') };
    }
  },

  async deleteAvatar(filePath: string): Promise<{ error: Error | null }> {
    const { error } = await supabase.storage.from('avatars').remove([filePath]);
    return { error: error ? new Error(error.message) : null };
  },
};

