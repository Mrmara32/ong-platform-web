import React, { useCallback, useEffect, useState } from "react";
import { Monitor, Bell, AlertTriangle, Plus, Send } from "lucide-react";
import {
  listAssets, createAsset, createAssetMaintenance,
  listNotifications, acknowledgeNotification, notifyLogisticsOfficers,
} from "./lib/api";
import { Banner, mono } from "./shared.jsx";

const URGENCY_STYLE = {
  DEPASSEE: "bg-[#FDECEC] text-[#9B2C2C]",
  IMMINENTE: "bg-[#FFF6E5] text-[#8A6116]",
  A_VENIR: "bg-[#F0F1F5] text-[#7A8399]",
};
const URGENCY_LABEL = { DEPASSEE: "Dépassée", IMMINENTE: "Imminente", A_VENIR: "À venir" };

function NewAssetForm({ onCreate, onCancel }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("INFORMATIQUE");
  const [serialNumber, setSerialNumber] = useState("");

  return (
    <div className="bg-white border border-[#E4E7EE] rounded-sm p-5 space-y-3 mb-6 max-w-lg">
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom (ex. PC portable — bureau Niamey)" className="w-full border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm" />
      <div className="grid grid-cols-2 gap-3">
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm">
          <option value="INFORMATIQUE">Informatique</option>
          <option value="GENERATEUR">Générateur</option>
          <option value="MOBILIER_BUREAU">Mobilier de bureau</option>
          <option value="EQUIPEMENT_TERRAIN">Équipement terrain</option>
          <option value="AUTRE">Autre</option>
        </select>
        <input value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} placeholder="Numéro de série" className="border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm" />
      </div>
      <div className="flex gap-2">
        <button onClick={() => name && onCreate({ name, category, serialNumber })} className="text-xs px-3 py-1.5 bg-[#1B2A4A] text-white rounded-sm hover:bg-[#233459]">
          Ajouter au registre
        </button>
        <button onClick={onCancel} className="text-xs px-3 py-1.5 text-[#7A8399]">Annuler</button>
      </div>
    </div>
  );
}

function NewMaintenanceForm({ onSubmit, onCancel }) {
  const [type, setType] = useState("RENOUVELLEMENT_LICENCE");
  const [description, setDescription] = useState("");
  const [cost, setCost] = useState("0");
  const [nextDueDate, setNextDueDate] = useState("");

  return (
    <div className="mt-3 bg-[#FAFBFC] border border-[#E4E7EE] rounded-sm p-4 space-y-3">
      <select value={type} onChange={(e) => setType(e.target.value)} className="w-full border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm">
        <option value="RENOUVELLEMENT_LICENCE">Renouvellement de licence (ex. antivirus)</option>
        <option value="PREVENTIVE">Maintenance préventive</option>
        <option value="CURATIVE">Maintenance curative</option>
      </select>
      <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (ex. Licence antivirus Bitdefender)" className="w-full border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm" />
      <div className="grid grid-cols-2 gap-3">
        <input value={cost} onChange={(e) => setCost(e.target.value)} placeholder="Coût" style={mono} className="border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm" />
        <input type="date" value={nextDueDate} onChange={(e) => setNextDueDate(e.target.value)} className="border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm" />
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onSubmit({ type, description, cost: parseFloat(cost) || 0, nextDueDate: nextDueDate || undefined })}
          className="text-xs px-3 py-1.5 bg-[#1B2A4A] text-white rounded-sm hover:bg-[#233459]"
        >
          Enregistrer
        </button>
        <button onClick={onCancel} className="text-xs px-3 py-1.5 text-[#7A8399]">Annuler</button>
      </div>
    </div>
  );
}

