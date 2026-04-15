import { Outlet, Link, useLocation } from "react-router-dom";
import {
  Home,
  Users,
  ShoppingCart,
  DollarSign,
  Box,
  ReceiptText,
  Settings,
  LogIn,
  LogOut,
} from "lucide-react";
import { useState } from "react";
import TitleBar from "./TitleBar";
import { useBranding } from "../hooks/useBranding";
import { useAuth } from "../context/AuthContext";
import BrandingModal from "./BrandingModal";

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const { branding, updateBranding } = useBranding();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const isElectron = typeof window !== 'undefined' && !!window.electron;

  const handleSaveBranding = (newBranding: any) => {
    updateBranding(newBranding);
    setToastMessage("¡Configuración guardada!");
    setTimeout(() => setToastMessage(null), 3000);
  };

  const navItems = [
    { name: "Principal", path: "/", icon: Home },
    { name: "Clientes", path: "/clientes", icon: Users },
    { name: "Ventas", path: "/ventas", icon: ShoppingCart },
    { name: "Pagos/Abonos", path: "/pagos", icon: DollarSign },
    { name: "Gastos", path: "/gastos", icon: ReceiptText },
    { name: "Inventario", path: "/inventario", icon: Box },
  ];

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <div className="h-screen relative overflow-hidden bg-gray-50/50">
      <TitleBar />
      <div className="h-full flex overflow-hidden">
        
        {/* Toast Premium */}
        {toastMessage && (
          <div className="fixed top-24 right-1/2 translate-x-1/2 z-[100] animate-in slide-in-from-top-10 fade-in duration-500">
            <div className="bg-gray-900/90 backdrop-blur-xl text-white px-8 py-4 rounded-[2rem] font-black shadow-2xl shadow-gray-900/20 flex items-center gap-3 text-sm border border-white/10 uppercase tracking-widest italic scale-105">
              <div className="w-2 h-2 bg-farm rounded-full animate-ping" />
              {toastMessage}
            </div>
          </div>
        )}

        <BrandingModal
          isOpen={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          currentBranding={branding}
          onSave={handleSaveBranding}
        />

        {/* Sidebar Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-30 lg:hidden transition-all duration-500"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar Premium */}
        <div
          className={` 
            fixed lg:static inset-y-0 left-0 w-72 bg-white transform transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] z-40 flex flex-col 
            border-r border-gray-100/80
            ${isElectron ? "pt-12" : "pt-4"} 
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          `}
        >
          {/* Brand Header */}
          <div className="h-24 flex items-center gap-5 px-8 mb-6 shrink-0 group">
            <div className="w-14 h-14 bg-gray-900 rounded-[1.75rem] flex items-center justify-center text-farm font-black shadow-2xl shadow-gray-900/20 shrink-0 uppercase tracking-tighter overflow-hidden transform transition-transform group-hover:rotate-3 duration-500 border-2 border-white/10">
              {branding?.logoImage ? (
                <img
                  src={branding.logoImage}
                  alt="Logo"
                  className="w-full h-full object-cover p-1"
                />
              ) : (
                <span className="text-xl italic">{branding?.logoText || "E"}</span>
              )}
            </div>
            <div className="min-w-0 flex flex-col justify-center">
              <span className="font-black text-[17px] text-gray-900 block leading-none truncate uppercase tracking-[-0.03em] italic">
                {branding?.appName || "SISTEMA"}
              </span>
              <span className="text-[9px] font-black text-farm mt-2 leading-none uppercase tracking-[0.2em] opacity-80">
                {branding?.subtitle || "ADMINISTRATIVO"}
              </span>
            </div>
          </div>

          {/* Navigation Area */}
          <div className="flex-1 px-4 overflow-y-auto custom-scrollbar-premium">
            <nav className="space-y-2 animate-in fade-in slide-in-from-left-4 duration-1000">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={` 
                      relative flex items-center gap-4 px-6 py-4 rounded-[1.5rem] transition-all duration-500 group 
                      ${isActive 
                        ? "bg-gray-900 text-white font-black shadow-[0_20px_40px_-12px_rgba(0,0,0,0.15)] translate-x-1" 
                        : "text-gray-400 hover:bg-gray-50/80 hover:text-gray-900 font-bold hover:translate-x-1"
                      }
                    `}
                  >
                    <div className={`transition-all duration-500 ${isActive ? "scale-110 rotate-0" : "group-hover:rotate-12"}`}>
                      <item.icon
                        size={20}
                        strokeWidth={isActive ? 2.5 : 2}
                        className={isActive ? "text-farm" : "group-hover:text-gray-900"}
                      />
                    </div>
                    <span className="text-[13px] tracking-wide uppercase italic">
                      {item.name}
                    </span>
                    {isActive && (
                      <div className="absolute right-4 w-1.5 h-1.5 bg-farm rounded-full shadow-[0_0_12px_rgba(34,197,94,0.5)]" />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* User & Utils Area */}
          <div className="p-6 mt-4 space-y-3 border-t border-gray-50 bg-gray-50/20">
            <div className="px-5 py-3 border border-gray-100 rounded-[1.25rem] bg-white shadow-sm flex items-center gap-4 group hover:border-farm/30 transition-all duration-500">
              <div className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center text-[10px] font-black text-farm shrink-0 border border-white/10 uppercase">
                {user?.email?.charAt(0) || "U"}
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Operador</p>
                <p className="text-[11px] font-bold text-gray-700 truncate">{user?.email}</p>
              </div>
            </div>

            <button
              onClick={() => setSettingsOpen(true)}
              className="flex items-center gap-4 w-full px-6 py-4 rounded-[1.25rem] text-gray-400 hover:bg-white hover:text-gray-900 transition-all duration-500 font-black group shadow-sm hover:shadow-md border border-transparent hover:border-gray-100"
            >
              <Settings
                size={20}
                className="group-hover:rotate-90 transition-transform duration-700"
              />
              <span className="text-[11px] uppercase tracking-widest italic">Personalizar</span>
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-4 w-full px-6 py-4 rounded-[1.25rem] text-red-400 hover:bg-red-50 hover:text-red-500 transition-all duration-500 font-black group"
            >
              <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
              <span className="text-[11px] uppercase tracking-widest italic">Salir del Portal</span>
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <main className={`flex-1 w-full flex flex-col bg-gray-50/50 ${isElectron ? "pt-8" : "pt-0"}`}>
          <div className="flex-1 p-6 lg:p-14 lg:pt-10 overflow-y-auto custom-scrollbar-premium animate-in fade-in duration-1000">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
}
