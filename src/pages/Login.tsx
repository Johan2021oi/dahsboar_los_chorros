import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { LogIn, Mail, Lock, AlertCircle, ArrowRight } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message === 'Invalid login credentials' ? 'Credenciales incorrectas' : error.message);
      setLoading(false);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]">
      <div className="w-full max-w-md animate-in fade-in zoom-in duration-500">
        <div className="bg-white rounded-[2.5rem] border-2 border-gray-100 shadow-2xl shadow-gray-200/50 p-10 lg:p-12 relative overflow-hidden">
          
          {/* Logo/Icon Container */}
          <div className="w-20 h-20 bg-gray-900 rounded-3xl flex items-center justify-center mb-10 shadow-xl shadow-gray-900/20 rotate-3 mx-auto">
            <LogIn className="text-farm w-10 h-10" />
          </div>

          <div className="text-center mb-10">
            <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase mb-3">Bienvenido</h1>
            <p className="text-gray-400 font-bold tracking-tight">Ingresa tus credenciales para continuar</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-2xl flex items-center gap-3 text-sm font-bold border border-red-100 animate-in shake duration-300">
                <AlertCircle size={18} />
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Correo Electrónico</label>
              <div className="relative group">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-farm transition-colors" size={20} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-14 pr-6 py-5 bg-gray-50 border-2 border-transparent focus:border-gray-900 focus:bg-white rounded-2xl transition-all outline-none font-bold text-gray-900 placeholder:text-gray-300"
                  placeholder="ejemplo@correo.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Contraseña</label>
              <div className="relative group">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-farm transition-colors" size={20} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-14 pr-6 py-5 bg-gray-50 border-2 border-transparent focus:border-gray-900 focus:bg-white rounded-2xl transition-all outline-none font-bold text-gray-900 placeholder:text-gray-300"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gray-900 text-white font-black py-5 rounded-2xl shadow-xl shadow-gray-900/10 active:scale-95 transition-all flex items-center justify-center gap-3 group disabled:opacity-50 mt-4 overflow-hidden relative"
            >
              {loading ? (
                <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span className="tracking-tighter uppercase">Iniciar Sesión</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <p className="mt-12 text-center text-gray-400 font-bold tracking-tight">
            ¿No tienes una cuenta?{' '}
            <Link to="/register" className="text-farm hover:text-gray-900 transition-colors border-b-2 border-farm/20 hover:border-gray-900 font-black">
              Crea tu negocio gratis
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
