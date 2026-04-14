import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import {
  Search,
  Plus,
  Trash2,
  ExternalLink,
  X,
  CheckCircle2,
  AlertCircle,
  Pencil,
} from "lucide-react";
import Toast from "../components/Toast"; // Cache simple fuera del componente para persistencia instantánea
let clientsCache: any[] | null = null;
export default function Clientes() {
  const [clientes, setClientes] = useState<any[]>(clientsCache || []);
  const [loading, setLoading] = useState(!clientsCache);
  const [search, setSearch] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newCliente, setNewCliente] = useState({
    nombre: "",
    telefono: "",
    direccion: "",
    email: "",
  });
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };
  const loadClientes = async (silent = false) => {
    if (!silent && !clientsCache) setLoading(true);
    try {
      // DESCARGA PARALELA ACTIVADA
      const [clientsRes, salesRes, paymentsRes] = await Promise.all([
        (supabase.from("clientes") as any)
          .select("*")
          .order("nombre", { ascending: true }),
        (supabase.from("ventas") as any).select("cliente_id, total"),
        (supabase.from("pagos") as any).select("cliente_id, monto"),
      ]);
      if (clientsRes.error) throw clientsRes.error;
      if (clientsRes.data) {
        // ALGORITMO DE MAPAS O(n) - Ultra eficiente
        const salesMap: Record<string, number> = {};
        (salesRes.data || []).forEach((v: any) => {
          salesMap[v.cliente_id] =
            (salesMap[v.cliente_id] || 0) + (v.total || 0);
        });
        const paymentsMap: Record<string, number> = {};
        (paymentsRes.data || []).forEach((p: any) => {
          paymentsMap[p.cliente_id] =
            (paymentsMap[p.cliente_id] || 0) + (p.monto || 0);
        });
        const clientsWithDebt = (clientsRes.data as any[]).map((c) => ({
          ...c,
          deuda: (salesMap[c.id] || 0) - (paymentsMap[c.id] || 0),
        }));
        setClientes(clientsWithDebt);
        clientsCache = clientsWithDebt; // Guardar en caché
      }
    } catch (err) {
      console.error("Error cargando clientes:", err);
      showNotification("error", "Error de conexión con la base de datos");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    loadClientes(!!clientsCache);
  }, []);
  const openModal = (cliente?: any) => {
    if (cliente) {
      setEditingId(cliente.id);
      setNewCliente({
        nombre: cliente.nombre,
        telefono: cliente.telefono || "",
        direccion: cliente.direccion || "",
        email: cliente.email || "",
      });
    } else {
      setEditingId(null);
      setNewCliente({
        nombre: "",
        telefono: "",
        direccion: "",
        email: "",
      });
    }
    setIsModalOpen(true);
  };
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCliente.nombre) return;
    setIsSaving(true);
    try {
      // Limpiar payload para asegurar compatibilidad con DB
      const payload = {
        nombre: newCliente.nombre,
        telefono: newCliente.telefono || null,
        direccion: newCliente.direccion || null,
        email: newCliente.email || null,
      };

      if (editingId) {
        const { error } = await (supabase.from("clientes") as any)
          .update(payload)
          .eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await (supabase.from("clientes") as any).insert([
          payload,
        ]);
        if (error) throw error;
      }
      setIsModalOpen(false);
      await loadClientes();
      showNotification(
        "success",
        editingId ? "Cliente actualizado" : "Cliente guardado correctamente",
      );
    } catch (err) {
      console.error(err);
      showNotification(
        "error",
        "Error al guardar cliente. Revisa la base de datos.",
      );
    } finally {
      setIsSaving(false);
    }
  };
  const handleDelete = async (id: string) => {
    try {
      const { error } = await (supabase.from("clientes") as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
      setConfirmDeleteId(null);
      showNotification("success", "Cliente eliminado correctamente");
      await loadClientes();
    } catch (err) {
      console.error(err);
      showNotification(
        "error",
        "No se pudo eliminar el cliente. Es posible que tenga ventas registradas.",
      );
      setConfirmDeleteId(null);
    }
  };
  const openWhatsApp = (tel: string) => {
    const cleanTel = tel.replace(/\D/g, "");
    window.open(
      `https://wa.me/57${cleanTel}
`,
      "_blank",
    );
  };
  const filteredClientes = clientes.filter((c) =>
    c.nombre.toLowerCase().includes(search.toLowerCase()),
  );
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(val);
  return (
    <div
      className="max-w-7xl mx-auto pb-12 space-y-8"
      onClick={() => confirmDeleteId && setConfirmDeleteId(null)}
    >
      {" "}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-8 mb-8">
        {" "}
        <div>
          <h1 className="text-xl font-black text-gray-900 tracking-tight uppercase">
            GESTIÓN DE CLIENTES
          </h1>
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mt-1 leading-none">
            ADMINISTRA TU CARTERA Y CONTACTOS ESTRATÉGICOS
          </p>
        </div>{" "}
        <button
          onClick={() => openModal()}
          className="bg-farm hover:bg-farm-dark text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-farm/20 hover:scale-[1.02] active:scale-[0.98]"
        >
          {" "}
          <Plus size={20} /> Nuevo Cliente{" "}
        </button>{" "}
      </div>{" "}
      <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden">
        {" "}
        <div className="p-6 border-b flex items-center gap-4 bg-white group">
          {" "}
          <Search
            className="text-gray-300 group-focus-within:text-farm transition-colors"
            size={18}
          />{" "}
          <input
            type="text"
            placeholder="Buscar cliente por nombre..."
            className="w-full bg-transparent outline-none text-gray-700 font-medium placeholder:text-gray-200 text-xs tracking-wider"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>{" "}
        <div className="max-h-[550px] overflow-y-auto custom-scrollbar">
          {" "}
          <table className="w-full text-left table-fixed">
            {" "}
            <thead>
              {" "}
              <tr className="bg-gray-50/80 text-gray-400 text-[10px] font-black uppercase tracking-widest border-b sticky top-0 z-10">
                {" "}
                <th className="px-10 py-5 w-[30%] whitespace-nowrap">Cliente / Info</th>{" "}
                <th className="px-10 py-5 w-[35%] whitespace-nowrap">Contacto</th>{" "}
                <th className="px-10 py-5 text-right w-[20%] whitespace-nowrap">Saldo Deuda</th>{" "}
                <th className="px-6 py-5 text-right w-[15%] whitespace-nowrap">Acciones</th>
              </tr>{" "}
            </thead>{" "}
            <tbody className="divide-y divide-gray-50">
              {" "}
              {loading ? ( // SKELETON LOADERS
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {" "}
                    <td className="px-6 py-4">
                      {" "}
                      <div className="h-4 bg-gray-200 rounded-md w-32 mb-2"></div>{" "}
                      <div className="h-3 bg-gray-100 rounded-md w-24"></div>{" "}
                    </td>{" "}
                    <td className="px-6 py-4">
                      {" "}
                      <div className="h-4 bg-gray-100 rounded-md w-28"></div>{" "}
                    </td>{" "}
                    <td className="px-6 py-4">
                      {" "}
                      <div className="h-6 bg-gray-200 rounded-md w-24 ml-auto"></div>{" "}
                    </td>{" "}
                    <td className="px-10 py-5 text-center">
                      {" "}
                      <div className="h-8 bg-gray-100 rounded-xl w-20 mx-auto"></div>{" "}
                    </td>{" "}
                  </tr>
                ))
              ) : filteredClientes.length > 0 ? (
                filteredClientes.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-gray-50/50 transition-colors group italic__text"
                  >
                    {" "}
                    <td className="px-10 py-5">
                      {" "}
                      <div className="flex flex-col">
                        {" "}
                        <div className="text-sm font-black text-gray-900 leading-tight">
                          {c.nombre}
                        </div>{" "}
                        <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wider leading-tight">
                          CC: {c.identificacion || "S/N"}
                        </div>
                      </div>{" "}
                    </td>{" "}
                    <td className="px-10 py-5">
                      {" "}
                      <div className="flex items-center gap-3">
                        {" "}
                        <div className="flex flex-col">
                          {" "}
                          <div className="text-xs font-bold text-gray-700 font-mono leading-none">
                            {" "}
                            {c.telefono || "----------"}{" "}
                          </div>{" "}
                          {c.email && (
                            <div className="text-[10px] text-gray-400 mt-1 truncate max-w-[150px] leading-none">
                              {" "}
                              {c.email}{" "}
                            </div>
                          )}{" "}
                        </div>{" "}
                        {c.telefono && (
                          <button
                            onClick={() => openWhatsApp(c.telefono)}
                            className="p-1.5 text-green-500 hover:bg-green-50 rounded-lg transition-colors shrink-0"
                            title="Enviar WhatsApp"
                          >
                            {" "}
                            <ExternalLink size={14} />{" "}
                          </button>
                        )}{" "}
                      </div>{" "}
                    </td>{" "}
                    <td
                      className={`px-10 py-5 text-right font-black text-lg tracking-tighter w-[160px] ${c.deuda > 0 ? "text-red-500" : "text-green-600"}`}
                    >
                      {" "}
                      {formatCurrency(c.deuda)}{" "}
                    </td>{" "}
                    <td className="px-4 py-4 w-[120px] whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1 w-full">
                        <button
                          onClick={() => openModal(c)}
                          className="p-1.5 text-gray-300 hover:text-farm transition-all hover:bg-farm/5 rounded-xl"
                          title="Editar"
                        >
                          <Pencil size={14} />
                        </button>
                        {confirmDeleteId === c.id ? (
                          <div className="flex gap-1 items-center animate-in fade-in zoom-in duration-200 w-[85px] justify-end">
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
                                handleDelete(c.id);
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
                                setConfirmDeleteId(c.id);
                              }}
                              className="p-1.5 text-red-200 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all opacity-40 hover:opacity-100"
                              title="Eliminar"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  {" "}
                  <td colSpan={4} className="px-6 py-12 text-center">
                    {" "}
                    <div className="text-gray-400 font-medium">
                      No se encontraron clientes para mostrar.
                    </div>{" "}
                  </td>{" "}
                </tr>
              )}{" "}
            </tbody>{" "}
          </table>{" "}
        </div>{" "}
      </div>{" "}
      {/* Modal CRUD Cliente */}{" "}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[1000] flex items-center justify-center p-4">
          {" "}
          <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] w-full max-w-md shadow-2xl border border-white/40 animate-in zoom-in-95 duration-200 overflow-hidden">
            {" "}
            <div className="p-6 border-b border-white/20 flex justify-between items-center bg-white/40">
              {" "}
              <h2 className="text-xl font-black text-gray-900">
                {editingId ? "Editar Cliente" : "Nuevo Cliente"}
              </h2>{" "}
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-gray-200 rounded-full transition-colors"
              >
                {" "}
                <X size={20} />{" "}
              </button>{" "}
            </div>{" "}
            <form onSubmit={handleSave} className="p-6 space-y-8">
                           <div className="grid grid-cols-1">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase ml-1">
                    Nombre Completo *
                  </label>
                  <input
                    required
                    type="text"
                    className="w-full border-gray-200 border rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-farm/30 font-semibold"
                    value={newCliente.nombre}
                    onChange={(e) =>
                      setNewCliente({ ...newCliente, nombre: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-6">
                {" "}
                <div className="space-y-1">
                  {" "}
                  <label className="text-xs font-bold text-gray-500 uppercase ml-1">
                    WhatsApp / Teléfono
                  </label>{" "}
                  <input
                    type="text"
                    className="w-full border-gray-200 border rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-farm/30 font-semibold"
                    value={newCliente.telefono}
                    onChange={(e) =>
                      setNewCliente({ ...newCliente, telefono: e.target.value })
                    }
                  />{" "}
                </div>{" "}
              </div>{" "}
              <div className="space-y-1">
                {" "}
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">
                  Dirección de Entrega
                </label>{" "}
                <input
                  type="text"
                  className="w-full border-gray-200 border rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-farm/30 font-semibold"
                  value={newCliente.direccion}
                  onChange={(e) =>
                    setNewCliente({ ...newCliente, direccion: e.target.value })
                  }
                />{" "}
              </div>{" "}
              <div className="space-y-1">
                {" "}
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">
                  Correo Electrónico (Opcional)
                </label>{" "}
                <input
                  type="email"
                  className="w-full border-gray-200 border rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-farm/30 font-semibold"
                  value={newCliente.email}
                  onChange={(e) =>
                    setNewCliente({ ...newCliente, email: e.target.value })
                  }
                />{" "}
              </div>{" "}
              <div className="flex gap-3 pt-6">
                {" "}
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-4 rounded-2xl font-bold text-gray-500 hover:bg-gray-100 transition-colors uppercase text-sm tracking-widest"
                >
                  Cancelar
                </button>{" "}
                <button
                  type="submit"
                  disabled={isSaving}
                  className={`flex-1 px-4 py-4 bg-farm text-white rounded-2xl font-black transition-all uppercase text-sm tracking-widest shadow-lg shadow-farm/20 ${isSaving ? "opacity-70 cursor-not-allowed" : "hover:bg-farm-dark hover:scale-[1.02]"}`}
                >
                  {" "}
                  {isSaving
                    ? "Procesando..."
                    : editingId
                      ? "Actualizar"
                      : "Guardar"}{" "}
                </button>{" "}
              </div>{" "}
            </form>{" "}
          </div>{" "}
        </div>
      )}{" "}
      {notification && (
        <Toast
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}{" "}
    </div>
  );
}
