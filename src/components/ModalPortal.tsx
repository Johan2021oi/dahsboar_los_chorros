import { ReactNode } from "react";
import ReactDOM from "react-dom";

interface ModalPortalProps {
  isOpen: boolean;
  children: ReactNode;
}

/** Renderiza children directamente en #modal-portal (hermano de body),
 *  escapando cualquier contenedor overflow/transform del Layout.
 *  Esto garantiza que backdrop-blur cubre el 100% del viewport. */
export default function ModalPortal({ isOpen, children }: ModalPortalProps) {
  if (!isOpen) return null;
  const portal = document.getElementById("modal-portal");
  if (!portal) return <>{children}</>;
  return ReactDOM.createPortal(children, portal);
}
