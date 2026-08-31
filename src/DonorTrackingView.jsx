import React, { useCallback, useEffect, useState } from "react";
import { Landmark, Plus, Link2, X, FileText } from "lucide-react";
import { listDonors, createDonor, listDonorAllocations, createDonorAllocation, deleteDonorAllocation, linkBudgetLineToDonor, getDonorReport, getProject, exportDonorReportPdf } from "./lib/api";
import { fmt, mono, Banner, KpiCard } from "./shared.jsx";

function NewDonorForm({ onCreate, onCancel }) {
  const [name, setName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");

  return (
    <div className="bg-[#FAFBFC] border border-[#E4E7EE] rounded-sm p-4 space-y-3 mb-3">
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom du bailleur (ex. : Union Européenne)" className="w-full border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Contact (optionnel)" className="border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm" />
        <input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="Email (optionnel)" className="border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm" />
      </div>
      <div className="flex gap-2">
        <button disabled={!name} onClick={() => onCreate({ name, contactName: contactName || undefined, contactEmail: contactEmail || undefined })} className="text-xs px-3 py-1.5 bg-[#1B2A4A] text-white rounded-sm hover:bg-[#233459] disabled:opacity-40">Ajouter</button>
        <button onClick={onCancel} className="text-xs px-3 py-1.5 text-[#7A8399]">Annuler</button>
      </div>
    </div>
  );
}

function NewAllocationForm({ donors, onCreate, onCancel }) {
  const [donorId, setDonorId] = useState(donors[0]?.id ?? "");
  const [allocatedAmount, setAllocatedAmount] = useState("");
  const [currency, setCurrency] = useState("GNF");
  const [grantNumber, setGrantNumber] = useState("");

  return (
    <div className="bg-white border border-[#E4E7EE] rounded-sm p-5 space-y-3 mb-6 max-w-lg">
      <div className="text-sm font-medium text-[#101B33]">Nouveau financement affecté</div>
      <select value={donorId} onChange={(e) => setDonorId(e.target.value)} className="w-full border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm">
        {donors.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
      </select>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input value={allocatedAmount} onChange={(e) => setAllocatedAmount(e.target.value)} placeholder="Montant alloué" style={mono} className="border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm" />
        <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm">
          <option value="GNF">GNF</option><option value="USD">USD</option><option value="EUR">EUR</option>
        </select>
      </div>
      <input value={grantNumber} onChange={(e) => setGrantNumber(e.target.value)} placeholder="N° de subvention propre à ce financement (optionnel)" className="w-full border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm" />
      <div className="flex gap-2">
        <button
          disabled={!donorId || !allocatedAmount}
          onClick={() => onCreate({ donorId, allocatedAmount: parseFloat(allocatedAmount) || 0, currency, grantNumber: grantNumber || undefined })}
          className="text-xs px-3 py-1.5 bg-[#1B2A4A] text-white rounded-sm hover:bg-[#233459] disabled:opacity-40"
        >
          Affecter au projet
        </button>
        <button onClick={onCancel} className="text-xs px-3 py-1.5 text-[#7A8399]">Annuler</button>
      </div>
    </div>
  );
}

function AllocationCard({ allocation, budgetLines, onDelete, onLinkLine }) {
  const unlinkedLines = budgetLines.filter((l) => !allocation.budgetLines.some((bl) => bl.id === l.id));
  const [linking, setLinking] = useState(false);
  const [selectedLine, setSelectedLine] = useState("");

  const spent = allocation.budgetLines.reduce((s, l) => s + Number(l.spent), 0);
  const pct = Math.min(100, (spent / Number(allocation.allocatedAmount)) * 100);

  return (
    <div className="bg-white border border-[#E4E7EE] rounded-sm p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium text-[#101B33]">{allocation.donor.name}</div>
          {allocation.grantNumber && <div className="text-xs text-[#9AA3B5] mt-0.5" style={mono}>N° {allocation.grantNumber}</div>}
        </div>
        <button onClick={() => onDelete(allocation.id)} className="text-[#B7BFCE] hover:text-[#9B2C2C]"><X size={14} /></button>
      </div>
      <div className="flex items-center justify-between mt-2 text-sm" style={mono}>
        <span>{fmt(spent, allocation.currency)} dépensés</span>
        <span className="text-[#9AA3B5]">/ {fmt(allocation.allocatedAmount, allocation.currency)}</span>
      </div>
      <div className="h-1.5 bg-[#EEF0F4] rounded-full overflow-hidden mt-1.5">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: pct >= 90 ? "#C53030" : "#1B2A4A" }} />
      </div>

      <div className="mt-3 space-y-1">
        {allocation.budgetLines.map((l) => (
          <div key={l.id} className="flex items-center gap-1.5 text-xs text-[#3D4761]">
            <Link2 size={11} className="text-[#9AA3B5]" /> {l.code} — {l.label}
          </div>
        ))}
      </div>

      {linking ? (
        <div className="mt-2 flex items-center gap-2">
          <select value={selectedLine} onChange={(e) => setSelectedLine(e.target.value)} className="flex-1 border border-[#D8DCE6] rounded-sm px-2 py-1.5 text-xs">
            {unlinkedLines.length === 0 && <option value="">Aucune ligne disponible</option>}
            {unlinkedLines.map((l) => <option key={l.id} value={l.id}>{l.code} — {l.label}</option>)}
          </select>
          <button onClick={() => { if (selectedLine) { onLinkLine(selectedLine, allocation.id); setLinking(false); } }} className="text-xs px-2 py-1.5 bg-[#1B2A4A] text-white rounded-sm">OK</button>
          <button onClick={() => setLinking(false)} className="text-xs text-[#7A8399]">Annuler</button>
        </div>
      ) : (
        <button onClick={() => setLinking(true)} className="mt-2 text-xs text-[#1B2A4A] hover:underline">+ Rattacher une ligne budgétaire</button>
      )}
    </div>
  );
}

