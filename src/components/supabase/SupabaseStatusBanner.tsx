import React, { useState } from 'react';
import { Database, Key, CheckCircle, AlertCircle, Copy, Check, ExternalLink } from 'lucide-react';
import { isSupabaseConfigured, activeSupabaseUrl, setCustomSupabaseCredentials } from '../../lib/supabase';
import { Modal } from '../ui/Modal';
import { SqlScriptModal } from './SqlScriptModal';

export const SupabaseStatusBanner: React.FC = () => {
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [urlInput, setUrlInput] = useState(activeSupabaseUrl || '');
  const [keyInput, setKeyInput] = useState('');

  const handleSaveCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    setCustomSupabaseCredentials(urlInput, keyInput);
  };

  const handleResetToEnv = () => {
    setCustomSupabaseCredentials('', '');
  };

  return (
    <>
      <div className="bg-amber-100/60 dark:bg-amber-950/40 border-b border-amber-200/60 dark:border-amber-900/50 px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {isSupabaseConfigured ? (
            <span className="flex items-center gap-1.5 font-medium text-emerald-800 dark:text-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Supabase Conectado en Vivo ({activeSupabaseUrl.replace('https://', '').split('.')[0]})
            </span>
          ) : (
            <span className="flex items-center gap-1.5 font-medium text-amber-800 dark:text-amber-300">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Modo Local / Demo activo (Sin credenciales en .env)
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSqlModal(true)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-900 text-white dark:bg-stone-800 hover:bg-stone-800 dark:hover:bg-stone-700 transition-colors font-medium text-[11px]"
          >
            <Database className="w-3 h-3 text-amber-400" />
            Ver SQL para Supabase
          </button>

          <button
            onClick={() => setShowConfigModal(true)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-200/70 dark:bg-amber-900/60 hover:bg-amber-300 dark:hover:bg-amber-800 text-amber-900 dark:text-amber-200 transition-colors font-medium text-[11px]"
          >
            <Key className="w-3 h-3" />
            {isSupabaseConfigured ? 'Ajustes Supabase' : 'Conectar mi Supabase'}
          </button>
        </div>
      </div>

      {/* Credential Config Modal */}
      <Modal
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        title="Conexión con Supabase"
        description="Configura tu URL y anon key de Supabase para almacenar todos los datos reales con RLS."
        maxWidth="md"
      >
        <form onSubmit={handleSaveCredentials} className="space-y-4">
          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-xs text-amber-900 dark:text-amber-200 space-y-2">
            <p className="font-semibold flex items-center gap-1.5">
              <Database className="w-4 h-4 text-amber-600" />
              ¿Cómo obtener tus credenciales?
            </p>
            <ol className="list-decimal list-inside space-y-1 text-stone-600 dark:text-stone-300">
              <li>Ingresa a tu proyecto en <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="underline font-medium text-amber-700 dark:text-amber-400 inline-flex items-center gap-0.5">supabase.com <ExternalLink className="w-2.5 h-2.5" /></a></li>
              <li>Ve a <strong>Project Settings → API</strong></li>
              <li>Copia la <strong>Project URL</strong> y el <strong>anon / public Key</strong></li>
              <li>Asegúrate de haber ejecutado el SQL schema en el <strong>SQL Editor</strong></li>
            </ol>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
              Project URL (VITE_SUPABASE_URL)
            </label>
            <input
              type="url"
              required
              placeholder="https://xyzcompany.supabase.co"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
              Anon / Public Key (VITE_SUPABASE_ANON_KEY)
            </label>
            <input
              type="password"
              required
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
            />
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-stone-100 dark:border-stone-800">
            <button
              type="button"
              onClick={handleResetToEnv}
              className="text-xs text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 underline"
            >
              Restablecer valores
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="px-3.5 py-1.5 text-xs font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs"
              >
                Guardar y Conectar
              </button>
            </div>
          </div>
        </form>
      </Modal>

      <SqlScriptModal isOpen={showSqlModal} onClose={() => setShowSqlModal(false)} />
    </>
  );
};
