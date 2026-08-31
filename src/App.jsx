import React, { useEffect, useState, useCallback } from "react";
import {
  LayoutDashboard, FolderKanban, Wallet, Truck, Users, FileText, Share2,
  Plus, ChevronRight, AlertTriangle, CheckCircle2, LogOut, Package,
  Download, FileSpreadsheet, Receipt, Banknote, Monitor, Car, UserPlus, CreditCard, BookOpen, Printer,
  LineChart, Landmark, ClipboardList, FileSignature, Mail,
} from "lucide-react";
import LoginScreen from "./LoginScreen.jsx";
import { RecordPaymentPanel, CURRENCIES } from "./shared.jsx";
import InvoicingView from "./InvoicingView.jsx";
import PayrollView from "./PayrollView.jsx";
import HrView from "./HrView.jsx";
import ShareView from "./ShareView.jsx";
import EquipmentView from "./EquipmentView.jsx";
import FleetView from "./FleetView.jsx";
import DriversView from "./DriversView.jsx";
import JournalView from "./JournalView.jsx";
import StockView from "./StockView.jsx";
import FinancialStatementsView from "./FinancialStatementsView.jsx";
import BankReconciliationView from "./BankReconciliationView.jsx";
import ConsumableRequestsView from "./ConsumableRequestsView.jsx";
import PaymentRequestsView from "./PaymentRequestsView.jsx";
import LettersView from "./LettersView.jsx";
import GanttChart from "./GanttChart.jsx";
import TeamView from "./TeamView.jsx";
import AcceptInviteScreen from "./AcceptInviteScreen.jsx";
import MenuBar from "./MenuBar.jsx";
import CommandPalette from "./CommandPalette.jsx";
import { ShortcutsModal, AboutModal } from "./HelpModals.jsx";
import OrganizationSettingsView from "./OrganizationSettingsView.jsx";
import {
  setAuthToken, getAuthToken, listProjects, listBudgetLines, createExpense,
  listPurchaseOrders, createPurchaseOrder, deliverPurchaseOrder,
  validatePurchaseOrder, rejectPurchaseOrder, registerSupplierInvoice,
  exportPurchaseOrderPdf, printPurchaseOrderPdf,
  listActivities, createActivity, listDocuments, createDocument,
  exportDocumentPdf, exportDocumentDocx, exportBudgetXlsx, printDocumentPdf,
  listSuppliers, createSupplier, createProject, paySupplier,
  listProjectMembers, addProjectMember, removeProjectMember, listMembers,
} from "./lib/api";

const fmt = (n, currency = "GNF") => {
  try {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency,
      maximumFractionDigits: currency === "GNF" ? 0 : 2,
    }).format(Number(n));
  } catch {
    return `${new Intl.NumberFormat("fr-FR").format(Math.round(Number(n)))} ${currency}`;
  }
};
const mono = { fontFamily: "'IBM Plex Mono', monospace" };

const NAV_ITEMS = [
  { id: "dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { id: "projects", label: "Projets", icon: FolderKanban },
  { id: "budget", label: "Budget & Dépenses", icon: Wallet },
  { id: "invoicing", label: "Facturation", icon: Receipt },
  { id: "payment-requests", label: "Demandes de paiement", icon: FileSignature },
  { id: "letters", label: "Lettres de transmission", icon: Mail },
  { id: "journal", label: "Journal comptable", icon: BookOpen },
  { id: "financial-statements", label: "États financiers", icon: LineChart },
  { id: "bank-reconciliation", label: "Rapprochement bancaire", icon: Landmark },
  { id: "consumables", label: "Demandes de consommables", icon: ClipboardList },
  { id: "payroll", label: "Paie", icon: Banknote },
  { id: "logistics", label: "Logistique", icon: Truck },
  { id: "stock", label: "Stocks", icon: Package },
  { id: "fleet", label: "Flotte (véhicules, motos, engins)", icon: Car },
  { id: "drivers", label: "Chauffeurs", icon: CreditCard },
  { id: "equipment", label: "Équipements & Alertes", icon: Monitor },
  { id: "hr", label: "Ressources humaines", icon: Users },
  { id: "docs", label: "Documents & TDR", icon: FileText },
  { id: "share", label: "Partage inter-ONG", icon: Share2 },
  { id: "team", label: "Équipe", icon: UserPlus },
];

// ================= Sidebar =================

function Sidebar({ active, onSelect, org, onLogout, collapsed, mobileOpen, onCloseMobile }) {
  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={onCloseMobile} />
      )}
      <aside
        className={`
          fixed md:relative inset-y-0 left-0 z-50 md:z-auto
          ${collapsed ? "md:w-16" : "md:w-64"} w-64 shrink-0
          bg-[#101B33] text-[#C9D3E5] flex flex-col h-full
          transition-transform md:transition-all duration-150
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0
        `}
      >
        <div className={`px-5 py-6 border-b border-[#22304F] ${collapsed ? "md:px-3" : ""}`}>
          <div className="text-[#E8B564] font-semibold tracking-wide text-sm uppercase" style={mono}>
            <span className={collapsed ? "md:hidden" : ""}>ONG Club des Amis du Monde (CAM)</span>
            <span className={collapsed ? "hidden md:inline" : "hidden"}>CAM</span>
          </div>
          <div className={`text-xs text-[#8494B5] mt-0.5 ${collapsed ? "md:hidden" : ""}`}>{org || "Plateforme de gestion de projets"}</div>
        </div>
        <nav className="flex-1 py-4 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { onSelect(item.id); onCloseMobile?.(); }}
                title={collapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 text-sm text-left transition-colors px-5 py-2.5 ${collapsed ? "md:justify-center md:px-0 md:py-3" : ""} ${
                  isActive ? "bg-[#1B2A4A] text-white border-r-2 border-[#E8B564]" : "text-[#9AA8C4] hover:bg-[#182642] hover:text-white"
                }`}
              >
                <Icon size={17} strokeWidth={1.75} />
                <span className={collapsed ? "md:hidden" : ""}>{item.label}</span>
              </button>
            );
          })}
        </nav>
        <button onClick={onLogout} className={`flex items-center gap-2 border-t border-[#22304F] text-xs text-[#9AA8C4] hover:text-white px-5 py-4 ${collapsed ? "md:justify-center md:py-4" : ""}`}>
          <LogOut size={14} /> <span className={collapsed ? "md:hidden" : ""}>Se déconnecter</span>
        </button>
      </aside>
    </>
  );
}