function DonorReportForm({ project, onGenerate, onCancel }) {
  const [format, setFormat] = useState("GENERIQUE");
  const [periodLabel, setPeriodLabel] = useState("");
  const [narrative, setNarrative] = useState("");
  const [challenges, setChallenges] = useState("");
  const [generating, setGenerating] = useState(false);

  const canSubmit = periodLabel && narrative.length >= 10;

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await onGenerate({ format, periodLabel, narrative, challenges: challenges || undefined });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="bg-white border border-[#E4E7EE] rounded-sm p-5 space-y-3 mb-6 max-w-2xl">
      <div className="text-sm font-medium text-[#101B33]">Générer un rapport bailleur — {project.name}</div>
      <p className="text-xs text-[#9AA3B5]">
        Reprend la structure et le vocabulaire habituels de chaque type de bailleur — pas un gabarit officiel figé d'une institution précise (chaque bailleur peut exiger son propre modèle au cas par cas), mais une base fidèle aux conventions de rapportage les plus courantes.
      </p>
      <select value={format} onChange={(e) => setFormat(e.target.value)} className="w-full border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm">
        <option value="GENERIQUE">Générique</option>
        <option value="UE">Union Européenne</option>
        <option value="ONU">Agence des Nations Unies</option>
        <option value="USAID">USAID</option>
      </select>
      <input value={periodLabel} onChange={(e) => setPeriodLabel(e.target.value)} placeholder="Période couverte (ex. : Trimestre 3 — Juillet à Septembre 2026)" className="w-full border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm" />
      <textarea value={narrative} onChange={(e) => setNarrative(e.target.value)} rows={5} placeholder="Résumé narratif des activités menées durant la période..." className="w-full border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm" />
      <textarea value={challenges} onChange={(e) => setChallenges(e.target.value)} rows={3} placeholder="Difficultés rencontrées et mesures correctives (optionnel)" className="w-full border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm" />
      <div className="flex gap-2">
        <button disabled={!canSubmit || generating} onClick={handleGenerate} className="text-xs px-3 py-1.5 bg-[#1B2A4A] text-white rounded-sm hover:bg-[#233459] disabled:opacity-40 flex items-center gap-1.5">
          <FileText size={13} /> {generating ? "Génération…" : "Générer le PDF"}
        </button>
        <button onClick={onCancel} className="text-xs px-3 py-1.5 text-[#7A8399]">Annuler</button>
      </div>
    </div>
  );
}

