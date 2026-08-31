import React, { useCallback, useEffect, useState } from "react";
import { BookOpen, Plus, X } from "lucide-react";
import { getJournal, exportJournalXlsx, postManualEntry } from "./lib/api";
import { fmt, mono, Banner, ExportMenu } from "./shared.jsx";

function NewManualEntryForm({ project, onCreate, onCancel }) {
  const [label, setLabel] = useState("");
  const [lines, setLines] = useState([
    { accountCode: "", accountLabel: "", side: "debit", amount: "" },
    { accountCode: "", accountLabel: "", side: "credit", amount: "" },
  ]);
  const [error, setError] = useState(null);

  const updateLine = (i, field, value) => setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, [field]: value } : l)));
  const addLine = () => setLines((prev) => [...prev, { accountCode: "", accountLabel: "", side: "debit", amount: "" }]);
  const removeLine = (i) => setLines((prev) => prev.filter((_, idx) => idx !== i));

  const totalDebit = lines.filter((l) => l.side === "debit").reduce((s, l) => s + (parseFloat(l.amount) || 0), 0);
  const totalCredit = lines.filter((l) => l.side === "credit").reduce((s, l) => s + (parseFloat(l.amount) || 0), 0);
  const balanced = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0;
  const canSubmit = label && lines.every((l) => l.accountCode && l.accountLabel && parseFloat(l.amount) > 0) && balanced;

  const submit = async () => {
    setError(null);
    try {
      await onCreate({
        label,
        projectId: project?.id,
        lines: lines.map((l) => ({
          accountCode: l.accountCode,
          accountLabel: l.accountLabel,
          debit: l.side === "debit" ? parseFloat(l.amount) : undefined,
          credit: l.side === "credit" ? parseFloat(l.amount) : undefined,
        })),
      });
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="bg-white border border-[#E4E7EE] rounded-sm p-5 space-y-4 mb-6">
      <div className="text-sm font-medium text-[#101B33]">Nouvelle écriture manuelle</div>
      {error && <Banner tone="error">{error}</Banner>}
      <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Libellé de l'écriture (ex. : Régularisation, amortissement...)" className="w-full border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm" />

      <div className="space-y-2 overflow-x-auto">
        {lines.map((l, i) => (
          <div key={i} className="grid grid-cols-12 gap-2 items-center min-w-[560px]">
            <input value={l.accountCode} onChange={(e) => updateLine(i, "accountCode", e.target.value)} placeholder="N° compte" style={mono} className="col-span-2 border border-[#D8DCE6] rounded-sm px-2 py-1.5 text-sm" />
            <input value={l.accountLabel} onChange={(e) => updateLine(i, "accountLabel", e.target.value)} placeholder="Libellé du compte" className="col-span-4 border border-[#D8DCE6] rounded-sm px-2 py-1.5 text-sm" />
            <select value={l.side} onChange={(e) => updateLine(i, "side", e.target.value)} className="col-span-2 border border-[#D8DCE6] rounded-sm px-2 py-1.5 text-sm">
              <option value="debit">Débit</option>
              <option value="credit">Crédit</option>
            </select>
            <input value={l.amount} onChange={(e) => updateLine(i, "amount", e.target.value)} placeholder="Montant" style={mono} className="col-span-3 border border-[#D8DCE6] rounded-sm px-2 py-1.5 text-sm" />
            {lines.length > 2 && <button onClick={() => removeLine(i)} className="col-span-1 text-[#B7BFCE] hover:text-[#9B2C2C]"><X size={14} /></button>}
          </div>
        ))}
      </div>
      <button onClick={addLine} className="text-xs text-[#1B2A4A] hover:underline">+ Ajouter une ligne</button>

      <div className={`text-xs px-3 py-2 rounded-sm ${balanced ? "bg-[#EFF6EE] text-[#2F5233]" : "bg-[#FDECEC] text-[#9B2C2C]"}`} style={mono}>
        Débit : {fmt(totalDebit)} · Crédit : {fmt(totalCredit)} {balanced ? "— équilibrée ✓" : "— déséquilibrée"}
      </div>

      <div className="flex gap-2">
        <button onClick={submit} disabled={!canSubmit} className="text-sm px-4 py-2 bg-[#1B2A4A] text-white rounded-sm hover:bg-[#233459] disabled:opacity-40">
          Enregistrer l'écriture
        </button>
        <button onClick={onCancel} className="text-sm px-4 py-2 text-[#7A8399]">Annuler</button>
      </div>
    </div>
  );
}