export default function EquipmentView() {
  const [assets, setAssets] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showAssetForm, setShowAssetForm] = useState(false);
  const [maintenanceFormFor, setMaintenanceFormFor] = useState(null);
  const [toast, setToast] = useState(null);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setAssets(await listAssets());
    setNotifications(await listNotifications());
  }, []);
  useEffect(() => { refresh(); }, [refresh]);

  const pending = notifications.filter((n) => n.status === "EN_ATTENTE");

  const handleCreateAsset = async (payload) => {
    try {
      await createAsset(payload);
      setShowAssetForm(false);
      await refresh();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleCreateMaintenance = async (assetId, payload) => {
    try {
      await createAssetMaintenance(assetId, payload);
      setMaintenanceFormFor(null);
      await refresh();
      setToast("Intervention enregistrée — alertes recalculées.");
    } catch (e) {
      setError(e.message);
    }
  };

  const handleAcknowledge = async (id) => {
    try {
      await acknowledgeNotification(id);
      await refresh();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleNotify = async () => {
    try {
      const result = await notifyLogisticsOfficers();
      setToast(
        result.sent
          ? `Récapitulatif envoyé à ${result.recipients.join(", ")}${result.simulated ? " (envoi simulé — SMTP non configuré)" : ""}.`
          : `Rien à notifier : ${result.reason}`
      );
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl text-[#101B33] font-semibold">Équipements & Alertes</h1>
        <div className="flex items-center gap-2">
          <button onClick={handleNotify} className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-[#D8DCE6] rounded-sm text-[#3D4761] hover:bg-[#FAFBFC]">
            <Send size={13} /> Notifier le Logisticien
          </button>
          {!showAssetForm && (
            <button onClick={() => setShowAssetForm(true)} className="flex items-center gap-1.5 bg-[#1B2A4A] text-white text-sm px-3.5 py-2 rounded-sm hover:bg-[#233459]">
              <Plus size={15} /> Ajouter un matériel
            </button>
          )}
        </div>
      </div>
      {toast && <Banner>{toast}</Banner>}
      {error && <Banner tone="error">{error}</Banner>}
      {showAssetForm && <NewAssetForm onCreate={handleCreateAsset} onCancel={() => setShowAssetForm(false)} />}

      <div className="bg-white border border-[#E4E7EE] rounded-sm mb-6">
        <div className="px-5 py-3 border-b border-[#E4E7EE] flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium text-[#101B33]">
            <Bell size={16} className="text-[#E8B564]" /> Alertes en attente
          </div>
          {pending.length > 0 && <span className="text-xs px-2 py-1 rounded-sm bg-[#FDECEC] text-[#9B2C2C]">{pending.length} active(s)</span>}
        </div>
        {pending.length === 0 ? (
          <div className="p-5 text-sm text-[#7A8399]">Aucune alerte en attente.</div>
        ) : (
          <div className="divide-y divide-[#F0F1F5]">
            {pending.map((n) => (
              <div key={n.id} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-start gap-3">
                  <AlertTriangle size={16} className={n.urgency === "DEPASSEE" ? "text-[#C53030] mt-0.5" : "text-[#E8B564] mt-0.5"} />
                  <div className="text-sm text-[#101B33]">{n.message}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-1 rounded-sm ${URGENCY_STYLE[n.urgency]}`}>{URGENCY_LABEL[n.urgency]}</span>
                  <button onClick={() => handleAcknowledge(n.id)} className="text-xs px-3 py-1.5 border border-[#D8DCE6] rounded-sm text-[#3D4761] hover:bg-[#FAFBFC]">
                    Marquer traitée
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white border border-[#E4E7EE] rounded-sm">
        <div className="px-5 py-3 border-b border-[#E4E7EE] text-sm font-medium text-[#101B33]">Registre du matériel</div>
        <div className="divide-y divide-[#F0F1F5]">
          {assets.map((a) => (
            <div key={a.id} className="px-5 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-3">
                  <Monitor size={16} className="text-[#9AA3B5] mt-0.5" />
                  <div>
                    <div className="text-sm text-[#101B33]">{a.name}</div>
                    <div className="text-xs text-[#9AA3B5] mt-0.5">{a.category} · {a.serialNumber || "—"}</div>
                  </div>
                </div>
                <button onClick={() => setMaintenanceFormFor(maintenanceFormFor === a.id ? null : a.id)} className="text-xs px-3 py-1.5 border border-[#D8DCE6] rounded-sm text-[#3D4761] hover:bg-[#FAFBFC]">
                  Enregistrer intervention
                </button>
              </div>
              {maintenanceFormFor === a.id && (
                <NewMaintenanceForm onSubmit={(p) => handleCreateMaintenance(a.id, p)} onCancel={() => setMaintenanceFormFor(null)} />
              )}
            </div>
          ))}
          {assets.length === 0 && <div className="p-5 text-sm text-[#7A8399]">Aucun matériel enregistré pour l'instant.</div>}
        </div>
      </div>
    </div>
  );
}
