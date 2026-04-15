import { useEffect, useState, useRef } from "react";
import { supabase } from "../lib/supabase";
import {
  Trash2,
  CheckCircle2,
  AlertCircle,
  Search,
  User,
  ChevronDown,
  Wallet,
  Building2,
  Smartphone,
  CreditCard,
  FileText,
  Pencil,
  Calendar,
  Download,
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
export default function Pagos() {
  const { branding } = useBranding();
  const [clientes, setClientes] = useState<any[]>([]);
  const [selectedCliente, setSelectedCliente] = useState("");
  const [deudaActual, setDeudaActual] = useState(0);
  const [monto, setMonto] = useState("");
  const [metodo, setMetodo] = useState("Efectivo");
  const [fechaPago, setFechaPago] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null); // Estados para el Selector Premium
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const [isMethodOpen, setIsMethodOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const methodRef = useRef<HTMLDivElement>(null);
  const [pagosRecientes, setPagosRecientes] = useState<any[]>([]);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
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
  useEffect(() => {
    // Cerrar el selector si se hace clic fuera
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsSelectOpen(false);
      }
      if (
        methodRef.current &&
        !methodRef.current.contains(event.target as Node)
      ) {
        setIsMethodOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  useEffect(() => {
    supabase
      .from("clientes")
      .select("id, nombre")
      .order("nombre")
      .then(({ data }) => {
        if (data) setClientes(data);
      });
  }, []);
  useEffect(() => {
    loadPagosRecientes();
  }, [range, customDates]);
  const loadPagosRecientes = async () => {
    const { start, end } = getInterval();
    const { data } = await (supabase.from("pagos") as any)
      .select("*, clientes(nombre, identificacion, telefono, direccion, email)")
      .gte("created_at", start.toISOString())
      .lte("created_at", end.toISOString())
      .order("created_at", { ascending: false });
    if (data) setPagosRecientes(data.filter((p: any) => (p.monto || 0) > 0));
  };
  const filteredPagos = pagosRecientes.filter(
    (p) =>
      p.clientes?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.metodo?.toLowerCase().includes(searchTerm.toLowerCase()),
  );
  const totalPeriodo = filteredPagos.reduce(
    (acc, p) => acc + (p.monto || 0),
    0,
  );
  const exportToCSV = () => {
    const headers = ["Fecha", "Cliente", "Monto", "Método"];
    const rows = filteredPagos.map((p) => [
      format(new Date(p.created_at), "dd/MM/yyyy HH:mm"),
      p.clientes?.nombre || "General",
      p.monto,
      p.metodo,
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
      `pagos_${range}_${format(new Date(), "yyyyMMdd")}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  useEffect(() => {
    if (selectedCliente) {
      calculateDebt(selectedCliente); // Dar foco al monto al cambiar de cliente
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setDeudaActual(0);
    }
  }, [selectedCliente]);
  const calculateDebt = async (clientId: string) => {
    const { data: ventas } = await (supabase.from("ventas") as any)
      .select("total")
      .eq("cliente_id", clientId);
    const { data: pagos } = await (supabase.from("pagos") as any)
      .select("monto")
      .eq("cliente_id", clientId);
    const totalVentas =
      (ventas as any[])?.reduce((sum, v) => sum + (v.total || 0), 0) || 0;
    const totalPagos =
      (pagos as any[])?.reduce((sum, p) => sum + (p.monto || 0), 0) || 0;
    setDeudaActual(totalVentas - totalPagos);
  };
  const handleSaldarTodo = () => {
    if (deudaActual > 0) {
      setMonto(deudaActual.toString());
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };
  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };
  const handleDeletePago = async (id: string) => {
    try {
      const { error } = await (supabase.from("pagos") as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
      showNotification("success", "Abono eliminado correctamente");
      setConfirmDeleteId(null);
      await loadPagosRecientes();
      if (selectedCliente) calculateDebt(selectedCliente); // Mantener foco siempre
      setTimeout(() => inputRef.current?.focus(), 50);
    } catch (err) {
      showNotification("error", "Error al eliminar el abono");
    }
  };
  const handleEditPago = (pago: any) => {
    setSelectedCliente(pago.cliente_id);
    setMonto(pago.monto.toString());
    setMetodo(pago.metodo_pago);
    setFechaPago(new Date(pago.created_at).toISOString().split("T")[0]);
    setEditingId(pago.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCliente || !monto || Number(monto) <= 0) return;
    setIsSubmitting(true);
    try {
      if (editingId) {
        const { error } = await (supabase.from("pagos") as any)
          .update({
            cliente_id: selectedCliente,
            monto: Number(monto),
            metodo_pago: metodo,
            created_at: new Date(fechaPago).toISOString(),
          })
          .eq("id", editingId);
        if (error) throw error;
        showNotification("success", "Abono actualizado correctamente");
      } else {
        const { error } = await (supabase.from("pagos") as any).insert([
          {
            cliente_id: selectedCliente,
            monto: Number(monto),
            metodo_pago: metodo,
            created_at: new Date(fechaPago).toISOString(),
          },
        ]);
        if (error) throw error;
        showNotification("success", `Abono registrado`);
      }
      setMonto("");
      setFechaPago(new Date().toISOString().split("T")[0]);
      setEditingId(null);
      setIsSubmitting(false);
      calculateDebt(selectedCliente);
      loadPagosRecientes();
      setTimeout(() => inputRef.current?.focus(), 50);
    } catch (err: any) {
      console.error(err);
      setIsSubmitting(false);
      showNotification("error", `Error: ${err.message || "Error al procesar"}`);
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
      className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 pb-20 px-0 lg:px-4"
      onClick={() => confirmDeleteId && setConfirmDeleteId(null)}
    >
      {" "}
      <div className="space-y-8 relative z-20">
        {" "}
        <div className="hidden lg:flex justify-between items-start">
          {" "}
          <div>
            <h1 className="text-lg font-bold text-gray-900 tracking-tight uppercase">
              Control de Abonos
            </h1>
            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest mt-0.5 leading-none">
              GESTIÓN DE CARTERA Y ABONOS A CAPITAL
            </p>
          </div>{" "}
        </div>{" "}
        <div className="bg-white p-6 lg:p-7 rounded-[2rem] lg:rounded-[2.5rem] shadow-xl border border-white/20">
          {" "}
          <form onSubmit={handleSubmit} className="space-y-8 lg:space-y-10">
            {" "}
              <div className="space-y-4">
                {" "}
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] ml-2 flex items-center gap-2">
                  <User size={14} className="text-farm" /> CLIENTE RESPONSABLE
                </label>{" "}
              <div className="relative" ref={dropdownRef}>
                {" "}
                {/* Selector Trigger */}{" "}
                <div
                  onClick={() => setIsSelectOpen(!isSelectOpen)}
                  className={` w-full flex items-center justify-between px-6 py-4 rounded-[2.5rem] cursor-pointer transition-all duration-300 bg-white border-2 border-gray-100 shadow-sm hover:border-farm/30 group ${isSelectOpen ? "ring-4 ring-farm/10 border-farm/50" : ""} `}
                >
                  {" "}
                  <div className="flex items-center gap-6">
                    {" "}
                    <div className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:text-farm transition-colors">
                      {" "}
                      <User size={22} />{" "}
                    </div>{" "}
                    <div>
                      {" "}
                      {selectedCliente ? (
                        <span className="text-lg font-medium text-gray-900 truncate max-w-[200px] block">
                          {" "}
                          {
                            clientes.find((c) => c.id === selectedCliente)
                              ?.nombre
                          }{" "}
                        </span>
                      ) : (
                        <span className="text-lg font-medium text-gray-300">
                          Seleccionar cliente...
                        </span>
                      )}{" "}
                    </div>{" "}
                  </div>{" "}
                  <ChevronDown
                    size={20}
                    className={`text-gray-300 transition-transform duration-300 ${isSelectOpen ? "rotate-180 text-farm" : ""}`}
                  />{" "}
                </div>{" "}
                {/* Dropdown Menu */}{" "}
                {isSelectOpen && (
                  <div className="absolute top-full left-0 right-0 mt-3 bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-2xl border border-white/40 z-[100] overflow-hidden">
                    {" "}
                    {/* Search Field */}{" "}
                    <div className="p-4 border-b border-white/20 bg-white/40 pb-2">
                      {" "}
                      <div className="relative">
                        {" "}
                        <Search
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                          size={16}
                        />{" "}
                        <input
                          autoFocus
                          type="text"
                          placeholder="Buscar cliente..."
                          className="w-full bg-gray-50/50 border-none rounded-2xl pl-11 pr-4 py-3 text-sm font-medium text-gray-700 outline-none ring-2 ring-transparent focus:ring-farm/20 transition-all placeholder:text-gray-200"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                        />{" "}
                      </div>{" "}
                    </div>{" "}
                    {/* Options List */}{" "}
                    <div className="max-h-[165px] overflow-y-auto p-2 custom-scrollbar">
                      {" "}
                      {clientes.filter((c) =>
                        c.nombre
                          .toLowerCase()
                          .includes(searchTerm.toLowerCase()),
                      ).length > 0 ? (
                        clientes
                          .filter((c) =>
                            c.nombre
                              .toLowerCase()
                              .includes(searchTerm.toLowerCase()),
                          )
                          .map((c) => (
                            <div
                              key={c.id}
                              onClick={() => {
                                setSelectedCliente(selectedCliente === c.id ? "" : c.id);
                                setIsSelectOpen(false);
                                setSearchTerm("");
                              }}
                              className={` flex items-center justify-between px-4 py-3.5 rounded-2xl cursor-pointer transition-all group ${selectedCliente === c.id ? "bg-farm text-white shadow-lg shadow-farm/20" : "hover:bg-gray-50 text-gray-600"} `}
                            >
                              {" "}
                              <div className="flex items-center gap-3">
                                {" "}
                                <div
                                  className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black ${selectedCliente === c.id ? "bg-white/20" : "bg-gray-100 text-gray-400"}`}
                                >
                                  {" "}
                                  {c.nombre.charAt(0)}{" "}
                                </div>{" "}
                                <span className="font-black truncate">
                                  {c.nombre}
                                </span>{" "}
                              </div>{" "}
                              {selectedCliente === c.id && (
                                <CheckCircle2 size={16} />
                              )}{" "}
                            </div>
                          ))
                      ) : (
                        <div className="py-8 text-center">
                          {" "}
                          <p className="text-gray-400 text-xs font-bold">
                            No se encontraron clientes
                          </p>{" "}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* SALDO DE CARTERA */}
              <div className="space-y-3">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] ml-2 flex items-center gap-2">
                  <CreditCard size={14} className="text-farm" /> SALDO DE CARTERA
                </label>
                <div className={`w-full flex items-center justify-between px-6 py-[1.15rem] rounded-[2rem] transition-all bg-white border-2 border-gray-100 shadow-sm ${!selectedCliente ? 'opacity-40 grayscale' : ''}`}>
                  <span className={`text-[9px] font-black uppercase tracking-widest ${deudaActual > 0 ? "text-red-500/80" : deudaActual < 0 ? "text-emerald-500" : "text-gray-400"}`}>
                    {deudaActual >= 0 ? "DEUDA PENDIENTE" : "SALDO A FAVOR"}
                  </span>
                  <span className={`text-xl font-black tracking-tight ${deudaActual > 0 ? "text-red-500" : deudaActual < 0 ? "text-emerald-500" : "text-gray-400"}`}>
                    {selectedCliente ? formatCurrency(Math.abs(deudaActual)) : '$ 0'}
                  </span>
                </div>
              </div>

              {/* FECHA DEL PAGO */}
              <div className="space-y-3">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] ml-2 flex items-center gap-2">
                  <Calendar size={14} className="text-farm" /> FECHA DEL PAGO
                </label>
                <DatePicker
                  label=""
                  icon={null}
                  value={fechaPago}
                  onChange={setFechaPago}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* MONTO DEL ABONO */}
              <div className="space-y-3">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] ml-2 flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded-full bg-farm/20 flex items-center justify-center text-[8px] text-farm">$</div> MONTO DEL ABONO
                </label>
                <input
                  ref={inputRef}
                  type="text"
                  inputMode="numeric"
                  required
                  placeholder="0"
                  className="w-full border-2 border-gray-100 rounded-[2rem] px-5 py-4 text-3xl font-black text-gray-900 focus:outline-none focus:border-farm focus:ring-4 focus:ring-farm/10 bg-gray-50/30 shadow-inner transition-all placeholder:text-gray-200"
                  value={monto ? Number(monto).toLocaleString("es-CO") : ""}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\./g, "").replace(/[^0-9]/g, "");
                    setMonto(raw === "" ? "" : raw);
                  }}
                  disabled={isSubmitting}
                />
              </div>

              {/* FORMA DE PAGO */}
              <div className="space-y-3">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] ml-2 flex items-center gap-2">
                  <CreditCard size={14} className="text-farm" /> FORMA DE PAGO
                </label>
                <div className="relative" ref={methodRef}>
                  <div
                    onClick={() => setIsMethodOpen(!isMethodOpen)}
                    className={` w-full flex items-center justify-between px-6 py-4 rounded-[2rem] cursor-pointer transition-all duration-300 bg-white border-2 border-gray-100 shadow-sm hover:border-farm/30 group ${isMethodOpen ? "ring-4 ring-farm/10 border-farm/50" : ""} `}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:text-farm transition-colors">
                        {metodo === "Efectivo" && <Wallet size={16} />}
                        {metodo === "Nequi" && <Smartphone size={16} />}
                        {metodo === "Bancolombia" && <Building2 size={16} />}
                        {metodo === "Daviplata" && <Smartphone size={16} />}
                        {!["Efectivo", "Nequi", "Bancolombia", "Daviplata"].includes(metodo) && <CreditCard size={16} />}
                      </div>
                      <span className="text-lg font-black text-gray-900">{metodo}</span>
                    </div>
                    <ChevronDown size={20} className={`text-gray-300 transition-transform duration-300 ${isMethodOpen ? "rotate-180 text-farm" : ""}`} />
                  </div>
                  {isMethodOpen && (
                    <div className="absolute top-full left-0 right-0 mt-3 bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-2xl border border-white/40 z-[100] overflow-hidden">
                      <div className="p-2 space-y-1 max-h-[115px] overflow-y-auto custom-scrollbar bg-white/40">
                        {[
                          { id: "Efectivo", icon: Wallet, color: "text-amber-500", bg: "bg-amber-50" },
                          { id: "Nequi", icon: Smartphone, color: "text-purple-500", bg: "bg-purple-50" },
                          { id: "Bancolombia", icon: Building2, color: "text-blue-600", bg: "bg-blue-50" },
                          { id: "Daviplata", icon: Smartphone, color: "text-red-500", bg: "bg-red-50" },
                        ].map((m) => (
                          <div
                            key={m.id}
                            onClick={() => {
                              setMetodo(m.id);
                              setIsMethodOpen(false);
                            }}
                            className={` flex items-center justify-between px-4 py-3.5 rounded-2xl cursor-pointer transition-all group ${metodo === m.id ? "bg-farm text-white shadow-lg shadow-farm/20" : "hover:bg-gray-50 text-gray-600"} `}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${metodo === m.id ? "bg-white/20" : m.bg + " " + m.color}`}>
                                <m.icon size={16} />
                              </div>
                              <span className="font-black truncate">{m.id}</span>
                            </div>
                            {metodo === m.id && <CheckCircle2 size={16} />}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="pt-8 border-t border-gray-100 flex justify-start">
              {" "}
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto flex-shrink-0 pb-1">
                {" "}
                {deudaActual > 0 && selectedCliente && !editingId && (
                  <button
                    type="button"
                    onClick={handleSaldarTodo}
                    className="px-8 py-5 bg-red-50 text-red-600 font-black rounded-full hover:bg-red-100 transition-all uppercase text-[10px] tracking-widest border-2 border-red-500/10 shadow-sm"
                  >
                    Saldar Todo
                  </button>
                )}
                {editingId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(null);
                      setSelectedCliente("");
                      setMonto("");
                      setFechaPago(new Date().toISOString().split("T")[0]);
                    }}
                    className="w-full lg:w-auto px-10 py-5 bg-gray-100 text-gray-400 font-bold rounded-full hover:bg-gray-200 transition-all uppercase text-[10px] tracking-widest whitespace-nowrap"
                  >
                    Cancelar
                  </button>
                )}{" "}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full lg:w-auto px-12 py-5 bg-gray-900 text-white font-black rounded-full shadow-2xl transition-all uppercase text-[10px] md:text-xs tracking-widest whitespace-nowrap ${isSubmitting ? "opacity-50 cursor-not-allowed" : "hover:opacity-90 active:scale-[0.98]"}`}
                >
                  {" "}
                  {isSubmitting
                    ? "Procesando..."
                    : editingId
                      ? "Actualizar Pago"
                      : "Registrar Pago"}{" "}
                </button>{" "}
              </div>{" "}
            </div>{" "}
          </form>{" "}
        </div>{" "}
      </div>{" "}
      <div className="space-y-8 relative z-10">
        {" "}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 lg:gap-6 mb-4 px-2 lg:px-0">
          <h2 className="text-lg font-black text-gray-800 uppercase tracking-tight">
            ÚLTIMOS ABONOS
          </h2>

          <div className="flex items-center gap-1 bg-gray-100/50 p-1.5 rounded-2xl border border-gray-100 min-w-0 shrink-0">
            {(["hoy", "semana", "mes", "personalizado"] as TimeRange[]).map(
              (r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-medium transition-all whitespace-nowrap ${range === r ? "bg-farm text-white shadow-lg shadow-farm/20" : "text-gray-400 hover:text-gray-600 hover:bg-white"}`}
                >
                  {r === "personalizado" ? "pers." : r}
                </button>
              ),
            )}
          </div>
        </div>{" "}
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
        <div className="flex items-center justify-between px-1 mb-4">
          {" "}
          <div className="flex items-center gap-3">
            {" "}
            <div className="flex flex-col">
              {" "}
              <div className="flex items-center gap-2 mb-2">
                {" "}
                <span className="text-[10px] font-semibold text-gray-400 leading-none">
                  TOTAL RECAUDADO
                </span>{" "}
                <span className="text-[8px] font-bold text-gray-300 uppercase tracking-tighter">
                  ({filteredPagos.length})
                </span>{" "}
              </div>{" "}
              <span className="text-2xl font-black text-farm leading-none tracking-tight">
                {branding.appName.includes("DASHBOARD") ? "" : "$"}
                {totalPeriodo.toLocaleString()}
              </span>{" "}
            </div>{" "}
          </div>{" "}
          <div className="flex items-center gap-2">
            {" "}
            <div className="flex items-center gap-2 bg-gray-50/50 px-3 py-1.5 rounded-full border border-gray-100 shadow-sm group/search focus-within:border-farm/30 transition-all">
              {" "}
              <Search
                className="text-gray-300 group-focus-within/search:text-farm transition-colors"
                size={14}
              />{" "}
              <input
                type="text"
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-16 sm:w-32 bg-transparent text-[10px] font-medium outline-none placeholder:text-gray-200 text-gray-700 tracking-wider"
              />{" "}
            </div>{" "}
            <button
              onClick={exportToCSV}
              className="p-1.5 bg-gray-50/50 border border-gray-100 rounded-full text-gray-300 hover:text-farm hover:border-farm/30 transition-all shadow-sm flex items-center justify-center"
              title="Exportar a CSV"
            >
              {" "}
              <Download size={14} />{" "}
            </button>{" "}
          </div>{" "}
        </div>{" "}
        <div className="bg-white rounded-[1.5rem] lg:rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden relative group mx-2 lg:mx-0">
          <div className="max-h-[485px] overflow-y-auto custom-scrollbar divide-y divide-gray-50">
            {filteredPagos.map((p) => (
              <div key={p.id} className="p-5 hover:bg-gray-50/50 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="min-w-0 flex-1 relative">
                    <div className="font-bold text-gray-900 truncate mb-0.5">
                      {p.clientes?.nombre}
                    </div>
                    <div className="text-[10px] text-gray-400 font-bold uppercase flex items-center gap-1.5 whitespace-nowrap">
                      <Calendar size={12} />
                      {new Date(p.created_at).toLocaleDateString()}
                      <span className="text-gray-200 text-xs">•</span>
                      {p.metodo_pago}
                    </div>
                  </div>

                  <div className="font-black text-farm text-sm text-right min-w-[90px] tracking-tighter">
                    {formatCurrency(p.monto)}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleEditPago(p)}
                      className="p-1.5 text-gray-300 hover:text-farm transition-all hover:bg-farm/5 rounded-xl"
                      title="Editar"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => generateReceipt(p, "pago", branding)}
                      className="p-1.5 text-farm hover:bg-farm/5 rounded-xl transition-all"
                      title="Ver Comprobante"
                    >
                      <FileText size={14} />
                    </button>
                    {confirmDeleteId === p.id ? (
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
                            handleDeletePago(p.id);
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
                            setConfirmDeleteId(p.id);
                          }}
                          className="p-1.5 text-red-200 hover:text-red-600 rounded-xl transition-all opacity-30 hover:opacity-100"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {filteredPagos.length === 0 && (
              <div className="py-20 text-center text-gray-300 font-medium">
                No se encontraron abonos
              </div>
            )}
          </div>
        </div>
      </div>{" "}
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