export default function JournalView({ project }) {
  const [entries, setEntries] = useState([]);
  const [scope, setScope] = useState("project");
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  const refresh = useCallback(async () => {
    try {
      setEntries(await getJournal(scope === "project" ? project?.id : undefined));
    } catch (e) {
      setError(e.message);
    }
  }, [project, scope]);
  useEffect(() => { refresh(); }, [refresh]);

  const handleCreate = async (payload) => {
    await postManualEntry(payload);
    setShowForm(false);
    await refresh();
    setToast("Écriture manuelle enregistrée.");
  };

  const totalDebit = entries.reduce((s, e) => s + Number(e.debit), 0);
  const totalCredit = entries.reduce((s, e) => s + Number(e.credit), 0);
  const balanced = Math.abs(totalDebit - totalCredit) < 1;

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-xl text-[#101B33] font-semibold flex items-center gap-2">
          <BookOpen size={20} className="text-[#1B2A4A]" /> Journal comptable
        </h1>
        <div className="flex items-center gap-2">
          <select value={scope} onChange={(e) => setScope(e.target.value)} className="text-sm border border-[#D8DCE6] rounded-sm px-3 py-2">
            <option value="project">Ce projet uniquement</option>
            <option value="all">Toute l'organisation</option>
          </select>
          <ExportMenu
            formats={[{ type: "xlsx", label: "Excel (.xlsx)" }]}
            onExport={() => exportJournalXlsx(scope === "project" ? project?.id : undefined)}
          />
          {!showForm && (
            <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 bg-[#1B2A4A] text-white text-sm px-3.5 py-2 rounded-sm hover:bg-[#233459]">
              <Plus size={15} /> Écriture manuelle
            </button>
          )}
        </div>
      </div>
      <p className="text-xs text-[#9AA3B5] mb-6">
        Écritures générées automatiquement par la plateforme (dépenses, décaissements, livraisons, paie, factures) ou saisies manuellement — plan comptable SYSCOHADA (classes 1 à 8).
      </p>
      {toast && <Banner>{toast}</Banner>}
      {error && <Banner tone="error">{error}</Banner>}
      {showForm && <NewManualEntryForm project={scope === "project" ? project : null} onCreate={handleCreate} onCancel={() => setShowForm(false)} />}

      <div className="bg-white border border-[#E4E7EE] rounded-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#E4E7EE] text-left text-xs text-[#7A8399] uppercase tracking-wide">
              <th className="px-5 py-3 font-medium">Date</th>
              <th className="px-5 py-3 font-medium">Compte</th>
              <th className="px-5 py-3 font-medium">Libellé</th>
              <th className="px-5 py-3 font-medium text-right">Débit</th>
              <th className="px-5 py-3 font-medium text-right">Crédit</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id} className="border-b border-[#F0F1F5] last:border-0 hover:bg-[#FAFBFC]">
                <td className="px-5 py-2.5 text-[#9AA3B5]" style={mono}>{new Date(e.date).toLocaleDateString("fr-FR")}</td>
                <td className="px-5 py-2.5 text-[#3D4761]" style={mono}>{e.account.accountCode} <span className="text-[#9AA3B5]">— {e.account.label}</span></td>
                <td className="px-5 py-2.5 text-[#3D4761]">
                  {e.label}
                  {e.sourceType === "MANUEL" && <span className="ml-2 text-xs px-1.5 py-0.5 rounded-sm bg-[#F0F1F5] text-[#7A8399]">Manuelle</span>}
                </td>
                <td className="px-5 py-2.5 text-right" style={mono}>{Number(e.debit) > 0 ? fmt(e.debit) : ""}</td>
                <td className="px-5 py-2.5 text-right" style={mono}>{Number(e.credit) > 0 ? fmt(e.credit) : ""}</td>
              </tr>
            ))}
            {entries.length === 0 && (
              <tr><td colSpan={5} className="px-5 py-6 text-center text-sm text-[#7A8399]">Aucune écriture pour l'instant.</td></tr>
            )}
          </tbody>
          {entries.length > 0 && (
            <tfoot>
              <tr className="border-t-2 border-[#E4E7EE] font-medium">
                <td colSpan={3} className="px-5 py-3 text-[#101B33]">Total</td>
                <td className="px-5 py-3 text-right" style={mono}>{fmt(totalDebit)}</td>
                <td className="px-5 py-3 text-right" style={mono}>{fmt(totalCredit)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
      {entries.length > 0 && !balanced && (
        <div className="mt-3 text-xs text-[#9B2C2C] bg-[#FDECEC] rounded-sm px-3 py-2">
          Débit et crédit ne s'équilibrent pas — signale cette anomalie au comptable.
        </div>
      )}
    </div>
  );
}
