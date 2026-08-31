import React, { useCallback, useEffect, useState } from "react";
import { ClipboardList, Plus } from "lucide-react";
import { listConsumableRequests, createConsumableRequest, decideConsumableRequest, listStaff, listStockItems } from "./lib/api";
import { Banner, KpiCard } from "./shared.jsx";

const STATUS_STYLE = {
  EN_ATTENTE: "bg-[#FFF6E5] text-[#8A6116]",
  APPROUVEE: "bg-[#E5F0FF] text-[#1D4E8F]",
  REFUSEE: "bg-[#FDECEC] text-[#9B2C2C]",
  SERVIE_STOCK: "bg-[#EFF6EE] text-[#2F5233]",
  COMMANDE_REQUISE: "bg-[#FDF4E3] text-[#8A6116]",
};
const STATUS_LABEL = {
  EN_ATTENTE: "En attente",
  APPROUVEE: "Approuvée",
  REFUSEE: "Refusée",
  SERVIE_STOCK: "Servie (stock)",
  COMMANDE_REQUISE: "Commande requise",
};

function NewRequestForm({ staff, onCreate, onCancel }) {
  const [staffId, setStaffId] = useState(staff[0]?.id ?? "");
  const [itemName, setItemName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");
  const [justification, setJustification] = useState("");

  return (
    <div className="bg-white border border-[#E4E7EE] rounded-sm p-5 space-y-3 mb-6 max-w-lg">
      <div className="text-sm font-medium text-[#101B33]">Nouvelle demande de consommables</div>
      <select value={staffId} onChange={(e) => setStaffId(e.target.value)} className="w-full border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm">
        {staff.map((s) => <option key={s.id} value={s.id}>{s.fullName} — {s.jobTitle}</option>)}
      </select>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <input value={itemName} onChange={(e) => setItemName(e.target.value)} placeholder="Article demandé" className="col-span-2 border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm" />
        <input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="Unité" className="border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm" />
      </div>
      <input value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="Quantité" className="w-full border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm" />
      <input value={justification} onChange={(e) => setJustification(e.target.value)} placeholder="Justification (optionnel)" className="w-full border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm" />
      <div className="flex gap-2">
        <button
          disabled={!staffId}
          onClick={() => itemName && quantity && unit && onCreate({ staffId, itemName, quantity: parseFloat(quantity) || 0, unit, justification: justification || undefined })}
          className="text-xs px-3 py-1.5 bg-[#1B2A4A] text-white rounded-sm hover:bg-[#233459] disabled:opacity-40"
        >
          Envoyer la demande
        </button>
        <button onClick={onCancel} className="text-xs px-3 py-1.5 text-[#7A8399]">Annuler</button>
      </div>
    </div>
  );
}

function DecideInline({ stockItems, onDecide, onCancel }) {
  const [source, setSource] = useState("stock");
  const [stockItemId, setStockItemId] = useState(stockItems[0]?.id ?? "");

  return (
    <div className="mt-2 bg-[#FAFBFC] border border-[#E4E7EE] rounded-sm p-3 space-y-2">
      <div className="flex items-center gap-3 text-sm">
        <label className="flex items-center gap-1.5">
          <input type="radio" checked={source === "stock"} onChange={() => setSource("stock")} /> Servir depuis le stock
        </label>
        <label className="flex items-center gap-1.5">
          <input type="radio" checked={source === "order"} onChange={() => setSource("order")} /> Nécessite une commande fournisseur
        </label>
      </div>
      {source === "stock" && (
        <select value={stockItemId} onChange={(e) => setStockItemId(e.target.value)} className="w-full border border-[#D8DCE6] rounded-sm px-3 py-1.5 text-sm">
          {stockItems.length === 0 && <option value="">Aucun article en stock</option>}
          {stockItems.map((s) => <option key={s.id} value={s.id}>{s.name} ({Number(s.quantity)} {s.unit} disponibles)</option>)}
        </select>
      )}
      <div className="flex gap-2">
        <button
          onClick={() => onDecide("APPROUVEE", source === "stock" ? stockItemId : undefined)}
          disabled={source === "stock" && !stockItemId}
          className="text-xs px-3 py-1.5 bg-[#1B2A4A] text-white rounded-sm hover:bg-[#233459] disabled:opacity-40"
        >
          Approuver
        </button>
        <button onClick={() => onDecide("REFUSEE")} className="text-xs px-3 py-1.5 border border-[#F5C2C2] text-[#9B2C2C] rounded-sm hover:bg-[#FDECEC]">Refuser</button>
        <button onClick={onCancel} className="text-xs px-3 py-1.5 text-[#7A8399]">Annuler</button>
      </div>
    </div>
  );
}

export default function ConsumableRequestsView({ currentRole }) {
  const [requests, setRequests] = useState([]);
  const [staff, setStaff] = useState([]);
  const [stockItems, setStockItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [decidingId, setDecidingId] = useState(null);
  const [toast, setToast] = useState(null);
  const [error, setError] = useState(null);
  const canDecide = currentRole === "ADMIN" || currentRole === "LOGISTICIEN";

  const refresh = useCallback(async () => {
    setRequests(await listConsumableRequests());
    setStaff(await listStaff());
    setStockItems(await listStockItems());
  }, []);
  useEffect(() => { refresh(); }, [refresh]);

  const handleCreate = async (payload) => {
    try {
      await createConsumableRequest(payload);
      setShowForm(false);
      await refresh();
      setToast("Demande envoyée.");
    } catch (e) {
      setError(e.message);
    }
  };

  const handleDecide = async (request, status, fulfilledFromStockItemId) => {
    try {
      await decideConsumableRequest(request.id, { status, fulfilledFromStockItemId });
      setDecidingId(null);
      await refresh();
      setToast(status === "APPROUVEE" ? "Demande approuvée." : "Demande refusée.");
    } catch (e) {
      setError(e.message);
    }
  };

  const pending = requests.filter((r) => r.status === "EN_ATTENTE");

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-xl text-[#101B33] font-semibold flex items-center gap-2">
          <ClipboardList size={20} className="text-[#1B2A4A]" /> Demandes de consommables
        </h1>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 bg-[#1B2A4A] text-white text-sm px-3.5 py-2 rounded-sm hover:bg-[#233459]">
            <Plus size={15} /> Nouvelle demande
          </button>
        )}
      </div>
      <p className="text-xs text-[#9AA3B5] mb-6">Tout employé peut demander des fournitures — la Logistique décide de servir depuis le stock ou de passer commande.</p>
      {toast && <Banner>{toast}</Banner>}
      {error && <Banner tone="error">{error}</Banner>}
      {showForm && <NewRequestForm staff={staff} onCreate={handleCreate} onCancel={() => setShowForm(false)} />}

      <div className="mb-6">
        <KpiCard label="En attente de décision" value={pending.length} accent="#E8B564" />
      </div>

      <div className="bg-white border border-[#E4E7EE] rounded-sm divide-y divide-[#F0F1F5]">
        {requests.map((r) => (
          <div key={r.id} className="px-5 py-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-[#101B33]">{r.itemName} — {Number(r.quantity)} {r.unit}</div>
                <div className="text-xs text-[#9AA3B5] mt-0.5">{r.requestedBy?.fullName} · {r.requestedBy?.jobTitle}</div>
                {r.justification && <div className="text-xs text-[#9AA3B5] mt-0.5">{r.justification}</div>}
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded-sm ${STATUS_STYLE[r.status]}`}>{STATUS_LABEL[r.status]}</span>
                {r.status === "EN_ATTENTE" && canDecide && (
                  <button onClick={() => setDecidingId(decidingId === r.id ? null : r.id)} className="text-xs px-3 py-1.5 border border-[#D8DCE6] rounded-sm text-[#3D4761] hover:bg-[#FAFBFC]">
                    Décider
                  </button>
                )}
              </div>
            </div>
            {decidingId === r.id && (
              <DecideInline stockItems={stockItems} onDecide={(status, stockItemId) => handleDecide(r, status, stockItemId)} onCancel={() => setDecidingId(null)} />
            )}
          </div>
        ))}
        {requests.length === 0 && <div className="p-5 text-sm text-[#7A8399]">Aucune demande pour l'instant.</div>}
      </div>
    </div>
  );
}
