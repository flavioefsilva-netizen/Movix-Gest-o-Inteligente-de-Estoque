'use client';

import { useState, useEffect } from 'react';
import { useApp } from '../lib/AppContext';
import { initializeDynamicSupabase } from '../lib/supabase';

export default function ConfigSupabaseModal() {
  const { isSupabaseModalOpen, setIsSupabaseModalOpen, retryDbConnection, dbStatus, dbErrorMessage } = useApp();
  const [url, setUrl] = useState('');
  const [key, setKey] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Load current keys on mount or when modal opens
  useEffect(() => {
    if (isSupabaseModalOpen && typeof window !== 'undefined') {
      const savedUrl = localStorage.getItem('movix_supabase_url') || '';
      const savedKey = localStorage.getItem('movix_supabase_anon_key') || '';
      setUrl(savedUrl);
      setKey(savedKey);
      setTestResult(null);
    }
  }, [isSupabaseModalOpen]);

  if (!isSupabaseModalOpen) return null;

  const handleTestAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || !key.trim()) {
      setTestResult({
        success: false,
        message: 'Por favor, preencha ambos os campos: URL e Chave Anon.',
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      // 1. Try to initialize client
      const testClient = initializeDynamicSupabase(url.trim(), key.trim());
      if (!testClient) {
        throw new Error('Falha ao instanciar o cliente Supabase. Verifique o formato da URL.');
      }

      // 2. Perform a test query on "products" to verify connection and existence of tables
      const { error } = await testClient.from('products').select('id').limit(1);
      
      if (error) {
        // If the error is about tables missing, the connection is correct but database needs schema
        if (error.code === '42P01' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
          setTestResult({
            success: true,
            message: 'Conectado com sucesso! ✔ No entanto, as tabelas não foram encontradas no seu Supabase. Certifique-se de executar o script "supabase_schema.sql" no editor SQL do seu painel do Supabase.',
          });
          // Save anyway since credentials are correct
          localStorage.setItem('movix_supabase_url', url.trim());
          localStorage.setItem('movix_supabase_anon_key', key.trim());
          if (retryDbConnection) await retryDbConnection();
          return;
        }
        throw error;
      }

      // Success
      setTestResult({
        success: true,
        message: 'Conexão em tempo real estabelecida com sucesso! O aplicativo agora está integrado à nuvem. ✔',
      });

      // Save to localStorage
      localStorage.setItem('movix_supabase_url', url.trim());
      localStorage.setItem('movix_supabase_anon_key', key.trim());

      // Trigger reconnect in app
      if (retryDbConnection) {
        await retryDbConnection();
      }

      // Close modal after a short delay
      setTimeout(() => {
        setIsSupabaseModalOpen(false);
      }, 1500);

    } catch (err: any) {
      console.error('[Supabase Config] Erro de teste:', err);
      setTestResult({
        success: false,
        message: `Falha na conexão: ${err?.message || 'Verifique se a URL e a chave estão corretas e se você tem acesso à internet.'}`,
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleClearConfig = () => {
    if (confirm('Tem certeza que deseja desconectar da nuvem e voltar ao modo Offline (Local)? Seus dados salvos localmente continuarão no seu navegador, mas não serão sincronizados com outros usuários.')) {
      localStorage.removeItem('movix_supabase_url');
      localStorage.removeItem('movix_supabase_anon_key');
      setUrl('');
      setKey('');
      setTestResult(null);
      
      // Force reload page to clear supabase bindings and re-initialize in fallback mode
      window.location.reload();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative border border-slate-100 flex flex-col gap-4 text-left">
        {/* Close button */}
        <button
          type="button"
          onClick={() => setIsSupabaseModalOpen(false)}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50 transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px] font-bold">close</span>
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="p-2.5 bg-blue-50 border border-blue-100 text-blue-600 rounded-xl">
            <span className="material-symbols-outlined text-[28px]">cloud_sync</span>
          </div>
          <div>
            <h3 className="text-base font-black text-slate-800 uppercase tracking-tight">
              Configurar Conexão em Nuvem
            </h3>
            <p className="text-xs text-slate-500 font-bold">
              Supabase Real-Time Database Integration
            </p>
          </div>
        </div>

        {/* Intro */}
        <div className="text-xs text-slate-600 leading-relaxed space-y-2">
          <p>
            Para que as informações (movimentações, cargas, clientes, etc.) de todos os computadores e entregadores fiquem sincronizadas <strong>instantaneamente</strong>, a aplicação precisa se conectar à sua conta do <strong className="text-slate-800">Supabase</strong>.
          </p>
          <p>
            Insira abaixo os dados de acesso públicos da sua API do Supabase. Estes dados ficam guardados de forma segura localmente no seu navegador e conectam você à sua nuvem privada.
          </p>
        </div>

        {/* Config Form */}
        <form onSubmit={handleTestAndSave} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
              Project URL (Endereço do Banco)
            </label>
            <input
              type="url"
              required
              placeholder="Ex: https://abcdefghijklm.supabase.co"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-slate-50/50 outline-hidden font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
              API Anon Key (Chave Pública Anon)
            </label>
            <textarea
              required
              rows={3}
              placeholder="Ex: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmY2..."
              value={key}
              onChange={(e) => setKey(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-slate-50/50 outline-hidden font-mono resize-none leading-relaxed"
            />
          </div>

          {/* Test & Result Alerts */}
          {testResult && (
            <div className={`p-3.5 rounded-xl text-xs font-bold leading-relaxed border ${
              testResult.success 
                ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
                : 'bg-rose-50 border-rose-100 text-rose-800'
            }`}>
              {testResult.message}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-slate-100 mt-4">
            <button
              type="submit"
              disabled={isTesting}
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-black text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
            >
              <span className="material-symbols-outlined text-[16px]">
                {isTesting ? 'progress_activity' : 'save'}
              </span>
              <span>{isTesting ? 'Testando Conexão...' : 'Testar e Conectar'}</span>
            </button>

            {typeof window !== 'undefined' && localStorage.getItem('movix_supabase_url') && (
              <button
                type="button"
                onClick={handleClearConfig}
                className="py-2.5 px-4 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-slate-200"
                title="Desconectar da Nuvem"
              >
                <span className="material-symbols-outlined text-[16px]">cloud_off</span>
                <span>Desconectar</span>
              </button>
            )}
          </div>
        </form>

        {/* Tutorial Details */}
        <div className="bg-slate-50 border border-slate-150 rounded-xl p-4 text-[10px] text-slate-500 leading-normal space-y-1.5 mt-1">
          <strong className="font-black text-slate-700 uppercase tracking-wide block">
            Como encontrar estas informações no Supabase:
          </strong>
          <ol className="list-decimal list-inside space-y-1">
            <li>Acesse seu painel em <strong className="font-bold text-slate-600">supabase.com</strong> e abra seu projeto.</li>
            <li>No menu lateral esquerdo, clique no ícone de engrenagem <strong className="font-bold text-slate-600">Project Settings</strong>.</li>
            <li>Clique na aba <strong className="font-bold text-slate-600">API</strong>.</li>
            <li>No topo, copie o <strong className="font-bold text-slate-600">Project URL</strong> e cole no primeiro campo acima.</li>
            <li>Abaixo, copie a chave rotulada como <strong className="font-bold text-slate-600">anon public</strong> (começa com <code className="bg-white px-1 rounded font-bold border font-mono">eyJ...</code>) e cole no segundo campo.</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
