import { CheckCircle2, AlertCircle, X } from "lucide-react";
import { useEffect } from "react";
import ReactDOM from "react-dom";

interface ToastProps {
  type: "success" | "error";
  message: string;
  onClose: () => void;
}

export default function Toast({ type, message, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const portal = document.getElementById("toast-portal");
  if (!portal) return null;

  return ReactDOM.createPortal(
    <div className="fixed top-6 right-6 z-[9999] animate-in slide-in-from-right-10 fade-in duration-500">
      <div
        className={`flex items-center gap-4 px-6 py-4 rounded-[2rem] shadow-2xl backdrop-blur-md border ${
          type === "success"
            ? "bg-green-500/90 text-white border-green-400/30"
            : "bg-red-500/90 text-white border-red-400/30"
        }`}
      >
        <div className={`p-2 rounded-full bg-white/20`}>
          {type === "success" ? (
            <CheckCircle2 size={24} />
          ) : (
            <AlertCircle size={24} />
          )}
        </div>
        <div>
          <p className="text-[10px] font-black opacity-70">
            {type === "success" ? "Éxito" : "Error"}
          </p>
          <p className="text-sm font-bold tracking-tight">{message}</p>
        </div>
        <button
          onClick={onClose}
          className="ml-2 p-1 hover:bg-white/10 rounded-lg transition-colors"
        >
          <X size={16} />
        </button>
      </div>
    </div>,
    portal
  );
}
