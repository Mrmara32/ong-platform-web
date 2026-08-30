import React from "react";
import { X } from "lucide-react";

function ModalShell({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div className="bg-white rounded-md shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#EEF0F4]">
          <div className="text-sm font-medium text-[#101B33]">{title}</div>
          <button onClick={onClose} className="text-[#9AA3B5] hover:text-[#101B33]"><X size={16} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

const SHORTCUTS = [
  { keys: "Ctrl + K", action: "Recherche rapide" },
  { keys: "Ctrl + P", action: "Imprimer la page" },
  { keys: "F11", action: "Mode plein écran" },
  { keys: "Échap", action: "Fermer une fenêtre modale" },
];

export function ShortcutsModal({ onClose }) {
  return (
    <ModalShell title="Raccourcis clavier" onClose={onClose}>
      <div className="space-y-2.5">
        {SHORTCUTS.map((s, i) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <span className="text-[#3D4761]">{s.action}</span>
            <kbd className="text-xs bg-[#F0F1F5] text-[#3D4761] rounded px-2 py-1" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{s.keys}</kbd>
          </div>
        ))}
      </div>
    </ModalShell>
  );
}

export function AboutModal({ onClose, orgName }) {
  return (
    <ModalShell title="À propos de Sahel Ops" onClose={onClose}>
      <div className="space-y-2 text-sm text-[#3D4761]">
        <p>Plateforme multi-organisations de gestion de projets pour ONG et acteurs du développement.</p>
        <p className="text-xs text-[#9AA3B5]">Version prototype · Organisation active : {orgName || "—"}</p>
        <p className="text-xs text-[#9AA3B5]">Comptabilité SYCEBNL · Multi-devises · Isolation stricte des données entre organisations.</p>
      </div>
    </ModalShell>
  );
}
