import React, { useCallback, useEffect, useState } from "react";
import { Plus, Receipt, Send } from "lucide-react";
import { listInvoices, createInvoice, sendInvoice, recordInvoicePayment, exportInvoicePdf } from "./lib/api";
import { fmt, mono, Banner, ExportMenu, RecordPaymentPanel } from "./shared.jsx";

const STATUS_STYLE = {
  EMISE: "bg-[#F0F1F5] text-[#3D4761]",
  ENVOYEE: "bg-[#E5F0FF] text-[#1D4E8F]",
  PAYEE: "bg-[#EFF6EE] text-[#2F5233]",
  EN_RETARD: "bg-[#FDECEC] text-[#9B2C2C]",
};

function NewInvoiceForm({ onCreate, onCancel }) {
  const [clientName, setClientName] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const numericAmount = parseFloat(amount.replace(/[^\d.]/g, "")) || 0;

  return (
    <div className="bg-white border border-[#E4E7EE] rounded-sm p-6 max-w-xl space-y-4 mb-6">
      <div className="text-sm font-medium text-[#101B33]">Nouvelle facture</div>
      <input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Client / partenaire facturé" className="w-full border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm" />
      <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description de la prestation" className="w-full border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm" />
      <div className="grid grid-cols-2 gap-3">
        <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Montant" style={mono} className="border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm" />
        <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm" />
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => clientName && description && numericAmount > 0 && dueDate && onCreate({ clientName, dueDate, lines: [{ description, quantity: 1, unitPrice: numericAmount }] })}
          className="text-sm px-4 py-2 bg-[#1B2A4A] text-white rounded-sm hover:bg-[#233459]"
        >
          Émettre la facture
        </button>
        <button onClick={onCancel} className="text-sm px-4 py-2 text-[#7A8399]">Annuler</button>
      </div>
    </div>
  );
}

export default function InvoicingView() {
  const [invoices, setInvoices] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [payingId, setPayingId] = useState(null);
  const [toast, setToast] = useState(null);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => setInvoices(await listInvoices()), []);
  useEffect(() => { refresh(); }, [refresh]);

  const handleCreate = async (payload) => {
    try {
      const invoice = await createInvoice(payload);
      setShowForm(false);
      await refresh();
      setToast(`Facture ${invoice.number} émise — écriture comptable générée automatiquement.`);
    } catch (e) {
      setError(e.message);
    }
  };

  const handleSend = async (invoice) => {
    try {
      await sendInvoice(invoice.id);
      await refresh();
      setToast(`Facture ${invoice.number} marquée comme envoyée.`);
    } catch (e) {
      setError(e.message);
    }
  };

  const handlePay = async (invoice, { method, reference }) => {
    try {
      await recordInvoicePayment(invoice.id, { amount: total(invoice), method, reference });
      setPayingId(null);
      await refresh();
      setToast(`Encaissement enregistré pour ${invoice.number}.`);
    } catch (e) {
      setError(e.message);
    }
  };

  const total = (inv) => inv.lines.reduce((s, l) => s + Number(l.quantity) * Number(l.unitPrice), 0);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl text-[#101B33] font-semibold">Facturation</h1>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 bg-[#1B2A4A] text-white text-sm px-3.5 py-2 rounded-sm hover:bg-[#233459]">
            <Plus size={15} /> Nouvelle facture
          </button>
        )}
      </div>
      {toast && <Banner>{toast}</Banner>}
      {error && <Banner tone="error">{error}</Banner>}
      {showForm && <NewInvoiceForm onCreate={handleCreate} onCancel={() => setShowForm(false)} />}

      <div className="space-y-3">
        {invoices.map((inv) => (
          <div key={inv.id} className="bg-white border border-[#E4E7EE] rounded-sm p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-3">
                <Receipt size={18} className="text-[#9AA3B5] mt-0.5" />
                <div>
                  <div className="text-sm text-[#101B33] font-medium">{inv.number} — {inv.clientName}</div>
                  <div className="text-xs text-[#9AA3B5] mt-0.5">Échéance {new Date(inv.dueDate).toLocaleDateString("fr-FR")}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span style={mono} className="text-sm text-[#3D4761]">{fmt(total(inv))}</span>
                <span className={`text-xs px-2 py-1 rounded-sm ${STATUS_STYLE[inv.status]}`}>{inv.status}</span>
                {inv.status === "EMISE" && (
                  <button onClick={() => handleSend(inv)} className="flex items-center gap-1 text-xs px-3 py-1.5 border border-[#D8DCE6] rounded-sm text-[#3D4761] hover:bg-[#FAFBFC]">
                    <Send size={12} /> Envoyer
                  </button>
                )}
                {inv.status !== "PAYEE" && (
                  <button onClick={() => setPayingId(payingId === inv.id ? null : inv.id)} className="text-xs px-3 py-1.5 border border-[#D8DCE6] rounded-sm text-[#3D4761] hover:bg-[#FAFBFC]">
                    Encaisser
                  </button>
                )}
                <ExportMenu formats={[{ type: "pdf", label: "PDF" }]} onExport={() => exportInvoicePdf(inv.id, inv.number)} />
              </div>
            </div>
            {payingId === inv.id && (
              <RecordPaymentPanel label="Encaissement de la facture" onRecord={(p) => handlePay(inv, p)} onClose={() => setPayingId(null)} />
            )}
          </div>
        ))}
        {invoices.length === 0 && <div className="bg-white border border-[#E4E7EE] rounded-sm p-6 text-sm text-[#7A8399]">Aucune facture pour l'instant.</div>}
      </div>
    </div>
  );
}
