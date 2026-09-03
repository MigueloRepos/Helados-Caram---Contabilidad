import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { biometricService, EnrolledBiometricUser } from '../services/biometric.service';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  LogIn,
  UserPlus,
  Moon,
  Sun,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Fingerprint,
  Smartphone,
  ShieldCheck,
} from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const { signIn, signUp, isLoading, isRegistrationAllowed } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberBiometric, setRememberBiometric] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Biometric state
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const [enrolledUser, setEnrolledUser] = useState<EnrolledBiometricUser | null>(null);
  const [isBiometricScanning, setIsBiometricScanning] = useState(false);

  useEffect(() => {
    // If registration is not allowed and currently in signup mode, switch back to login
    if (!isRegistrationAllowed && isSignUp) {
      setIsSignUp(false);
    }
  }, [isRegistrationAllowed, isSignUp]);

  useEffect(() => {
    const checkBiometrics = async () => {
      const supported = await biometricService.isBiometricAvailable();
      setIsBiometricSupported(supported);
      const enrolled = biometricService.getEnrolledUser();
      setEnrolledUser(enrolled);
      if (enrolled?.email && !email) {
        setEmail(enrolled.email);
      }
    };
    checkBiometrics();
  }, []);

  const handleBiometricLogin = async () => {
    setErrorMsg(null);
    setSuccessNotice(null);
    setIsBiometricScanning(true);

    try {
      const res = await biometricService.authenticateWithBiometric();
      if (res.ok && res.credentials) {
        setSuccessNotice(`¡Huella verificada! Ingresando como ${res.credentials.userName || res.credentials.email}...`);
        const { error } = await signIn(res.credentials.email, res.credentials.password);
        if (!error) {
          setTimeout(() => {
            onLoginSuccess();
          }, 400);
        } else {
          setErrorMsg(error.message);
        }
      } else if (res.error) {
        setErrorMsg(res.error);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error durante la autenticación por huella.');
    } finally {
      setIsBiometricScanning(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessNotice(null);

    if (isSignUp) {
      if (!isRegistrationAllowed) {
        setErrorMsg('El registro de nuevos usuarios está deshabilitado. Solo los 2 usuarios autorizados tienen acceso a la plataforma.');
        return;
      }
      if (!fullName.trim()) {
        setErrorMsg('Por favor ingresa tu nombre completo.');
        return;
      }
      const { error } = await signUp(email, password, fullName, 'admin');
      if (!error) {
        // If user opted to enroll biometric
        if (rememberBiometric && isBiometricSupported) {
          try {
            await biometricService.enrollBiometric(email, password, fullName);
          } catch (bioErr) {
            console.warn('Biometric auto-enrollment skipped:', bioErr);
          }
        }
        setSuccessNotice('¡Cuenta registrada exitosamente!');
        setTimeout(() => {
          onLoginSuccess();
        }, 600);
      } else {
        setErrorMsg(error.message);
      }
    } else {
      const { error } = await signIn(email, password);
      if (!error) {
        // If remember biometric is checked and not enrolled, enroll it now
        if (rememberBiometric && isBiometricSupported) {
          try {
            await biometricService.enrollBiometric(email, password, fullName || email.split('@')[0]);
          } catch (bioErr) {
            console.warn('Biometric enrollment skipped:', bioErr);
          }
        }
        onLoginSuccess();
      } else {
        setErrorMsg(error.message);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-stone-100 to-stone-200 dark:from-stone-950 dark:via-stone-900 dark:to-stone-950 flex flex-col justify-between p-4 sm:p-6 transition-colors duration-200">
      {/* Top bar with theme toggle */}
      <div className="flex items-center justify-between max-w-5xl w-full mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-amber-600 flex items-center justify-center text-white shadow-md shadow-amber-600/20">
            <span className="text-lg">🍦</span>
          </div>
          <div>
            <h1 className="font-display font-extrabold text-sm tracking-tight text-stone-900 dark:text-white">
              HELADOS CARAM
            </h1>
            <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400">
              Contabilidad Empresarial & Cierres
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors shadow-xs"
            title={`Cambiar a modo ${theme === 'light' ? 'oscuro' : 'claro'}`}
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Login Card */}
      <div className="max-w-md w-full mx-auto my-6 space-y-4">
        <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/80 dark:border-stone-800 p-6 sm:p-8 shadow-2xl space-y-5">
          <div className="text-center space-y-1">
            <div className="inline-flex p-3 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 mb-1">
              <span className="text-2xl">🍦</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-display text-stone-900 dark:text-white">
              {isSignUp ? 'Crear Cuenta de Usuario' : 'Acceso al Sistema'}
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              {isSignUp
                ? 'Registra tus datos de acceso al sistema contable'
                : 'Ingresa con tus credenciales o huella dactilar'}
            </p>
          </div>

          {/* Access Policy Protection Banner when registration is blocked */}
          {!isRegistrationAllowed ? (
            <div className="p-3 rounded-2xl bg-amber-500/10 dark:bg-amber-950/40 border border-amber-300/80 dark:border-amber-800/80 flex items-center gap-2.5 text-xs text-stone-700 dark:text-stone-300">
              <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <div className="leading-tight">
                <span className="font-bold text-stone-900 dark:text-white block">
                  Acceso Restringido
                </span>
                <span className="text-[11px] text-stone-500 dark:text-stone-400">
                  Plataforma privada con registro deshabilitado.
                </span>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-2xl bg-emerald-500/10 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 flex items-center gap-2.5 text-xs text-emerald-800 dark:text-emerald-300">
              <AlertCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="text-[11px]">
                Modo de registro de usuarios habilitado temporalmente.
              </span>
            </div>
          )}

          {/* Quick Fingerprint Login CTA if enrolled on this device */}
          {!isSignUp && enrolledUser && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-600/10 to-emerald-500/10 border border-amber-300/80 dark:border-amber-700/80 space-y-2.5 text-center">
              <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-stone-800 dark:text-stone-200">
                <Smartphone className="w-3.5 h-3.5 text-amber-600" />
                <span>Huella vinculada para <strong>{enrolledUser.userName || enrolledUser.email}</strong></span>
              </div>

              <button
                type="button"
                onClick={handleBiometricLogin}
                disabled={isBiometricScanning || isLoading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold text-xs shadow-md shadow-amber-600/30 flex items-center justify-center gap-2.5 transition-all active:scale-98 disabled:opacity-50"
              >
                <Fingerprint className={`w-5 h-5 text-amber-200 ${isBiometricScanning ? 'animate-pulse' : ''}`} />
                <span>{isBiometricScanning ? 'Verificando huella...' : 'Acceder con Huella Dactilar'}</span>
              </button>

              <p className="text-[10px] text-stone-500 dark:text-stone-400">
                Toca el botón y coloca tu dedo en el sensor de tu dispositivo móvil
              </p>
            </div>
          )}

          {/* Segmented Control for Login vs SignUp ONLY if registration is explicitly allowed */}
          {isRegistrationAllowed && (
            <div className="grid grid-cols-2 p-1 rounded-2xl bg-stone-100 dark:bg-stone-800 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(false);
                  setErrorMsg(null);
                  setSuccessNotice(null);
                }}
                className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  !isSignUp
                    ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-xs font-bold'
                    : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                Iniciar Sesión
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(true);
                  setErrorMsg(null);
                  setSuccessNotice(null);
                }}
                className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  isSignUp
                    ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-xs font-bold'
                    : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                Crear Cuenta
              </button>
            </div>
          )}

          {/* Success Notice */}
          {successNotice && (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{successNotice}</span>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 space-y-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{errorMsg}</span>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && isRegistrationAllowed && (
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Administrador Helados Caram"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="usuario@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  placeholder="•••••••• (mínimo 6 caracteres)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2.5 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1 text-stone-400 hover:text-stone-600 absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Biometric Opt-in Checkbox */}
            {isBiometricSupported && (
              <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700/80">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-stone-700 dark:text-stone-300">
                  <input
                    type="checkbox"
                    checked={rememberBiometric}
                    onChange={(e) => setRememberBiometric(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 focus:ring-offset-0"
                  />
                  <span className="flex items-center gap-1.5">
                    <Fingerprint className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>Habilitar inicio con <strong>Huella Dactilar</strong> en este móvil</span>
                  </span>
                </label>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md shadow-amber-600/30 transition-all active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSignUp ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
              {isLoading
                ? 'Procesando...'
                : isSignUp
                ? 'Registrar y Acceder'
                : 'Iniciar Sesión'}
            </button>
          </form>
        </div>
      </div>

      {/* Footer info */}
      <div className="text-center text-xs text-stone-400 dark:text-stone-500">
        © 2026 Helados Caram • Sistema de Contabilidad & Cierres Diarios
      </div>
    </div>
  );
};
