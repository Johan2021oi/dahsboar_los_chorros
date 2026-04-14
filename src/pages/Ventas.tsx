import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { supabase } from "../lib/supabase";
import {
  Plus,
  Trash2,
  ShoppingCart,
  Calendar,
  User,
  CheckCircle2 as CheckCircleIcon,
  AlertCircle as AlertCircleIcon,
  ChevronDown,
  CheckCircle,
  FileText,
  Pencil,
  Search,
  Download,
  Eye,
  Box,
} from "lucide-react";
import { generateReceipt } from "../lib/receipt";
import { useBranding } from "../hooks/useBranding";
import DatePicker from "../components/DatePicker";
import Toast from "../components/Toast";
import {
  subDays,
  format,
  startOfMonth,
  endOfMonth,
  startOfDay,
  endOfDay,
  parseISO,
  startOfWeek,
  endOfWeek,
} from "date-fns";
type TimeRange = "hoy" | "semana" | "mes" | "personalizado";
export default function Ventas() {
  const { branding } = useBranding();
  const [clientes, setClientes] = useState<any[]>([]);
  const [inventario, setInventario] = useState<any[]>([]);
  const [ventasRecientes, setVentasRecientes] = useState<any[]>([]);
  const [selectedCliente, setSelectedCliente] = useState("");
  const [detalles, setDetalles] = useState<any[]>([
    {
      id: Date.now(),
      producto: "",
      producto_id: "",
      cantidad: 0,
      precio_unitario: 0,
    },
  ]);
  const [fechaVenta, setFechaVenta] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [originalDetalles, setOriginalDetalles] = useState<any[]>([]); // To track stock changes
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [clientSearch, setClientSearch] = useState("");
  const [range, setRange] = useState<TimeRange>("mes");
  const [customDates, setCustomDates] = useState({
    start: format(subDays(new Date(), 30), "yyyy-MM-dd"),
    end: format(new Date(), "yyyy-MM-dd"),
  });
  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };
  const [activeDropdownId, setActiveDropdownId] = useState<number | null>(null);
  const [hoveredVentaId, setHoveredVentaId] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const scrollRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const syncPosition = () => {
    if (triggerRef.current && dropdownRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const container = scrollRef.current;
      
      // Lógica de visibilidad inteligente
      if (container) {
        const containerRect = container.getBoundingClientRect();
        const padding = 10;
        if (rect.top < containerRect.top - padding || rect.bottom > containerRect.bottom + padding) {
          setActiveDropdownId(null);
          return;
        }
      }

      dropdownRef.current.style.top = `${rect.bottom + 8}px`;
      dropdownRef.current.style.left = `${rect.left}px`;
      dropdownRef.current.style.width = `${rect.width}px`;
    }
  };
  const getInterval = () => {
    const today = new Date();
    if (range === "hoy")
      return { start: startOfDay(today), end: endOfDay(today) };
    if (range === "semana")
      return {
        start: startOfWeek(today, { weekStartsOn: 1 }),
        end: endOfWeek(today, { weekStartsOn: 1 }),
      };
    if (range === "mes")
      return { start: startOfMonth(today), end: endOfMonth(today) };
    return {
      start: startOfDay(parseISO(customDates.start)),
      end: endOfDay(parseISO(customDates.end)),
    };
  };
  useEffect(() => {
    supabase
      .from("clientes")
      .select("id, nombre, telefono")
      .order("nombre")
      .then(({ data }) => {
        if (data) setClientes(data);
      });
    supabase
      .from("inventario")
      .select("*")
      .order("nombre")
      .then(({ data }) => {
        if (data) setInventario(data);
      });
  }, []);
  useEffect(() => {
    loadVentas();
  }, [range, customDates]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (activeDropdownId) {
        setActiveDropdownId(null);
      }
    };
    // Use timeout to prevent immediate closure from the same click
    const timeout = setTimeout(() => {
      if (activeDropdownId) window.addEventListener("click", handleClickOutside);
    }, 100);
    return () => {
      clearTimeout(timeout);
      window.removeEventListener("click", handleClickOutside);
    };
  }, [activeDropdownId]);

  useEffect(() => {
    if (activeDropdownId !== null && activeDropdownId !== -1) {
      // Sincronización inicial
      syncPosition();
      // Escuchadores de scroll globales con captura (para atrapar scrolls internos)
      window.addEventListener("scroll", syncPosition, true);
      window.addEventListener("resize", syncPosition);
    }
    return () => {
      window.removeEventListener("scroll", syncPosition, true);
      window.removeEventListener("resize", syncPosition);
    };
  }, [activeDropdownId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [detalles.length]);
  const loadVentas = async () => {
    const { start, end } = getInterval();
    const { data } = await (supabase.from("ventas") as any)
      .select(
        "*, clientes(nombre, identificacion, telefono, direccion, email), detalle_venta(*)",
      )
      .gte("created_at", start.toISOString())
      .lte("created_at", end.toISOString())
      .order("created_at", { ascending: false });
    if (data) setVentasRecientes(data);
  };
  const addDetalle = () => {
    setDetalles([
      ...detalles,
      {
        id: Date.now(),
        producto: "",
        producto_id: "",
        cantidad: 0,
        precio_unitario: 0,
      },
    ]);
  };
  const removeDetalle = (id: number) => {
    if (detalles.length > 1) {
      setDetalles(detalles.filter((d) => d.id !== id));
    }
  };
  const updateDetalle = (id: number, field: string, value: any) => {
    setDetalles((prev) =>
      prev.map((d) => (d.id === id ? { ...d, [field]: value } : d)),
    );
  };
  const updateMultipleDetalle = (id: number, updates: any) => {
    setDetalles((prev) =>
      prev.map((d) => (d.id === id ? { ...d, ...updates } : d)),
    );
  };
  const calcularTotal = () => {
    return detalles.reduce(
      (sum, d) => sum + Number(d.cantidad) * Number(d.precio_unitario),
      0,
    );
  };
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(val);
  const handleEditVenta = (venta: any) => {
    setEditingId(venta.id);
    setSelectedCliente(venta.cliente_id); // Process details for UI
    const mappedDetalles = venta.detalle_venta.map((d: any) => {
      // Find product_id from inventory if possible
      const invItem = inventario.find((i) => i.nombre === d.producto);
      return {
        id: d.id,
        producto: d.producto,
        producto_id: invItem?.id || "",
        cantidad: d.cantidad,
        precio_unitario: d.precio,
      };
    });
    setDetalles(mappedDetalles);
    setOriginalDetalles(mappedDetalles.map((d: any) => ({ ...d }))); // Deep copy
    setFechaVenta(new Date(venta.created_at).toISOString().split("T")[0]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const handleDeleteVenta = async (id: string) => {
    try {
      // 1. Eliminar detalles primero para evitar error de clave foránea
      await (supabase.from("detalle_venta") as any).delete().eq("venta_id", id);
      
      // 2. Eliminar la venta principal
      const { error } = await (supabase.from("ventas") as any)
        .delete()
        .eq("id", id);
        
      if (error) throw error;
      showNotification("success", "Venta eliminada correctamente");
      setConfirmDeleteId(null);
      await loadVentas();
    } catch (err) {
      console.error("Error al eliminar venta:", err);
      showNotification("error", "No se pudo eliminar la venta.");
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !selectedCliente ||
      detalles.length === 0 ||
      detalles.some((d) => !d.producto)
    ) {
      return showNotification(
        "error",
        "Completa todos los campos obligatorios",
      );
    }
    setIsSubmitting(true);
    try {
      const total = calcularTotal();
      let ventaId = editingId;
      if (editingId) {
        // UPDATE MODE
        const { error: updateError } = await (supabase.from("ventas") as any)
          .update({
            cliente_id: selectedCliente,
            total,
            created_at: new Date(fechaVenta + "T12:00:00").toISOString(),
          })
          .eq("id", editingId);
        if (updateError) throw updateError; // Handling details: simpler approach for MVP is delete and re-insert
        // But we MUST handle stock correction before deleting
        // 1. Revert old stock
        for (const oldD of originalDetalles) {
          if (oldD.producto_id) {
            const item = inventario.find((i: any) => i.id === oldD.producto_id);
            if (item) {
              const stockRestored =
                Number(item.cantidad) + Number(oldD.cantidad);
              await (supabase.from("inventario") as any)
                .update({ cantidad: stockRestored })
                .eq("id", oldD.producto_id);
            }
          }
        } // 2. Delete old details
        await (supabase.from("detalle_venta") as any)
          .delete()
          .eq("venta_id", editingId);
      } else {
        // INSERT MODE
        const { data: ventaData, error: ventaError } = await (
          supabase.from("ventas") as any
        )
          .insert([
            {
              cliente_id: selectedCliente,
              total,
              created_at: new Date(fechaVenta + "T12:00:00").toISOString(),
            },
          ])
          .select()
          .single();
        if (ventaError) throw ventaError;
        ventaId = (ventaData as any).id;
      } // INSERT DETAILS (for both new and edited)
      const insertData = detalles.map((d) => ({
        venta_id: ventaId,
        producto: d.producto,
        cantidad: Number(d.cantidad),
        precio: Number(d.precio_unitario) || 0,
      }));
      const { error: detallesError } = await (
        supabase.from("detalle_venta") as any
      ).insert(insertData);
      if (detallesError) throw detallesError; // 3. APPLY NEW STOCK (for both new and edited)
      // Refetch inventory to have latest (since we reverted stock above)
      const { data: freshInv } = await supabase.from("inventario").select("*");
      for (const d of detalles) {
        if (d.producto_id) {
          const item = (freshInv || inventario).find(
            (i) => i.id === d.producto_id,
          );
          if (item) {
            const nuevoStock = Math.max(
              0,
              Number(item.cantidad) - Number(d.cantidad),
            );
            await (supabase.from("inventario") as any)
              .update({ cantidad: nuevoStock })
              .eq("id", d.producto_id);
          }
        }
      }
      showNotification(
        "success",
        editingId ? "Venta actualizada" : "Venta registrada",
      );
      setEditingId(null);
      setSelectedCliente("");
      setFechaVenta(new Date().toISOString().split("T")[0]);
      setDetalles([
        {
          id: Date.now(),
          producto: "",
          producto_id: "",
          cantidad: 0,
          precio_unitario: 0,
        },
      ]);
      loadVentas(); // Update inventory local state
      supabase
        .from("inventario")
        .select("*")
        .order("nombre")
        .then(({ data }) => {
          if (data) setInventario(data);
        });
    } catch (err: any) {
      console.error(err);
      showNotification(
        "error",
        `Error: ${err.message || "No se pudo procesar"}`,
      );
    } finally {
      setIsSubmitting(false);
    }
  };
  const filteredVentas = ventasRecientes.filter(
    (v) =>
      v.clientes?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.detalle_venta?.some((d: any) =>
        d.producto.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
  );
  const totalPeriodo = filteredVentas.reduce(
    (acc, v) => acc + (v.total || 0),
    0,
  );
  const exportToCSV = () => {
    const headers = ["Fecha", "Cliente", "ID Venta", "Total", "Productos"];
    const rows = filteredVentas.map((v) => [
      format(new Date(v.created_at), "dd/MM/yyyy HH:mm"),
      v.clientes?.nombre || "General",
      v.id,
      v.total,
      v.detalle_venta
        ?.map((d: any) => `${d.producto} (x${d.cantidad})`)
        .join("; "),
    ]);
    const csvContent =
      "\uFEFF" +
      [headers, ...rows]
        .map((e) => e.map((cell) => `"${cell}"`).join(","))
        .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `ventas_${range}_${format(new Date(), "yyyyMMdd")}.csv`,
    );
    document.body.appendChild(link);
link.click();
    document.body.removeChild(link);
  };
  return (
    <>
    <div
      className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-12 pb-20 px-4"
      onClick={() => {
        setActiveDropdownId(null);
        if (confirmDeleteId) setConfirmDeleteId(null);
        if (notification) setNotification(null);
      }}
    >
      <div className="space-y-8 relative z-20">
        <div className="flex items-center justify-between px-2">
          <div>
            <h1 className="text-xl font-black text-gray-900 tracking-tight uppercase">
              {editingId ? "Editar Venta" : "Nueva Venta"}
            </h1>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mt-1 leading-none">
              {editingId
                ? "Ajusta los detalles del despacho"
                : "GESTIONA EL DESPACHO DE PRODUCTOS"}
            </p>
          </div>
          <div className="p-3 bg-farm/10 rounded-[1.25rem] text-farm shadow-inner">
            <ShoppingCart size={24} />
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-md p-10 rounded-[3rem] shadow-2xl border border-white/20 relative flex flex-col h-fit">
          <div className="flex-1 -mx-2 px-2 pr-4">
            <form onSubmit={handleSubmit} className="space-y-10 pb-4">
              <div className="grid grid-cols-1 sm:grid-cols-[1.3fr_0.7fr] gap-8 items-start">
                <div className="space-y-4 relative">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1.5 flex items-center gap-2">
                    <User size={14} className="text-farm" /> CLIENTE
                  </label>
                  <div
                    className={`w-full flex items-center justify-between px-6 py-4 rounded-[2.5rem] cursor-pointer transition-all bg-white border-2 border-gray-100 shadow-sm hover:border-farm/30 group ${activeDropdownId === -1 ? "ring-4 ring-farm/10 border-farm/50" : ""} `}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveDropdownId(activeDropdownId === -1 ? null : -1);
                    }}
                  >
                    <div className="flex items-center gap-6">
                      <div className="w-9 h-9 shrink-0 rounded-xl bg-white border border-gray-100 flex items-center justify-center font-black text-gray-300 text-[11px] shadow-sm group-hover:border-farm/30 group-hover:text-farm transition-all">
                        {selectedCliente ? (
                          <span className="text-farm font-black">{clientes.find(c => c.id === selectedCliente)?.nombre.charAt(0)}</span>
                        ) : (
                          <User size={22} />
                        )}
                      </div>
                      <div className="min-w-0">
                        {selectedCliente ? (
                          <span className="text-base font-medium text-gray-900 truncate block">
                            {clientes.find((c) => c.id === selectedCliente)?.nombre}
                          </span>
                        ) : (
                          <span className="text-base font-medium text-gray-300">
                            Seleccionar cliente...
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronDown
                      className={`transition-transform ${activeDropdownId === -1 ? "rotate-180 text-farm" : ""}`}
                      size={20}
                    />
                  </div>

                  {activeDropdownId === -1 && (
                    <div className="absolute z-[100] left-0 right-0 top-full mt-2 bg-white/80 backdrop-blur-xl border border-white/40 rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[400px] flex flex-col shadow-farm/10">
                      <div className="p-4 border-b border-white/20 bg-white/40 sticky top-0 z-10">
                        <div className="relative group">
                          <Search
                            size={16}
                            className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${clientSearch ? "text-farm" : "text-gray-400"}`}
                          />
                          <input
                            autoFocus
                            type="text"
                            placeholder="Buscar cliente..."
                            className="w-full bg-white border-none rounded-2xl pl-11 pr-4 py-3 text-sm font-bold text-gray-700 outline-none ring-2 ring-transparent focus:ring-farm/20 transition-all placeholder:text-gray-300"
                            value={clientSearch}
                            onChange={(e) => setClientSearch(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </div>

                      <div className="p-2 space-y-1 overflow-y-auto custom-scrollbar max-h-[165px] flex-1">
                        {clientes.filter(c => 
                          c.nombre.toLowerCase().includes(clientSearch.toLowerCase()) ||
                          (c.telefono && c.telefono.includes(clientSearch))
                        ).length > 0 ? (
                          clientes
                            .filter(c => 
                              c.nombre.toLowerCase().includes(clientSearch.toLowerCase()) ||
                              (c.telefono && c.telefono.includes(clientSearch))
                            )
                            .map((c) => (
                              <div
                                key={c.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedCliente(selectedCliente === c.id ? "" : c.id);
                                  setActiveDropdownId(null);
                                  setClientSearch("");
                                }}
                                className={`flex items-center justify-between px-4 py-3.5 rounded-2xl cursor-pointer transition-all group ${selectedCliente === c.id ? "bg-farm text-white shadow-lg shadow-farm/20" : "hover:bg-gray-50 text-gray-600"}`}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black ${selectedCliente === c.id ? "bg-white/20" : "bg-gray-100 text-gray-400"}`}>
                                    {c.nombre.charAt(0)}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="font-black truncate">
                                      {c.nombre}
                                    </div>
                                  </div>
                                </div>
                                {selectedCliente === c.id && (
                                  <CheckCircleIcon size={16} />
                                )}
                              </div>
                            ))
                        ) : (
                          <div className="p-12 text-center">
                            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">No se encontraron clientes</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="relative">
                  <DatePicker
                    label="FECHA DE VENTA"
                    icon={<Calendar size={14} className="text-farm" />}
                    value={fechaVenta}
                    onChange={setFechaVenta}
                    className="[&>div:nth-child(2)]:mt-4"
                  />
                </div>
              </div>
              <div className="space-y-8 pt-4">
                <div className="relative" id="ventas-container">
                  <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2 mb-4">
                    <Box size={14} className="text-farm" /> DETALLE DE PRODUCTOS
                  </h3>
                  <div 
                    ref={scrollRef}
                    className="max-h-[170px] overflow-y-auto pr-2 pb-5 custom-scrollbar space-y-4 transition-all"
                  >
                    {detalles.map((d, index) => (
                      <div
                        key={d.id}
                        className="relative bg-gray-50/50 p-4 rounded-[2.5rem] border border-gray-100 grid grid-cols-1 md:grid-cols-[1fr_80px_160px_40px] gap-4 items-center group"
                      >
                        {/* Producto */}
                        <div className="space-y-1 relative min-w-0">
                          <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest ml-1 mb-2 block text-left">
                            PRODUCTO
                          </label>
                          <div
                            className="w-full bg-white border border-gray-100 rounded-xl px-4 py-2 text-sm font-semibold focus-within:ring-2 focus-within:ring-farm/20 cursor-pointer flex justify-between items-center transition-all hover:border-farm/30 min-w-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              triggerRef.current = e.currentTarget;
                              setActiveDropdownId(
                                activeDropdownId === d.id ? null : d.id,
                              );
                              setTimeout(syncPosition, 0);
                            }}
                          >
                            <span className={`truncate ${d.producto ? "text-gray-900" : "text-gray-400"}`}>
                              {d.producto || "Ej. AAA"}
                            </span>
                            <ChevronDown size={14} className={`shrink-0 text-gray-400 transition-transform ${activeDropdownId === d.id ? "rotate-180" : ""}`} />
                          </div>
                        </div>

                        {/* Cantidad */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest ml-1 text-center block mb-2">
                            CANT.
                          </label>
                          <input
                            type="number"
                            min="1"
                            required
                            className="w-full bg-white border border-gray-100 rounded-xl px-2 py-2 text-sm font-black text-center outline-none ring-0 focus:ring-2 focus:ring-farm/20 transition-all min-w-0"
                            value={d.cantidad}
                            onChange={(e) => updateDetalle(d.id, "cantidad", e.target.value)}
                          />
                        </div>

                        {/* Precio Unitario */}
                        <div className="space-y-1">
                          <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-widest ml-1 text-right mb-2">
                            PRECIO UNIT. ($)
                          </label>
                           <input
                            type="text"
                            inputMode="numeric"
                            required
                            className="w-full bg-white border border-gray-100 rounded-xl px-3 py-2 text-sm font-black text-farm text-right outline-none ring-0 focus:ring-2 focus:ring-farm/20 transition-all min-w-0"
                            value={Number(d.precio_unitario || 0).toLocaleString("es-CO")}
                            onChange={(e) => {
                              const raw = e.target.value.replace(/\./g, "").replace(/[^0-9]/g, "");
                              updateDetalle(d.id, "precio_unitario", raw === "" ? 0 : parseInt(raw));
                            }}
                          />
                        </div>

                        {/* Acciones */}
                        <div className="flex items-center justify-center pt-4 md:pt-4">
                          {index !== 0 && (
                            <button
                              type="button"
                              onClick={() => removeDetalle(d.id)}
                              className="p-2 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={addDetalle}
                  className="flex items-center gap-2 text-[10px] font-black text-farm uppercase tracking-[0.2em] hover:translate-x-1 transition-all"
                >
                  <Plus size={16} /> AÑADIR PRODUCTO
                </button>
              </div>

              <div className="pt-8 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6 w-full px-2">
                <div className="flex-1 flex justify-start min-w-0 transition-all">
                  <div className="bg-farm text-white px-8 py-4 rounded-full shadow-xl shadow-farm/20 transition-all hover:scale-[1.02] flex flex-col min-w-0">
                    <span className="text-[10px] font-semibold opacity-60 block leading-none mb-1.5 uppercase tracking-widest">
                      TOTAL
                    </span>
                    <p
                      className="text-xl md:text-2xl font-black transition-all truncate tracking-tighter"
                      title={formatCurrency(calcularTotal())}
                    >
                      {formatCurrency(calcularTotal())}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 flex-shrink-0 w-full md:w-auto pb-1">
                  {editingId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(null);
                        setSelectedCliente("");
                        setDetalles([
                          {
                            id: Date.now(),
                            producto: "",
                            producto_id: "",
                            cantidad: 0,
                            precio_unitario: 0,
                          },
                        ]);
                      }}
                      className="hidden sm:block px-6 py-4 bg-red-500 text-white font-black rounded-full shadow-lg shadow-red-200 transition-all hover:scale-105 active:scale-95 uppercase text-[10px] tracking-widest whitespace-nowrap"
                    >
                      Can
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`flex-1 md:flex-none px-12 py-5 ${editingId ? "bg-farm" : "bg-gray-900"} text-white font-black rounded-full shadow-2xl transition-all hover:scale-[1.05] active:scale-[0.98] uppercase text-[10px] md:text-xs tracking-widest whitespace-nowrap ${isSubmitting ? "opacity-50 cursor-not-allowed" : "hover:opacity-90"} flex items-center justify-center`}
                  >
                    {isSubmitting
                      ? "Procesando..."
                      : editingId
                        ? "Actualizar"
                        : "Finalizar Venta"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div className="space-y-8 relative z-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <h2 className="text-lg font-black text-gray-800 uppercase tracking-tight">
            HISTORIAL RECIENTE
          </h2>
          <div className="flex items-center gap-1 bg-gray-100/50 p-1.5 rounded-2xl border border-gray-100 min-w-0 shrink-0">
            {(["hoy", "semana", "mes", "personalizado"] as TimeRange[]).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`flex-1 sm:flex-none px-3 py-1.5 rounded-xl text-[11px] font-medium transition-all whitespace-nowrap ${range === r ? "bg-farm text-white shadow-lg shadow-farm/20" : "text-gray-400 hover:text-gray-600 hover:bg-white"}`}
              >
                {r === "personalizado" ? "pers." : r}
              </button>
            ))}
          </div>
        </div>

        {range === "personalizado" && (
          <div className="bg-white p-2 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <DatePicker
                value={customDates.start}
                onChange={(d) => setCustomDates({ ...customDates, start: d })}
                compact
              />
            </div>
            <span className="text-gray-300 font-black text-[9px] tracking-widest shrink-0">
              →
            </span>
            <div className="flex-1 min-w-0">
              <DatePicker
                value={customDates.end}
                onChange={(d) => setCustomDates({ ...customDates, end: d })}
                compact
                align="right"
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-semibold text-gray-400 leading-none">
                  RESUMEN DEL PERIODO
                </span>
                <span className="text-[8px] font-bold text-gray-300 uppercase tracking-tighter">
                  ({filteredVentas.length})
                </span>
              </div>
              <span className="text-2xl font-black text-farm leading-none tracking-tight">
                {formatCurrency(totalPeriodo)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-gray-50/50 px-3 py-1.5 rounded-full border border-gray-100 shadow-sm group/search focus-within:border-farm/30 transition-all">
              <Search
                className="text-gray-300 group-focus-within/search:text-farm transition-colors"
                size={14}
              />
              <input
                type="text"
                placeholder="Buscar cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-20 sm:w-32 bg-transparent text-[10px] font-medium outline-none placeholder:text-gray-200 text-gray-700 tracking-wider"
              />
            </div>
            <button
              onClick={exportToCSV}
              className="p-1.5 bg-gray-50/50 border border-gray-100 rounded-full text-gray-300 hover:text-farm hover:border-farm/30 transition-all shadow-sm flex items-center justify-center"
              title="Exportar a CSV"
            >
              <Download size={14} />
            </button>
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden relative group">
          <div className="max-h-[485px] overflow-y-auto custom-scrollbar divide-y divide-gray-50">
            {filteredVentas.map((v) => (
              <div
                key={v.id}
                className="p-5 hover:bg-gray-50/50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="min-w-0 flex-1 relative">
                    <div className="flex items-center gap-2 mb-0.5">
                      <div className="font-bold text-gray-900 truncate">
                        {v.clientes?.nombre}
                      </div>
                      <div
                        onMouseEnter={(e) => {
                          setHoveredVentaId(v.id);
                          setMousePos({ x: e.clientX, y: e.clientY });
                        }}
                        onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}
                        onMouseLeave={() => setHoveredVentaId(null)}
                        className="p-1 text-gray-300 hover:text-farm transition-colors cursor-help"
                      >
                        <Eye size={14} />
                      </div>
                      {hoveredVentaId === v.id && (
                        <div
                          className="fixed z-[9999] bg-white/95 backdrop-blur-md border border-gray-100 shadow-2xl rounded-[2.5rem] p-5 min-w-[260px] max-w-[320px] pointer-events-none"
                          style={{
                            left: `${Math.min(mousePos.x + 15, window.innerWidth - 280)}px`,
                            top: `${Math.min(mousePos.y + 15, window.innerHeight - 300)}px`,
                          }}
                        >
                          <div className="text-[10px] font-semibold text-gray-400 mb-4 border-b border-gray-50 pb-2">
                            Resumen del Pedido
                          </div>
                          <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                            {v.detalle_venta?.map((d: any) => (
                              <div
                                key={d.id}
                                className="flex flex-col border-b border-dashed border-gray-100/50 pb-2.5 last:border-0 last:pb-0"
                              >
                                <span className="text-sm font-black text-gray-800 tracking-tight leading-snug">
                                  {d.producto}
                                </span>
                                <div className="flex flex-col items-start mt-1 space-y-0.5">
                                  <span className="text-[9px] font-semibold text-gray-400 flex items-center gap-1">
                                    <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-500">
                                      {d.cantidad} uds
                                    </span>
                                    <span className="text-gray-300">×</span>
                                    {formatCurrency(Number(d.precio || 0))}
                                  </span>
                                  <span className="text-[15px] font-black text-farm tracking-tighter pt-0.5">
                                    {formatCurrency(Number(d.precio || 0) * Number(d.cantidad || 0))}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="mt-4 pt-3 border-t-2 border-dashed border-gray-100 flex flex-col items-end gap-1">
                            <span className="text-[10px] font-semibold text-gray-400">
                              TOTAL PEDIDO
                            </span>
                            <span className="text-xl font-black text-gray-900 leading-none">
                              {formatCurrency(v.total || 0)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1">
                      <Calendar size={12} />
                      {new Date(v.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="font-black text-farm text-sm text-right min-w-[90px] tracking-tighter">
                    {formatCurrency(v.total)}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleEditVenta(v)}
                      className="p-1.5 text-gray-300 hover:text-farm transition-all hover:bg-farm/5 rounded-xl"
                      title="Editar Venta"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => generateReceipt(v, "venta", branding)}
                      className="p-1.5 text-farm hover:bg-farm/5 rounded-xl transition-all"
                      title="Ver Comprobante"
                    >
                      <FileText size={14} />
                    </button>
                    {confirmDeleteId === v.id ? (
                      <div className="flex gap-1 items-center w-[85px] justify-end">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmDeleteId(null);
                          }}
                          className="text-[8px] font-semibold text-gray-400 hover:text-gray-600 px-2 py-1 rounded-lg bg-gray-50 border border-gray-100 transition-all font-sans"
                        >
                          No
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteVenta(v.id);
                          }}
                          className="text-[8px] font-black text-white bg-red-500 hover:bg-red-600 px-2 py-1 rounded-lg shadow-lg shadow-red-500/20 transition-all font-sans"
                        >
                          Sí
                        </button>
                      </div>
                    ) : (
                      <div className="w-[85px] flex justify-end">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmDeleteId(v.id);
                          }}
                          className="p-1.5 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-40 hover:opacity-100"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SELECTOR DE PRODUCTOS PORTABLE (GLUED SYNC PORTAL) */}
      {activeDropdownId !== null && activeDropdownId !== -1 && createPortal(
        <div
          ref={dropdownRef}
          className="fixed z-[100000] animate-in fade-in slide-in-from-top-2 duration-300 pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-white border border-gray-200 rounded-2xl shadow-[0_30px_60px_-12px_rgba(0,0,0,0.3)] overflow-hidden max-h-40 overflow-y-auto custom-scrollbar">
            <div className="p-1.5 space-y-1">
              {inventario.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const isSelected = detalles.find((d) => d.id === activeDropdownId)?.producto_id === p.id;
                    
                    if (isSelected) {
                      updateMultipleDetalle(activeDropdownId, {
                        producto: "",
                        producto_id: "",
                        precio_unitario: 0,
                      });
                    } else {
                      updateMultipleDetalle(activeDropdownId, {
                        producto: p.nombre,
                        producto_id: p.id,
                        precio_unitario: p.precio_unidad || 0,
                      });
                    }
                    setActiveDropdownId(null);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all ${detalles.find((d) => d.id === activeDropdownId)?.producto_id === p.id ? "bg-farm text-white" : "hover:bg-farm/10 text-gray-600"}`}
                >
                  <div className="flex justify-between items-center">
                    <span>{p.nombre}</span>
                    <span className="text-[10px] opacity-60">
                      Stock: {p.cantidad}
                    </span>
                  </div>
                </button>
              ))}
              {inventario.length === 0 && (
                <div className="p-4 text-center text-xs text-gray-400">
                  No hay productos en inventario
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
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
