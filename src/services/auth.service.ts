import { supabase, activeSupabaseUrl } from '../lib/supabase';
import { UserProfile, UserRole } from '../types';

export function formatAuthError(error: any): Error {
  if (!error) return new Error('Error desconocido');
  const msg = typeof error === 'string' ? error : error.message || '';

  if (msg.toLowerCase().includes('invalid api key') || msg.toLowerCase().includes('apikey')) {
    return new Error(
      'Clave API de Supabase inválida. Asegúrate de copiar la clave "anon public" (formato JWT que empieza con "eyJ...") desde Supabase > Project Settings > API.'
    );
  }
  if (msg.toLowerCase().includes('invalid login credentials')) {
    return new Error(
      'Credenciales incorrectas o usuario no registrado en Supabase. Si es tu primera vez, haz clic en "Crear Cuenta" para registrar este usuario y contraseña.'
    );
  }
  if (msg.toLowerCase().includes('email not confirmed')) {
    return new Error(
      'El correo no ha sido confirmado aún. Revisa tu bandeja de entrada o desactiva "Confirm email" en Supabase > Authentication > Providers > Email.'
    );
  }
  if (msg.toLowerCase().includes('user already registered')) {
    return new Error('Ya existe una cuenta con este correo electrónico. Cambia a "Iniciar Sesión" e ingresa tu contraseña.');
  }
  if (msg.toLowerCase().includes('password should be at least')) {
    return new Error('La contraseña debe tener al menos 6 caracteres.');
  }
  if (msg.toLowerCase().includes('failed to fetch') || msg.toLowerCase().includes('networkerror')) {
    return new Error(
      `No se pudo conectar con el servidor de Supabase (${activeSupabaseUrl}). Verifica tu conexión a internet o la URL del proyecto.`
    );
  }

  return new Error(msg);
}

export const authService = {
  async testConnection(): Promise<{ ok: boolean; message: string }> {
    try {
      const { error } = await supabase.auth.getSession();
      if (error) {
        const formatted = formatAuthError(error);
        return { ok: false, message: formatted.message };
      }
      return { ok: true, message: 'Conexión exitosa con Supabase' };
    } catch (err: any) {
      const formatted = formatAuthError(err);
      return { ok: false, message: formatted.message };
    }
  },

  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    return { session: data?.session, error: error ? formatAuthError(error) : null };
  },

  async getCurrentProfile(): Promise<{ profile: UserProfile | null; error: Error | null }> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        return { profile: null, error: userError ? formatAuthError(userError) : null };
      }

      // Query profiles table safely with maybeSingle()
      let profileData: any = null;
      try {
        const { data, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (!profileError && data) {
          profileData = data;
        }
      } catch {
        // Table might not exist yet
      }

      if (!profileData) {
        // Build resilient fallback profile
        const fallbackProfile: UserProfile = {
          id: user.id,
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Administrador',
          avatar_url: user.user_metadata?.avatar_url || null,
          role: (user.user_metadata?.role as UserRole) || 'admin',
          created_at: user.created_at,
          updated_at: user.updated_at || user.created_at,
          email: user.email,
        };

        // Attempt to upsert profile record silently
        try {
          await supabase.from('profiles').upsert({
            id: user.id,
            full_name: fallbackProfile.full_name,
            avatar_url: fallbackProfile.avatar_url,
            role: fallbackProfile.role,
          });
        } catch {
          // Ignore if table not created
        }

        return { profile: fallbackProfile, error: null };
      }

      return {
        profile: {
          ...profileData,
          email: user.email,
        },
        error: null,
      };
    } catch (err: unknown) {
      return { profile: null, error: err instanceof Error ? formatAuthError(err) : new Error('Error al obtener perfil') };
    }
  },

  async signIn(email: string, password: string): Promise<{ profile: UserProfile | null; error: Error | null }> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        return { profile: null, error: formatAuthError(error) };
      }

      if (data.user) {
        const { profile } = await this.getCurrentProfile();
        return { profile, error: null };
      }

      return { profile: null, error: new Error('Usuario no encontrado') };
    } catch (err: unknown) {
      return { profile: null, error: formatAuthError(err) };
    }
  },

  async signOut(): Promise<{ error: Error | null }> {
    const { error } = await supabase.auth.signOut();
    return { error: error ? formatAuthError(error) : null };
  },

  async signUp(
    email: string,
    password: string,
    fullName: string,
    role: UserRole = 'admin'
  ): Promise<{ user: any | null; session: any | null; error: Error | null }> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            role: role,
          },
        },
      });

      if (error) {
        return { user: null, session: null, error: formatAuthError(error) };
      }

      return { user: data.user, session: data.session, error: null };
    } catch (err: unknown) {
      return { user: null, session: null, error: formatAuthError(err) };
    }
  },

  async updatePassword(newPassword: string): Promise<{ error: Error | null }> {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    return { error: error ? formatAuthError(error) : null };
  },

  async updateProfile(userId: string, updates: { full_name?: string; avatar_url?: string; role?: UserRole }): Promise<{ error: Error | null }> {
    const { error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    return { error: error ? formatAuthError(error) : null };
  },

  async resetPasswordForEmail(email: string): Promise<{ error: Error | null }> {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/ajustes`,
    });
    return { error: error ? formatAuthError(error) : null };
  },
};

