import React, { useState } from "react";
import { Download, FileText, FileSpreadsheet } from "lucide-react";

export const fmt = (n) => new Intl.NumberFormat("fr-FR").format(Math.round(Number(n))) + " FCFA";
export const mono = { fontFamily: "'IBM Plex Mono', monospace" };

export const PAYMENT_METHODS = [
  { id: "VIREMENT", label: "Virement bancaire" },
  { id: "ORANGE_MONEY", label: "Orange Money" },
  { id: "MTN_MONEY", label: "MTN Money" },
  { id: "MOOV_MONEY", label: "Moov Money" },
  { id: "WAVE", label: "Wave" },
  { id: "ESPECES", label: "Espèces" },
  { id: "CHEQUE", label: "Chèque" },
];

export function Banner({ children, tone = "info" }) {
  const styles = {
    info: "bg-[#EFF3FA] text-[#1B2A4A]",
    error: "bg-[#FDECEC] text-[#9B2C2C]",
  };
  return <div className={`text-sm px-4 py-2.5 rounded-sm mb-4 ${styles[tone]}`}>{children}</div>;
}

export function ExportMenu({ formats, onExport }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const icons = { pdf: Download, docx: FileText, xlsx: FileSpreadsheet };

  const handle = async (type) => {
    setOpen(false);
    setBusy(true);
    try {
      await onExport(type);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)} disabled={busy} className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-[#D8DCE6] rounded-sm text-[#3D4761] hover:bg-[#FAFBFC] disabled:opacity-50">
        <Download size={13} /> {busy ? "Génération…" : "Exporter"}
      </button>
      {open && (
        <div className="absolute right-0 mt-1 bg-white border border-[#E4E7EE] rounded-sm shadow-sm z-10 w-44">
          {formats.map((f) => {
            const Icon = icons[f.type] || FileText;
            return (
              <button key={f.type} onClick={() => handle(f.type)} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#3D4761] hover:bg-[#FAFBFC]">
                <Icon size={13} /> {f.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** Panneau générique de saisie d'un paiement multicanal (virement, mobile money, espèces, chèque). */
export function RecordPaymentPanel({ label, onRecord, onClose }) {
  const [method, setMethod] = useState(PAYMENT_METHODS[0].id);
  const [reference, setReference] = useState("");
  return (
    <div className="mt-3 bg-[#FAFBFC] border border-[#E4E7EE] rounded-sm p-4 space-y-3">
      <div className="text-xs text-[#7A8399] uppercase tracking-wide">{label}</div>
      <div className="grid grid-cols-2 gap-3">
        <select value={method} onChange={(e) => setMethod(e.target.value)} className="border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm">
          {PAYMENT_METHODS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
        </select>
        <input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Référence de transaction (optionnel)" className="border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm" />
      </div>
      <div className="flex gap-2">
        <button onClick={() => onRecord({ method, reference })} className="text-xs px-3 py-1.5 bg-[#1B2A4A] text-white rounded-sm hover:bg-[#233459]">
          Confirmer le paiement
        </button>
        <button onClick={onClose} className="text-xs px-3 py-1.5 text-[#7A8399] hover:text-[#101B33]">Annuler</button>
      </div>
    </div>
  );
}

export function KpiCard({ label, value, sub, accent }) {
  return (
    <div className="bg-white border border-[#E4E7EE] rounded-sm p-4 border-l-4" style={{ borderLeftColor: accent }}>
      <div className="text-xs text-[#7A8399] uppercase tracking-wide">{label}</div>
      <div className="text-2xl text-[#101B33] mt-1" style={{ ...mono, fontWeight: 600 }}>{value}</div>
      {sub && <div className="text-xs text-[#9AA3B5] mt-1">{sub}</div>}
    </div>
  );
}

/** Statut du permis de conduire — même seuil de 15 jours que le calcul d'alertes backend (alerts.service.ts). */
export function licenseStatus(expiryDate) {
  const daysLeft = (new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  if (daysLeft < 0) return { label: "Expiré", style: "bg-[#FDECEC] text-[#9B2C2C]" };
  if (daysLeft <= 15) return { label: "Expire bientôt", style: "bg-[#FFF6E5] text-[#8A6116]" };
  return { label: "Valide", style: "bg-[#EFF6EE] text-[#2F5233]" };
}
