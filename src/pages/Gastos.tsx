import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import {
  ReceiptText,
  Plus,
  Trash2,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Pencil,
  Search,
  Download,
  X,
} from "lucide-react";
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
const CATEGORIAS = [
  "Alimento",
  "Transporte",
  "Sueldos",
  "Mantenimiento",
  "Medicinas",
  "Otros",
];
const RANGES: TimeRange[] = ["hoy", "semana", "mes", "personalizado"];
export default function Gastos() {
  const [gastos, setGastos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newGasto, setNewGasto] = useState({
    descripcion: "",
    categoria: "Alimento",
    monto: "",
    fecha: new Date().toISOString().split("T")[0],
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [range, setRange] = useState<TimeRange>("mes");
  const [customDates, setCustomDates] = useState({
    start: format(subDays(new Date(), 30), "yyyy-MM-dd"),
    end: format(new Date(), "yyyy-MM-dd"),
  });
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
  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };
  const loadGastos = async () => {
    setLoading(true);
    try {
      const { start, end } = getInterval();
      const { data, error } = await (supabase.from("gastos") as any)
        .select("*")
        .gte("fecha", format(start, "yyyy-MM-dd"))
        .lte("fecha", format(end, "yyyy-MM-dd"))
        .order("fecha", { ascending: false });
      if (error) throw error;
      setGastos(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  const filteredGastos = gastos.filter(
    (g) =>
      g.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.categoria?.toLowerCase().includes(searchTerm.toLowerCase()),
  );
  const totalPeriodo = filteredGastos.reduce(
    (acc, g) => acc + Number(g.monto || 0),
    0,
  );
  const exportToCSV = () => {
    const headers = ["Fecha", "Descripción", "Categoría", "Monto"];
    const rows = filteredGastos.map((g) => [
      g.fecha,
      g.descripcion,
      g.categoria,
      g.monto,
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
      `gastos_${range}_${format(new Date(), "yyyyMMdd")}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  useEffect(() => {
    loadGastos();
  }, [range, customDates]);
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGasto.descripcion || !newGasto.monto) return;
    try {
      if (editingId) {
        const { error } = await (supabase.from("gastos") as any)
          .update([{ ...newGasto, monto: Number(newGasto.monto) }])
          .eq("id", editingId);
        if (error) throw error;
        showNotification("success", "Gasto actualizado correctamente");
      } else {
        const { error } = await (supabase.from("gastos") as any).insert([
          { ...newGasto, monto: Number(newGasto.monto) },
        ]);
        if (error) throw error;
        showNotification("success", "Gasto guardado correctamente");
      }
      setIsModalOpen(false);
      setEditingId(null);
      setNewGasto({
        descripcion: "",
        categoria: "Alimento",
        monto: "",
        fecha: new Date().toISOString().split("T")[0],
      });
      await loadGastos();
    } catch (err) {
      showNotification("error", "Error al procesar el gasto.");
    }
  };
  const handleEdit = (gasto: any) => {
    setNewGasto({
      descripcion: gasto.descripcion,
      categoria: gasto.categoria,
      monto: gasto.monto.toString(),
      fecha: gasto.fecha,
    });
    setEditingId(gasto.id);
    setIsModalOpen(true);
  };
  const handleDelete = async (id: string) => {
    try {
      const { error } = await (supabase.from("gastos") as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
      showNotification("success", "Gasto eliminado correctamente");
      setConfirmDeleteId(null);
      await loadGastos();
    } catch (err) {
      showNotification("error", "Error eliminando registro.");
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
      className="max-w-7xl mx-auto space-y-12 animate-in fade-in duration-500 pb-12"
      onClick={() => {
        confirmDeleteId && setConfirmDeleteId(null);
      }}
    >

      {/* Header General */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-xl font-black text-gray-900 tracking-tight uppercase">
            Gestión de Egresos
          </h1>
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mt-1 leading-none">
            REGISTRA Y CONTROLA LAS SALIDAS DE DINERO
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-red-500 hover:bg-red-600 text-white px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-xl shadow-red-500/20 hover:scale-[1.05] active:scale-[0.98] uppercase tracking-wide"
        >
          <Plus size={20} /> REGISTRAR GASTO
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-12 items-start">
        {/* Columna Izquierda: Historial */}
        <div className="space-y-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-lg font-black text-gray-800 uppercase tracking-tight">
              HISTORIAL DE EGRESOS
            </h2>
            <div className="flex items-center gap-1 bg-gray-100/50 p-1.5 rounded-2xl border border-gray-100 shrink-0">
              {range === "personalizado" && (
                <>
                  <div className="w-[90px]">
                    <DatePicker
                      value={customDates.start}
                      onChange={(d) => setCustomDates({ ...customDates, start: d })}
                      compact
                    />
                  </div>
                  <span className="text-gray-300 text-[9px] font-bold px-0.5 shrink-0">→</span>
                  <div className="w-[90px]">
                    <DatePicker
                      value={customDates.end}
                      onChange={(d) => setCustomDates({ ...customDates, end: d })}
                      compact
                      align="right"
                    />
                  </div>
                  <div className="w-px h-4 bg-gray-200 mx-1 shrink-0" />
                </>
              )}
              {RANGES.map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-medium transition-all whitespace-nowrap ${range === r ? "bg-red-500 text-white shadow-lg shadow-red-500/20" : "text-gray-400 hover:text-gray-600 hover:bg-white"}`}
                >
                  {r === "personalizado" ? "pers." : r}
                </button>
              ))}
            </div>
          </div>



          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-3">
              <div className="flex flex-col">
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] font-semibold text-gray-400 leading-none">
                    RESUMEN DE EGRESOS
                  </span>
                  <span className="text-[8px] font-bold text-gray-300 uppercase tracking-tighter">
                    ({filteredGastos.length})
                  </span>
                </div>
                <span className="text-2xl font-black text-red-500 leading-none tracking-tight">
                  {formatCurrency(totalPeriodo)}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 bg-gray-50/50 px-3 py-1.5 rounded-full border border-gray-100 shadow-sm group/search focus-within:border-red-500/30 transition-all">
                <Search
                  className="text-gray-300 group-focus-within/search:text-red-500 transition-colors"
                  size={14}
                />
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-20 sm:w-32 bg-transparent text-[10px] font-medium outline-none placeholder:text-gray-200 text-gray-700 font-sans"
                />
              </div>
              <button
                onClick={exportToCSV}
                className="p-1.5 bg-gray-50/50 border border-gray-100 rounded-full text-gray-300 hover:text-red-500 hover:border-red-500/30 transition-all shadow-sm flex items-center justify-center"
                title="Exportar a CSV"
              >
                <Download size={14} />
              </button>
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden">
            <div className="relative">
              <div className="max-h-[452px] overflow-y-auto custom-scrollbar pb-3">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-gray-50 text-gray-400 text-[10px] font-black uppercase tracking-widest border-b sticky top-0 z-10">
                        <th className="px-6 py-4">Fecha / Concepto</th>
                        <th className="px-6 py-4">Categoría</th>
                        <th className="px-6 py-4 text-right">Monto</th>
                        <th className="px-6 py-4"></th>
                      </tr>
                    </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredGastos.map((gasto) => (
                      <tr
                        key={gasto.id}
                        className="hover:bg-red-50/30 transition-colors group italic__text"
                      >
                        <td className="px-6 py-4">
                          <div className="text-sm font-bold text-gray-900 leading-tight">
                            {gasto.descripcion}
                          </div>
                          <div className="text-[10px] text-gray-400 font-bold uppercase mt-0.5 flex items-center gap-1">
                            <Calendar size={12} /> {gasto.fecha}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 bg-gray-100 text-gray-500 rounded-lg text-[9px] font-black uppercase tracking-tighter">
                            {gasto.categoria}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-black text-red-600 tracking-tighter min-w-[120px]">
                          {formatCurrency(Number(gasto.monto || 0))}
                        </td>
                        <td className="px-4 py-4 text-right w-[180px] whitespace-nowrap">
                          <div className="flex gap-1 justify-end items-center opacity-0 group-hover:opacity-100 transition-opacity w-full">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(gasto);
                              }}
                              className="p-1.5 text-gray-300 hover:text-farm transition-all hover:bg-farm/5 rounded-xl"
                            >
                              <Pencil size={14} />
                            </button>
                            {confirmDeleteId === gasto.id ? (
                              <div className="flex gap-1 items-center">
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
                                    handleDelete(gasto.id);
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
                                  setConfirmDeleteId(gasto.id);
                                }}
                                className="p-1.5 text-gray-300 hover:text-red-500 transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {gastos.length === 0 && !loading && (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-gray-400 font-bold uppercase text-[10px] tracking-widest">
                          No hay gastos registrados.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
              {/* Gradiente sutil — dentro del relative, pointer-events:none */}
              {filteredGastos.length > 0 && (
                <div
                  className="pointer-events-none absolute bottom-0 left-0 right-0 h-8"
                  style={{ background: 'linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.75) 60%, rgba(255,255,255,0.97) 100%)' }}
                />
              )}
            </div>
          </div>
        </div>

        {/* Columna Derecha: Estadísticas */}
        <div className="space-y-8">
          <div className="bg-red-500 text-white p-6 rounded-[2.5rem] shadow-xl shadow-red-500/20 relative overflow-hidden group">
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">
                  Total Gastos Hoy
                </h3>
                <ReceiptText size={20} className="opacity-60" />
              </div>
              <p className="text-4xl font-black tracking-tighter">
                {formatCurrency(
                  gastos
                    .filter((g) => g.fecha === new Date().toISOString().split("T")[0])
                    .reduce((s, g) => s + Number(g.monto || 0), 0),
                )}
              </p>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
          </div>

          <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/20">
            <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-4 block">
              Distribución por Categoría
            </h3>
            <div className="space-y-4">
              {CATEGORIAS.map((cat) => {
                const totalCat = filteredGastos
                  .filter((g) => g.categoria === cat)
                  .reduce((s, g) => s + Number(g.monto || 0), 0);
                const porcentaje = totalPeriodo > 0 ? (totalCat / totalPeriodo) * 100 : 0;
                if (totalCat === 0) return null;
                return (
                  <div key={cat} className="space-y-2">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-tight">
                      <span className="text-gray-600">{cat}</span>
                      <span className="text-red-500">{formatCurrency(totalCat)}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-red-500 rounded-full"
                        style={{ width: `${porcentaje}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
              {filteredGastos.length === 0 && (
                <p className="text-[10px] font-bold text-gray-300 uppercase">
                  Sin datos en este periodo
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[1000] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">
                {editingId ? "Editar Gasto" : "Nuevo Egreso"}
              </h2>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingId(null);
                  setNewGasto({
                    descripcion: "",
                    categoria: "Alimento",
                    monto: "",
                    fecha: new Date().toISOString().split("T")[0],
                  });
                }}
                className="p-2 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-8 space-y-8">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">
                  Concepto / Descripción
                </label>
                <input
                  required
                  type="text"
                  placeholder="Ej: Bulto de purina..."
                  className="w-full border-gray-200 border rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500/20 font-semibold"
                  value={newGasto.descripcion}
                  onChange={(e) => setNewGasto({ ...newGasto, descripcion: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase ml-1">
                    Monto ($)
                  </label>
                  <input
                    required
                    type="text"
                    inputMode="numeric"
                    className="w-full border-gray-200 border rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500/20 font-black text-red-600"
                    value={newGasto.monto ? Number(newGasto.monto).toLocaleString("es-CO") : ""}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\./g, "").replace(/[^0-9]/g, "");
                      setNewGasto({
                        ...newGasto,
                        monto: raw === "" ? "" : raw,
                      });
                    }}
                  />
                </div>
                <div className="space-y-1">
                  <DatePicker
                    label="Fecha"
                    icon={<Calendar size={14} className="text-farm" />}
                    value={newGasto.fecha}
                    onChange={(date) => setNewGasto({ ...newGasto, fecha: date })}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">
                  Categoría
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {CATEGORIAS.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setNewGasto({ 
                        ...newGasto, 
                        categoria: newGasto.categoria === cat ? "" : cat 
                      })}
                      className={`px-3 py-3 rounded-xl text-[10px] font-bold uppercase tracking-tighter transition-all border ${newGasto.categoria === cat ? "border-red-500 bg-red-50 text-red-600 shadow-sm" : "border-gray-100 text-gray-400 hover:bg-gray-50"}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-4 rounded-2xl font-bold text-gray-500 hover:bg-gray-100 transition-colors uppercase text-sm tracking-widest"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`flex-1 px-4 py-4 ${editingId ? "bg-farm" : "bg-red-500"} text-white rounded-2xl font-black transition-all uppercase text-sm tracking-widest shadow-lg shadow-red-500/20 hover:scale-[1.02] active:scale-[0.98]`}
                >
                  {editingId ? "Actualizar" : "Guardar"}
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
