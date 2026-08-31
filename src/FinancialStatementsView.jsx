import React, { useCallback, useEffect, useState } from "react";
import { LineChart } from "lucide-react";
import { getBalance, getBilan, getCompteResultat, getFluxTresorerie } from "./lib/api";
import { fmt, mono, Banner, KpiCard } from "./shared.jsx";

const TABS = [
  { id: "balance", label: "Balance générale" },
  { id: "bilan", label: "Bilan" },
  { id: "resultat", label: "Compte de résultat" },
  { id: "flux", label: "Flux de trésorerie" },
];

function BalanceTab() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => { getBalance().then(setData).catch((e) => setError(e.message)); }, []);
  if (error) return <Banner tone="error">{error}</Banner>;
  if (!data) return <div className="text-sm text-[#7A8399]">Chargement…</div>;

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <KpiCard label="Total débit" value={fmt(data.totalDebit)} accent="#1B2A4A" />
        <KpiCard label="Total crédit" value={fmt(data.totalCredit)} accent="#2F855A" />
        <KpiCard label="Équilibre" value={data.balanced ? "✓ Équilibrée" : "✗ Déséquilibrée"} accent={data.balanced ? "#2F855A" : "#C53030"} />
      </div>
      <div className="bg-white border border-[#E4E7EE] rounded-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#E4E7EE] text-left text-xs text-[#7A8399] uppercase tracking-wide">
              <th className="px-5 py-3 font-medium">Compte</th>
              <th className="px-5 py-3 font-medium text-right">Débit</th>
              <th className="px-5 py-3 font-medium text-right">Crédit</th>
              <th className="px-5 py-3 font-medium text-right">Solde</th>
            </tr>
          </thead>
          <tbody>
            {data.accounts.map((a) => (
              <tr key={a.code} className="border-b border-[#F0F1F5] last:border-0">
                <td className="px-5 py-2.5 text-[#3D4761]" style={mono}>{a.code} — {a.label}</td>
                <td className="px-5 py-2.5 text-right" style={mono}>{fmt(a.debit)}</td>
                <td className="px-5 py-2.5 text-right" style={mono}>{fmt(a.credit)}</td>
                <td className="px-5 py-2.5 text-right font-medium" style={{ ...mono, color: a.balance >= 0 ? "#2F5233" : "#9B2C2C" }}>{fmt(Math.abs(a.balance))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function BilanTab() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => { getBilan().then(setData).catch((e) => setError(e.message)); }, []);
  if (error) return <Banner tone="error">{error}</Banner>;
  if (!data) return <div className="text-sm text-[#7A8399]">Chargement…</div>;

  const Column = ({ title, rows, total }) => (
    <div className="bg-white border border-[#E4E7EE] rounded-sm">
      <div className="px-5 py-3 border-b border-[#E4E7EE] text-sm font-medium text-[#101B33]">{title}</div>
      <div className="divide-y divide-[#F0F1F5]">
        {rows.map((a) => (
          <div key={a.code} className="flex items-center justify-between px-5 py-2.5 text-sm">
            <span className="text-[#3D4761]" style={mono}>{a.code} — {a.label}</span>
            <span style={mono}>{fmt(Math.abs(a.balance))}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between px-5 py-3 border-t-2 border-[#E4E7EE] font-medium">
        <span className="text-[#101B33]">Total</span>
        <span style={mono}>{fmt(total)}</span>
      </div>
    </div>
  );

  return (
    <>
      {!data.equilibre && (
        <div className="mb-4 text-xs text-[#9B2C2C] bg-[#FDECEC] rounded-sm px-3 py-2">
          Actif ({fmt(data.totalActif)}) ≠ Passif ({fmt(data.totalPassif)}) — écart à investiguer.
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Column title="Actif (classes 2, 3, 5 + tiers débiteurs)" rows={data.actif} total={data.totalActif} />
        <Column title="Passif (classe 1 + tiers créditeurs)" rows={data.passif} total={data.totalPassif} />
      </div>
    </>
  );
}

function CompteResultatTab() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => { getCompteResultat().then(setData).catch((e) => setError(e.message)); }, []);
  if (error) return <Banner tone="error">{error}</Banner>;
  if (!data) return <div className="text-sm text-[#7A8399]">Chargement…</div>;

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <KpiCard label="Total charges" value={fmt(data.totalCharges)} accent="#C53030" />
        <KpiCard label="Total produits" value={fmt(data.totalProduits)} accent="#2F855A" />
        <KpiCard label="Résultat net" value={fmt(data.resultatNet)} accent={data.resultatNet >= 0 ? "#2F855A" : "#C53030"} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white border border-[#E4E7EE] rounded-sm">
          <div className="px-5 py-3 border-b border-[#E4E7EE] text-sm font-medium text-[#101B33]">Charges (classes 6, 8)</div>
          <div className="divide-y divide-[#F0F1F5]">
            {data.charges.map((c) => (
              <div key={c.code} className="flex items-center justify-between px-5 py-2.5 text-sm">
                <span className="text-[#3D4761]" style={mono}>{c.code} — {c.label}</span>
                <span style={mono}>{fmt(c.amount)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white border border-[#E4E7EE] rounded-sm">
          <div className="px-5 py-3 border-b border-[#E4E7EE] text-sm font-medium text-[#101B33]">Produits (classe 7)</div>
          <div className="divide-y divide-[#F0F1F5]">
            {data.produits.map((p) => (
              <div key={p.code} className="flex items-center justify-between px-5 py-2.5 text-sm">
                <span className="text-[#3D4761]" style={mono}>{p.code} — {p.label}</span>
                <span style={mono}>{fmt(p.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function FluxTab() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => { getFluxTresorerie().then(setData).catch((e) => setError(e.message)); }, []);
  if (error) return <Banner tone="error">{error}</Banner>;
  if (!data) return <div className="text-sm text-[#7A8399]">Chargement…</div>;

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <KpiCard label="Total entrées" value={fmt(data.totalEntrees)} accent="#2F855A" />
        <KpiCard label="Total sorties" value={fmt(data.totalSorties)} accent="#C53030" />
        <KpiCard label="Variation nette" value={fmt(data.variationNette)} accent={data.variationNette >= 0 ? "#2F855A" : "#C53030"} />
      </div>
      <div className="bg-white border border-[#E4E7EE] rounded-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#E4E7EE] text-left text-xs text-[#7A8399] uppercase tracking-wide">
              <th className="px-5 py-3 font-medium">Compte de trésorerie</th>
              <th className="px-5 py-3 font-medium text-right">Entrées</th>
              <th className="px-5 py-3 font-medium text-right">Sorties</th>
              <th className="px-5 py-3 font-medium text-right">Variation</th>
            </tr>
          </thead>
          <tbody>
            {data.comptes.map((c) => (
              <tr key={c.code} className="border-b border-[#F0F1F5] last:border-0">
                <td className="px-5 py-2.5 text-[#3D4761]" style={mono}>{c.code} — {c.label}</td>
                <td className="px-5 py-2.5 text-right" style={mono}>{fmt(c.entrees)}</td>
                <td className="px-5 py-2.5 text-right" style={mono}>{fmt(c.sorties)}</td>
                <td className="px-5 py-2.5 text-right font-medium" style={{ ...mono, color: c.variation >= 0 ? "#2F5233" : "#9B2C2C" }}>{fmt(c.variation)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default function FinancialStatementsView() {
  const [tab, setTab] = useState("balance");

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-xl text-[#101B33] font-semibold flex items-center gap-2 mb-2">
        <LineChart size={20} className="text-[#1B2A4A]" /> États financiers
      </h1>
      <p className="text-xs text-[#9AA3B5] mb-6">
        Calculés directement depuis le grand livre — aucune double saisie, une seule source de vérité.
      </p>
      <div className="flex gap-1 mb-6 border-b border-[#E4E7EE]">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm border-b-2 -mb-px ${tab === t.id ? "border-[#1B2A4A] text-[#101B33] font-medium" : "border-transparent text-[#7A8399] hover:text-[#3D4761]"}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === "balance" && <BalanceTab />}
      {tab === "bilan" && <BilanTab />}
      {tab === "resultat" && <CompteResultatTab />}
      {tab === "flux" && <FluxTab />}
    </div>
  );
}
