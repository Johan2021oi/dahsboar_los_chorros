import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { LogIn, Mail, Lock, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const emailRef = useRef<HTMLInputElement>(null);

  // Autofoco inteligente al cargar
  useEffect(() => {
    if (emailRef.current) emailRef.current.focus();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message === 'Invalid login credentials' ? 'Credenciales incorrectas' : 'Ocurrió un error al iniciar sesión');
      setLoading(false);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/30 flex items-center justify-center p-6 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px]">
      <div className="w-full max-w-[440px] animate-in fade-in zoom-in-95 duration-700">
        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.06)] p-10 lg:p-14 relative overflow-hidden">
          
          {/* Subtle Accent Line */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-farm/5" />

          {/* Icon Container - Premium Circle */}
          <div className="w-20 h-20 bg-gray-900 rounded-[2rem] flex items-center justify-center mb-10 shadow-2xl shadow-gray-900/20 mx-auto transform transition-transform hover:scale-105 duration-500">
            <LogIn className="text-farm w-10 h-10" />
          </div>

          <div className="text-center mb-12">
            <h1 className="text-[38px] font-black text-gray-900 tracking-[-0.04em] uppercase leading-none mb-4">
              Bienvenido
            </h1>
            <p className="text-[13px] font-bold text-gray-400 uppercase tracking-widest leading-none">
              Inicia sesión para gestionar tu negocio
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="bg-red-50/50 text-red-500 p-4 rounded-2xl flex items-center gap-3 text-sm font-black border border-red-100/50 animate-in shake duration-500 shadow-sm">
                <AlertCircle size={18} className="shrink-0" />
                <span className="tracking-tight">{error}</span>
              </div>
            )}

            <div className="space-y-2 group">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2 block transition-colors group-focus-within:text-farm">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-farm transition-all duration-300" size={18} />
                <input
                  ref={emailRef}
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError(null);
                  }}
                  className="w-full pl-16 pr-6 py-5 bg-white border border-gray-100 focus:border-gray-900 focus:shadow-[0_0_0_4px_rgba(0,0,0,0.02)] rounded-[1.5rem] transition-all outline-none font-bold text-gray-900 placeholder:text-gray-200 text-sm"
                  placeholder="Tu correo electrónico"
                />
              </div>
            </div>

            <div className="space-y-2 group">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2 block transition-colors group-focus-within:text-farm">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-farm transition-all duration-300" size={18} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  className="w-full pl-16 pr-6 py-5 bg-white border border-gray-100 focus:border-gray-900 focus:shadow-[0_0_0_4px_rgba(0,0,0,0.02)] rounded-[1.5rem] transition-all outline-none font-bold text-gray-900 placeholder:text-gray-200 text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gray-900 text-white font-black py-5 rounded-[1.5rem] shadow-2xl shadow-gray-900/10 active:scale-[0.98] hover:scale-[1.01] transition-all flex items-center justify-center gap-3 group disabled:opacity-70 mt-4 overflow-hidden relative"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-farm" />
                  <span className="text-sm font-black uppercase tracking-widest italic">Cargando...</span>
                </div>
              ) : (
                <>
                  <span className="text-sm font-black uppercase tracking-widest italic">Entrar al Sistema</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform text-farm duration-500" />
                </>
              )}
              
              {/* Premium Shimmer Effect */}
              {!loading && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-shimmer pointer-events-none" />
              )}
            </button>
          </form>

          <footer className="mt-14 pt-8 border-t border-gray-50 flex flex-col items-center gap-4">
            <p className="text-gray-400 font-bold text-[13px] tracking-tight">
              ¿No tienes una cuenta aún?
            </p>
            <Link 
              to="/register" 
              className="text-farm font-black text-sm uppercase tracking-widest hover:text-gray-900 transition-all duration-300 hover:scale-110 active:scale-95 border-b-2 border-farm/20 hover:border-gray-900 pb-0.5"
            >
              Crea tu negocio gratis
            </Link>
          </footer>
        </div>
      </div>
    </div>
  );
}
