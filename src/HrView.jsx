import React, { useCallback, useEffect, useState } from "react";
import { Plus, Users, Mail, Phone } from "lucide-react";
import { listStaff, createStaff, createAssignment, getStaffingCost } from "./lib/api";
import { fmt, mono, Banner, KpiCard } from "./shared.jsx";

function NewStaffForm({ onCreate, onCancel }) {
  const [fullName, setFullName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [monthlyCost, setMonthlyCost] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  return (
    <div className="bg-white border border-[#E4E7EE] rounded-sm p-5 space-y-3 mb-6 max-w-lg">
      <div className="text-sm font-medium text-[#101B33]">Nouvel employé</div>
      <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Nom complet" className="w-full border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm" />
      <div className="grid grid-cols-2 gap-3">
        <input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="Fonction" className="border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm" />
        <input value={monthlyCost} onChange={(e) => setMonthlyCost(e.target.value)} placeholder="Coût mensuel" style={mono} className="border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email (optionnel)" className="border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm" />
        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Téléphone (optionnel)" className="border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm" />
      </div>
      <p className="text-xs text-[#9AA3B5]">
        L'email et le téléphone servent au partage des bulletins de paie (email/WhatsApp) et sont requis pour déclarer cet employé comme chauffeur.
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => fullName && jobTitle && monthlyCost && onCreate({
            fullName, jobTitle, monthlyCost: parseFloat(monthlyCost) || 0,
            ...(email ? { email } : {}), ...(phone ? { phone } : {}),
          })}
          className="text-xs px-3 py-1.5 bg-[#1B2A4A] text-white rounded-sm hover:bg-[#233459]"
        >
          Ajouter l'employé
        </button>
        <button onClick={onCancel} className="text-xs px-3 py-1.5 text-[#7A8399]">Annuler</button>
      </div>
    </div>
  );
}

function NewAssignmentForm({ staff, projectId, onCreate, onCancel }) {
  const [staffId, setStaffId] = useState(staff[0]?.id ?? "");
  const [allocPct, setAllocPct] = useState("100");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));

  return (
    <div className="bg-white border border-[#E4E7EE] rounded-sm p-5 space-y-3 mb-6 max-w-lg">
      <select value={staffId} onChange={(e) => setStaffId(e.target.value)} className="w-full border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm">
        {staff.map((s) => <option key={s.id} value={s.id}>{s.fullName} — {s.jobTitle}</option>)}
      </select>
      <div className="grid grid-cols-2 gap-3">
        <input value={allocPct} onChange={(e) => setAllocPct(e.target.value)} placeholder="Taux d'affectation (%)" className="border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm" />
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm" />
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => staffId && onCreate({ staffId, projectId, allocPct: parseInt(allocPct, 10) || 100, startDate })}
          className="text-xs px-3 py-1.5 bg-[#1B2A4A] text-white rounded-sm hover:bg-[#233459]"
        >
          Affecter au projet
        </button>
        <button onClick={onCancel} className="text-xs px-3 py-1.5 text-[#7A8399]">Annuler</button>
      </div>
    </div>
  );
}

export default function HrView({ project }) {
  const [staff, setStaff] = useState([]);
  const [staffingCost, setStaffingCost] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showStaffForm, setShowStaffForm] = useState(false);
  const [toast, setToast] = useState(null);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setStaff(await listStaff());
    if (project) setStaffingCost(await getStaffingCost(project.id));
  }, [project]);
  useEffect(() => { refresh(); }, [refresh]);

  const handleCreate = async (payload) => {
    try {
      await createAssignment(payload);
      setShowForm(false);
      await refresh();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleCreateStaff = async (payload) => {
    try {
      await createStaff(payload);
      setShowStaffForm(false);
      await refresh();
      setToast(`${payload.fullName} ajouté(e) à l'organisation.`);
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl text-[#101B33] font-semibold">Ressources humaines</h1>
        <div className="flex items-center gap-2">
          {!showStaffForm && (
            <button onClick={() => setShowStaffForm(true)} className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-[#D8DCE6] rounded-sm text-[#3D4761] hover:bg-[#FAFBFC]">
              <Plus size={13} /> Nouvel employé
            </button>
          )}
          {project && !showForm && (
            <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 bg-[#1B2A4A] text-white text-sm px-3.5 py-2 rounded-sm hover:bg-[#233459]">
              <Plus size={15} /> Affecter du personnel
            </button>
          )}
        </div>
      </div>
      {toast && <Banner>{toast}</Banner>}
      {error && <Banner tone="error">{error}</Banner>}
      {showStaffForm && <NewStaffForm onCreate={handleCreateStaff} onCancel={() => setShowStaffForm(false)} />}
      {showForm && project && <NewAssignmentForm staff={staff} projectId={project.id} onCreate={handleCreate} onCancel={() => setShowForm(false)} />}

      {staffingCost && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <KpiCard label="Personnel affecté" value={staffingCost.assignments.length} accent="#1B2A4A" />
          <KpiCard label="Coût mensuel imputé" value={fmt(staffingCost.totalMonthlyCost)} sub="sur ce projet" accent="#E8B564" />
          <KpiCard label="Employés dans l'organisation" value={staff.length} accent="#2F855A" />
        </div>
      )}

      <div className="bg-white border border-[#E4E7EE] rounded-sm divide-y divide-[#F0F1F5]">
        {staff.map((s) => (
          <div key={s.id} className="flex items-center justify-between px-5 py-3">
            <div className="flex items-center gap-3">
              <Users size={16} className="text-[#9AA3B5]" />
              <div>
                <div className="text-sm text-[#101B33]">{s.fullName}</div>
                <div className="text-xs text-[#9AA3B5] mt-0.5 flex items-center gap-3">
                  <span>{s.jobTitle}</span>
                  {s.email && <span className="flex items-center gap-1"><Mail size={10} /> {s.email}</span>}
                  {s.phone && <span className="flex items-center gap-1"><Phone size={10} /> {s.phone}</span>}
                </div>
              </div>
            </div>
            <span style={mono} className="text-sm text-[#3D4761]">{fmt(s.monthlyCost)} / mois</span>
          </div>
        ))}
        {staff.length === 0 && <div className="p-5 text-sm text-[#7A8399]">Aucun employé pour l'instant.</div>}
      </div>
    </div>
  );
}
