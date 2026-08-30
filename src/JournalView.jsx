import React, { useCallback, useEffect, useState } from "react";
import { BookOpen } from "lucide-react";
import { getJournal, exportJournalXlsx } from "./lib/api";
import { fmt, mono, Banner, ExportMenu } from "./shared.jsx";

export default function JournalView({ project }) {
  const [entries, setEntries] = useState([]);
  const [scope, setScope] = useState("project");
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    try {
      setEntries(await getJournal(scope === "project" ? project?.id : undefined));
    } catch (e) {
      setError(e.message);
    }
  }, [project, scope]);
  useEffect(() => { refresh(); }, [refresh]);

  const totalDebit = entries.reduce((s, e) => s + Number(e.debit), 0);
  const totalCredit = entries.reduce((s, e) => s + Number(e.credit), 0);
  const balanced = Math.abs(totalDebit - totalCredit) < 1;

  return (
    <div className="p-8">
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
        </div>
      </div>
      <p className="text-xs text-[#9AA3B5] mb-6">
        Écritures générées automatiquement par la plateforme (dépenses, décaissements, livraisons, paie, factures) — plan comptable SYCEBNL.
      </p>
      {error && <Banner tone="error">{error}</Banner>}

      <div className="bg-white border border-[#E4E7EE] rounded-sm">
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
                <td className="px-5 py-2.5 text-[#3D4761]">{e.label}</td>
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
