import { useEffect, useState, useRef } from "react";
import { supabase } from "../lib/supabase";
import {
  Plus,
  Minus,
  Trash2,
  Package,
  CheckCircle2,
  ChevronDown,
  Layers,
  Box,
  Weight,
  Pencil,
  X,
  TrendingUp,
} from "lucide-react";
import Toast from "../components/Toast";

// Cache simple fuera del componente para navegación instantánea
let inventarioCache: any[] | null = null;

export default function Inventario() {
  const [items, setItems] = useState<any[]>(inventarioCache || []);
  const [loading, setLoading] = useState(!inventarioCache);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newItem, setNewItem] = useState({
    nombre: "",
    cantidad: 0,
    unidad: "Cubeta",
    precio_unidad: 0,
  });
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isUnitOpen, setIsUnitOpen] = useState(false);
  const unitRef = useRef<HTMLDivElement>(null);

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const loadInventario = async (silent = false) => {
    if (!silent && !inventarioCache) setLoading(true);
    try {
      const { data, error } = await (supabase.from("inventario") as any)
        .select("*")
        .order("nombre", { ascending: true });
      if (error) throw error;
      inventarioCache = data || [];
      setItems(inventarioCache);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventario(!!inventarioCache);
    const handleClickOutside = (event: MouseEvent) => {
      if (unitRef.current && !unitRef.current.contains(event.target as Node)) {
        setIsUnitOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.nombre) return;
    try {
      if (editingId) {
        const { error } = await (supabase.from("inventario") as any)
          .update({
            nombre: newItem.nombre,
            cantidad: Number(newItem.cantidad) || 0,
            unidad: newItem.unidad,
            precio_unidad: Number(newItem.precio_unidad) || 0,
          })
          .eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await (supabase.from("inventario") as any).insert([
          {
            nombre: newItem.nombre,
            cantidad: Number(newItem.cantidad) || 0,
            unidad: newItem.unidad,
            precio_unidad: Number(newItem.precio_unidad) || 0,
          },
        ]);
        if (error) throw error;
      }
      setIsModalOpen(false);
      setEditingId(null);
      setNewItem({
        nombre: "",
        cantidad: 0,
        unidad: "Cubeta",
        precio_unidad: 0,
      });
      showNotification(
        "success",
        editingId ? "Producto actualizado" : "Producto agregado al inventario",
      );
      await loadInventario();
    } catch (err) {
      showNotification("error", "Error al guardar el item.");
    }
  };

  const adjustStock = async (id: string, amount: number) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    const newCount = Math.max(0, Number(item.cantidad) + amount);
    try {
      const { error } = await (supabase.from("inventario") as any)
        .update({ cantidad: newCount })
        .eq("id", id);
      if (error) throw error;
      await loadInventario();
    } catch (err) {
      console.error(err);
    }
  };

  const setEditingItem = (item: any) => {
    setEditingId(item.id);
    setNewItem({
      nombre: item.nombre,
      cantidad: item.cantidad,
      unidad: item.unidad,
      precio_unidad: item.precio_unidad,
    });
  };

  const deleteItem = async (id: string) => {
    try {
      await (supabase.from("inventario") as any).delete().eq("id", id);
      showNotification("success", "Producto eliminado");
      setConfirmDeleteId(null);
      await loadInventario();
    } catch (err) {
      showNotification("error", "Error al eliminar.");
    }
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(val);

  return (
    <>
    <div
      className="max-w-7xl mx-auto pb-12 space-y-6 lg:space-y-8 animate-in fade-in duration-500"
      onClick={() => {
        confirmDeleteId && setConfirmDeleteId(null);
        notification && setNotification(null);
      }}
    >
      <div className="hidden lg:flex flex-col lg:flex-row lg:items-center justify-between gap-6 lg:gap-8 shrink-0 mb-4 px-2 lg:px-0">
        <div className="flex items-center gap-6">
          <div>
            <h1 className="text-lg font-bold text-gray-900 tracking-tight uppercase">
              INVENTARIO Y STOCK
            </h1>
            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest mt-0.5 leading-none">
              MONITOREA LA EXISTENCIA DE PRODUCTOS Y SUMINISTROS
            </p>
        </div>
      </div>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 lg:gap-8 shrink-0 mb-4 px-2 lg:px-0 lg:hidden">
         {/* Espacio reservado para botones en móvil si es necesario */}
      </div>

        <button
          onClick={() => {
            setEditingId(null);
            setIsModalOpen(true);
          }}
          className="w-full lg:w-auto bg-farm hover:bg-farm-dark text-white px-5 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95"
        >
          <Plus size={18} /> <span className="text-xs">NUEVO PRODUCTO</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-8 px-2 lg:px-0">
        {[
          {
            label: "VALOR INVENTARIO",
            value: formatCurrency(
              items.reduce(
                (s, i) =>
                  s + Number(i.cantidad || 0) * Number(i.precio_unidad || 0),
                0,
              ),
            ),
            color: "farm",
          },
          {
            label: "PRODUCTOS REGISTRADOS",
            value: items.length,
            color: "gray-900",
          },
          {
            label: "STOCK CRÍTICO",
            value: items.filter((i) => Number(i.cantidad || 0) < 20).length,
            color:
              items.filter((i) => Number(i.cantidad || 0) < 20).length > 0
                ? "red-500"
                : "farm",
            alert: items.filter((i) => Number(i.cantidad || 0) < 20).length > 0,
          },
          {
            label: "CATEGORÍAS STOCK",
            value: Array.from(new Set(items.map((i) => i.unidad))).length,
            color: "blue-500",
          },
        ].map((s, i) => (
          <div
            key={i}
            className="bg-white p-5 lg:p-7 rounded-[1.5rem] lg:rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/20 relative overflow-hidden group transition-all"
          >
            <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-3 leading-none">
              {s.label}
            </div>
            <div
              className={`text-2xl font-black tracking-tight text-${s.color}`}
            >
              {s.value}
            </div>
            {s.alert && (
              <div className="absolute top-0 right-0 w-16 h-16 bg-red-100 rounded-full -mr-8 -mt-8 opacity-20"></div>
            )}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-[1.5rem] lg:rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden">
        {/* Wrapper relativo para contener el gradiente dentro del card */}
        <div className="relative">
          <div className="max-h-[500px] overflow-y-auto custom-scrollbar pb-4" id="inventario-scroll">
            <div className="overflow-x-auto">
              <table className="w-full text-left font-sans">
                <thead>
                  <tr className="bg-gray-50 text-gray-400 text-[10px] font-black uppercase tracking-widest border-b sticky top-0 z-10">
                    <th className="px-6 py-4">Producto / Insumo</th>
                    <th className="px-6 py-4">Unidad</th>
                    <th className="px-6 py-4 text-center">Stock Actual</th>
                    <th className="px-6 py-4 text-right">Precio Ref.</th>
                    <th className="px-6 py-4 text-center">Ajuste Rápido</th>
                    <th className="px-6 py-4 w-[200px]"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((i) => (
                    <tr
                      key={i.id}
                      className="hover:bg-farm-light/10 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-gray-900">
                          {i.nombre}
                        </div>
                      </td>
                      <td className="px-6 py-4 uppercase text-[10px] font-semibold text-gray-400 tracking-tighter">
                        {i.unidad}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`text-lg font-black ${i.cantidad < 20 ? "text-red-500" : "text-farm"}`}
                        >
                          {i.cantidad}
                        </span>
                        {i.cantidad < 20 && (
                          <p className="text-[9px] font-black text-red-400 uppercase tracking-widest mt-0.5">
                            REABASTECER
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-gray-600">
                        {formatCurrency(i.precio_unidad)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => adjustStock(i.id, -1)}
                            className="p-1.5 hover:bg-gray-100 rounded-lg text-red-500 transition-colors border"
                          >
                            <Minus size={16} />
                          </button>
                          <button
                            onClick={() => adjustStock(i.id, 1)}
                            className="p-1.5 hover:bg-gray-100 rounded-lg text-farm transition-colors border"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 w-[180px] whitespace-nowrap">
                        <div className="flex justify-end gap-1 items-center w-full">
                          <button
                            onClick={() => {
                              setEditingItem(i);
                              setIsModalOpen(true);
                            }}
                            className="p-1.5 text-gray-300 hover:text-farm transition-all hover:bg-farm/5 rounded-xl"
                            title="Editar"
                          >
                            <Pencil size={14} />
                          </button>
                          {confirmDeleteId === i.id ? (
                            <div className="flex gap-1.5 items-center animate-in fade-in zoom-in duration-300 min-w-[80px] justify-end">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setConfirmDeleteId(null);
                                }}
                                className="text-[9px] font-semibold text-gray-400 hover:text-gray-600 px-2 py-1 rounded-lg bg-gray-50 border border-gray-100 transition-all"
                              >
                                No
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteItem(i.id);
                                }}
                                className="text-[9px] font-black text-white bg-red-500 hover:bg-red-600 px-2.5 py-1 rounded-lg shadow-lg shadow-red-500/20 transition-all"
                              >
                                Sí
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmDeleteId(i.id);
                              }}
                              className="text-gray-300 hover:text-red-500 p-1.5 rounded-xl transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {items.length === 0 && !loading && (
                    <tr>
                      <td colSpan={6} className="px-6 py-20 text-center">
                        <Package
                          size={48}
                          className="mx-auto text-gray-200 mb-4"
                        />
                        <div className="text-gray-400 font-bold uppercase tracking-widest text-xs">
                          BODEGA VACÍA. AGREGA TU PRIMER PRODUCTO.
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          {/* Gradiente siempre visible — indica que puede haber más productos al desplazarse */}
          {items.length > 0 && (
            <div
              className="pointer-events-none absolute bottom-0 left-0 right-0 h-10 rounded-b-[2.5rem]"
              style={{ background: 'linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.85) 50%, rgba(255,255,255,1) 100%)' }}
            />
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[1000] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] w-full max-w-md shadow-2xl border border-white/40 animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
            <div className="p-6 border-b border-white/20 flex justify-between items-center bg-white/40 rounded-t-[1.5rem] lg:rounded-t-[2.5rem]">
              <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">
                {editingId ? "Editar Item" : "Nuevo Producto"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-gray-200 rounded-xl transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-8 space-y-8">
              <div className="space-y-2">
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest ml-1">
                  Nombre del Producto
                </label>
                <input
                  required
                  type="text"
                  placeholder="Ej: Huevo AAA..."
                  className="w-full border-gray-200 border-2 rounded-2xl px-5 py-4 focus:outline-none focus:ring-4 focus:ring-farm/10 font-bold text-gray-700"
                  value={newItem.nombre}
                  onChange={(e) =>
                    setNewItem({ ...newItem, nombre: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest ml-1">
                    Cant. Inicial
                  </label>
                  <input
                    required
                    type="number"
                    className="w-full border-gray-200 border-2 rounded-2xl px-5 py-4 focus:outline-none focus:ring-4 focus:ring-farm/10 font-black text-xl text-gray-900"
                    value={newItem.cantidad}
                    onChange={(e) =>
                      setNewItem({
                        ...newItem,
                        cantidad:
                          e.target.value === ""
                            ? ""
                            : (Number(e.target.value) as any),
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest ml-1">
                    Unidad
                  </label>
                  <div className="relative" ref={unitRef}>
                    <div
                      onClick={() => setIsUnitOpen(!isUnitOpen)}
                      className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl cursor-pointer transition-all duration-300 bg-white border-2 border-gray-200 ${isUnitOpen ? "ring-4 ring-farm/10 border-farm" : "hover:border-gray-300"}`}
                    >
                      <span className="text-sm font-black text-gray-700 uppercase tracking-tight">
                        {newItem.unidad}
                      </span>
                      <ChevronDown
                        size={16}
                        className={`text-gray-300 transition-transform ${isUnitOpen ? "rotate-180 text-farm" : ""}`}
                      />
                    </div>
                    {isUnitOpen && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 z-[60] overflow-hidden animate-in fade-in slide-in-from-top-2">
                        {["Cubeta", "Bulto", "Unidad", "Kilo"].map((u) => (
                          <div
                            key={u}
                            onClick={() => {
                              setNewItem({ ...newItem, unidad: u });
                              setIsUnitOpen(false);
                            }}
                            className={`px-5 py-3 text-xs font-black uppercase tracking-widest cursor-pointer transition-all ${newItem.unidad === u ? "bg-farm text-white" : "hover:bg-gray-50 text-gray-600"}`}
                          >
                            {u}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest ml-1">
                  Precio Unitario ($)
                </label>
                <input
                  required
                  type="number"
                  className="w-full border-gray-200 border-2 rounded-2xl px-5 py-4 focus:outline-none focus:ring-4 focus:ring-farm/10 font-black text-xl text-farm"
                  value={newItem.precio_unidad}
                  onChange={(e) =>
                    setNewItem({
                      ...newItem,
                      precio_unidad:
                        e.target.value === ""
                          ? ""
                          : (Number(e.target.value) as any),
                    })
                  }
                />
              </div>
              <div className="pt-8">
                <button
                  type="submit"
                  className="w-full py-5 bg-farm text-white rounded-[2.5rem] font-black uppercase text-sm tracking-widest shadow-xl shadow-farm/20 hover:bg-farm-dark transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  {editingId ? "Actualizar Bodega" : "Ingresar a Bodega"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
    {notification && (
      <Toast
        type={notification.type}
        message={notification.message}
        onClose={() => setNotification(null)}
      />
    )}
    </>
  );
}
