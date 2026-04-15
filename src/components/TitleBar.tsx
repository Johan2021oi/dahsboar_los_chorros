import { Minus, Square, X } from "lucide-react";
declare global {
  interface Window {
    electron: {
      windowControls: {
        minimize: () => void;
        maximize: () => void;
        close: () => void;
      };
    };
  }
}
export default function TitleBar() {
  // Verificación ultra-estricta: SOLO renderizar si estamos dentro de Electron
  const isElectron = typeof window !== 'undefined' && 
                     window.electron && 
                     window.electron.windowControls;

  if (!isElectron) {
    return null;
  }

  const handleMinimize = () => {
    console.log("Minimize clicked");
    if (window.electron?.windowControls) {
      window.electron.windowControls.minimize();
    }
  };
  const handleMaximize = () => {
    console.log("Maximize clicked");
    if (window.electron?.windowControls) {
      window.electron.windowControls.maximize();
    }
  };
  const handleClose = () => {
    console.log("Close clicked");
    if (window.electron?.windowControls) {
      window.electron.windowControls.close();
    }
  };
  return (
    <div className="h-8 absolute top-0 left-0 w-full z-[40] flex items-center justify-between select-none">
      {" "}
      {/* CAPA DE ARRASTRE */}{" "}
      <div
        className="absolute inset-0 z-0"
        style={{ WebkitAppRegion: "drag" } as any}
      />{" "}
      {/* Botones de Control - Capa Superior Fija (Siempre nítidos y clicables) */}{" "}
      <div
        className="fixed top-0 right-0 z-[200] flex h-8"
        style={{ WebkitAppRegion: "no-drag" } as any}
      >
        {" "}
        <button
          onClick={handleMinimize}
          className="px-4 h-full flex items-center justify-center text-gray-400 hover:bg-gray-200 hover:text-gray-900 transition-colors pointer-events-auto"
          title="Minimizar"
        >
          {" "}
          <Minus size={14} />{" "}
        </button>{" "}
        <button
          onClick={handleMaximize}
          className="px-4 h-full flex items-center justify-center text-gray-400 hover:bg-gray-200 hover:text-gray-900 transition-colors pointer-events-auto"
          title="Maximizar"
        >
          {" "}
          <Square size={12} />{" "}
        </button>{" "}
        <button
          onClick={handleClose}
          className="px-4 h-full flex items-center justify-center text-gray-400 hover:bg-red-500 hover:text-white transition-colors pointer-events-auto"
          title="Cerrar"
        >
          {" "}
          <X size={14} />{" "}
        </button>{" "}
      </div>{" "}
    </div>
  );
}
