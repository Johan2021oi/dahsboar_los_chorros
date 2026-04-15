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
  Menu,
} from "lucide-react";
import { useState } from "react";
import TitleBar from "./TitleBar";
import { useBranding } from "../hooks/useBranding";
import { useAuth } from "../context/AuthContext";
import BrandingModal from "./BrandingModal";
import Toast from "./Toast";

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const { branding, updateBranding } = useBranding();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const isElectron = typeof window !== 'undefined' && !!window.electron;

  const handleSaveBranding = async (newBranding: any) => {
    const success = await updateBranding(newBranding);
    if (success) {
      setToastMessage("¡Configuración guardada!");
    } else {
      setToastMessage("Error al guardar en la nube. Cambios guardados localmente.");
    }
  };

  const navItems = [
    { name: "Dashboard", path: "/", icon: Home },
    { name: "Clientes", path: "/clientes", icon: Users },
    { name: "Ventas", path: "/ventas", icon: ShoppingCart },
    { name: "Pagos/Abonos", path: "/pagos", icon: DollarSign },
    { name: "Gastos/Egresos", path: "/gastos", icon: ReceiptText },
    { name: "Inventario", path: "/inventario", icon: Box },
  ];

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <div className="h-screen relative overflow-hidden bg-gray-50/50">
      <TitleBar />
      <div className="h-full flex overflow-hidden">
        
        {toastMessage && (
          <Toast 
            type="success" 
            message={toastMessage} 
            onClose={() => setToastMessage(null)} 
          />
        )}

        <BrandingModal
          isOpen={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          currentBranding={branding}
          onSave={handleSaveBranding}
        />

        {/* Sidebar Overlay */}
        <div
          className={`fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[998] transition-all duration-500 lg:hidden ${sidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
          onClick={() => setSidebarOpen(false)}
        />

        {/* Sidebar Premium */}
        <div
          className={` 
            fixed lg:static inset-y-0 left-0 w-72 bg-white transform transition-all duration-500 ease-in-out z-[999] flex flex-col 
            border-r border-gray-100 shadow-2xl lg:shadow-none
            ${isElectron ? "pt-12" : "pt-4"} 
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          `}
        >
          {/* Brand Header */}
          {/* Brand Header - Hidden on Mobile, Clickable to Edit */}
          <button 
            onClick={() => setSettingsOpen(true)}
            className="hidden lg:flex h-24 items-center gap-5 px-8 mb-6 shrink-0 group hover:bg-gray-50/50 transition-colors w-full text-left"
          >
            <div className="w-14 h-14 bg-gray-900 rounded-[1.75rem] flex items-center justify-center text-farm font-black shadow-2xl shadow-gray-900/20 shrink-0 uppercase tracking-tighter overflow-hidden transform transition-transform group-hover:rotate-3 duration-500 border-2 border-white/10">
              {branding?.logoImage ? (
                <img
                  src={branding.logoImage}
                  alt="Logo"
                  className="w-full h-full object-cover p-1"
                />
              ) : (
                <span className="text-xl">{branding?.logoText || "E"}</span>
              )}
            </div>
            <div className="min-w-0 flex flex-col justify-center">
              <span className="font-bold text-[17px] text-gray-900 block leading-none truncate uppercase tracking-[-0.03em] group-hover:text-farm transition-colors">
                {branding?.appName || "SISTEMA"}
              </span>
              <span className="text-[9px] font-bold text-farm mt-2 leading-none uppercase tracking-[0.2em] opacity-80">
                {branding?.subtitle || "ADMINISTRATIVO"}
              </span>
            </div>
          </button>

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
                    <div className={`transition-all duration-500 ${isActive ? "scale-110 rotate-0" : "group-hover:scale-110"}`}>
                      <item.icon
                        size={20}
                        strokeWidth={isActive ? 2.5 : 2}
                        className={isActive ? "text-farm" : "text-gray-400 group-hover:text-gray-600"}
                      />
                    </div>
                    <span className={`text-sm tracking-wide ${isActive ? "font-bold" : "font-medium"}`}>
                      {item.name}
                    </span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* User & Utils Area */}
          <div className="p-6 mt-4 flex items-center justify-between gap-2">
            <button
              onClick={() => setSettingsOpen(true)}
              className="flex items-center gap-3 px-5 py-3 rounded-2xl text-gray-400 hover:bg-gray-50 hover:text-gray-900 transition-all duration-300 font-semibold group flex-1"
            >
              <Settings
                size={18}
                className="group-hover:rotate-90 transition-transform duration-700"
              />
              <span className="text-sm">Ajustes</span>
            </button>
            <button
              onClick={handleLogout}
              className="p-3 rounded-2xl text-red-400 hover:bg-red-50 hover:text-red-500 transition-all duration-300 group shrink-0"
              title="Salir del Portal"
            >
              <LogOut size={18} className="group-hover:-translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>

        {/* Mobile Top Bar */}
        <div className="flex lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-100 z-[9999] items-center justify-between px-5 shadow-sm">
          <button 
            onClick={() => setSettingsOpen(true)}
            className="flex items-center gap-3 active:scale-95 transition-transform text-left"
          >
            <div className="w-9 h-9 bg-gray-900 rounded-xl flex items-center justify-center text-farm overflow-hidden shadow-lg shadow-gray-900/20">
               {branding?.logoImage ? (
                <img src={branding.logoImage} alt="Logo" className="w-full h-full object-cover p-1" />
              ) : (
                <span className="text-base font-bold">{branding?.logoText || "B"}</span>
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-sm text-gray-900 uppercase tracking-tight leading-none truncate active:text-farm">
                {branding?.appName || "Busi"}
              </span>
              <span className="text-[8px] font-medium text-farm uppercase tracking-widest mt-0.5 truncate">
                {branding?.subtitle || "Panel de Control"}
              </span>
            </div>
          </button>
          <button 
            onClick={() => setSidebarOpen(true)}
            className="p-2.5 bg-gray-50 rounded-xl text-gray-900 hover:bg-gray-100 active:scale-95 transition-all shadow-sm border border-gray-100"
            aria-label="Abrir menú"
          >
            <Menu size={22} strokeWidth={2.5} />
          </button>
        </div>

        {/* Main Content Area */}
        <main className={`flex-1 w-full flex flex-col bg-gray-50/50 ${isElectron ? "pt-8" : "pt-24 lg:pt-0"}`}>
          <div className="flex-1 p-3 lg:p-14 lg:pt-10 overflow-y-auto custom-scrollbar-premium animate-in fade-in duration-1000">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
