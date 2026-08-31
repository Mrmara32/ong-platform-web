import React, { useCallback, useEffect, useState } from "react";
import { Landmark, Plus, Link2 } from "lucide-react";
import { listBankStatementLines, createBankStatementLine, listUnreconciledEntries, matchBankStatementLine } from "./lib/api";
import { fmt, mono, Banner, KpiCard } from "./shared.jsx";

function NewLineForm({ onCreate, onCancel }) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");

  return (
    <div className="bg-white border border-[#E4E7EE] rounded-sm p-5 space-y-3 mb-6 max-w-lg">
      <div className="text-sm font-medium text-[#101B33]">Nouvelle ligne de relevé bancaire</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm" />
        <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Montant (négatif si débit)" style={mono} className="border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm" />
      </div>
      <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Libellé (tel qu'affiché sur le relevé)" className="w-full border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm" />
      <input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Référence (optionnel)" className="w-full border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm" />
      <div className="flex gap-2">
        <button
          onClick={() => label && amount && onCreate({ date, label, amount: parseFloat(amount) || 0, reference: reference || undefined })}
          className="text-xs px-3 py-1.5 bg-[#1B2A4A] text-white rounded-sm hover:bg-[#233459]"
        >
          Ajouter la ligne
        </button>
        <button onClick={onCancel} className="text-xs px-3 py-1.5 text-[#7A8399]">Annuler</button>
      </div>
    </div>
  );
}

function MatchInline({ entries, onMatch, onCancel }) {
  const [entryId, setEntryId] = useState(entries[0]?.id ?? "");
  return (
    <div className="mt-2 bg-[#FAFBFC] border border-[#E4E7EE] rounded-sm p-3 flex items-center gap-2">
      <select value={entryId} onChange={(e) => setEntryId(e.target.value)} className="flex-1 border border-[#D8DCE6] rounded-sm px-3 py-1.5 text-sm">
        {entries.length === 0 && <option value="">Aucune écriture de trésorerie non rapprochée</option>}
        {entries.map((e) => (
          <option key={e.id} value={e.id}>
            {new Date(e.date).toLocaleDateString("fr-FR")} · {e.label} · {fmt(Number(e.debit) || Number(e.credit))}
          </option>
        ))}
      </select>
      <button onClick={() => entryId && onMatch(entryId)} disabled={!entryId} className="text-xs px-3 py-1.5 bg-[#1B2A4A] text-white rounded-sm hover:bg-[#233459] disabled:opacity-40">
        Rapprocher
      </button>
      <button onClick={onCancel} className="text-xs px-3 py-1.5 text-[#7A8399]">Annuler</button>
    </div>
  );
}

export default function BankReconciliationView() {
  const [lines, setLines] = useState([]);
  const [unreconciled, setUnreconciled] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [matchingLineId, setMatchingLineId] = useState(null);
  const [toast, setToast] = useState(null);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLines(await listBankStatementLines());
    setUnreconciled(await listUnreconciledEntries());
  }, []);
  useEffect(() => { refresh(); }, [refresh]);

  const handleCreate = async (payload) => {
    try {
      await createBankStatementLine(payload);
      setShowForm(false);
      await refresh();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleMatch = async (lineId, entryId) => {
    try {
      await matchBankStatementLine(lineId, entryId);
      setMatchingLineId(null);
      await refresh();
      setToast("Ligne rapprochée.");
    } catch (e) {
      setError(e.message);
    }
  };

  const unmatchedLines = lines.filter((l) => !l.matched);
  const matchedLines = lines.filter((l) => l.matched);

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-xl text-[#101B33] font-semibold flex items-center gap-2">
          <Landmark size={20} className="text-[#1B2A4A]" /> Rapprochement bancaire
        </h1>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 bg-[#1B2A4A] text-white text-sm px-3.5 py-2 rounded-sm hover:bg-[#233459]">
            <Plus size={15} /> Ligne de relevé
          </button>
        )}
      </div>
      <p className="text-xs text-[#9AA3B5] mb-6">Saisis les lignes de ton relevé bancaire, puis rapproche-les des écritures de trésorerie correspondantes.</p>
      {toast && <Banner>{toast}</Banner>}
      {error && <Banner tone="error">{error}</Banner>}
      {showForm && <NewLineForm onCreate={handleCreate} onCancel={() => setShowForm(false)} />}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <KpiCard label="Lignes à rapprocher" value={unmatchedLines.length} accent="#E8B564" />
        <KpiCard label="Lignes rapprochées" value={matchedLines.length} accent="#2F855A" />
      </div>

      <div className="bg-white border border-[#E4E7EE] rounded-sm divide-y divide-[#F0F1F5]">
        {lines.map((l) => (
          <div key={l.id} className="px-5 py-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-[#101B33]">{l.label}</div>
                <div className="text-xs text-[#9AA3B5] mt-0.5" style={mono}>{new Date(l.date).toLocaleDateString("fr-FR")} · {fmt(l.amount)}</div>
              </div>
              {l.matched ? (
                <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-sm bg-[#EFF6EE] text-[#2F5233]"><Link2 size={12} /> Rapprochée</span>
              ) : (
                <button onClick={() => setMatchingLineId(matchingLineId === l.id ? null : l.id)} className="text-xs px-3 py-1.5 border border-[#D8DCE6] rounded-sm text-[#3D4761] hover:bg-[#FAFBFC]">
                  Rapprocher
                </button>
              )}
            </div>
            {matchingLineId === l.id && (
              <MatchInline entries={unreconciled} onMatch={(entryId) => handleMatch(l.id, entryId)} onCancel={() => setMatchingLineId(null)} />
            )}
          </div>
        ))}
        {lines.length === 0 && <div className="p-5 text-sm text-[#7A8399]">Aucune ligne de relevé pour l'instant.</div>}
      </div>
    </div>
  );
}
