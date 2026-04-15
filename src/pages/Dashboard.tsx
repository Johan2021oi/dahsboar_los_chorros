import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useBranding } from "../hooks/useBranding";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  Briefcase,
  Calendar,
} from "lucide-react";
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
  addDays,
} from "date-fns";
import DatePicker from "../components/DatePicker";
type TimeRange = "hoy" | "semana" | "mes" | "personalizado";

// Cache para navegación instantánea entre páginas
let dashboardCache: {
  stats: any;
  ventasData: any[];
  prodsData: any[];
  lowStockCount: number;
  range: string;
} | null = null;

export default function Dashboard() {
  const navigate = useNavigate();
  const { branding, updateBranding } = useBranding();
  const [range, setRange] = useState<TimeRange>("mes");
  const [customDates, setCustomDates] = useState({
    start: format(subDays(new Date(), 30), "yyyy-MM-dd"),
    end: format(new Date(), "yyyy-MM-dd"),
  }); // Estados para Edición Inline
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(branding.appName);
  const handleSaveName = () => {
    if (tempName.trim()) {
      updateBranding({ appName: tempName.toUpperCase() });
    }
    setIsEditingName(false);
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
  const [loading, setLoading] = useState(!dashboardCache);
  const [isInitialLoad, setIsInitialLoad] = useState(!dashboardCache);
  const [stats, setStats] = useState(dashboardCache?.stats || {
    ventas: 0, gastos: 0, utilidad: 0, porCobrar: 0, totalClientes: 0,
  });
  const [ventasData, setVentasData] = useState<{ dia: string; total: number }[]>(dashboardCache?.ventasData || []);
  const [prodsData, setProdsData] = useState<{ producto: string; cantidad: number; total: number }[]>(dashboardCache?.prodsData || []);
  const [lowStockCount, setLowStockCount] = useState(dashboardCache?.lowStockCount || 0);
  const fetchDashboardData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const { start, end } = getInterval();
      const startIso = start.toISOString();
      const endIso = end.toISOString();
      const startStr = format(start, "yyyy-MM-dd");
      const endStr = format(end, "yyyy-MM-dd");

      // Carga paralela ultra-rápida
      const [
        vRes,
        gRes,
        pRes,
        cRes,
        iRes,
        invRes,
        resVHistoricos,
        resPHistoricos
      ] = await Promise.all([
        (supabase.from("ventas") as any).select("total, created_at").gte("created_at", startIso).lte("created_at", endIso),
        (supabase.from("gastos") as any).select("monto").gte("fecha", startStr).lte("fecha", endStr),
        (supabase.from("pagos") as any).select("monto").gte("fecha", startStr).lte("fecha", endStr),
        (supabase.from("clientes") as any).select("*", { count: "exact", head: true }),
        (supabase.from("detalle_venta") as any).select("producto, cantidad, precio, ventas!inner(created_at)").gte("ventas.created_at", startIso).lte("ventas.created_at", endIso),
        (supabase.from("inventario") as any).select("cantidad"),
        (supabase.from("ventas") as any).select("total"),
        (supabase.from("pagos") as any).select("monto")
      ]);

      const vData = vRes.data || [];
      const gData = gRes.data || [];
      const items = iRes.data || [];
      const currentInv = invRes.data || [];
      const pData = pRes.data || [];
      const allSales = (resVHistoricos.data as any[]) || [];
      const allPayments = (resPHistoricos.data as any[]) || [];

      const totalVentas = vData.reduce((s: any, v: any) => s + (Number(v.total) || 0), 0);
      const totalGastos = gData.reduce((s: any, g: any) => s + (Number(g.monto) || 0), 0);
      const totalPagosPeriodo = pData.reduce((s: any, p: any) => s + (Number(p.monto) || 0), 0);

      // Cuentas por cobrar = DEUDA TOTAL ABSOLUTA (Cálculo Ultra-Seguro)
      const { data: hSales } = await (supabase.from("ventas") as any).select("total");
      const { data: hPayments } = await (supabase.from("pagos") as any).select("monto");
      
      const tVH = (hSales || []).reduce((acc: number, v: any) => acc + (Number(v.total) || 0), 0);
      const tPH = (hPayments || []).reduce((acc: number, p: any) => acc + (Number(p.monto) || 0), 0);
      
      const porCobrar = Math.max(0, tVH - tPH);

      setStats({
        ventas: totalVentas,
        gastos: totalGastos,
        utilidad: totalVentas - totalGastos,
        porCobrar,
        totalClientes: cRes.count || 0,
      });

      // Gráfica de Ventas (Orden Cronológico Protegido)
      const graphData: { dia: string; total: number }[] = [];
      let curr = new Date(start);
      const graphMap: Record<string, number> = {};
      
      vData.forEach((v: any) => {
        const d = format(parseISO(v.created_at), "dd/MM");
        graphMap[d] = (graphMap[d] || 0) + v.total;
      });

      while (curr <= end) {
        const d = format(curr, "dd/MM");
        graphData.push({
          dia: d,
          total: graphMap[d] || 0
        });
        curr = addDays(curr, 1);
      }
      setVentasData(graphData);

      // Top Movimiento
      const pMap: Record<string, { cantidad: number; total: number }> = {};
      items.forEach((i: any) => {
        if (!pMap[i.producto]) pMap[i.producto] = { cantidad: 0, total: 0 };
        pMap[i.producto].cantidad += i.cantidad;
        pMap[i.producto].total += i.cantidad * (i.precio || 0);
      });
      setProdsData(Object.keys(pMap).map(k => ({
        producto: k,
        cantidad: pMap[k].cantidad,
        total: pMap[k].total,
      })));

      // Stock bajo (Umbral de 20 para máxima proactividad)
      setLowStockCount(currentInv.filter((i: any) => i.cantidad <= 20).length);
      // Guardar en caché
      dashboardCache = { stats: { ventas: totalVentas, gastos: totalGastos, utilidad: totalVentas - totalGastos, porCobrar, totalClientes: cRes.count || 0 }, ventasData: graphData, prodsData: Object.keys(pMap).map(k => ({ producto: k, cantidad: pMap[k].cantidad, total: pMap[k].total })), lowStockCount: currentInv.filter((i: any) => i.cantidad <= 20).length, range };
    } catch (err) {
      console.error("Error al cargar dashboard:", err);
    } finally {
      setLoading(false);
      setIsInitialLoad(false);
    }
  };
  useEffect(() => {
    const hasCacheForRange = dashboardCache?.range === range;
    fetchDashboardData(!hasCacheForRange ? false : true);
  }, [range, customDates]);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(val);
  return (
    <div className="max-w-7xl mx-auto space-y-4 lg:space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 lg:gap-8 relative z-40">
        <div className="flex flex-row items-center gap-4 min-w-0">
          <div className="shrink-0">
            <h1 className="text-lg font-bold text-gray-900 tracking-tight hidden lg:flex items-center gap-3 whitespace-nowrap">
              DASHBOARD GENERAL
            </h1>
            <div className="flex flex-col gap-1 mt-1">
              {isEditingName ? (
                <input
                  autoFocus
                  className="bg-transparent border-b-2 border-farm outline-none font-bold text-sm text-gray-600 uppercase tracking-widest w-full max-w-[300px] py-1 animate-in slide-in-from-left-2"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  onBlur={handleSaveName}
                  onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
                />
              ) : (
                <div className="hidden lg:flex items-center gap-4">
                  <div
                    onClick={() => {
                      setTempName(branding.appName);
                      setIsEditingName(true);
                    }}
                    className="flex items-center gap-2 cursor-text hover:bg-gray-100/50 px-2 py-0.5 rounded-lg transition-all group/name text-gray-500"
                  >
                    <p className="font-bold text-xs tracking-widest">{branding.appName}</p>
                    <div className="opacity-0 group-hover/name:opacity-100 transition-opacity text-farm">
                      <TrendingUp size={12} className="rotate-90" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 lg:gap-6 flex-wrap lg:flex-nowrap justify-start lg:justify-end flex-1">
          {range === "personalizado" && (
            <div className="flex items-center gap-2 bg-white/50 backdrop-blur-sm px-3 py-1.5 rounded-2xl border border-gray-100 shadow-sm duration-500 shrink-0">
              <div className="flex items-center gap-2">
                <DatePicker
                  size="sm"
                  compact
                  value={customDates.start}
                  onChange={(date) =>
                    setCustomDates({ ...customDates, start: date })
                  }
                  className="w-32"
                />
              </div>
              <span className="text-gray-300 font-black">→</span>
              <div className="flex items-center gap-2">
                <DatePicker
                  size="sm"
                  compact
                  align="right"
                  value={customDates.end}
                  onChange={(date) =>
                    setCustomDates({ ...customDates, end: date })
                  }
                  className="w-32"
                />
              </div>
            </div>
          )}

          {lowStockCount > 0 && (
            <button
              onClick={() => navigate("/inventario")}
              className="flex items-center gap-2 bg-orange-50 px-3 lg:px-4 py-2 rounded-2xl border-2 border-orange-100/50 duration-500 hover:bg-orange-100 transition-all group shadow-sm shadow-orange-100/20 active:scale-95 shrink-0"
            >
              <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
              <span className="text-[10px] font-black text-orange-600 tracking-wider uppercase">
                {lowStockCount === 1
                  ? "1 STOCK CRÍTICO"
                  : `${lowStockCount} STOCK CRÍTICO`}
              </span>
            </button>
          )}
          <div className="relative z-[60] flex items-center gap-1 bg-white/50 p-1 rounded-xl lg:p-1.5 lg:rounded-2xl border border-gray-100 shadow-sm backdrop-blur-md shrink-0">
            {(["hoy", "semana", "mes", "personalizado"] as TimeRange[]).map(
              (t) => (
                <button
                  key={t}
                  onClick={() => setRange(t)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-medium transition-all whitespace-nowrap ${range === t ? "bg-farm text-white shadow-lg shadow-farm/20" : "text-gray-400 hover:text-gray-600 hover:bg-gray-50/50"}`}
                >
                  {t === "personalizado" ? "pers." : t}
                </button>
              ),
            )}
          </div>
      </div>
    </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-8">
        {" "}
        {[
          {
            label: "INGRESOS TOTALES",
            value: formatCurrency(stats.ventas),
            icon: TrendingUp,
            color: "farm",
            trend: "+12%",
            up: true,
          },
          {
            label: "EGRESOS (GASTOS)",
            value: `-${formatCurrency(stats.gastos)}`,
            icon: CreditCard,
            color: "red-600",
            trend: "-5%",
            up: false,
          },
          {
            label: "UTILIDAD NETA",
            value: formatCurrency(stats.utilidad),
            icon: DollarSign,
            color: "blue-500",
            isNet: true,
          },
          {
            label: "CUENTAS X COBRAR",
            value: formatCurrency(stats.porCobrar),
            icon: Briefcase,
            color: "orange-500",
          },
        ].map((s, i) => (
          <div
            key={i}
            className="relative group bg-white p-4 lg:p-7 rounded-[1.5rem] lg:rounded-[2rem] shadow-sm border border-gray-100 hover:shadow-md transition-all hover:-translate-y-1 duration-500"
          >
            <div className="relative flex flex-col h-full justify-between">
              {" "}
              <div className="flex justify-between items-center mb-1">
                {" "}
                <div
                  className={`p-2.5 rounded-xl bg-${s.color}/10 text-${s.color} shadow-inner`}
                >
                  {" "}
                  <s.icon size={20} />{" "}
                </div>{" "}
                {s.trend && (
                  <div
                    className={`flex items-center gap-1 text-[10px] font-bold ${s.up ? "text-farm" : "text-red-500"}`}
                  >
                    {" "}
                    {s.up ? (
                      <ArrowUpRight size={12} />
                    ) : (
                      <ArrowDownRight size={12} />
                    )}{" "}
                    {s.trend}{" "}
                  </div>
                )}{" "}
              </div>{" "}
              <div className="mt-3">
                {" "}
                <p className="text-[9px] font-medium text-gray-400 uppercase tracking-widest leading-none">
                  {s.label}
                </p>{" "}
                <h3
                  className={`text-lg lg:text-xl font-bold tracking-tight ${s.isNet ? (stats.utilidad < 0 ? "text-red-600" : "text-blue-600") : (s.color === "red-600" ? "text-red-600" : "text-gray-900")}`}
                >
                  {s.value}
                </h3>{" "}
              </div>{" "}
            </div>{" "}
          </div>
        ))}{" "}
      </div>{" "}
      <div
      className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-8 animate-in fade-in duration-500 px-4"
    >    <div className="bg-white p-3 lg:p-8 rounded-[1.5rem] lg:rounded-[2rem] shadow-sm border border-gray-100 hover:shadow-md transition-all flex flex-col h-[300px] lg:h-[420px]">
          <div className="flex items-center justify-between mb-3 shrink-0">
            <h3 className="text-sm font-bold text-gray-800 tracking-tight uppercase">
              FLUJO DE INGRESOS
            </h3>
{" "}
            <div className="flex items-center gap-2">
              {" "}
              <span className="w-3 h-3 bg-farm rounded-full"></span>{" "}
              <span className="text-[11px] font-medium text-gray-400">
                Ventas (COP)
              </span>{" "}
            </div>{" "}
          </div>{" "}
          <div className="flex-1 min-h-0">
            {" "}
            <ResponsiveContainer width="100%" height="100%">
              {" "}
              <AreaChart data={ventasData}>
                {" "}
                <defs>
                  {" "}
                  <linearGradient id="colorV" x1="0" y1="0" x2="0" y2="1">
                    {" "}
                    <stop
                      offset="5%"
                      stopColor="#22c55e"
                      stopOpacity={0.3}
                    />{" "}
                    <stop
                      offset="95%"
                      stopColor="#22c55e"
                      stopOpacity={0}
                    />{" "}
                  </linearGradient>{" "}
                </defs>{" "}
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#F3F4F6"
                />{" "}
                <XAxis
                  dataKey="dia"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#9CA3AF", fontSize: 11, fontWeight: 700 }}
                  dy={10}
                  interval={ventasData.length > 15 ? 5 : 0}
                />{" "}
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#9CA3AF", fontSize: 11, fontWeight: 700 }}
                  tickFormatter={(v) =>
                    new Intl.NumberFormat("es-CO", {
                      notation: "compact",
                      compactDisplay: "short",
                    }).format(v)
                  }
                />{" "}
                <Tooltip
                  contentStyle={{
                    borderRadius: "1.5rem",
                    border: "none",
                    boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)",
                    fontFamily: "Outfit",
                  }}
                  formatter={(v: any) => [formatCurrency(v), "Venta"]}
                />{" "}
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#22c55e"
                  strokeWidth={4}
                  fillOpacity={1}
                  fill="url(#colorV)"
                />{" "}
              </AreaChart>{" "}
            </ResponsiveContainer>{" "}
          </div>{" "}
        </div>{" "}
        <div className="bg-white p-4 lg:p-8 rounded-[2rem] shadow-sm border border-gray-100 hover:shadow-md transition-all flex flex-col h-[400px] lg:h-[420px]">
          <div className="flex items-center justify-between mb-4 shrink-0">
            <h3 className="text-lg font-black text-gray-800 tracking-tight uppercase">
              TOP MOVIMIENTO
            </h3>
{" "}
            <div className="bg-gray-50 px-3 py-2 rounded-xl border border-gray-100 flex flex-col items-end">
              {" "}
              <span className="text-[10px] font-semibold text-gray-400">
                UNIDADES TOTALES
              </span>{" "}
              <span className="text-sm font-black text-farm tracking-tight">
                {" "}
                {prodsData.reduce((sum, p) => sum + p.cantidad, 0)}{" "}
              </span>{" "}
            </div>{" "}
          </div>{" "}
          <div className="relative flex-1 min-h-0">
            {" "}
            <div className="h-full overflow-y-auto custom-scrollbar pr-2 space-y-2 pb-6">
              {" "}
              {prodsData
                .sort((a, b) => b.total - a.total)
                .slice(0, 50)
                .map((p, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between py-1 px-2 hover:bg-gray-50/50 rounded-2xl transition-all group shrink-0"
                  >
                    {" "}
                    <div className="flex items-center gap-3">
                      {" "}
                      <div className="w-9 h-9 shrink-0 rounded-xl bg-white border border-gray-100 flex items-center justify-center font-black text-gray-300 text-[11px] shadow-sm group-hover:border-farm/30 group-hover:text-farm transition-all">
                        {" "}
                        {idx + 1}{" "}
                      </div>{" "}
                      <div className="min-w-0">
                        {" "}
                        <p className="text-[15px] font-black text-gray-800 leading-tight tracking-tight truncate">
                          {p.producto}
                        </p>{" "}
                        <div className="flex items-center gap-2 mt-0.5">
                          {" "}
                          <span className="text-sm font-black text-farm tracking-tight">
                            {p.cantidad}
                          </span>{" "}
                          <span className="text-[10px] uppercase font-semibold text-gray-400 tracking-wider">
                            uds.
                          </span>{" "}
                        </div>{" "}
                      </div>{" "}
                    </div>{" "}
                    <div className="text-right shrink-0 ml-2">
                      {" "}
                      <p className="text-[15px] font-black text-gray-900 tracking-tight">
                        {formatCurrency(p.total)}
                      </p>{" "}
                      <div className="flex items-center justify-end gap-1.5 mt-0.5">
                        {" "}
                        <div className="w-1.5 h-1.5 bg-farm rounded-full shadow-sm shadow-farm/50"></div>{" "}
                        <span className="text-[10px] uppercase font-semibold text-gray-400 tracking-wider">
                          Ingreso
                        </span>{" "}
                      </div>{" "}
                    </div>{" "}
                  </div>
                ))}{" "}
              {prodsData.length === 0 && (
                <div className="py-20 text-center text-gray-300 font-bold">
                  sin datos para este periodo.
                </div>
              )}{" "}
            </div>{" "}
            {/* Gradiente de fade al final del scroll */}
            {prodsData.length > 5 && (
              <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none z-10 rounded-b-[2rem]"></div>
            )}
          </div>{" "}
          {prodsData.length > 0 && (
            <div className="mt-4 pt-3 border-t border-dashed border-gray-100 flex items-center justify-between px-3 mt-auto">
              {" "}
              <div className="space-y-0.5">
                {" "}
                <p className="text-[10px] font-semibold text-gray-400">
                  Resumen Periodo
                </p>{" "}
                <p className="text-xs font-bold text-gray-500">
                  {prodsData.length} Productos
                </p>{" "}
              </div>{" "}
              <div className="text-right">
                {" "}
                <p className="text-lg font-black text-farm tracking-tighter">
                  {" "}
                  {formatCurrency(
                    prodsData.reduce((sum, p) => sum + p.total, 0),
                  )}{" "}
                </p>{" "}
              </div>{" "}
            </div>
          )}{" "}
        </div>{" "}
      </div>{" "}
    </div>
  );
}