function KpiCard({ label, value, sub, accent }) {
  return (
    <div className="bg-white border border-[#E4E7EE] rounded-sm p-4 border-l-4" style={{ borderLeftColor: accent }}>
      <div className="text-xs text-[#7A8399] uppercase tracking-wide">{label}</div>
      <div className="text-2xl text-[#101B33] mt-1" style={{ ...mono, fontWeight: 600 }}>{value}</div>
      {sub && <div className="text-xs text-[#9AA3B5] mt-1">{sub}</div>}
    </div>
  );
}

function Banner({ children, tone = "info" }) {
  const styles = {
    info: "bg-[#EFF3FA] text-[#1B2A4A]",
    error: "bg-[#FDECEC] text-[#9B2C2C]",
  };
  return <div className={`text-sm px-4 py-2.5 rounded-sm mb-4 ${styles[tone]}`}>{children}</div>;
}

function ExportMenu({ formats, onExport }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const icons = { pdf: Download, docx: FileText, xlsx: FileSpreadsheet };

  const handle = async (type) => {
    setOpen(false);
    setBusy(true);
    try {
      await onExport(type);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)} disabled={busy} className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-[#D8DCE6] rounded-sm text-[#3D4761] hover:bg-[#FAFBFC] disabled:opacity-50">
        <Download size={13} /> {busy ? "Génération…" : "Exporter"}
      </button>
      {open && (
        <div className="absolute right-0 mt-1 bg-white border border-[#E4E7EE] rounded-sm shadow-sm z-10 w-44">
          {formats.map((f) => {
            const Icon = icons[f.type] || FileText;
            return (
              <button key={f.type} onClick={() => handle(f.type)} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#3D4761] hover:bg-[#FAFBFC]">
                <Icon size={13} /> {f.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ================= Dashboard (données réelles) =================

function DashboardView({ project, lines, loading }) {
  if (loading) return <div className="p-8 text-sm text-[#7A8399]">Chargement depuis l'API…</div>;
  if (!project) return <div className="p-8 text-sm text-[#7A8399]">Aucun projet. Crée-en un via l'API ou le seed.</div>;

  const currency = project.currency || "GNF";
  const totalAllocated = lines.reduce((s, l) => s + Number(l.allocated), 0);
  const totalSpent = lines.reduce((s, l) => s + Number(l.spent), 0);
  const execRate = totalAllocated ? ((totalSpent / totalAllocated) * 100).toFixed(1) : "0.0";

  return (
    <div className="p-4 md:p-8">
      <header className="mb-6">
        <div className="text-xs text-[#8494B5] uppercase tracking-wide" style={mono}>{project.code} · {project.donor}</div>
        <h1 className="text-2xl text-[#101B33] font-semibold mt-1">{project.name}</h1>
      </header>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <KpiCard label="Budget alloué" value={fmt(totalAllocated, currency)} accent="#1B2A4A" />
        <KpiCard label="Dépensé à date" value={fmt(totalSpent, currency)} accent="#E8B564" />
        <KpiCard label="Taux d'exécution" value={`${execRate} %`} accent="#2F855A" />
        <KpiCard label="Lignes en alerte" value={lines.filter((l) => Number(l.spent) / Number(l.allocated) > 0.85).length} accent="#C53030" />
      </div>
      <div className="bg-white border border-[#E4E7EE] rounded-sm">
        <div className="px-5 py-3 border-b border-[#E4E7EE] text-sm font-medium text-[#101B33]">Exécution par ligne budgétaire</div>
        <div className="p-5 space-y-4">
          {lines.map((l) => {
            const pct = Math.min(100, (Number(l.spent) / Number(l.allocated)) * 100);
            return (
              <div key={l.id}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-[#3D4761]"><span className="text-[#9AA3B5]" style={mono}>{l.code}</span> {l.label}</span>
                  <span style={mono} className="text-[#3D4761]">{fmt(l.spent, currency)} / {fmt(l.allocated, currency)}</span>
                </div>
                <div className="h-1.5 bg-[#EEF0F4] rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: pct > 85 ? "#C53030" : "#1B2A4A" }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ================= Budget & Dépenses (réel) =================

function NewExpenseForm({ lines, currency, onSubmit, onCancel, submitting }) {
  const [lineId, setLineId] = useState(lines[0]?.id ?? "");
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const selectedLine = lines.find((l) => l.id === lineId);
  const numericAmount = parseFloat(amount.replace(/[^\d.]/g, "")) || 0;
  const remaining = selectedLine ? Number(selectedLine.allocated) - Number(selectedLine.spent) : 0;
  const remainingAfter = remaining - numericAmount;
  const willExceed = remainingAfter < 0;

  return (
    <div className="bg-white border border-[#E4E7EE] rounded-sm p-6 max-w-xl">
      <div className="text-sm font-medium text-[#101B33] mb-4">Nouvelle dépense</div>
      <div className="space-y-4">
        <div>
          <label className="text-xs text-[#7A8399] uppercase tracking-wide">Ligne budgétaire</label>
          <select value={lineId} onChange={(e) => setLineId(e.target.value)} className="w-full mt-1 border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2A4A]/30">
            {lines.map((l) => <option key={l.id} value={l.id}>{l.code} — {l.label}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-[#7A8399] uppercase tracking-wide">Libellé de la dépense</label>
          <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Ex. : Carburant véhicule terrain" className="w-full mt-1 border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2A4A]/30" />
        </div>
        <div>
          <label className="text-xs text-[#7A8399] uppercase tracking-wide">Montant ({currency})</label>
          <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" style={mono} className="w-full mt-1 border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2A4A]/30" />
        </div>
        {selectedLine && (
          <div className={`rounded-sm p-3 text-sm flex items-start gap-2 ${willExceed ? "bg-[#FDECEC] text-[#9B2C2C]" : "bg-[#EFF6EE] text-[#2F5233]"}`}>
            {willExceed ? <AlertTriangle size={16} className="mt-0.5 shrink-0" /> : <CheckCircle2 size={16} className="mt-0.5 shrink-0" />}
            <div style={mono}>Disponible avant : {fmt(remaining, currency)} · après : {fmt(remainingAfter, currency)}</div>
          </div>
        )}
        <div className="flex gap-2 pt-2">
          <button
            onClick={() => label && numericAmount > 0 && onSubmit({ budgetLineId: lineId, label, amount: numericAmount })}
            disabled={!label || numericAmount <= 0 || submitting}
            className="bg-[#1B2A4A] text-white text-sm px-4 py-2 rounded-sm disabled:opacity-40 hover:bg-[#233459]"
          >
            {submitting ? "Envoi à l'API…" : "Enregistrer la dépense"}
          </button>
          <button onClick={onCancel} className="text-sm px-4 py-2 text-[#7A8399] hover:text-[#101B33]">Annuler</button>
        </div>
      </div>
    </div>
  );
}

function BudgetView({ project, lines, refreshLines, toast, setToast }) {
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const currency = project.currency || "GNF";

  const handleSubmit = async ({ budgetLineId, label, amount }) => {
    setSubmitting(true);
    setError(null);
    try {
      const result = await createExpense({ projectId: project.id, budgetLineId, label, amount });
      setShowForm(false);
      await refreshLines();
      setToast(
        result.exceeds
          ? `Dépense enregistrée mais dépasse le disponible de la ligne (écriture SYCEBNL générée quand même).`
          : `Dépense enregistrée — écriture comptable générée automatiquement. Disponible restant : ${fmt(result.remaining, currency)}.`
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl text-[#101B33] font-semibold">Budget & Dépenses</h1>
        <div className="flex items-center gap-2">
          <ExportMenu
            formats={[{ type: "xlsx", label: "Excel (.xlsx)" }]}
            onExport={() => exportBudgetXlsx(project.id, project.code)}
          />
          {!showForm && (
            <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 bg-[#1B2A4A] text-white text-sm px-3.5 py-2 rounded-sm hover:bg-[#233459]">
              <Plus size={15} /> Nouvelle dépense
            </button>
          )}
        </div>
      </div>
      {toast && <Banner>{toast}</Banner>}
      {error && <Banner tone="error">{error}</Banner>}
      {showForm ? (
        <NewExpenseForm lines={lines} currency={currency} onSubmit={handleSubmit} onCancel={() => setShowForm(false)} submitting={submitting} />
      ) : (
        <div className="bg-white border border-[#E4E7EE] rounded-sm overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="border-b border-[#E4E7EE] text-left text-xs text-[#7A8399] uppercase tracking-wide">
                <th className="px-5 py-3 font-medium">Compte</th>
                <th className="px-5 py-3 font-medium">Ligne budgétaire</th>
                <th className="px-5 py-3 font-medium text-right">Alloué</th>
                <th className="px-5 py-3 font-medium text-right">Dépensé</th>
                <th className="px-5 py-3 font-medium text-right">Disponible</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((l) => {
                const remaining = Number(l.allocated) - Number(l.spent);
                return (
                  <tr key={l.id} className="border-b border-[#F0F1F5] last:border-0">
                    <td className="px-5 py-3 text-[#9AA3B5]" style={mono}>{l.code}</td>
                    <td className="px-5 py-3 text-[#3D4761]">{l.label}</td>
                    <td className="px-5 py-3 text-right" style={mono}>{fmt(l.allocated, currency)}</td>
                    <td className="px-5 py-3 text-right" style={mono}>{fmt(l.spent, currency)}</td>
                    <td className="px-5 py-3 text-right" style={{ ...mono, color: remaining < l.allocated * 0.15 ? "#C53030" : "#2F855A" }}>{fmt(remaining, currency)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ================= Logistique — Commandes (réel) =================

function NewSupplierForm({ onCreate, onCancel }) {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  return (
    <div className="bg-white border border-[#E4E7EE] rounded-sm p-4 space-y-3 mb-4">
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom du fournisseur" className="w-full border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm" />
      <input value={contact} onChange={(e) => setContact(e.target.value)} placeholder="Contact (téléphone/email, optionnel)" className="w-full border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm" />
      <div className="flex gap-2">
        <button onClick={() => name && onCreate({ name, ...(contact ? { contact } : {}) })} className="text-xs px-3 py-1.5 bg-[#1B2A4A] text-white rounded-sm hover:bg-[#233459]">
          Ajouter le fournisseur
        </button>
        <button onClick={onCancel} className="text-xs px-3 py-1.5 text-[#7A8399]">Annuler</button>
      </div>
    </div>
  );
}

function NewOrderForm({ project, lines, suppliers, onCreate, onCancel, onAddSupplier }) {
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id ?? "");
  const [budgetLineId, setBudgetLineId] = useState(lines[0]?.id ?? "");
  const [item, setItem] = useState("");
  const [amount, setAmount] = useState("");
  const [showSupplierForm, setShowSupplierForm] = useState(false);

  return (
    <div className="bg-white border border-[#E4E7EE] rounded-sm p-5 space-y-3 mb-6 max-w-lg">
      <div className="text-sm font-medium text-[#101B33]">Nouvelle commande</div>

      {suppliers.length === 0 || showSupplierForm ? (
        <NewSupplierForm
          onCreate={async (payload) => { await onAddSupplier(payload); setShowSupplierForm(false); }}
          onCancel={() => setShowSupplierForm(false)}
        />
      ) : (
        <div className="flex items-center gap-2">
          <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} className="flex-1 border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm">
            {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <button onClick={() => setShowSupplierForm(true)} className="text-xs text-[#1B2A4A] hover:underline whitespace-nowrap">+ Nouveau</button>
        </div>
      )}

      <select value={budgetLineId} onChange={(e) => setBudgetLineId(e.target.value)} className="w-full border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm">
        {lines.map((l) => <option key={l.id} value={l.id}>{l.code} — {l.label}</option>)}
      </select>
      <input value={item} onChange={(e) => setItem(e.target.value)} placeholder="Article / prestation commandée" className="w-full border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm" />
      <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Montant" style={mono} className="w-full border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm" />

      <div className="flex gap-2">
        <button
          onClick={() => supplierId && budgetLineId && item && amount && onCreate({
            projectId: project.id, budgetLineId, supplierId, item, amount: parseFloat(amount) || 0,
          })}
          disabled={!supplierId}
          className="text-xs px-3 py-1.5 bg-[#1B2A4A] text-white rounded-sm hover:bg-[#233459] disabled:opacity-40"
        >
          Passer la commande
        </button>
        <button onClick={onCancel} className="text-xs px-3 py-1.5 text-[#7A8399]">Annuler</button>
      </div>
    </div>
  );
}

function RejectOrderInline({ onSubmit, onCancel }) {
  const [reason, setReason] = useState("");
  return (
    <div className="mt-3 bg-[#FDECEC] border border-[#F5C2C2] rounded-sm p-4 space-y-3">
      <div className="text-xs text-[#9B2C2C] font-medium">Motif du refus</div>
      <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} placeholder="Ex. : budget insuffisant, fournisseur non retenu..." className="w-full border border-[#E9B4B4] rounded-sm px-3 py-2 text-sm bg-white" />
      <div className="flex gap-2">
        <button onClick={() => reason.length >= 3 && onSubmit(reason)} className="text-xs px-3 py-1.5 bg-[#9B2C2C] text-white rounded-sm hover:bg-[#7F2424]">Confirmer le refus</button>
        <button onClick={onCancel} className="text-xs px-3 py-1.5 text-[#7A8399]">Annuler</button>
      </div>
    </div>
  );
}

function DeliverOrderInline({ onSubmit, onCancel }) {
  const [ref, setRef] = useState("");
  return (
    <div className="mt-3 bg-[#FAFBFC] border border-[#E4E7EE] rounded-sm p-4 space-y-3">
      <div className="text-xs text-[#7A8399] uppercase tracking-wide">Bon de livraison reçu</div>
      <input value={ref} onChange={(e) => setRef(e.target.value)} placeholder="Référence du bon de livraison (optionnel)" className="w-full border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm" />
      <div className="flex gap-2">
        <button onClick={() => onSubmit(ref || undefined)} className="text-xs px-3 py-1.5 bg-[#1B2A4A] text-white rounded-sm hover:bg-[#233459]">Confirmer la réception</button>
        <button onClick={onCancel} className="text-xs px-3 py-1.5 text-[#7A8399]">Annuler</button>
      </div>
    </div>
  );
}

function SupplierInvoiceInline({ defaultAmount, onSubmit, onCancel }) {
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [amount, setAmount] = useState(String(defaultAmount ?? ""));
  return (
    <div className="mt-3 bg-[#FAFBFC] border border-[#E4E7EE] rounded-sm p-4 space-y-3">
      <div className="text-xs text-[#7A8399] uppercase tracking-wide">Facture fournisseur reçue</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} placeholder="N° de facture fournisseur" className="border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm" />
        <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Montant" style={mono} className="border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm" />
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => invoiceNumber && parseFloat(amount) > 0 && onSubmit({ invoiceNumber, amount: parseFloat(amount) })}
          className="text-xs px-3 py-1.5 bg-[#1B2A4A] text-white rounded-sm hover:bg-[#233459]"
        >
          Enregistrer la facture
        </button>
        <button onClick={onCancel} className="text-xs px-3 py-1.5 text-[#7A8399]">Annuler</button>
      </div>
    </div>
  );
}

function LogisticsView({ project, lines, orders, refreshOrders, refreshLines, toast, setToast, currentRole }) {
  const [error, setError] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [payingOrderId, setPayingOrderId] = useState(null);
  const [rejectingOrderId, setRejectingOrderId] = useState(null);
  const [deliveringOrderId, setDeliveringOrderId] = useState(null);
  const [invoicingOrderId, setInvoicingOrderId] = useState(null);
  const lineLabel = (id) => lines.find((l) => l.id === id)?.label ?? id;
  const isPresident = currentRole === "ADMIN";
  const isComptable = currentRole === "ADMIN" || currentRole === "COMPTABLE";

  const refreshSuppliers = useCallback(async () => setSuppliers(await listSuppliers()), []);
  useEffect(() => { refreshSuppliers(); }, [refreshSuppliers]);

  const handleCreateOrder = async (payload) => {
    try {
      await createPurchaseOrder(payload);
      setShowForm(false);
      await refreshOrders();
      setToast("Commande passée — en attente de validation du Président.");
    } catch (e) {
      setError(e.message);
    }
  };

  const handleCreateSupplier = async (payload) => {
    try {
      await createSupplier(payload);
      await refreshSuppliers();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleValidate = async (order) => {
    try {
      await validatePurchaseOrder(order.id);
      await refreshOrders();
      setToast(`Commande « ${order.item} » validée — la Logistique peut passer commande au fournisseur.`);
    } catch (e) {
      setError(e.message);
    }
  };

  const handleReject = async (order, reason) => {
    try {
      await rejectPurchaseOrder(order.id, reason);
      setRejectingOrderId(null);
      await refreshOrders();
      setToast(`Commande « ${order.item} » refusée.`);
    } catch (e) {
      setError(e.message);
    }
  };

  const handleDeliver = async (order, deliveryNoteRef) => {
    try {
      await deliverPurchaseOrder(order.id, deliveryNoteRef);
      setDeliveringOrderId(null);
      await refreshOrders();
      setToast(`Réception de « ${order.item} » confirmée.`);
    } catch (e) {
      setError(e.message);
    }
  };

  const handleSupplierInvoice = async (order, payload) => {
    try {
      await registerSupplierInvoice(order.id, payload);
      setInvoicingOrderId(null);
      await Promise.all([refreshOrders(), refreshLines()]);
      setToast(`Facture fournisseur enregistrée — écriture comptable générée automatiquement.`);
    } catch (e) {
      setError(e.message);
    }
  };

  const handlePaySupplier = async (order, { method, reference }) => {
    try {
      await paySupplier({ supplierId: order.supplierId, projectId: project?.id, budgetLineId: order.budgetLineId, amount: Number(order.supplierInvoice?.amount ?? order.amount), method, reference, purchaseOrderId: order.id });
      setPayingOrderId(null);
      await refreshOrders();
      setToast(`Fournisseur payé — commande clôturée.`);
    } catch (e) {
      setError(e.message);
    }
  };

  const statusStyle = {
    EN_ATTENTE_VALIDATION: "bg-[#FFF6E5] text-[#8A6116]",
    REJETEE: "bg-[#FDECEC] text-[#9B2C2C]",
    VALIDEE: "bg-[#E5F0FF] text-[#1D4E8F]",
    LIVREE: "bg-[#EAF2FF] text-[#1D4E8F]",
    FACTURE_RECUE: "bg-[#FDF4E3] text-[#8A6116]",
    COMPTABILISEE: "bg-[#EFF6EE] text-[#2F5233]",
  };
  const statusLabel = {
    EN_ATTENTE_VALIDATION: "En attente de validation",
    REJETEE: "Refusée",
    VALIDEE: "Validée",
    LIVREE: "Livrée",
    FACTURE_RECUE: "Facture reçue",
    COMPTABILISEE: "Payée",
  };

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-xl text-[#101B33] font-semibold">Logistique — Commandes</h1>
        {project && !showForm && (
          <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 bg-[#1B2A4A] text-white text-sm px-3.5 py-2 rounded-sm hover:bg-[#233459]">
            <Plus size={15} /> Nouvelle commande
          </button>
        )}
      </div>
      <p className="text-sm text-[#7A8399] mb-6">
        Cycle complet : Logistique passe la commande → Président valide → réception (bon de livraison) → Comptable enregistre la facture fournisseur → paiement.
      </p>
      {toast && <Banner>{toast}</Banner>}
      {error && <Banner tone="error">{error}</Banner>}
      {showForm && project && (
        <NewOrderForm project={project} lines={lines} suppliers={suppliers} onCreate={handleCreateOrder} onCancel={() => setShowForm(false)} onAddSupplier={handleCreateSupplier} />
      )}

      {orders.length === 0 ? (
        <div className="bg-white border border-[#E4E7EE] rounded-sm p-6 text-sm text-[#7A8399]">Aucune commande pour l'instant.</div>
      ) : (
        <div className="bg-white border border-[#E4E7EE] rounded-sm divide-y divide-[#F0F1F5]">
          {orders.map((o) => (
            <div key={o.id} className="px-5 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-3">
                  <Package size={18} className="text-[#9AA3B5] mt-0.5" />
                  <div>
                    <div className="text-sm text-[#101B33] font-medium">{o.item}</div>
                    <div className="text-xs text-[#9AA3B5] mt-0.5">{o.supplier?.name} · Ligne {lineLabel(o.budgetLineId)}</div>
                    {o.status === "REJETEE" && o.rejectionReason && (
                      <div className="text-xs text-[#9B2C2C] mt-1">Motif : {o.rejectionReason}</div>
                    )}
                    {o.deliveryNoteRef && <div className="text-xs text-[#9AA3B5] mt-1">BL n° {o.deliveryNoteRef}</div>}
                    {o.supplierInvoice && <div className="text-xs text-[#9AA3B5] mt-1">Facture n° {o.supplierInvoice.invoiceNumber} · {fmt(o.supplierInvoice.amount)}</div>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span style={mono} className="text-sm text-[#3D4761]">{fmt(o.amount)}</span>
                  <span className={`text-xs px-2 py-1 rounded-sm ${statusStyle[o.status]}`}>{statusLabel[o.status]}</span>

                  {o.status === "EN_ATTENTE_VALIDATION" && isPresident && (
                    <>
                      <button onClick={() => handleValidate(o)} className="text-xs px-3 py-1.5 bg-[#1B2A4A] text-white rounded-sm hover:bg-[#233459]">Valider</button>
                      <button onClick={() => setRejectingOrderId(rejectingOrderId === o.id ? null : o.id)} className="text-xs px-3 py-1.5 border border-[#F5C2C2] text-[#9B2C2C] rounded-sm hover:bg-[#FDECEC]">Refuser</button>
                    </>
                  )}
                  {o.status === "VALIDEE" && (
                    <button onClick={() => setDeliveringOrderId(deliveringOrderId === o.id ? null : o.id)} className="text-xs px-3 py-1.5 bg-[#1B2A4A] text-white rounded-sm hover:bg-[#233459]">Confirmer réception</button>
                  )}
                  {o.status === "LIVREE" && isComptable && (
                    <button onClick={() => setInvoicingOrderId(invoicingOrderId === o.id ? null : o.id)} className="text-xs px-3 py-1.5 border border-[#D8DCE6] rounded-sm text-[#3D4761] hover:bg-[#FAFBFC]">Enregistrer facture</button>
                  )}
                  {o.status === "FACTURE_RECUE" && isComptable && (
                    <button onClick={() => setPayingOrderId(payingOrderId === o.id ? null : o.id)} className="text-xs px-3 py-1.5 border border-[#D8DCE6] rounded-sm text-[#3D4761] hover:bg-[#FAFBFC]">Payer le fournisseur</button>
                  )}
                  {o.status !== "EN_ATTENTE_VALIDATION" && o.status !== "REJETEE" && (
                    <>
                      <button onClick={() => printPurchaseOrderPdf(o.id)} className="flex items-center gap-1 text-xs px-2.5 py-1.5 border border-[#D8DCE6] rounded-sm text-[#3D4761] hover:bg-[#FAFBFC]" title="Ouvrir pour impression">
                        <Printer size={12} />
                      </button>
                      <ExportMenu formats={[{ type: "pdf", label: "PDF" }]} onExport={() => exportPurchaseOrderPdf(o.id)} />
                    </>
                  )}
                </div>
              </div>
              {rejectingOrderId === o.id && <RejectOrderInline onSubmit={(reason) => handleReject(o, reason)} onCancel={() => setRejectingOrderId(null)} />}
              {deliveringOrderId === o.id && <DeliverOrderInline onSubmit={(ref) => handleDeliver(o, ref)} onCancel={() => setDeliveringOrderId(null)} />}
              {invoicingOrderId === o.id && <SupplierInvoiceInline defaultAmount={o.amount} onSubmit={(p) => handleSupplierInvoice(o, p)} onCancel={() => setInvoicingOrderId(null)} />}
              {payingOrderId === o.id && <RecordPaymentPanel label="Paiement du fournisseur" onRecord={(p) => handlePaySupplier(o, p)} onClose={() => setPayingOrderId(null)} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PlaceholderView({ title }) {
  return (
    <div className="p-4 md:p-8">
      <h1 className="text-xl text-[#101B33] font-semibold mb-2">{title}</h1>
      <p className="text-sm text-[#7A8399]">
        Ce module est complet côté prototype visuel et côté API (<code className="bg-[#F0F1F5] px-1 rounded">/api/hr</code>,{" "}
        <code className="bg-[#F0F1F5] px-1 rounded">/api/documents</code>) — il suit exactement le même schéma de branchement
        que Budget et Logistique ci-dessus (fetch au chargement, appel API à l'action, rafraîchissement de l'état).
      </p>
    </div>
  );
}

// ================= Projets — activités filtrées par portée d'accès (réel) =================

function NewActivityForm({ project, onSubmit, onCancel }) {
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [budgetLineId, setBudgetLineId] = useState("");
  const [estimatedCost, setEstimatedCost] = useState("");
  const lines = project?.budgetLines || [];

  return (
    <div className="bg-white border border-[#E4E7EE] rounded-sm p-5 space-y-3 mb-4">
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titre de l'activité" className="w-full border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm" />
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm" />
      </div>
      {lines.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <select value={budgetLineId} onChange={(e) => setBudgetLineId(e.target.value)} className="border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm">
            <option value="">Sans ligne budgétaire</option>
            {lines.map((l) => <option key={l.id} value={l.id}>{l.code} — {l.label}</option>)}
          </select>
          <input value={estimatedCost} onChange={(e) => setEstimatedCost(e.target.value)} placeholder="Coût estimé" style={mono} className="border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm" />
        </div>
      )}
      <div className="flex gap-2">
        <button
          onClick={() => title && startDate && endDate && onSubmit({
            title, startDate, endDate,
            ...(budgetLineId ? { budgetLineId, estimatedCost: parseFloat(estimatedCost) || 0 } : {}),
          })}
          className="text-xs px-3 py-1.5 bg-[#1B2A4A] text-white rounded-sm hover:bg-[#233459]"
        >
          Créer l'activité
        </button>
        <button onClick={onCancel} className="text-xs px-3 py-1.5 text-[#7A8399]">Annuler</button>
      </div>
    </div>
  );
}

function NewProjectForm({ onCreate, onCancel }) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [donor, setDonor] = useState("");
  const [currency, setCurrency] = useState("GNF");
  const [totalBudget, setTotalBudget] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [lines, setLines] = useState([{ code: "61", label: "Personnel de terrain", allocated: "" }]);

  const updateLine = (i, field, value) => {
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, [field]: value } : l)));
  };
  const addLine = () => setLines((prev) => [...prev, { code: "", label: "", allocated: "" }]);
  const removeLine = (i) => setLines((prev) => prev.filter((_, idx) => idx !== i));

  const canSubmit = name && code && donor && totalBudget && startDate && endDate && lines.every((l) => l.code && l.label && l.allocated);

  return (
    <div className="bg-white border border-[#E4E7EE] rounded-sm p-5 space-y-4 mb-6 max-w-2xl">
      <div className="text-sm font-medium text-[#101B33]">Nouveau projet</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom du projet" className="border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm" />
        <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Code (ex. PRJ-2026-020)" className="border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <input value={donor} onChange={(e) => setDonor(e.target.value)} placeholder="Bailleur" className="col-span-2 border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm" />
        <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm">
          {CURRENCIES.map((c) => <option key={c.value} value={c.value}>{c.value}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input value={totalBudget} onChange={(e) => setTotalBudget(e.target.value)} placeholder={`Budget total (${currency})`} style={mono} className="border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm" />
        <div />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm" />
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm" />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs text-[#7A8399] uppercase tracking-wide">Lignes budgétaires initiales</label>
          <button onClick={addLine} className="text-xs text-[#1B2A4A] hover:underline">+ Ajouter une ligne</button>
        </div>
        <div className="space-y-2 overflow-x-auto">
          {lines.map((l, i) => (
            <div key={i} className="grid grid-cols-8 gap-2 min-w-[420px]">
              <input value={l.code} onChange={(e) => updateLine(i, "code", e.target.value)} placeholder="Code" className="col-span-1 border border-[#D8DCE6] rounded-sm px-2 py-1.5 text-sm" />
              <input value={l.label} onChange={(e) => updateLine(i, "label", e.target.value)} placeholder="Libellé" className="col-span-4 border border-[#D8DCE6] rounded-sm px-2 py-1.5 text-sm" />
              <input value={l.allocated} onChange={(e) => updateLine(i, "allocated", e.target.value)} placeholder="Alloué" style={mono} className="col-span-2 border border-[#D8DCE6] rounded-sm px-2 py-1.5 text-sm" />
              {lines.length > 1 && <button onClick={() => removeLine(i)} className="text-[#B7BFCE] hover:text-[#9B2C2C]">✕</button>}
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <button
          disabled={!canSubmit}
          onClick={() => onCreate({
            name, code, donor, currency, totalBudget: parseFloat(totalBudget) || 0, startDate, endDate,
            budgetLines: lines.map((l) => ({ code: l.code, label: l.label, allocated: parseFloat(l.allocated) || 0 })),
          })}
          className="text-sm px-4 py-2 bg-[#1B2A4A] text-white rounded-sm hover:bg-[#233459] disabled:opacity-40"
        >
          Créer le projet
        </button>
        <button onClick={onCancel} className="text-sm px-4 py-2 text-[#7A8399]">Annuler</button>
      </div>
    </div>
  );
}

const PROJECT_ROLE_LABELS = {
  RESPONSABLE: "Responsable (accès complet)",
  MEMBRE: "Membre d'équipe",
  PARTENAIRE: "Partenaire externe",
  LECTURE_SEULE: "Lecture seule",
};

function ProjectTeamSection({ projectId }) {
  const [members, setMembers] = useState([]);
  const [orgMembers, setOrgMembers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState("MEMBRE");
  const [scope, setScope] = useState("PERSONNEL");
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    try {
      setMembers(await listProjectMembers(projectId));
      const org = await listMembers();
      setOrgMembers(org);
    } catch (e) {
      setError(e.message);
    }
  }, [projectId]);
  useEffect(() => { refresh(); }, [refresh]);

  const availableUsers = orgMembers.filter((m) => !members.some((pm) => pm.userId === m.user.id));

  const handleAdd = async () => {
    if (!userId) return;
    try {
      await addProjectMember(projectId, { userId, role, scope });
      setShowForm(false);
      await refresh();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleRemove = async (memberUserId) => {
    try {
      await removeProjectMember(projectId, memberUserId);
      await refresh();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="bg-white border border-[#E4E7EE] rounded-sm p-5 mt-6">
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs text-[#7A8399] uppercase tracking-wide">Équipe du projet</div>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="text-xs text-[#1B2A4A] hover:underline">+ Ajouter un membre</button>
        )}
      </div>
      {error && <Banner tone="error">{error}</Banner>}

      {showForm && (
        <div className="bg-[#FAFBFC] border border-[#E4E7EE] rounded-sm p-4 space-y-3 mb-4">
          <select value={userId} onChange={(e) => setUserId(e.target.value)} className="w-full border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm">
            <option value="">Choisir un membre de l'organisation</option>
            {availableUsers.map((m) => <option key={m.user.id} value={m.user.id}>{m.user.fullName} — {m.user.email}</option>)}
          </select>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <select value={role} onChange={(e) => setRole(e.target.value)} className="border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm">
              {Object.entries(PROJECT_ROLE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <select value={scope} onChange={(e) => setScope(e.target.value)} className="border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm">
              <option value="PERSONNEL">Espace personnel (voit ses seules activités)</option>
              <option value="COMPLET">Accès complet au projet</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={handleAdd} disabled={!userId} className="text-xs px-3 py-1.5 bg-[#1B2A4A] text-white rounded-sm hover:bg-[#233459] disabled:opacity-40">
              Ajouter au projet
            </button>
            <button onClick={() => setShowForm(false)} className="text-xs px-3 py-1.5 text-[#7A8399]">Annuler</button>
          </div>
        </div>
      )}

      <div className="divide-y divide-[#F0F1F5]">
        {members.map((m) => (
          <div key={m.id} className="flex items-center justify-between py-2.5">
            <div>
              <div className="text-sm text-[#101B33]">{m.user.fullName}</div>
              <div className="text-xs text-[#9AA3B5] mt-0.5">{PROJECT_ROLE_LABELS[m.role]} · {m.scope === "COMPLET" ? "Accès complet" : "Espace personnel"}</div>
            </div>
            <button onClick={() => handleRemove(m.userId)} className="text-[#B7BFCE] hover:text-[#9B2C2C]"><X size={14} /></button>
          </div>
        ))}
        {members.length === 0 && <div className="py-3 text-sm text-[#7A8399]">Aucun membre explicitement rattaché — seul l'Admin/Président y a accès pour l'instant.</div>}
      </div>
    </div>
  );
}

function ProjectsView({ project, projects, onSelectProject, onProjectCreated }) {
  const [data, setData] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showNewProject, setShowNewProject] = useState(false);
  const [activityView, setActivityView] = useState("liste");
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    if (!project) return;
    try {
      setData(await listActivities(project.id));
    } catch (e) {
      setError(e.message);
    }
  }, [project]);

  useEffect(() => { refresh(); }, [refresh]);

  const handleCreate = async (payload) => {
    try {
      await createActivity(project.id, payload);
      setShowForm(false);
      await refresh();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleCreateProject = async (payload) => {
    try {
      const newProject = await createProject(payload);
      setShowNewProject(false);
      await onProjectCreated(newProject.id);
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {projects.length > 0 && (
            <select
              value={project?.id ?? ""}
              onChange={(e) => onSelectProject(e.target.value)}
              className="text-sm border border-[#D8DCE6] rounded-sm px-3 py-2"
            >
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!showNewProject && (
            <button onClick={() => setShowNewProject(true)} className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-[#D8DCE6] rounded-sm text-[#3D4761] hover:bg-[#FAFBFC]">
              <Plus size={13} /> Nouveau projet
            </button>
          )}
          {project && !showForm && (
            <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 bg-[#1B2A4A] text-white text-sm px-3.5 py-2 rounded-sm hover:bg-[#233459]">
              <Plus size={15} /> Nouvelle activité
            </button>
          )}
        </div>
      </div>
      {error && <Banner tone="error">{error}</Banner>}
      {showNewProject && <NewProjectForm onCreate={handleCreateProject} onCancel={() => setShowNewProject(false)} />}

      {!project ? (
        <div className="text-sm text-[#7A8399]">Aucun projet. Crée ton premier projet ci-dessus.</div>
      ) : (
        <>
          <h1 className="text-xl text-[#101B33] font-semibold mb-1">{project.name}</h1>
          <div className="text-xs text-[#9AA3B5] mb-6" style={mono}>{project.code} · {project.donor}</div>
          {showForm && <NewActivityForm project={project} onSubmit={handleCreate} onCancel={() => setShowForm(false)} />}

          {data && (
            <>
              <div className={`text-xs mb-4 px-3 py-2 rounded-sm ${data.scope === "COMPLET" ? "bg-[#EFF6EE] text-[#2F5233]" : "bg-[#F0F1F5] text-[#7A8399]"}`}>
                {data.scope === "COMPLET"
                  ? "Accès complet — l'API renvoie toutes les activités du projet (Admin/Président ou Responsable)."
                  : "Espace personnel — l'API ne renvoie que les activités dont tu es responsable."}
              </div>
              <div className="flex gap-1 mb-3">
                <button onClick={() => setActivityView("liste")} className={`text-xs px-3 py-1.5 rounded-sm ${activityView === "liste" ? "bg-[#1B2A4A] text-white" : "bg-[#F0F1F5] text-[#7A8399]"}`}>Liste</button>
                <button onClick={() => setActivityView("gantt")} className={`text-xs px-3 py-1.5 rounded-sm ${activityView === "gantt" ? "bg-[#1B2A4A] text-white" : "bg-[#F0F1F5] text-[#7A8399]"}`}>Gantt</button>
              </div>
              {activityView === "gantt" ? (
                <GanttChart activities={data.activities} />
              ) : (
                <div className="bg-white border border-[#E4E7EE] rounded-sm divide-y divide-[#F0F1F5]">
                  {data.activities.length === 0 ? (
                    <div className="p-5 text-sm text-[#7A8399]">Aucune activité pour l'instant.</div>
                  ) : (
                    data.activities.map((a) => (
                      <div key={a.id} className="flex items-center justify-between px-5 py-3">
                        <div>
                          <div className="text-sm text-[#101B33]">{a.title}</div>
                          <div className="text-xs text-[#9AA3B5] mt-0.5">
                            {a.owner?.fullName ?? "Non assignée"}
                            {a.budgetLine && ` · ${a.budgetLine.code} — ${a.budgetLine.label}`}
                            {a.estimatedCost != null && ` · ${fmt(a.estimatedCost, project.currency)}`}
                          </div>
                        </div>
                        <span className="text-xs text-[#9AA3B5]">{a.status}</span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          )}

          <ProjectTeamSection projectId={project.id} />
        </>
      )}
    </div>
  );
}

// ================= Documents & TDR (réel, avec export) =================

function DocumentsView({ project }) {
  const [documents, setDocuments] = useState([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  const refresh = useCallback(async () => setDocuments(await listDocuments()), []);
  useEffect(() => { refresh(); }, [refresh]);

  const handleCreate = async () => {
    if (!title || !content) return;
    try {
      await createDocument({ projectId: project?.id, title, type: "TDR", content });
      setTitle("");
      setContent("");
      await refresh();
      setToast("Document créé.");
    } catch (e) {
      setError(e.message);
    }
  };

  const doExport = async (doc, type) => {
    try {
      if (type === "pdf") await exportDocumentPdf(doc.id, doc.title);
      else await exportDocumentDocx(doc.id, doc.title);
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-xl text-[#101B33] font-semibold mb-6">Documents & TDR</h1>
      {toast && <Banner>{toast}</Banner>}
      {error && <Banner tone="error">{error}</Banner>}

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white border border-[#E4E7EE] rounded-sm p-5 space-y-3">
          <div className="text-sm font-medium text-[#101B33]">Nouveau document</div>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titre (ex. TDR — Évaluation à mi-parcours)" className="w-full border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm" />
          <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={6} placeholder="Contenu du document…" className="w-full border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm" />
          <button onClick={handleCreate} className="text-sm px-4 py-2 bg-[#1B2A4A] text-white rounded-sm hover:bg-[#233459]">Enregistrer</button>
        </div>

        <div className="bg-white border border-[#E4E7EE] rounded-sm divide-y divide-[#F0F1F5]">
          {documents.length === 0 ? (
            <div className="p-5 text-sm text-[#7A8399]">Aucun document pour l'instant.</div>
          ) : (
            documents.map((d) => (
              <div key={d.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <div className="text-sm text-[#101B33]">{d.title}</div>
                  <div className="text-xs text-[#9AA3B5] mt-0.5">{d.type}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => printDocumentPdf(d.id)} className="flex items-center gap-1 text-xs px-3 py-1.5 border border-[#D8DCE6] rounded-sm text-[#3D4761] hover:bg-[#FAFBFC]" title="Ouvrir pour impression">
                    <Printer size={12} />
                  </button>
                  <ExportMenu
                    formats={[{ type: "pdf", label: "PDF" }, { type: "docx", label: "Word (.docx)" }]}
                    onExport={(type) => doExport(d, type)}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ================= App root =================

function decodeTokenPayload(token) {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return {};
  }
}

export default function App() {
  const [session, setSession] = useState(null);
  const [active, setActive] = useState("dashboard");
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState(null);
  const [lines, setLines] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [modal, setModal] = useState(null); // "shortcuts" | "about" | null

  const inviteToken = new URLSearchParams(window.location.search).get("token");
  const isAcceptInvitePath = window.location.pathname === "/accept-invite" && inviteToken;

  useEffect(() => {
    if (getAuthToken()) setSession({ token: getAuthToken() });
  }, []);

  // Raccourci global Ctrl/Cmd+K pour la recherche rapide — cohérent avec le
  // menu "Recherche" et le bouton dédié de la barre de menu.
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const setToastTimed = (msg) => {
    setToast(msg);
    window.clearTimeout(window.__t);
    window.__t = window.setTimeout(() => setToast(null), 5000);
  };

  const refreshLines = useCallback(async () => {
    if (!projectId) return;
    setLines(await listBudgetLines(projectId));
  }, [projectId]);

  const refreshOrders = useCallback(async () => {
    setOrders(await listPurchaseOrders());
  }, []);

  useEffect(() => {
    if (!session) return;
    (async () => {
      setLoading(true);
      const projs = await listProjects();
      setProjects(projs);
      if (projs[0]) setProjectId(projs[0].id);
      setLoading(false);
    })();
  }, [session]);

  useEffect(() => { refreshLines(); }, [refreshLines]);
  useEffect(() => { if (session) refreshOrders(); }, [session, refreshOrders]);

  if (isAcceptInvitePath && !session) {
    return (
      <AcceptInviteScreen
        token={inviteToken}
        onAccepted={(s) => {
          window.history.replaceState({}, "", "/");
          setSession(s);
        }}
      />
    );
  }

  if (!session) {
    return <LoginScreen onLoggedIn={(s) => setSession(s)} />;
  }

  const project = projects.find((p) => p.id === projectId);
  const tokenPayload = decodeTokenPayload(session.token);

  const handleLogout = () => { setAuthToken(null); setSession(null); };
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
    else document.exitFullscreen?.();
  };

  const paletteItems = [
    ...NAV_ITEMS.map((item) => ({ id: item.id, label: item.label, icon: item.icon, group: "Écrans", target: item.id })),
    { id: "action-logout", label: "Se déconnecter", group: "Actions", action: handleLogout },
    { id: "action-fullscreen", label: "Basculer le plein écran", group: "Actions", action: handleToggleFullscreen },
  ];

  const view = (() => {
    switch (active) {
      case "dashboard": return <DashboardView project={project} lines={lines} loading={loading} />;
      case "projects": return (
        <ProjectsView
          project={project}
          projects={projects}
          onSelectProject={setProjectId}
          onProjectCreated={async (newId) => {
            const projs = await listProjects();
            setProjects(projs);
            setProjectId(newId);
          }}
        />
      );
      case "budget": return project
        ? <BudgetView project={project} lines={lines} refreshLines={refreshLines} toast={toast} setToast={setToastTimed} />
        : <div className="p-8 text-sm text-[#7A8399]">Sélectionne un projet.</div>;
      case "invoicing": return <InvoicingView />;
      case "payment-requests": return <PaymentRequestsView project={project} />;
      case "letters": return <LettersView />;
      case "journal": return <JournalView project={project} />;
      case "financial-statements": return <FinancialStatementsView />;
      case "bank-reconciliation": return <BankReconciliationView />;
      case "consumables": return <ConsumableRequestsView currentRole={tokenPayload.role} />;
      case "payroll": return <PayrollView project={project} lines={lines} />;
      case "logistics": return <LogisticsView project={project} lines={lines} orders={orders} refreshOrders={refreshOrders} refreshLines={refreshLines} toast={toast} setToast={setToastTimed} currentRole={tokenPayload.role} />;
      case "stock": return <StockView />;
      case "fleet": return <FleetView />;
      case "drivers": return <DriversView />;
      case "equipment": return <EquipmentView />;
      case "hr": return <HrView project={project} currentRole={tokenPayload.role} />;
      case "docs": return <DocumentsView project={project} />;
      case "share": return <ShareView />;
      case "team": return <TeamView currentUserId={tokenPayload.userId} />;
      case "settings": return <OrganizationSettingsView currentRole={tokenPayload.role} />;
      default: return null;
    }
  })();

  return (
    <div className="flex flex-col h-screen bg-[#F5F6F9]" style={{ fontFamily: "'Inter', sans-serif" }}>
      <MenuBar
        onNavigate={setActive}
        onLogout={handleLogout}
        onOpenPalette={() => setPaletteOpen(true)}
        onToggleSidebar={() => setSidebarCollapsed((c) => !c)}
        onToggleMobileSidebar={() => setMobileSidebarOpen((o) => !o)}
        onToggleFullscreen={handleToggleFullscreen}
        onShowShortcuts={() => setModal("shortcuts")}
        onShowAbout={() => setModal("about")}
        orgName={session.organization}
      />
      <div className="flex flex-1 min-h-0">
        <Sidebar
          active={active}
          onSelect={setActive}
          org={session.organization}
          onLogout={handleLogout}
          collapsed={sidebarCollapsed}
          mobileOpen={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
        />
        <main className="flex-1 overflow-y-auto overflow-x-hidden">{view}</main>
      </div>

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        items={paletteItems}
        onSelect={(item) => { if (item.target) setActive(item.target); if (item.action) item.action(); }}
      />
      {modal === "shortcuts" && <ShortcutsModal onClose={() => setModal(null)} />}
      {modal === "about" && <AboutModal onClose={() => setModal(null)} orgName={session.organization} />}
    </div>
  );
}
