import React, { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { listAuditLog } from "./lib/api";
import { mono, Banner } from "./shared.jsx";

const ACTION_LABEL = {
  CREATE_ACCOUNT: "Création de compte",
  CHANGE_ROLE: "Changement de rôle",
  REMOVE_MEMBER: "Retrait d'un membre",
  VALIDATE_ORDER: "Validation de commande",
  REJECT_ORDER: "Refus de commande",
  PAYMENT_REQUEST_APPROUVEE_PRESIDENT: "Approbation de demande de paiement",
  PAYMENT_REQUEST_ENVOYEE_BAILLEUR: "Envoi au bailleur",
  PAYMENT_REQUEST_PAYEE: "Paiement enregistré",
};

export default function AuditLogView() {
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    listAuditLog().then(setLogs).catch((e) => setError(e.message));
  }, []);

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-xl text-[#101B33] font-semibold flex items-center gap-2 mb-2">
        <ShieldCheck size={20} className="text-[#1B2A4A]" /> Journal d'audit
      </h1>
      <p className="text-xs text-[#9AA3B5] mb-6">
        Historique des actions sensibles (comptes, rôles, validations financières) — garantit la transparence exigée par les bailleurs.
      </p>
      {error && <Banner tone="error">{error}</Banner>}

      <div className="bg-white border border-[#E4E7EE] rounded-sm divide-y divide-[#F0F1F5]">
        {logs.map((l) => (
          <div key={l.id} className="px-5 py-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#101B33]">{ACTION_LABEL[l.action] || l.action}</span>
              <span className="text-xs text-[#9AA3B5]" style={mono}>{new Date(l.timestamp).toLocaleString("fr-FR")}</span>
            </div>
            <div className="text-xs text-[#9AA3B5] mt-0.5">
              Par {l.userName}
              {l.metadata && Object.keys(l.metadata).length > 0 && (
                <span> · {Object.entries(l.metadata).map(([k, v]) => `${k} : ${v}`).join(" · ")}</span>
              )}
            </div>
          </div>
        ))}
        {logs.length === 0 && <div className="p-5 text-sm text-[#7A8399]">Aucune action enregistrée pour l'instant.</div>}
      </div>
    </div>
  );
}
