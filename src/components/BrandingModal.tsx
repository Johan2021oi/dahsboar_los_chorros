import { useState } from "react";
import { X, Save } from "lucide-react";
import type { Branding } from "../hooks/useBranding";
interface BrandingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBranding: Branding;
  onSave: (newBranding: Branding) => void;
}
export default function BrandingModal({
  isOpen,
  onClose,
  currentBranding,
  onSave,
}: BrandingModalProps) {
  const [formData, setFormData] = useState<Branding>(currentBranding);
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      {" "}
      {/* Overlay */}{" "}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />{" "}
      {/* Modal */}{" "}
      <div className="relative w-full max-w-2xl bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/40 transform transition-all animate-in fade-in zoom-in duration-300 max-h-[85vh] flex flex-col">
        {" "}
        {/* Header - Fixed */}{" "}
        <div className="px-8 pt-8 pb-4 bg-white/40 border-b border-white/20 shrink-0">
          {" "}
          <div className="flex items-center justify-between">
            {" "}
            <h3 className="text-xl font-bold text-gray-900 tracking-tight">
              Ajustes
            </h3>{" "}
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/50 rounded-full transition-colors text-gray-400 hover:text-gray-600"
            >
              {" "}
              <X size={20} />{" "}
            </button>{" "}
          </div>{" "}
        </div>{" "}
        {/* Body - Scrollable */}{" "}
        <div className="flex-1 overflow-y-auto px-8 py-6 custom-scrollbar">
          {" "}
          <div className="space-y-8">
            {" "}
            {/* Logo Section */}{" "}
            <div>
              {" "}
              <label className="block text-xs font-semibold text-gray-400 mb-3 ml-1">
                {" "}
                Logotipo Corporativo (Imagen){" "}
              </label>{" "}
              <div className="flex flex-col gap-4">
                {" "}
                <div className="flex items-center gap-4 p-5 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl group hover:border-farm/50 transition-all cursor-pointer relative">
                  {" "}
                  <input
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setFormData({
                            ...formData,
                            logoImage: reader.result as string,
                          });
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />{" "}
                  <div className="w-16 h-16 rounded-xl bg-white border border-gray-100 flex items-center justify-center overflow-hidden shrink-0 shadow-sm group-hover:shadow-md transition-all">
                    {" "}
                    {formData.logoImage ? (
                      <img
                        src={formData.logoImage}
                        alt="Preview"
                        className="w-full h-full object-contain p-1"
                      />
                    ) : (
                      <div className="text-2xl font-black text-farm uppercase tracking-tighter">
                        {" "}
                        {formData.logoText}{" "}
                      </div>
                    )}{" "}
                  </div>{" "}
                  <div className="flex flex-col">
                    {" "}
                    <span className="text-sm font-black text-gray-700">
                      Cargar Imagen
                    </span>{" "}
                    <span className="text-[10px] font-medium text-gray-400">
                      PNG, JPG o GIF • Max 1MB
                    </span>{" "}
                  </div>{" "}
                </div>{" "}
                {formData.logoImage && (
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, logoImage: null })
                    }
                    className="text-[10px] font-black text-red-400 hover:text-red-500 transition-colors flex items-center gap-1.5 ml-1 self-start"
                  >
                    {" "}
                    <span>Eliminar Imagen y volver a iniciales</span>{" "}
                  </button>
                )}{" "}
              </div>{" "}
            </div>{" "}
            {/* General Info */}{" "}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {" "}
              <div className="space-y-2">
                {" "}
                <label className="block text-xs font-semibold text-gray-400 ml-1">
                  {" "}
                  Nombre del Negocio{" "}
                </label>{" "}
                <input
                  type="text"
                  value={formData.appName}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      appName: e.target.value.toUpperCase(),
                    })
                  }
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-farm/10 focus:border-farm outline-none transition-all font-bold text-gray-700"
                  placeholder="Ej: GRANJA LOS CHORROS"
                />{" "}
              </div>{" "}
              <div className="space-y-2">
                {" "}
                <label className="block text-xs font-semibold text-gray-400 ml-1">
                  {" "}
                  Iniciales / Emoji{" "}
                </label>{" "}
                <input
                  type="text"
                  value={formData.logoText}
                  maxLength={2}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      logoText: e.target.value.toUpperCase(),
                    })
                  }
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-farm/10 focus:border-farm outline-none transition-all font-bold text-gray-700"
                  placeholder="Ej: LC o 🥚"
                />{" "}
              </div>{" "}
            </div>{" "}
            <div className="space-y-2">
              {" "}
              <label className="block text-xs font-semibold text-gray-400 ml-1">
                {" "}
                Administrador{" "}
              </label>{" "}
              <input
                type="text"
                value={formData.subtitle}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    subtitle: e.target.value.toUpperCase(),
                  })
                }
                className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-farm/10 focus:border-farm outline-none transition-all font-bold text-gray-700"
                placeholder="Ej: JOHAN DÍAZ"
              />{" "}
            </div>{" "}
            {/* SECCIÓN DATOS DE CONTACTO */}{" "}
            <div className="pt-6 border-t border-gray-50 space-y-5">
              {" "}
              <h4 className="text-sm font-semibold text-gray-800 tracking-tight flex items-center gap-2">
                {" "}
                <span className="w-1.5 h-1.5 bg-farm rounded-full"></span> Datos
                de Contacto (Para Comprobantes){" "}
              </h4>{" "}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {" "}
                <div className="space-y-2">
                  {" "}
                  <label className="block text-xs font-semibold text-gray-400 ml-1">
                    {" "}
                    Teléfono{" "}
                  </label>{" "}
                  <input
                    type="text"
                    value={formData.phone || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-farm/10 focus:border-farm outline-none transition-all font-bold text-gray-700"
                    placeholder="Ej: +57 300 000 0000"
                  />{" "}
                </div>{" "}
                <div className="space-y-2">
                  {" "}
                  <label className="block text-xs font-semibold text-gray-400 ml-1">
                    {" "}
                    Teléfono 2{" "}
                  </label>{" "}
                  <input
                    type="text"
                    value={formData.phone2 || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, phone2: e.target.value })
                    }
                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-farm/10 focus:border-farm outline-none transition-all font-bold text-gray-700"
                    placeholder="Opcional"
                  />{" "}
                </div>{" "}
                <div className="space-y-2">
                  {" "}
                  <label className="block text-xs font-semibold text-gray-400 ml-1">
                    {" "}
                    Correo Electrónico{" "}
                  </label>{" "}
                  <input
                    type="email"
                    value={formData.email || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-farm/10 focus:border-farm outline-none transition-all font-bold text-gray-700"
                    placeholder="Ej: contacto@granjaloschorros.com"
                  />{" "}
                </div>{" "}
                <div className="md:col-span-2 space-y-2">
                  {" "}
                  <label className="block text-xs font-semibold text-gray-400 ml-1">
                    {" "}
                    Dirección{" "}
                  </label>{" "}
                  <input
                    type="text"
                    value={formData.address || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-farm/10 focus:border-farm outline-none transition-all font-bold text-gray-700"
                    placeholder="Ej: Vereda Los Chorros, Finca Principal"
                  />{" "}
                </div>{" "}
              </div>{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
        {/* Footer - Fixed */}{" "}
        <div className="p-8 bg-gray-50 border-t border-gray-100 shrink-0">
          {" "}
          <div className="flex gap-3">
            {" "}
            <button
              onClick={onClose}
              className="px-6 py-4 text-sm font-semibold text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-2xl transition-all"
            >
              {" "}
              Cancelar{" "}
            </button>{" "}
            <button
              onClick={() => {
                onSave(formData);
                onClose();
              }}
              className="flex-1 py-4 bg-farm text-white rounded-2xl font-black text-sm shadow-xl shadow-farm/20 hover:shadow-farm/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              {" "}
              <Save size={18} /> Guardar Cambios{" "}
            </button>{" "}
          </div>{" "}
        </div>{" "}
      </div>{" "}
    </div>
  );
}
