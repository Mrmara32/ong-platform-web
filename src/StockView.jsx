import React, { useCallback, useEffect, useState } from "react";
import { Package, Plus, AlertTriangle, ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { listStockItems, createStockItem, createStockMovement, listWarehouses, createWarehouse } from "./lib/api";
import { fmt, mono, Banner, KpiCard } from "./shared.jsx";

function NewWarehouseForm({ onCreate, onCancel }) {
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  return (
    <div className="bg-white border border-[#E4E7EE] rounded-sm p-4 space-y-3 mb-4">
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom de l'entrepôt/site" className="w-full border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm" />
      <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Localisation (optionnel)" className="w-full border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm" />
      <div className="flex gap-2">
        <button onClick={() => name && onCreate({ name, ...(location ? { location } : {}) })} className="text-xs px-3 py-1.5 bg-[#1B2A4A] text-white rounded-sm hover:bg-[#233459]">
          Créer l'entrepôt
        </button>
        <button onClick={onCancel} className="text-xs px-3 py-1.5 text-[#7A8399]">Annuler</button>
      </div>
    </div>
  );
}

function NewItemForm({ warehouses, onCreate, onCancel, onAddWarehouse }) {
  const [warehouseId, setWarehouseId] = useState(warehouses[0]?.id ?? "");
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("");
  const [quantity, setQuantity] = useState("0");
  const [minQuantity, setMinQuantity] = useState("0");
  const [unitCost, setUnitCost] = useState("0");
  const [showWarehouseForm, setShowWarehouseForm] = useState(false);

  return (
    <div className="bg-white border border-[#E4E7EE] rounded-sm p-5 space-y-3 mb-6 max-w-lg">
      <div className="text-sm font-medium text-[#101B33]">Nouvel article de stock</div>

      {warehouses.length === 0 || showWarehouseForm ? (
        <NewWarehouseForm onCreate={async (p) => { await onAddWarehouse(p); setShowWarehouseForm(false); }} onCancel={() => setShowWarehouseForm(false)} />
      ) : (
        <div className="flex items-center gap-2">
          <select value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)} className="flex-1 border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm">
            {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
          <button onClick={() => setShowWarehouseForm(true)} className="text-xs text-[#1B2A4A] hover:underline whitespace-nowrap">+ Nouvel entrepôt</button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom de l'article" className="border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm" />
        <input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="Unité (kg, sac, unité...)" className="border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <input value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="Quantité initiale" style={mono} className="border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm" />
        <input value={minQuantity} onChange={(e) => setMinQuantity(e.target.value)} placeholder="Seuil d'alerte" style={mono} className="border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm" />
        <input value={unitCost} onChange={(e) => setUnitCost(e.target.value)} placeholder="Coût unitaire" style={mono} className="border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm" />
      </div>
      <div className="flex gap-2">
        <button
          disabled={!warehouseId}
          onClick={() => name && unit && onCreate({
            warehouseId, name, unit,
            quantity: parseFloat(quantity) || 0, minQuantity: parseFloat(minQuantity) || 0, unitCost: parseFloat(unitCost) || 0,
          })}
          className="text-xs px-3 py-1.5 bg-[#1B2A4A] text-white rounded-sm hover:bg-[#233459] disabled:opacity-40"
        >
          Ajouter l'article
        </button>
        <button onClick={onCancel} className="text-xs px-3 py-1.5 text-[#7A8399]">Annuler</button>
      </div>
    </div>
  );
}

function MovementInline({ item, onSubmit, onClose }) {
  const [type, setType] = useState("ENTREE");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  return (
    <div className="mt-3 bg-[#FAFBFC] border border-[#E4E7EE] rounded-sm p-4 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <select value={type} onChange={(e) => setType(e.target.value)} className="border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm">
          <option value="ENTREE">Entrée</option>
          <option value="SORTIE">Sortie</option>
          <option value="TRANSFERT">Transfert</option>
        </select>
        <input value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder={`Quantité (${item.unit})`} style={mono} className="border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm" />
      </div>
      <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Motif (ex. distribution terrain, réception commande...)" className="w-full border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm" />
      <div className="flex gap-2">
        <button
          onClick={() => quantity && onSubmit({ stockItemId: item.id, type, quantity: parseFloat(quantity) || 0, ...(reason ? { reason } : {}) })}
          className="text-xs px-3 py-1.5 bg-[#1B2A4A] text-white rounded-sm hover:bg-[#233459]"
        >
          Enregistrer le mouvement
        </button>
        <button onClick={onClose} className="text-xs px-3 py-1.5 text-[#7A8399]">Annuler</button>
      </div>
    </div>
  );
}

export default function StockView() {
  const [items, setItems] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [movingItemId, setMovingItemId] = useState(null);
  const [toast, setToast] = useState(null);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setItems(await listStockItems());
    setWarehouses(await listWarehouses());
  }, []);
  useEffect(() => { refresh(); }, [refresh]);

  const belowThreshold = items.filter((i) => i.belowThreshold);

  const handleCreateItem = async (payload) => {
    try {
      await createStockItem(payload);
      setShowForm(false);
      await refresh();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleCreateWarehouse = async (payload) => {
    try {
      await createWarehouse(payload);
      await refresh();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleMovement = async (payload) => {
    try {
      await createStockMovement(payload);
      setMovingItemId(null);
      await refresh();
      setToast("Mouvement de stock enregistré.");
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-xl text-[#101B33] font-semibold">Stocks</h1>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 bg-[#1B2A4A] text-white text-sm px-3.5 py-2 rounded-sm hover:bg-[#233459]">
            <Plus size={15} /> Nouvel article
          </button>
        )}
      </div>
      <p className="text-xs text-[#9AA3B5] mb-6">Inventaire multi-entrepôts avec alerte de seuil et traçabilité des distributions.</p>
      {toast && <Banner>{toast}</Banner>}
      {error && <Banner tone="error">{error}</Banner>}
      {showForm && <NewItemForm warehouses={warehouses} onCreate={handleCreateItem} onCancel={() => setShowForm(false)} onAddWarehouse={handleCreateWarehouse} />}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <KpiCard label="Articles suivis" value={items.length} accent="#1B2A4A" />
        <KpiCard label="Sous le seuil d'alerte" value={belowThreshold.length} accent="#C53030" />
        <KpiCard label="Entrepôts" value={warehouses.length} accent="#2F855A" />
      </div>

      <div className="bg-white border border-[#E4E7EE] rounded-sm divide-y divide-[#F0F1F5]">
        {items.map((item) => (
          <div key={item.id} className="px-5 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-3">
                <Package size={16} className="text-[#9AA3B5] mt-0.5" />
                <div>
                  <div className="text-sm text-[#101B33] flex items-center gap-2">
                    {item.name}
                    {item.belowThreshold && <AlertTriangle size={12} className="text-[#C53030]" />}
                  </div>
                  <div className="text-xs text-[#9AA3B5] mt-0.5" style={mono}>
                    {Number(item.quantity).toLocaleString("fr-FR")} {item.unit} · seuil {Number(item.minQuantity).toLocaleString("fr-FR")} {item.unit} · {fmt(item.unitCost)}/{item.unit}
                  </div>
                </div>
              </div>
              <button onClick={() => setMovingItemId(movingItemId === item.id ? null : item.id)} className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-[#D8DCE6] rounded-sm text-[#3D4761] hover:bg-[#FAFBFC]">
                <ArrowDownCircle size={12} /><ArrowUpCircle size={12} /> Mouvement
              </button>
            </div>
            {movingItemId === item.id && (
              <MovementInline item={item} onSubmit={handleMovement} onClose={() => setMovingItemId(null)} />
            )}
          </div>
        ))}
        {items.length === 0 && <div className="p-5 text-sm text-[#7A8399]">Aucun article en stock pour l'instant.</div>}
      </div>
    </div>
  );
}
