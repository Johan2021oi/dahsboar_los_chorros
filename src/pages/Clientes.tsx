import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import {
  Search,
  Plus,
  Trash2,
  ExternalLink,
  X,
  Pencil,
  Archive,
  ArchiveRestore,
  Users,
} from "lucide-react";
import Toast from "../components/Toast";

// Cache simple fuera del componente para persistencia instantánea
let clientsCache: any[] | null = null;
let archivedCache: any[] | null = null;
export default function Clientes() {
  const [loading, setLoading] = useState(!clientsCache);
  const [search, setSearch] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newCliente, setNewCliente] = useState({
    nombre: "",
    identificacion: "",
    telefono: "",
    direccion: "",
    email: "",
  });
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmReactivateId, setConfirmReactivateId] = useState<string | null>(null);
  const [confirmPermanentDeleteId, setConfirmPermanentDeleteId] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };
  const [clientesActivos, setClientesActivos] = useState<any[]>(clientsCache || []);
  const [clientesArchivados, setClientesArchivados] = useState<any[]>(archivedCache || []);
  const [salesMap, setSalesMap] = useState<Record<string, number>>({});
  const [paymentsMap, setPaymentsMap] = useState<Record<string, number>>({});

  const loadClientes = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      // Cargar activos y archivados en paralelo
      const [activosRes, archivadosRes, salesRes, paymentsRes] = await Promise.all([
        (supabase.from("clientes") as any)
          .select("*")
          .eq("activo", true)
          .order("nombre", { ascending: true }),
        (supabase.from("clientes") as any)
          .select("*")
          .eq("activo", false)
          .order("nombre", { ascending: true }),
        (supabase.from("ventas") as any).select("cliente_id, total"),
        (supabase.from("pagos") as any).select("cliente_id, monto"),
      ]);

      if (activosRes.error) throw activosRes.error;
      if (archivadosRes.error) throw archivadosRes.error;

      // ALGORITMO DE MAPAS O(n) - Ultra eficiente
      const sMap: Record<string, number> = {};
      (salesRes.data || []).forEach((v: any) => {
        sMap[v.cliente_id] = (sMap[v.cliente_id] || 0) + (v.total || 0);
      });
      const pMap: Record<string, number> = {};
      (paymentsRes.data || []).forEach((p: any) => {
        pMap[p.cliente_id] = (pMap[p.cliente_id] || 0) + (p.monto || 0);
      });

      setSalesMap(sMap);
      setPaymentsMap(pMap);

      const calcularDeuda = (clientes: any[]) =>
        clientes.map((c) => ({
          ...c,
          deuda: (sMap[c.id] || 0) - (pMap[c.id] || 0),
        }));

      const activosConDeuda = calcularDeuda(activosRes.data || []);
      const archivadosConDeuda = calcularDeuda(archivadosRes.data || []);

      setClientesActivos(activosConDeuda);
      setClientesArchivados(archivadosConDeuda);
      clientsCache = activosConDeuda;
      archivedCache = archivadosConDeuda;
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

  // Usar los datos según la vista seleccionada sin recargar
  const clientes = showArchived ? clientesArchivados : clientesActivos;
  const openModal = (cliente?: any) => {
    if (cliente) {
      setEditingId(cliente.id);
      setNewCliente({
        nombre: cliente.nombre,
        identificacion: cliente.identificacion || "",
        telefono: cliente.telefono || "",
        direccion: cliente.direccion || "",
        email: cliente.email || "",
      });
    } else {
      setEditingId(null);
      setNewCliente({
        nombre: "",
        identificacion: "",
        telefono: "",
        direccion: "",
        email: "",
      });
    }
    setIsModalOpen(true);
  };
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCliente.nombre.trim()) {
      showNotification("error", "El nombre completo es obligatorio");
      return;
    }
    setIsSaving(true);
    try {
      // Limpiar payload para asegurar compatibilidad con DB
      const payload = {
        nombre: newCliente.nombre,
        identificacion: newCliente.identificacion || null,
        telefono: newCliente.telefono || null,
        direccion: newCliente.direccion || null,
        email: newCliente.email || null,
        activo: true,
      };

      if (editingId) {
        const { data, error } = await (supabase.from("clientes") as any)
          .update(payload)
          .eq("id", editingId)
          .select()
          .single();
        if (error) throw error;

        // Recalcular deuda usando el mapa actual
        const clienteActualizado = { 
          ...data, 
          deuda: (salesMap[editingId] || 0) - (paymentsMap[editingId] || 0) 
        };
        
        setClientesActivos((prev) =>
          prev.map((c) => (c.id === editingId ? clienteActualizado : c))
        );
        clientsCache = clientsCache?.map((c) =>
          c.id === editingId ? clienteActualizado : c
        ) || null;
      } else {
        const { data, error } = await (supabase.from("clientes") as any)
          .insert([payload])
          .select()
          .single();
        if (error) throw error;

        // Nuevo cliente siempre inicia con deuda 0 hasta que tenga ventas
        const nuevoCliente = { ...data, deuda: 0 };
        setClientesActivos((prev) =>
          [...prev, nuevoCliente].sort((a, b) => a.nombre.localeCompare(b.nombre))
        );
        clientsCache = [...(clientsCache || []), nuevoCliente].sort((a, b) =>
          a.nombre.localeCompare(b.nombre)
        );
      }
      setIsModalOpen(false);
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
    const cliente = clientesActivos.find((c) => c.id === id);
    if (!cliente) return;

    // Solo permitir eliminar si la deuda es 0 (cliente saldado)
    if (cliente.deuda > 0) {
      showNotification(
        "error",
        "No se puede archivar: el cliente tiene deuda pendiente.",
      );
      setConfirmDeleteId(null);
      return;
    }

    try {
      // Soft delete: marcar como inactivo
      const { error } = await (supabase.from("clientes") as any)
        .update({ activo: false })
        .eq("id", id);
      if (error) throw error;

      setConfirmDeleteId(null);
      showNotification("success", "Cliente archivado correctamente");

      // Actualizar estado local sin recargar
      const clienteArchivado = { ...cliente, activo: false };
      setClientesActivos((prev) => prev.filter((c) => c.id !== id));
      setClientesArchivados((prev) => [...prev, clienteArchivado].sort((a, b) =>
        a.nombre.localeCompare(b.nombre)
      ));
      clientsCache = clientsCache?.filter((c) => c.id !== id) || null;
      archivedCache = [...(archivedCache || []), clienteArchivado].sort((a, b) =>
        a.nombre.localeCompare(b.nombre)
      );
    } catch (err) {
      console.error(err);
      showNotification(
        "error",
        "Error al archivar el cliente. Inténtelo nuevamente.",
      );
      setConfirmDeleteId(null);
    }
  };

  const handleReactivate = async (id: string) => {
    const cliente = clientesArchivados.find((c) => c.id === id);
    if (!cliente) return;

    try {
      // Reactivar: marcar como activo
      const { error } = await (supabase.from("clientes") as any)
        .update({ activo: true })
        .eq("id", id);
      if (error) throw error;

      setConfirmReactivateId(null);
      showNotification("success", "Cliente reactivado correctamente");

      // Actualizar estado local sin recargar
      const clienteReactivado = { ...cliente, activo: true };
      setClientesArchivados((prev) => prev.filter((c) => c.id !== id));
      setClientesActivos((prev) => [...prev, clienteReactivado].sort((a, b) =>
        a.nombre.localeCompare(b.nombre)
      ));
      archivedCache = archivedCache?.filter((c) => c.id !== id) || null;
      clientsCache = [...(clientsCache || []), clienteReactivado].sort((a, b) =>
        a.nombre.localeCompare(b.nombre)
      );
    } catch (err) {
      console.error(err);
      showNotification(
        "error",
        "Error al reactivar el cliente. Inténtelo nuevamente.",
      );
      setConfirmReactivateId(null);
    }
  };

  const handlePermanentDelete = async (id: string) => {
    try {
      // Primero desvincular ventas y pagos (poner cliente_id en NULL)
      await (supabase.from("ventas") as any)
        .update({ cliente_id: null })
        .eq("cliente_id", id);

      await (supabase.from("pagos") as any)
        .update({ cliente_id: null })
        .eq("cliente_id", id);

      // Ahora eliminar el cliente permanentemente
      const { error } = await (supabase.from("clientes") as any)
        .delete()
        .eq("id", id);
      if (error) throw error;

      setConfirmPermanentDeleteId(null);
      showNotification("success", "Cliente eliminado permanentemente");

      // Actualizar estado local sin recargar
      setClientesArchivados((prev) => prev.filter((c) => c.id !== id));
      archivedCache = archivedCache?.filter((c) => c.id !== id) || null;
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes("foreign key") || err.code === "23503") {
        showNotification(
          "error",
          "No se puede eliminar: el cliente aún tiene registros vinculados.",
        );
      } else {
        showNotification(
          "error",
          "Error al eliminar el cliente. Inténtelo nuevamente.",
        );
      }
      setConfirmPermanentDeleteId(null);
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
      onClick={() => {
        if (confirmDeleteId) setConfirmDeleteId(null);
        if (confirmReactivateId) setConfirmReactivateId(null);
        if (confirmPermanentDeleteId) setConfirmPermanentDeleteId(null);
      }}
    >
      {" "}
      <div className="hidden lg:flex flex-col lg:flex-row lg:items-center justify-between gap-6 lg:gap-8 mb-8">
        <div className="text-left">
          <h1 className="text-xl font-black text-gray-900 tracking-tight uppercase">
            GESTIÓN DE CLIENTES
          </h1>
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mt-1 leading-none">
            ADMINISTRA TU CARTERA Y CONTACTOS ESTRATÉGICOS
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 lg:gap-3 flex-wrap mb-8">
        <button
          onClick={() => setShowArchived(!showArchived)}
          className={`flex-1 lg:flex-none px-4 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${
            showArchived
              ? "bg-amber-500 text-white hover:bg-amber-600 shadow-lg shadow-amber/20"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          {showArchived ? (
            <>
              <Users size={18} />
              <span className="text-sm">Ver Activos</span>
            </>
          ) : (
            <>
              <Archive size={18} />
              <span className="text-sm">Ver Archivados</span>
            </>
          )}
        </button>
        {!showArchived && (
          <button
            onClick={() => openModal()}
            className="flex-1 lg:flex-none bg-farm hover:bg-farm-dark text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-farm/20 hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap"
          >
            <Plus size={20} /> <span className="text-sm">Nuevo Cliente</span>
          </button>
        )}
      </div>

      <div className="bg-white rounded-[1.5rem] lg:rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden">
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
        <div className="max-h-[550px] overflow-x-auto overflow-y-auto custom-scrollbar">
          <div className="min-w-[800px] lg:min-w-full">
            <table className="w-full text-left table-fixed">
            {" "}
            <thead>
              {" "}
              <tr className="bg-gray-50/80 text-gray-400 text-[10px] font-black uppercase tracking-widest border-b sticky top-0 z-10">
                {" "}
                <th className="px-10 py-5 w-[30%] whitespace-nowrap">
                  Cliente / Info
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] ${
                    showArchived
                      ? "text-amber-600 bg-amber-100"
                      : "text-farm bg-farm/10"
                  }`}>
                    {clientes.length}
                  </span>
                </th>{" "}
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
                        {showArchived ? (
                          // Clientes archivados - botones de reactivar y eliminar
                          <div className="flex items-center justify-end gap-1 w-full">
                            {confirmReactivateId === c.id ? (
                              <div className="flex gap-1 items-center animate-in fade-in zoom-in duration-200">
                                <span className="text-[8px] text-gray-400 mr-1">¿Reactivar?</span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setConfirmReactivateId(null);
                                  }}
                                  className="text-[8px] font-semibold text-gray-400 hover:text-gray-600 px-2 py-1 rounded-lg bg-gray-50 border border-gray-100 transition-all font-sans"
                                >
                                  No
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleReactivate(c.id);
                                  }}
                                  className="text-[8px] font-black text-white bg-green-500 hover:bg-green-600 px-2 py-1 rounded-lg shadow-lg shadow-green-500/20 transition-all font-sans"
                                >
                                  Sí
                                </button>
                              </div>
                            ) : confirmPermanentDeleteId === c.id ? (
                              <div className="flex gap-1 items-center animate-in fade-in zoom-in duration-200">
                                <span className="text-[8px] text-red-500 mr-1">¿Eliminar?</span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setConfirmPermanentDeleteId(null);
                                  }}
                                  className="text-[8px] font-semibold text-gray-400 hover:text-gray-600 px-2 py-1 rounded-lg bg-gray-50 border border-gray-100 transition-all font-sans"
                                >
                                  No
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handlePermanentDelete(c.id);
                                  }}
                                  className="text-[8px] font-black text-white bg-red-600 hover:bg-red-700 px-2 py-1 rounded-lg shadow-lg shadow-red-600/20 transition-all font-sans"
                                >
                                  Sí
                                </button>
                              </div>
                            ) : (
                              <>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setConfirmReactivateId(c.id);
                                  }}
                                  className="p-1.5 text-green-500 hover:text-green-700 hover:bg-green-50 rounded-xl transition-all"
                                  title="Reactivar cliente"
                                >
                                  <ArchiveRestore size={16} />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setConfirmPermanentDeleteId(c.id);
                                  }}
                                  className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all"
                                  title="Eliminar permanentemente"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </>
                            )}
                          </div>
                        ) : c.deuda === 0 ? (
                          // Clientes activos saldados - botón de archivar
                          confirmDeleteId === c.id ? (
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
                                className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all opacity-60 hover:opacity-100"
                                title="Archivar cliente saldado"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          )
                        ) : (
                          // Clientes con deuda - no se pueden archivar
                          <div className="w-[85px] flex justify-end">
                            <span
                              className="text-[9px] text-gray-300 font-medium"
                              title="Tiene deuda pendiente"
                            >
                              Activo
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <div className="text-gray-400 font-medium">
                      {showArchived
                        ? "No hay clientes archivados."
                        : "No se encontraron clientes para mostrar."}
                    </div>
                  </td>
                </tr>
              )}{" "}
            </tbody>{" "}
            </table>
          </div>
        </div>{" "}
      </div>{" "}
      {/* Modal CRUD Cliente */}{" "}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[1000] flex items-end sm:items-center justify-center p-0 sm:p-4">
          {" "}
          <div className="bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] w-full max-w-md shadow-2xl border border-white/40 animate-in slide-in-from-bottom sm:zoom-in-95 duration-200 overflow-hidden">
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
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  className="w-full border-gray-200 border rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-farm/30 font-semibold"
                  value={newCliente.nombre}
                  onChange={(e) =>
                    setNewCliente({ ...newCliente, nombre: e.target.value })
                  }
                  placeholder="Ej: Juan Pérez García"
                  required
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase ml-1">
                    Identificación (CC)
                  </label>
                  <input
                    type="text"
                    className="w-full border-gray-200 border rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-farm/30 font-semibold"
                    value={newCliente.identificacion}
                    onChange={(e) =>
                      setNewCliente({ ...newCliente, identificacion: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase ml-1">
                    WhatsApp / Teléfono
                  </label>
                  <input
                    type="text"
                    className="w-full border-gray-200 border rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-farm/30 font-semibold"
                    value={newCliente.telefono}
                    onChange={(e) =>
                      setNewCliente({ ...newCliente, telefono: e.target.value })
                    }
                  />
                </div>
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
