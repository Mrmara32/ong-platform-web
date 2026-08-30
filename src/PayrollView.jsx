import React, { useCallback, useEffect, useState } from "react";
import { Plus, Banknote, Send, MessageCircle, Mail } from "lucide-react";
import { listStaff, listPayslips, createPayslip, payPayslip, sharePayslip, exportPayslipPdf } from "./lib/api";
import { fmt, mono, Banner, ExportMenu, RecordPaymentPanel } from "./shared.jsx";

const STATUS_STYLE = {
  GENERE: "bg-[#F0F1F5] text-[#3D4761]",
  PAYE: "bg-[#EFF6EE] text-[#2F5233]",
  PARTAGE: "bg-[#E5F0FF] text-[#1D4E8F]",
};

function NewPayslipForm({ staff, onCreate, onCancel }) {
  const [staffId, setStaffId] = useState(staff[0]?.id ?? "");
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7));
  const [baseSalary, setBaseSalary] = useState("");
  const [bonuses, setBonuses] = useState("0");
  const [deductions, setDeductions] = useState("0");

  return (
    <div className="bg-white border border-[#E4E7EE] rounded-sm p-6 max-w-xl space-y-4 mb-6">
      <div className="text-sm font-medium text-[#101B33]">Générer un bulletin</div>
      <select value={staffId} onChange={(e) => setStaffId(e.target.value)} className="w-full border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm">
        {staff.map((s) => <option key={s.id} value={s.id}>{s.fullName} — {s.jobTitle}</option>)}
      </select>
      <input type="month" value={period} onChange={(e) => setPeriod(e.target.value)} className="w-full border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm" />
      <div className="grid grid-cols-3 gap-3">
        <input value={baseSalary} onChange={(e) => setBaseSalary(e.target.value)} placeholder="Salaire de base" style={mono} className="border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm" />
        <input value={bonuses} onChange={(e) => setBonuses(e.target.value)} placeholder="Primes" style={mono} className="border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm" />
        <input value={deductions} onChange={(e) => setDeductions(e.target.value)} placeholder="Retenues" style={mono} className="border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm" />
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => staffId && baseSalary && onCreate({
            staffId, period,
            baseSalary: parseFloat(baseSalary) || 0,
            bonuses: parseFloat(bonuses) || 0,
            deductions: parseFloat(deductions) || 0,
          })}
          className="text-sm px-4 py-2 bg-[#1B2A4A] text-white rounded-sm hover:bg-[#233459]"
        >
          Générer
        </button>
        <button onClick={onCancel} className="text-sm px-4 py-2 text-[#7A8399]">Annuler</button>
      </div>
    </div>
  );
}

export default function PayrollView({ project, lines }) {
  const [staff, setStaff] = useState([]);
  const [payslips, setPayslips] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [payingId, setPayingId] = useState(null);
  const [shareMenuId, setShareMenuId] = useState(null);
  const [toast, setToast] = useState(null);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setStaff(await listStaff());
    setPayslips(await listPayslips());
  }, []);
  useEffect(() => { refresh(); }, [refresh]);

  const handleCreate = async (payload) => {
    try {
      await createPayslip(payload);
      setShowForm(false);
      await refresh();
      setToast("Bulletin généré.");
    } catch (e) {
      setError(e.message);
    }
  };

  const handlePay = async (payslip, { method, reference }) => {
    if (!project) return setError("Sélectionne un projet pour imputer le paiement à une ligne budgétaire.");
    const personnelLine = lines.find((l) => l.code === "61");
    if (!personnelLine) return setError("Aucune ligne budgétaire Personnel trouvée sur ce projet.");
    try {
      await payPayslip(payslip.id, { projectId: project.id, budgetLineId: personnelLine.id, method, reference });
      setPayingId(null);
      await refresh();
      setToast(`Salaire net payé — écriture comptable générée sur la ligne Personnel.`);
    } catch (e) {
      setError(e.message);
    }
  };

  const handleShare = async (payslip, channel) => {
    try {
      const result = await sharePayslip(payslip.id, channel);
      setShareMenuId(null);
      await refresh();
      setToast(
        channel === "whatsapp"
          ? `Lien WhatsApp généré : ${result.link}`
          : `Bulletin envoyé par email à ${result.target}.`
      );
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl text-[#101B33] font-semibold">Paie</h1>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 bg-[#1B2A4A] text-white text-sm px-3.5 py-2 rounded-sm hover:bg-[#233459]">
            <Plus size={15} /> Générer un bulletin
          </button>
        )}
      </div>
      {toast && <Banner>{toast}</Banner>}
      {error && <Banner tone="error">{error}</Banner>}
      {showForm && <NewPayslipForm staff={staff} onCreate={handleCreate} onCancel={() => setShowForm(false)} />}

      <div className="space-y-3">
        {payslips.map((ps) => (
          <div key={ps.id} className="bg-white border border-[#E4E7EE] rounded-sm p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-3">
                <Banknote size={18} className="text-[#9AA3B5] mt-0.5" />
                <div>
                  <div className="text-sm text-[#101B33] font-medium">{ps.staff?.fullName} <span className="text-[#9AA3B5]">· {ps.period}</span></div>
                  <div className="text-xs text-[#9AA3B5] mt-0.5" style={mono}>Net à payer : {fmt(ps.netPay)}</div>
                  {ps.sharedVia?.length > 0 && <div className="text-xs text-[#9AA3B5] mt-1">Partagé via : {ps.sharedVia.join(", ")}</div>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded-sm ${STATUS_STYLE[ps.status]}`}>{ps.status}</span>
                {ps.status === "GENERE" && (
                  <button onClick={() => setPayingId(payingId === ps.id ? null : ps.id)} className="text-xs px-3 py-1.5 border border-[#D8DCE6] rounded-sm text-[#3D4761] hover:bg-[#FAFBFC]">
                    Payer
                  </button>
                )}
                <div className="relative">
                  <button onClick={() => setShareMenuId(shareMenuId === ps.id ? null : ps.id)} className="flex items-center gap-1 text-xs px-3 py-1.5 border border-[#D8DCE6] rounded-sm text-[#3D4761] hover:bg-[#FAFBFC]">
                    <Send size={12} /> Partager
                  </button>
                  {shareMenuId === ps.id && (
                    <div className="absolute right-0 mt-1 bg-white border border-[#E4E7EE] rounded-sm shadow-sm z-10 w-40">
                      <button onClick={() => handleShare(ps, "whatsapp")} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#3D4761] hover:bg-[#FAFBFC]">
                        <MessageCircle size={13} className="text-[#2F855A]" /> WhatsApp
                      </button>
                      <button onClick={() => handleShare(ps, "email")} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#3D4761] hover:bg-[#FAFBFC]">
                        <Mail size={13} className="text-[#1D4E8F]" /> Email
                      </button>
                    </div>
                  )}
                </div>
                <ExportMenu formats={[{ type: "pdf", label: "PDF" }]} onExport={() => exportPayslipPdf(ps.id, ps.staff?.fullName)} />
              </div>
            </div>
            {payingId === ps.id && (
              <RecordPaymentPanel label="Paiement du salaire net" onRecord={(p) => handlePay(ps, p)} onClose={() => setPayingId(null)} />
            )}
          </div>
        ))}
        {payslips.length === 0 && <div className="bg-white border border-[#E4E7EE] rounded-sm p-6 text-sm text-[#7A8399]">Aucun bulletin pour l'instant.</div>}
      </div>
    </div>
  );
}
