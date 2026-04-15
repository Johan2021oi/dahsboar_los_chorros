import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { UserPlus, Mail, Lock, Store, AlertCircle, ArrowRight } from 'lucide-react';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

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
      setError('¡Cuenta creada! Por favor revisa tu correo para confirmar (si es necesario) o intenta iniciar sesión.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]">
      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-5 duration-500">
        <div className="bg-white rounded-[2.5rem] border-2 border-gray-100 shadow-2xl shadow-gray-200/50 p-10 lg:p-12">
          
          <div className="w-20 h-20 bg-farm rounded-3xl flex items-center justify-center mb-10 shadow-xl shadow-farm/20 -rotate-3 mx-auto">
            <UserPlus className="text-white w-10 h-10" />
          </div>

          <div className="text-center mb-10">
            <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase mb-3">Nuevo Negocio</h1>
            <p className="text-gray-400 font-bold tracking-tight">Crea tu cuenta y empieza a vender</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-5">
            {error && (
              <div className={`p-4 rounded-2xl flex items-center gap-3 text-sm font-bold border animate-in shake duration-300 ${error.includes('creada') ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                <AlertCircle size={18} />
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Nombre del Negocio</label>
              <div className="relative group">
                <Store className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-farm transition-colors" size={20} />
                <input
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full pl-14 pr-6 py-5 bg-gray-50 border-2 border-transparent focus:border-gray-900 focus:bg-white rounded-2xl transition-all outline-none font-bold text-gray-900 placeholder:text-gray-300"
                  placeholder="Eje: Granja Los Chorros"
                />
              </div>
            </div>

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
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-14 pr-6 py-5 bg-gray-50 border-2 border-transparent focus:border-gray-900 focus:bg-white rounded-2xl transition-all outline-none font-bold text-gray-900 placeholder:text-gray-300"
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gray-900 text-white font-black py-5 rounded-2xl shadow-xl shadow-gray-900/10 active:scale-95 transition-all flex items-center justify-center gap-3 group disabled:opacity-50 mt-4 overflow-hidden"
            >
              {loading ? (
                <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span className="tracking-tighter uppercase">Crear Cuenta</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <p className="mt-12 text-center text-gray-400 font-bold tracking-tight">
            ¿Ya tienes una cuenta?{' '}
            <Link to="/login" className="text-farm hover:text-gray-900 transition-colors border-b-2 border-farm/20 hover:border-gray-900 font-black">
              Inicia sesión aquí
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
