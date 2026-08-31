import React, { useCallback, useEffect, useState } from "react";
import { Target, Plus, TrendingUp, Users } from "lucide-react";
import { createLogframeIndicator, updateLogframeIndicator, deleteLogframeIndicator, getImpactDashboard, getProject } from "./lib/api";
import { Banner, KpiCard, mono } from "./shared.jsx";

function NewIndicatorForm({ onCreate, onCancel }) {
  const [objective, setObjective] = useState("");
  const [result, setResult] = useState("");
  const [indicator, setIndicator] = useState("");
  const [target, setTarget] = useState("");

  const canSubmit = objective && result && indicator && parseFloat(target) > 0;

  return (
    <div className="bg-white border border-[#E4E7EE] rounded-sm p-5 space-y-3 mb-6 max-w-2xl">
      <div className="text-sm font-medium text-[#101B33]">Nouvel indicateur</div>
      <input value={objective} onChange={(e) => setObjective(e.target.value)} placeholder="Objectif (ex. : Réduire l'incidence du paludisme...)" className="w-full border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm" />
      <input value={result} onChange={(e) => setResult(e.target.value)} placeholder="Résultat attendu (ex. : R1 — Visites à domicile réalisées)" className="w-full border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input value={indicator} onChange={(e) => setIndicator(e.target.value)} placeholder="Indicateur (ex. : Nombre de VAD réalisées)" className="border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm" />
        <input type="number" min="0" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="Cible" style={mono} className="border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm" />
      </div>
      <div className="flex gap-2">
        <button
          disabled={!canSubmit}
          onClick={() => onCreate({ objective, result, indicator, target: parseFloat(target) })}
          className="text-xs px-3 py-1.5 bg-[#1B2A4A] text-white rounded-sm hover:bg-[#233459] disabled:opacity-40"
        >
          Ajouter l'indicateur
        </button>
        <button onClick={onCancel} className="text-xs px-3 py-1.5 text-[#7A8399]">Annuler</button>
      </div>
    </div>
  );
}

function IndicatorRow({ ind, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [achieved, setAchieved] = useState(String(ind.achieved));
  const pct = Math.min(100, (ind.achieved / ind.target) * 100);

  return (
    <div className="px-5 py-4 border-b border-[#F0F1F5] last:border-0">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="text-xs text-[#9AA3B5] uppercase tracking-wide">{ind.objective}</div>
          <div className="text-sm text-[#101B33] mt-0.5">{ind.result}</div>
          <div className="text-xs text-[#3D4761] mt-1">{ind.indicator}</div>
        </div>
        <div className="text-right shrink-0">
          {editing ? (
            <div className="flex items-center gap-1">
              <input value={achieved} onChange={(e) => setAchieved(e.target.value)} style={mono} className="w-24 border border-[#D8DCE6] rounded-sm px-2 py-1 text-sm text-right" />
              <button onClick={() => { onUpdate(ind.id, parseFloat(achieved) || 0); setEditing(false); }} className="text-xs text-[#1B2A4A] hover:underline">OK</button>
            </div>
          ) : (
            <button onClick={() => setEditing(true)} className="text-sm" style={mono}>
              {ind.achieved.toLocaleString("fr-FR")} / {ind.target.toLocaleString("fr-FR")}
            </button>
          )}
          <button onClick={() => onDelete(ind.id)} className="block text-xs text-[#B7BFCE] hover:text-[#9B2C2C] mt-1 ml-auto">Retirer</button>
        </div>
      </div>
      <div className="h-1.5 bg-[#EEF0F4] rounded-full overflow-hidden mt-2">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: pct >= 100 ? "#2F855A" : "#1B2A4A" }} />
      </div>
    </div>
  );
}

export default function LogframeMatrixView({ project }) {
  const [showForm, setShowForm] = useState(false);
  const [impact, setImpact] = useState(null);
  const [logframe, setLogframe] = useState([]);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    if (!project) return;
    try {
      const full = await getProject(project.id);
      setLogframe(full.logframe || []);
      setImpact(await getImpactDashboard(project.id));
    } catch (e) {
      setError(e.message);
    }
  }, [project]);
  useEffect(() => { refresh(); }, [refresh]);

  if (!project) return <div className="p-4 md:p-8 text-sm text-[#7A8399]">Sélectionne un projet.</div>;

  const handleCreate = async (payload) => {
    try {
      await createLogframeIndicator(project.id, payload);
      setShowForm(false);
      await refresh();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleUpdate = async (id, achieved) => {
    try {
      await updateLogframeIndicator(id, { achieved });
      await refresh();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteLogframeIndicator(id);
      await refresh();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-xl text-[#101B33] font-semibold flex items-center gap-2">
          <Target size={20} className="text-[#1B2A4A]" /> Suivi & Évaluation — {project.name}
        </h1>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 bg-[#1B2A4A] text-white text-sm px-3.5 py-2 rounded-sm hover:bg-[#233459]">
            <Plus size={15} /> Nouvel indicateur
          </button>
        )}
      </div>
      <p className="text-xs text-[#9AA3B5] mb-6">Matrice du cadre logique (objectifs, résultats, indicateurs) et évolution des bénéficiaires touchés sur le terrain.</p>
      {error && <Banner tone="error">{error}</Banner>}
      {showForm && <NewIndicatorForm onCreate={handleCreate} onCancel={() => setShowForm(false)} />}

      {impact && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <KpiCard label="Bénéficiaires touchés (cumul)" value={impact.totalBeneficiaries.toLocaleString("fr-FR")} accent="#2F855A" />
          <KpiCard label="Remontées terrain" value={impact.totalUpdates} accent="#1B2A4A" />
          <KpiCard label="Indicateurs suivis" value={logframe.length} accent="#E8B564" />
        </div>
      )}

      <div className="bg-white border border-[#E4E7EE] rounded-sm mb-6">
        <div className="px-5 py-3 border-b border-[#E4E7EE] text-sm font-medium text-[#101B33]">Matrice d'indicateurs</div>
        {logframe.length === 0 ? (
          <div className="p-5 text-sm text-[#7A8399]">Aucun indicateur pour l'instant.</div>
        ) : (
          logframe.map((ind) => <IndicatorRow key={ind.id} ind={ind} onUpdate={handleUpdate} onDelete={handleDelete} />)
        )}
      </div>

      {impact && impact.timeline.length > 0 && (
        <div className="bg-white border border-[#E4E7EE] rounded-sm">
          <div className="px-5 py-3 border-b border-[#E4E7EE] flex items-center gap-2 text-sm font-medium text-[#101B33]">
            <TrendingUp size={15} className="text-[#9AA3B5]" /> Évolution des bénéficiaires (remontées terrain)
          </div>
          <div className="divide-y divide-[#F0F1F5] max-h-96 overflow-y-auto">
            {impact.timeline.slice().reverse().map((t, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-2.5">
                <div>
                  <div className="text-sm text-[#101B33] flex items-center gap-1.5"><Users size={12} className="text-[#9AA3B5]" /> {t.activityTitle}</div>
                  <div className="text-xs text-[#9AA3B5] mt-0.5">{t.note}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm" style={mono}>+{t.beneficiariesReached}</div>
                  <div className="text-xs text-[#9AA3B5]">{new Date(t.date).toLocaleDateString("fr-FR")}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
