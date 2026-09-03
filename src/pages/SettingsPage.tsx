import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { storageService } from '../services/storage.service';
import { biometricService, EnrolledBiometricUser } from '../services/biometric.service';
import { isSupabaseConfigured, activeSupabaseUrl, setCustomSupabaseCredentials } from '../lib/supabase';
import { SqlScriptModal } from '../components/supabase/SqlScriptModal';
import { Badge } from '../components/ui/Badge';
import {
  Settings,
  User,
  ShieldCheck,
  Database,
  Moon,
  Sun,
  Upload,
  Camera,
  CheckCircle,
  FileCode,
  Key,
  ShieldAlert,
  Server,
  Layers,
  Fingerprint,
  Smartphone,
  Trash2,
  Lock,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { profile, isAdmin, updateProfile } = useAuth();
  const { theme, toggleTheme, addToast } = useTheme();

  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSqlModal, setShowSqlModal] = useState(false);

  // Supabase Config
  const [urlInput, setUrlInput] = useState(activeSupabaseUrl || '');
  const [keyInput, setKeyInput] = useState('');

  // Biometric / Fingerprint State
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const [enrolledBioUser, setEnrolledBioUser] = useState<EnrolledBiometricUser | null>(null);
  const [bioPasswordInput, setBioPasswordInput] = useState('');
  const [isEnrollingBio, setIsEnrollingBio] = useState(false);
  const [showBioPasswordModal, setShowBioPasswordModal] = useState(false);
  const [isTestingBio, setIsTestingBio] = useState(false);

  useEffect(() => {
    const checkBio = async () => {
      const supported = await biometricService.isBiometricAvailable();
      setIsBiometricSupported(supported);
      setEnrolledBioUser(biometricService.getEnrolledUser());
    };
    checkBio();
  }, []);

  const handleEnrollBiometric = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.email) return;
    if (!bioPasswordInput) {
      addToast({
        type: 'warning',
        title: 'Contraseña requerida',
        message: 'Ingresa tu contraseña para vincularla a la huella dactilar de este dispositivo.',
      });
      return;
    }

    try {
      setIsEnrollingBio(true);
      const res = await biometricService.enrollBiometric(
        profile.email,
        bioPasswordInput,
        profile.full_name || profile.email.split('@')[0]
      );

      if (res.ok) {
        setEnrolledBioUser(biometricService.getEnrolledUser());
        setShowBioPasswordModal(false);
        setBioPasswordInput('');
        addToast({
          type: 'success',
          title: 'Huella Dactilar Vinculada',
          message: 'Ahora puedes iniciar sesión tocando tu sensor de huella móvil.',
        });
      } else {
        addToast({
          type: 'error',
          title: 'Error al vincular huella',
          message: res.error || 'No se pudo completar el registro biométrico.',
        });
      }
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Error',
        message: err?.message || 'Fallo inesperado al vincular huella.',
      });
    } finally {
      setIsEnrollingBio(false);
    }
  };

  const handleTestBiometric = async () => {
    try {
      setIsTestingBio(true);
      const res = await biometricService.authenticateWithBiometric();
      if (res.ok && res.credentials) {
        addToast({
          type: 'success',
          title: '¡Huella Verificada!',
          message: `Lectura exitosa para el usuario: ${res.credentials.userName || res.credentials.email}`,
        });
      } else {
        addToast({
          type: 'warning',
          title: 'Lectura no completada',
          message: res.error || 'No se pudo verificar la huella.',
        });
      }
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Error biométrico',
        message: err?.message || 'Error durante la lectura de huella.',
      });
    } finally {
      setIsTestingBio(false);
    }
  };

  const handleRemoveBiometric = () => {
    biometricService.removeBiometric();
    setEnrolledBioUser(null);
    addToast({
      type: 'info',
      title: 'Huella desvinculada',
      message: 'Se ha desactivado el acceso por huella dactilar en este dispositivo.',
    });
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const { error } = await updateProfile({
      full_name: fullName.trim(),
      avatar_url: avatarUrl.trim(),
    });
    setIsSaving(false);
    if (!error) {
      addToast({
        type: 'success',
        title: 'Perfil actualizado',
        message: 'Tus datos de usuario se han guardado correctamente.',
      });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    setIsUploading(true);
    const { url: publicUrl, error } = await storageService.uploadAvatar(profile.id, file);
    setIsUploading(false);

    if (publicUrl) {
      setAvatarUrl(publicUrl);
      await updateProfile({ avatar_url: publicUrl });
      addToast({
        type: 'success',
        title: 'Foto actualizada',
        message: 'Tu foto de perfil ha sido subida a Supabase Storage.',
      });
    } else if (error) {
      addToast({
        type: 'error',
        title: 'Error al subir imagen',
        message: error.message,
      });
    }
  };

  const handleSaveCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    setCustomSupabaseCredentials(urlInput, keyInput);
    addToast({
      type: 'success',
      title: 'Credenciales guardadas',
      message: 'Se han configurado las credenciales de Supabase.',
    });
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          <h2 className="text-xl font-bold font-display text-stone-900 dark:text-white">
            Ajustes del Sistema & Perfil
          </h2>
        </div>
        <p className="text-xs text-stone-500 dark:text-stone-400">
          Administración de cuenta, permisos, conexión a Supabase y preferencias
        </p>
      </div>

      {/* 1. Profile Settings */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-stone-800 p-6 shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-stone-100 dark:border-stone-800">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-amber-600" />
            <h3 className="text-sm font-bold text-stone-900 dark:text-white uppercase tracking-wider">
              Mi Perfil de Usuario
            </h3>
          </div>
          <Badge variant={isAdmin ? 'amber' : 'blue'}>
            {isAdmin ? 'ADMINISTRADOR' : 'FRANK'}
          </Badge>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-5">
          {/* Avatar selector */}
          <div className="flex flex-col sm:flex-row items-center gap-5">
            <div className="relative group">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={fullName}
                  referrerPolicy="no-referrer"
                  className="w-20 h-20 rounded-full object-cover border-2 border-amber-500 shadow-md"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 flex items-center justify-center font-bold text-2xl border-2 border-amber-400 shadow-md">
                  {fullName.charAt(0) || 'U'}
                </div>
              )}

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="absolute bottom-0 right-0 p-2 rounded-full bg-amber-600 text-white shadow-md hover:bg-amber-700 transition-transform active:scale-95 disabled:opacity-50"
                title="Subir foto a Supabase Storage"
              >
                <Camera className="w-4 h-4" />
              </button>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                className="hidden"
              />
            </div>

            <div className="text-center sm:text-left space-y-1">
              <h4 className="text-sm font-bold text-stone-900 dark:text-white">
                Foto de Perfil
              </h4>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Formatos permitidos: JPG, PNG, WEBP. Se almacena en el bucket <strong>avatars</strong> de Supabase.
              </p>
              {isUploading && (
                <span className="text-xs text-amber-600 font-medium animate-pulse">
                  Subiendo archivo a Supabase Storage...
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Nombre Completo *
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                URL de Avatar (Opcional)
              </label>
              <input
                type="url"
                placeholder="https://..."
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition-all active:scale-98 disabled:opacity-50"
            >
              {isSaving ? 'Guardando...' : 'Guardar Perfil'}
            </button>
          </div>
        </form>
      </div>

      {/* 2. Supabase Integration & Database Controls */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-stone-800 p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between pb-4 border-b border-stone-100 dark:border-stone-800">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-amber-600" />
            <h3 className="text-sm font-bold text-stone-900 dark:text-white uppercase tracking-wider">
              Conexión Supabase (PostgreSQL + RLS + Storage)
            </h3>
          </div>
          <button
            onClick={() => setShowSqlModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-900 dark:bg-stone-800 hover:bg-stone-800 text-white text-xs font-semibold transition-colors"
          >
            <FileCode className="w-3.5 h-3.5 text-amber-400" />
            Ver Script SQL Completo
          </button>
        </div>

        <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-stone-700 dark:text-stone-300">
              Estado de la Conexión:
            </span>
            {isSupabaseConfigured ? (
              <span className="text-emerald-600 font-bold flex items-center gap-1">
                <CheckCircle className="w-4 h-4" /> Conectado en Vivo ({activeSupabaseUrl})
              </span>
            ) : (
              <span className="text-amber-600 font-bold flex items-center gap-1">
                Modo Local Activo (Fallback con datos en memoria/localStorage)
              </span>
            )}
          </div>
          <p className="text-stone-500 dark:text-stone-400 leading-relaxed">
            Para almacenar y consultar datos en tu propia base de datos PostgreSQL en la nube, ingresa tu Project URL y Anon Key a continuación:
          </p>
        </div>

        <form onSubmit={handleSaveCredentials} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                VITE_SUPABASE_URL
              </label>
              <input
                type="url"
                required
                placeholder="https://xyzcompany.supabase.co"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                VITE_SUPABASE_ANON_KEY (Clave Pública "anon", ej: eyJhbGciOi...)
              </label>
              <input
                type="text"
                required
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none font-mono text-[11px]"
              />
              {keyInput.startsWith('sb_secret_') && (
                <p className="mt-1 text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                  ⚠️ Has ingresado una clave secreta (sb_secret_...). Debes usar la clave <strong>anon public</strong> (eyJ...) de Supabase Dashboard &gt; Project Settings &gt; API.
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition-all active:scale-98"
            >
              Guardar y Conectar Supabase
            </button>
          </div>
        </form>
      </div>

      {/* 3. Mobile Fingerprint / Biometric Authentication */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-stone-800 p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between pb-4 border-b border-stone-100 dark:border-stone-800">
          <div className="flex items-center gap-2">
            <Fingerprint className="w-4 h-4 text-amber-600" />
            <h3 className="text-sm font-bold text-stone-900 dark:text-white uppercase tracking-wider">
              Acceso con Huella Dactilar (Dispositivo Móvil / Biometría)
            </h3>
          </div>
          <Badge variant={enrolledBioUser ? 'emerald' : 'stone'}>
            {enrolledBioUser ? 'HUELLA ACTIVA' : 'NO VINCULADA'}
          </Badge>
        </div>

        <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700 text-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-stone-700 dark:text-stone-300">
              Sensor Biométrico en este Dispositivo:
            </span>
            {isBiometricSupported ? (
              <span className="text-emerald-600 font-bold flex items-center gap-1">
                <CheckCircle className="w-4 h-4" /> Disponible y Compatible (WebAuthn Platform)
              </span>
            ) : (
              <span className="text-stone-500 font-medium">
                No detectado o no disponible en este navegador
              </span>
            )}
          </div>

          <p className="text-stone-500 dark:text-stone-400 leading-relaxed">
            Permite iniciar sesión instantáneamente con tu huella dactilar, Touch ID o sensor biométrico integrado en tu smartphone o tablet sin tener que escribir tu contraseña cada vez.
          </p>
        </div>

        {enrolledBioUser ? (
          <div className="p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-950/30 border border-amber-300/80 dark:border-amber-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-amber-600" />
                <span className="text-xs font-bold text-stone-900 dark:text-white">
                  Huella registrada para {enrolledBioUser.userName} ({enrolledBioUser.email})
                </span>
              </div>
              <span className="text-[11px] text-stone-500 dark:text-stone-400 block">
                Dispositivo: {enrolledBioUser.deviceName || 'Móvil'} • Registrado el: {new Date(enrolledBioUser.registeredAt).toLocaleDateString()}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleTestBiometric}
                disabled={isTestingBio}
                className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                <Fingerprint className="w-4 h-4" />
                {isTestingBio ? 'Probando...' : 'Probar Huella'}
              </button>

              <button
                type="button"
                onClick={handleRemoveBiometric}
                className="px-3 py-2 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-700 dark:text-rose-300 text-xs font-semibold transition-colors flex items-center gap-1"
                title="Desvincular huella de este dispositivo"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Desvincular
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {showBioPasswordModal ? (
              <form onSubmit={handleEnrollBiometric} className="p-4 rounded-2xl bg-amber-50/60 dark:bg-stone-800 border border-amber-200 dark:border-stone-700 space-y-3">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-600" />
                  <span className="text-xs font-bold text-stone-900 dark:text-white">
                    Confirma tu contraseña para vincular el sensor de huella:
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="password"
                    required
                    placeholder="Tu contraseña actual..."
                    value={bioPasswordInput}
                    onChange={(e) => setBioPasswordInput(e.target.value)}
                    className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={isEnrollingBio || !bioPasswordInput}
                      className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <Fingerprint className="w-4 h-4" />
                      {isEnrollingBio ? 'Escaneando sensor...' : 'Escanear y Guardar Huella'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowBioPasswordModal(false)}
                      className="px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-semibold text-stone-600 dark:text-stone-300"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setShowBioPasswordModal(true)}
                disabled={!isBiometricSupported}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white text-xs font-bold shadow-md shadow-amber-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Fingerprint className="w-4 h-4 text-amber-200" />
                Vincular Huella Dactilar en este Dispositivo
              </button>
            )}
          </div>
        )}
      </div>

      {/* 4. Theme & Interface Preferences */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-stone-800 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-4 border-b border-stone-100 dark:border-stone-800">
          <Moon className="w-4 h-4 text-amber-600" />
          <h3 className="text-sm font-bold text-stone-900 dark:text-white uppercase tracking-wider">
            Tema Visual
          </h3>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-stone-800 dark:text-stone-200 block">
              Modo Oscuro / Modo Claro
            </span>
            <span className="text-[11px] text-stone-500 dark:text-stone-400">
              Tema actual: <strong>{theme === 'dark' ? 'Oscuro' : 'Claro'}</strong>
            </span>
          </div>

          <button
            onClick={toggleTheme}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-semibold text-stone-800 dark:text-stone-200 shadow-xs"
          >
            {theme === 'light' ? (
              <>
                <Moon className="w-4 h-4 text-amber-600" />
                <span>Activar Modo Oscuro</span>
              </>
            ) : (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span>Activar Modo Claro</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* SQL Script Modal */}
      <SqlScriptModal isOpen={showSqlModal} onClose={() => setShowSqlModal(false)} />
    </div>
  );
};
