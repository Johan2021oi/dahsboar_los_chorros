import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { UserPlus, Mail, Lock, Store, AlertCircle, ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const businessRef = useRef<HTMLInputElement>(null);

  // Autofoco inteligente
  useEffect(() => {
    if (businessRef.current) businessRef.current.focus();
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // 1. Registrar usuario en Supabase Auth
    // Nota: Usamos user_metadata para guardar el nombre del negocio inicial
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          business_name: businessName,
        }
      }
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    // 2. Redirigir al login o dashboard
    // Nota: Dependiendo de la config de Supabase, puede requerir confirmar email.
    // Pero por defecto, si está configurado para auto-confirmar, podemos entrar.
    if (authData.session) {
      navigate('/');
    } else {
      // Si no hay sesión, es probable que se requiera confirmar el correo
      setError('¡Cuenta creada con éxito! 🚀 Por favor, revisa tu correo electrónico para confirmar tu cuenta y poder iniciar sesión.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/30 flex items-center justify-center p-6 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px]">
      <div className="w-full max-w-[440px] animate-in fade-in zoom-in-95 duration-700">
        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.06)] p-6 lg:p-8 relative overflow-hidden">
          
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-farm/5" />

          <div className="w-12 h-12 bg-gray-900 rounded-[1.25rem] flex items-center justify-center mb-4 shadow-xl shadow-gray-900/20 mx-auto transform transition-transform hover:scale-105 duration-500">
            <UserPlus className="text-farm w-7 h-7" />
          </div>

          <div className="text-center mb-5">
            <h1 className="text-[22px] font-black text-gray-900 tracking-[-0.04em] uppercase leading-tight mb-2">
              Nuevo Negocio
            </h1>
            <p className="text-[11px] font-medium text-gray-400 uppercase tracking-widest leading-none">
              Tu negocio inteligente
            </p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            {error && (
              <div className={`p-4 rounded-2xl flex items-center gap-3 text-sm font-medium border animate-in shake duration-300 ${error.includes('creada') ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                <AlertCircle size={18} />
                {error}
              </div>
            )}

            <div className="relative group">
              <Store className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-farm transition-all duration-300" size={18} />
              <input
                ref={businessRef}
                type="text"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full pl-16 pr-6 py-4 bg-white border border-gray-100 focus:border-gray-900 focus:shadow-[0_0_0_4px_rgba(0,0,0,0.02)] rounded-[1.5rem] transition-all outline-none font-medium text-gray-900 placeholder:text-gray-400 placeholder:text-[13px] text-sm"
                placeholder="Nombre del Negocio"
              />
            </div>

            <div className="relative group">
              <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-farm transition-all duration-300" size={18} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-16 pr-6 py-4 bg-white border border-gray-100 focus:border-gray-900 focus:shadow-[0_0_0_4px_rgba(0,0,0,0.02)] rounded-[1.5rem] transition-all outline-none font-medium text-gray-900 placeholder:text-gray-400 placeholder:text-[13px] text-sm"
                placeholder="Correo Electrónico"
              />
            </div>

            <div className="relative group">
              <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-farm transition-all duration-300" size={18} />
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-16 pr-14 py-4 bg-white border border-gray-100 focus:border-gray-900 focus:shadow-[0_0_0_4px_rgba(0,0,0,0.02)] rounded-[1.5rem] transition-all outline-none font-medium text-gray-900 placeholder:text-gray-400 placeholder:text-[13px] text-sm"
                placeholder="Contraseña (mín. 6)"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-300 hover:text-farm transition-all duration-300 z-20 p-1 hover:bg-gray-50 rounded-full flex items-center justify-center cursor-pointer"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gray-900 text-white font-black py-3 rounded-[1.5rem] shadow-2xl shadow-gray-900/10 active:scale-[0.98] hover:scale-[1.01] transition-all flex items-center justify-center gap-3 group disabled:opacity-70 mt-3 overflow-hidden relative"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-farm" />
                  <span className="text-sm font-black uppercase tracking-widest">Creando...</span>
                </div>
              ) : (
                <>
                  <span className="text-sm font-black uppercase tracking-widest">Registrar Negocio</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform text-farm duration-500" />
                </>
              )}
              {!loading && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-shimmer pointer-events-none" />
              )}
            </button>
          </form>

          <footer className="mt-5 pt-5 border-t border-gray-50 flex flex-col items-center gap-3">
            <p className="text-gray-400 font-medium text-[12px] tracking-tight">
              ¿Ya tienes una cuenta?
            </p>
            <Link 
              to="/login" 
              className="text-farm font-semibold text-[10px] uppercase tracking-[0.15em] hover:text-gray-900 transition-all duration-300 hover:scale-105 active:scale-95 pb-0.5 border-b border-farm/10 hover:border-gray-900"
            >
              Inicia sesión aquí
            </Link>
          </footer>
        </div>
      </div>
    </div>
  );
}