export default function DonorTrackingView({ project }) {
  const [donors, setDonors] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [budgetLines, setBudgetLines] = useState([]);
  const [report, setReport] = useState(null);
  const [showDonorForm, setShowDonorForm] = useState(false);
  const [showAllocationForm, setShowAllocationForm] = useState(false);
  const [showReportForm, setShowReportForm] = useState(false);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    if (!project) return;
    try {
      setDonors(await listDonors());
      setAllocations(await listDonorAllocations(project.id));
      setReport(await getDonorReport(project.id));
      const full = await getProject(project.id);
      setBudgetLines(full.budgetLines || []);
    } catch (e) {
      setError(e.message);
    }
  }, [project]);
  useEffect(() => { refresh(); }, [refresh]);

  if (!project) return <div className="p-4 md:p-8 text-sm text-[#7A8399]">Sélectionne un projet.</div>;

  const handleCreateDonor = async (payload) => {
    try {
      await createDonor(payload);
      setShowDonorForm(false);
      await refresh();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleCreateAllocation = async (payload) => {
    try {
      await createDonorAllocation(project.id, payload);
      setShowAllocationForm(false);
      await refresh();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleDeleteAllocation = async (id) => {
    try {
      await deleteDonorAllocation(id);
      await refresh();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleLinkLine = async (budgetLineId, donorAllocationId) => {
    try {
      await linkBudgetLineToDonor(budgetLineId, donorAllocationId);
      await refresh();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleGenerateReport = async (payload) => {
    try {
      await exportDonorReportPdf(project.id, payload);
      setShowReportForm(false);
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-xl text-[#101B33] font-semibold flex items-center gap-2">
          <Landmark size={20} className="text-[#1B2A4A]" /> Suivi par bailleur — {project.name}
        </h1>
        {!showReportForm && (
          <button onClick={() => setShowReportForm(true)} className="flex items-center gap-1.5 bg-[#1B2A4A] text-white text-sm px-3.5 py-2 rounded-sm hover:bg-[#233459]">
            <FileText size={15} /> Générer un rapport
          </button>
        )}
      </div>
      <p className="text-xs text-[#9AA3B5] mb-6">
        Un projet cofinancé par plusieurs bailleurs — chacun avec un montant précis. Chaque ligne budgétaire rattachée à un financement permet de tracer exactement quelles dépenses sont couvertes par quel bailleur.
      </p>
      {error && <Banner tone="error">{error}</Banner>}
      {showReportForm && <DonorReportForm project={project} onGenerate={handleGenerateReport} onCancel={() => setShowReportForm(false)} />}

      {report && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <KpiCard label="Bailleurs actifs" value={allocations.length} accent="#1B2A4A" />
          <KpiCard label="Budget non affecté" value={fmt(report.unallocatedBudget, project.currency)} accent="#E8B564" />
          <KpiCard label="Dépenses non affectées" value={fmt(report.unallocatedSpent, project.currency)} accent="#9AA3B5" />
        </div>
      )}

      <div className="flex items-center gap-2 mb-3">
        {!showDonorForm && (
          <button onClick={() => setShowDonorForm(true)} className="text-xs px-3 py-1.5 border border-[#D8DCE6] rounded-sm text-[#3D4761] hover:bg-[#FAFBFC] flex items-center gap-1">
            <Plus size={12} /> Nouveau bailleur
          </button>
        )}
        {!showAllocationForm && donors.length > 0 && (
          <button onClick={() => setShowAllocationForm(true)} className="text-xs px-3 py-1.5 bg-[#1B2A4A] text-white rounded-sm hover:bg-[#233459] flex items-center gap-1">
            <Plus size={12} /> Affecter un financement au projet
          </button>
        )}
      </div>
      {showDonorForm && <NewDonorForm onCreate={handleCreateDonor} onCancel={() => setShowDonorForm(false)} />}
      {showAllocationForm && <NewAllocationForm donors={donors} onCreate={handleCreateAllocation} onCancel={() => setShowAllocationForm(false)} />}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {allocations.map((a) => (
          <AllocationCard key={a.id} allocation={a} budgetLines={budgetLines} onDelete={handleDeleteAllocation} onLinkLine={handleLinkLine} />
        ))}
        {allocations.length === 0 && <div className="text-sm text-[#7A8399] p-5 bg-white border border-[#E4E7EE] rounded-sm sm:col-span-2">Aucun financement affecté pour l'instant.</div>}
      </div>
    </div>
  );
}
