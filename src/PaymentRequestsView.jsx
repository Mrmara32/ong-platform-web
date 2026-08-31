import React, { useCallback, useEffect, useState } from "react";
import { FileSignature, Plus, Printer, Download } from "lucide-react";
import { listPaymentRequests, createPaymentRequest, decidePaymentRequest, exportPaymentRequestPdf, printPaymentRequestPdf } from "./lib/api";
import { fmt, mono, Banner, KpiCard } from "./shared.jsx";

const STATUS_LABEL = {
  BROUILLON: "Brouillon",
  APPROUVEE_PRESIDENT: "Approuvée (Président)",
  ENVOYEE_BAILLEUR: "Envoyée au bailleur",
  PAYEE: "Payée",
};
const STATUS_STYLE = {
  BROUILLON: "bg-[#F0F1F5] text-[#7A8399]",
  APPROUVEE_PRESIDENT: "bg-[#E5F0FF] text-[#1D4E8F]",
  ENVOYEE_BAILLEUR: "bg-[#FFF6E5] text-[#8A6116]",
  PAYEE: "bg-[#EFF6EE] text-[#2F5233]",
};
const NEXT_STATUS = {
  BROUILLON: { value: "APPROUVEE_PRESIDENT", label: "Approuver (Président)" },
  APPROUVEE_PRESIDENT: { value: "ENVOYEE_BAILLEUR", label: "Marquer envoyée au bailleur" },
  ENVOYEE_BAILLEUR: { value: "PAYEE", label: "Marquer payée" },
};

function NewPaymentRequestForm({ project, onCreate, onCancel }) {
  const [repereNumber, setRepereNumber] = useState("");
  const [amountRequested, setAmountRequested] = useState("");
  const [achievements, setAchievements] = useState("");
  const [preparedByName, setPreparedByName] = useState("");
  const [preparedByTitle, setPreparedByTitle] = useState("");

  const canSubmit = repereNumber && amountRequested && achievements && preparedByName && preparedByTitle;

  return (
    <div className="bg-white border border-[#E4E7EE] rounded-sm p-5 space-y-3 mb-6 max-w-2xl">
      <div className="text-sm font-medium text-[#101B33]">Nouvelle demande de paiement — {project?.name}</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input value={repereNumber} onChange={(e) => setRepereNumber(e.target.value)} placeholder="N° de repère" style={mono} className="border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm" />
        <input value={amountRequested} onChange={(e) => setAmountRequested(e.target.value)} placeholder={`Montant demandé (${project?.currency || "GNF"})`} style={mono} className="border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm" />
      </div>
      <textarea
        value={achievements}
        onChange={(e) => setAchievements(e.target.value)}
        rows={4}
        placeholder={"Réalisations et justificatifs — une ligne par élément, ex. :\n6 sensibilisations de masse\n46 réunions mensuelles organisées"}
        className="w-full border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm"
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input value={preparedByName} onChange={(e) => setPreparedByName(e.target.value)} placeholder="Nom de l'approbateur" className="border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm" />
        <input value={preparedByTitle} onChange={(e) => setPreparedByTitle(e.target.value)} placeholder="Titre (ex. Président de l'ONG CAM)" className="border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm" />
      </div>
      <div className="flex gap-2">
        <button
          disabled={!canSubmit}
          onClick={() => onCreate({
            projectId: project.id,
            repereNumber: parseInt(repereNumber, 10),
            amountRequested: parseFloat(amountRequested) || 0,
            achievements, preparedByName, preparedByTitle,
          })}
          className="text-sm px-4 py-2 bg-[#1B2A4A] text-white rounded-sm hover:bg-[#233459] disabled:opacity-40"
        >
          Créer la demande
        </button>
        <button onClick={onCancel} className="text-sm px-4 py-2 text-[#7A8399]">Annuler</button>
      </div>
    </div>
  );
}

export default function PaymentRequestsView({ project }) {
  const [requests, setRequests] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState(null);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    if (project) setRequests(await listPaymentRequests(project.id));
  }, [project]);
  useEffect(() => { refresh(); }, [refresh]);

  const handleCreate = async (payload) => {
    try {
      await createPaymentRequest(payload);
      setShowForm(false);
      await refresh();
      setToast("Demande de paiement créée en brouillon.");
    } catch (e) {
      setError(e.message);
    }
  };

  const handleAdvance = async (r) => {
    try {
      await decidePaymentRequest(r.id, NEXT_STATUS[r.status].value);
      await refresh();
    } catch (e) {
      setError(e.message);
    }
  };

  if (!project) return <div className="p-4 md:p-8 text-sm text-[#7A8399]">Sélectionne un projet.</div>;

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-xl text-[#101B33] font-semibold flex items-center gap-2">
          <FileSignature size={20} className="text-[#1B2A4A]" /> Demandes de paiement
        </h1>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 bg-[#1B2A4A] text-white text-sm px-3.5 py-2 rounded-sm hover:bg-[#233459]">
            <Plus size={15} /> Nouvelle demande
          </button>
        )}
      </div>
      <p className="text-xs text-[#9AA3B5] mb-6">
        Cycle : brouillon → approuvée par le Président → envoyée au bailleur → payée. Format calqué sur les demandes de paiement USAID/RTI.
      </p>
      {toast && <Banner>{toast}</Banner>}
      {error && <Banner tone="error">{error}</Banner>}
      {showForm && <NewPaymentRequestForm project={project} onCreate={handleCreate} onCancel={() => setShowForm(false)} />}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <KpiCard label="Demandes créées" value={requests.length} accent="#1B2A4A" />
        <KpiCard label="En attente d'approbation" value={requests.filter((r) => r.status === "BROUILLON").length} accent="#E8B564" />
        <KpiCard label="Payées" value={requests.filter((r) => r.status === "PAYEE").length} accent="#2F855A" />
      </div>

      <div className="bg-white border border-[#E4E7EE] rounded-sm divide-y divide-[#F0F1F5]">
        {requests.map((r) => (
          <div key={r.id} className="flex items-center justify-between px-5 py-3 flex-wrap gap-2">
            <div>
              <div className="text-sm text-[#101B33]">Repère n° {r.repereNumber}</div>
              <div className="text-xs text-[#9AA3B5] mt-0.5" style={mono}>{fmt(r.amountRequested, r.project?.currency)} · {new Date(r.requestDate).toLocaleDateString("fr-FR")}</div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-1 rounded-sm ${STATUS_STYLE[r.status]}`}>{STATUS_LABEL[r.status]}</span>
              {NEXT_STATUS[r.status] && (
                <button onClick={() => handleAdvance(r)} className="text-xs px-3 py-1.5 bg-[#1B2A4A] text-white rounded-sm hover:bg-[#233459]">
                  {NEXT_STATUS[r.status].label}
                </button>
              )}
              <button onClick={() => printPaymentRequestPdf(r.id)} className="p-1.5 border border-[#D8DCE6] rounded-sm text-[#3D4761] hover:bg-[#FAFBFC]" title="Imprimer">
                <Printer size={14} />
              </button>
              <button onClick={() => exportPaymentRequestPdf(r.id, r.repereNumber)} className="p-1.5 border border-[#D8DCE6] rounded-sm text-[#3D4761] hover:bg-[#FAFBFC]" title="Télécharger">
                <Download size={14} />
              </button>
            </div>
          </div>
        ))}
        {requests.length === 0 && <div className="p-5 text-sm text-[#7A8399]">Aucune demande de paiement pour ce projet.</div>}
      </div>
    </div>
  );
}
