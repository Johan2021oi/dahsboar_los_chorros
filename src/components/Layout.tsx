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
  const handleSaveBranding = (newBranding: any) => {
    updateBranding(newBranding);
    setToastMessage("¡Configuración guardada correctamente!");
    setTimeout(() => setToastMessage(null), 3000);
  };
  const navItems = [
    { name: "Dashboard", path: "/", icon: Home },
    { name: "Clientes", path: "/clientes", icon: Users },
    { name: "Ventas", path: "/ventas", icon: ShoppingCart },
    { name: "Pagos/Abonos", path: "/pagos", icon: DollarSign },
    { name: "Gastos/Egresos", path: "/gastos", icon: ReceiptText },
    { name: "Inventario", path: "/inventario", icon: Box },
  ];
  const { user, signOut } = useAuth();
  const isElectron = typeof window !== 'undefined' && !!window.electron;

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <div className="h-screen relative overflow-hidden bg-gray-50">
      {" "}
      <TitleBar />{" "}
      <div className="h-full flex overflow-hidden">
        {" "}
        {/* Toast Notification */}{" "}
        {toastMessage && (
          <div className="fixed top-20 right-1/2 translate-x-1/2 z-50 animate-in slide-in-from-top-5 duration-300">
            {" "}
            <div className="bg-farm text-white px-6 py-3 rounded-full font-black shadow-lg shadow-farm/20 flex items-center gap-2 text-sm border-2 border-white/20 backdrop-blur-md tracking-tight">
              {" "}
              {toastMessage}{" "}
            </div>{" "}
          </div>
        )}{" "}
        {/* Settings Modal */}{" "}
        <BrandingModal
          isOpen={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          currentBranding={branding}
          onSave={handleSaveBranding}
        />{" "}
        {/* Sidebar overlay */}{" "}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}{" "}
        {/* Sidebar */}{" "}
        <div
          className={` fixed lg:static inset-y-0 left-0 w-64 bg-white transform transition-transform duration-200 ease-in-out z-40 flex flex-col border-r border-gray-100/50 ${isElectron ? "pt-8" : "pt-0"} ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"} `}
        >
          {" "}
          <div className="h-20 flex items-center gap-4 px-6 lg:mt-2 shrink-0 border-b border-gray-50/50">
            {" "}
            <div className="w-11 h-11 bg-white border border-gray-100 rounded-[1.25rem] flex items-center justify-center text-farm font-black shadow-sm shrink-0 uppercase tracking-tighter overflow-hidden">
              {branding?.logoImage ? (
                <img
                  src={branding.logoImage}
                  alt="Logo"
                  className="w-full h-full object-contain p-1.5"
                />
              ) : (
                branding?.logoText || "EG"
              )}
            </div>
            <div className="min-w-0 flex flex-col justify-center">
              <span className="font-black text-[15px] text-gray-900 block leading-tight truncate uppercase tracking-tighter">
                {branding?.appName || "SISTEMA"}
              </span>
              <span className="text-[10px] font-black text-farm mt-0.5 leading-none">
                {branding?.subtitle || "ADMINISTRATIVO"}
              </span>
            </div>{" "}
          </div>{" "}
          <div className="flex-1 p-4 mt-4 overflow-y-auto custom-scrollbar px-6">
            {" "}
            <nav className="space-y-1 animate-in fade-in duration-500">
              {" "}
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={` flex items-center gap-3.5 px-4 py-4 rounded-2xl transition-all duration-500 ${isActive ? "bg-gray-900 text-white font-black shadow-xl shadow-gray-200/50 scale-[1.02] translate-x-1" : "text-gray-400 hover:bg-gray-50 hover:text-gray-900 font-bold"} `}
                  >
                    {" "}
                    <item.icon
                      size={20}
                      className={isActive ? "text-farm" : ""}
                    />{" "}
                    <span className="text-sm tracking-tight">
                      {item.name}
                    </span>{" "}
                  </Link>
                );
              })}{" "}
            </nav>{" "}
          </div>{" "}
          {/* Bottom Utils */}{" "}
          <div className="p-6 bg-gray-50/5 space-y-2 border-t border-gray-50 animate-in slide-in-from-bottom-4 duration-500">
            {" "}
            <div className="px-4 py-2 border border-gray-100 rounded-2xl bg-gray-50/30 overflow-hidden mb-2">
              <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest leading-none mb-1">Usuario</p>
              <p className="text-xs font-bold text-gray-600 truncate">{user?.email}</p>
            </div>

            <button
              onClick={() => setSettingsOpen(true)}
              className="flex items-center gap-3.5 w-full px-4 py-4 rounded-2xl text-gray-400 hover:bg-white hover:text-gray-900 transition-all font-black group shadow-sm hover:shadow-md border border-transparent hover:border-gray-100"
            >
              {" "}
              <Settings
                size={20}
                className="group-hover:rotate-45 transition-transform duration-700"
              />{" "}
              <span className="text-sm tracking-tight">Ajustes</span>{" "}
            </button>{" "}

            <button
              onClick={handleLogout}
              className="flex items-center gap-3.5 w-full px-4 py-4 rounded-2xl text-red-400 hover:bg-red-50 hover:text-red-600 transition-all font-black group"
            >
              {" "}
              <LogIn
                size={20}
                className="rotate-180"
              />{" "}
              <span className="text-sm tracking-tight">Cerrar Sesión</span>{" "}
            </button>{" "}
          </div>{" "}
        </div>{" "}
        {/* Main content */}{" "}
        <main className={`flex-1 w-full flex flex-col ${isElectron ? "pt-8" : "pt-0"}`}>
          {" "}
          <div className="flex-1 p-4 lg:p-10 lg:pt-8 overflow-y-auto custom-scrollbar">
            {" "}
            <Outlet />{" "}
          </div>{" "}
        </main>{" "}
      </div>{" "}
    </div>
  );
}
