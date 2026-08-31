import React, { useCallback, useEffect, useState } from "react";
import { User, Plus, ArrowLeft, CreditCard, Car, Route, Trash2, Save, AlertTriangle } from "lucide-react";
import { listDrivers, getDriver, createDriver, updateDriver, removeDriver, listStaff } from "./lib/api";
import { Banner, KpiCard, licenseStatus } from "./shared.jsx";

function NewDriverForm({ staff, onCreate, onCancel }) {
  const [staffId, setStaffId] = useState(staff[0]?.id ?? "");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [licenseExpiryDate, setLicenseExpiryDate] = useState("");

  return (
    <div className="bg-white border border-[#E4E7EE] rounded-sm p-5 space-y-3 mb-6 max-w-lg">
      <div className="text-sm font-medium text-[#101B33]">Déclarer un chauffeur</div>
      <p className="text-xs text-[#9AA3B5]">
        Un chauffeur EST un employé de l'organisation — sélectionne-le dans la liste RH, aucune fiche séparée n'est créée.
      </p>
      {staff.length === 0 ? (
        <div className="text-xs text-[#9B2C2C] bg-[#FDECEC] rounded-sm px-3 py-2">
          Tous les employés sont déjà déclarés chauffeurs, ou aucun employé n'existe encore (module RH).
        </div>
      ) : (
        <>
          <select value={staffId} onChange={(e) => setStaffId(e.target.value)} className="w-full border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm">
            {staff.map((s) => <option key={s.id} value={s.id}>{s.fullName} — {s.jobTitle}</option>)}
          </select>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} placeholder="N° de permis" className="border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm" />
            <input type="date" value={licenseExpiryDate} onChange={(e) => setLicenseExpiryDate(e.target.value)} className="border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm" />
          </div>
        </>
      )}
      <div className="flex gap-2">
        <button
          disabled={staff.length === 0}
          onClick={() => staffId && licenseNumber && licenseExpiryDate && onCreate({ staffId, licenseNumber, licenseExpiryDate })}
          className="text-xs px-3 py-1.5 bg-[#1B2A4A] text-white rounded-sm hover:bg-[#233459] disabled:opacity-40"
        >
          Déclarer chauffeur
        </button>
        <button onClick={onCancel} className="text-xs px-3 py-1.5 text-[#7A8399]">Annuler</button>
      </div>
    </div>
  );
}

function DriverDetail({ driverId, onBack, onChanged }) {
  const [driver, setDriver] = useState(null);
  const [licenseNumber, setLicenseNumber] = useState("");
  const [licenseExpiryDate, setLicenseExpiryDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  const refresh = useCallback(async () => {
    const data = await getDriver(driverId);
    setDriver(data);
    setLicenseNumber(data.licenseNumber);
    setLicenseExpiryDate(data.licenseExpiryDate.slice(0, 10));
  }, [driverId]);
  useEffect(() => { refresh(); }, [refresh]);

  if (!driver) return <div className="text-sm text-[#7A8399]">Chargement…</div>;
  const status = licenseStatus(driver.licenseExpiryDate);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await updateDriver(driver.id, { licenseNumber, licenseExpiryDate });
      await refresh();
      onChanged?.();
      setToast("Informations du permis mises à jour.");
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await removeDriver(driver.id);
      onChanged?.();
      onBack();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1.5 text-xs text-[#7A8399] hover:text-[#101B33] mb-4">
        <ArrowLeft size={13} /> Retour à la liste
      </button>
      {toast && <Banner>{toast}</Banner>}
      {error && <Banner tone="error">{error}</Banner>}

      <div className="bg-white border border-[#E4E7EE] rounded-sm p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#EEF0F4] flex items-center justify-center">
              <User size={18} className="text-[#3D4761]" />
            </div>
            <div>
              <div className="text-lg text-[#101B33] font-semibold">{driver.staff.fullName}</div>
              <div className="text-xs text-[#9AA3B5]">{driver.staff.jobTitle}</div>
            </div>
          </div>
          <span className={`text-xs px-2 py-1 rounded-sm ${status.style}`}>{status.label}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div>
            <label className="text-xs text-[#7A8399] uppercase tracking-wide font-medium">N° de permis</label>
            <input value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} className="w-full mt-1 border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs text-[#7A8399] uppercase tracking-wide font-medium">Expiration du permis</label>
            <input type="date" value={licenseExpiryDate} onChange={(e) => setLicenseExpiryDate(e.target.value)} className="w-full mt-1 border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm" />
          </div>
        </div>

        <div className="flex items-center gap-2 mb-4 text-xs text-[#9AA3B5]">
          {driver.staff.phone && <span>{driver.staff.phone}</span>}
          {driver.staff.email && <span>· {driver.staff.email}</span>}
        </div>

        <div className="flex gap-2">
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 bg-[#1B2A4A] text-white text-xs px-3 py-1.5 rounded-sm hover:bg-[#233459] disabled:opacity-50">
            <Save size={13} /> {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
          <button onClick={handleDelete} className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-[#F5C2C2] text-[#9B2C2C] rounded-sm hover:bg-[#FDECEC]">
            <Trash2 size={13} /> Retirer le statut chauffeur
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white border border-[#E4E7EE] rounded-sm">
          <div className="px-5 py-3 border-b border-[#E4E7EE] flex items-center gap-2 text-sm font-medium text-[#101B33]">
            <Car size={15} className="text-[#9AA3B5]" /> Véhicules attitrés
          </div>
          <div className="divide-y divide-[#F0F1F5]">
            {driver.assignedVehicles.length === 0 ? (
              <div className="p-4 text-sm text-[#7A8399]">Aucun véhicule attitré en permanence.</div>
            ) : (
              driver.assignedVehicles.map((v) => (
                <div key={v.id} className="px-4 py-2.5 text-sm text-[#101B33]">{v.brand} {v.model} <span className="text-[#9AA3B5]">· {v.plateNumber}</span></div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white border border-[#E4E7EE] rounded-sm">
          <div className="px-5 py-3 border-b border-[#E4E7EE] flex items-center gap-2 text-sm font-medium text-[#101B33]">
            <Route size={15} className="text-[#9AA3B5]" /> Derniers trajets
          </div>
          <div className="divide-y divide-[#F0F1F5] max-h-80 overflow-y-auto">
            {driver.trips.length === 0 ? (
              <div className="p-4 text-sm text-[#7A8399]">Aucun trajet enregistré.</div>
            ) : (
              driver.trips.map((t) => (
                <div key={t.id} className="px-4 py-2.5">
                  <div className="text-sm text-[#101B33]">{t.purpose}</div>
                  <div className="text-xs text-[#9AA3B5] mt-0.5">
                    {new Date(t.departureDate).toLocaleDateString("fr-FR")} · {t.vehicle.plateNumber}
                    {t.project && ` · ${t.project.name}`}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DriversView() {
  const [drivers, setDrivers] = useState([]);
  const [staff, setStaff] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState(null);
  const [forbidden, setForbidden] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setDrivers(await listDrivers());
      setStaff(await listStaff());
    } catch (e) {
      if (String(e.message).includes("403") || String(e.message).toLowerCase().includes("autoris")) {
        setForbidden(true);
      } else {
        setError(e.message);
      }
    }
  }, []);
  useEffect(() => { refresh(); }, [refresh]);

  if (forbidden) {
    return (
      <div className="p-4 md:p-8">
        <h1 className="text-xl text-[#101B33] font-semibold mb-2">Chauffeurs</h1>
        <Banner tone="error">
          Accès réservé au chargé de logistique et à l'Admin/Président de l'organisation.
        </Banner>
      </div>
    );
  }

  const handleCreate = async (payload) => {
    try {
      await createDriver(payload);
      setShowForm(false);
      await refresh();
    } catch (e) {
      setError(e.message);
    }
  };

  const availableStaff = staff.filter((s) => !drivers.some((d) => d.staffId === s.id));
  const expiringSoon = drivers.filter((d) => licenseStatus(d.licenseExpiryDate).label !== "Valide");

  if (selectedId) {
    return (
      <div className="p-4 md:p-8">
        <DriverDetail driverId={selectedId} onBack={() => setSelectedId(null)} onChanged={refresh} />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-xl text-[#101B33] font-semibold">Chauffeurs</h1>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 bg-[#1B2A4A] text-white text-sm px-3.5 py-2 rounded-sm hover:bg-[#233459]">
            <Plus size={15} /> Déclarer un chauffeur
          </button>
        )}
      </div>
      <p className="text-xs text-[#9AA3B5] mb-6">
        Module réservé au chargé de logistique et à l'Admin/Président. Chaque chauffeur est obligatoirement un employé de l'organisation.
      </p>
      {error && <Banner tone="error">{error}</Banner>}
      {showForm && <NewDriverForm staff={availableStaff} onCreate={handleCreate} onCancel={() => setShowForm(false)} />}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <KpiCard label="Chauffeurs déclarés" value={drivers.length} accent="#1B2A4A" />
        <KpiCard label="Permis à surveiller" value={expiringSoon.length} accent="#E8B564" />
        <KpiCard label="Employés disponibles" value={availableStaff.length} sub="pas encore chauffeurs" accent="#2F855A" />
      </div>

      <div className="bg-white border border-[#E4E7EE] rounded-sm divide-y divide-[#F0F1F5]">
        {drivers.map((d) => {
          const status = licenseStatus(d.licenseExpiryDate);
          return (
            <button key={d.id} onClick={() => setSelectedId(d.id)} className="w-full flex items-center justify-between px-5 py-3 text-left hover:bg-[#FAFBFC]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#EEF0F4] flex items-center justify-center">
                  <User size={15} className="text-[#3D4761]" />
                </div>
                <div>
                  <div className="text-sm text-[#101B33]">{d.staff.fullName}</div>
                  <div className="text-xs text-[#9AA3B5] mt-0.5 flex items-center gap-1">
                    <CreditCard size={11} /> {d.licenseNumber} · expire le {new Date(d.licenseExpiryDate).toLocaleDateString("fr-FR")}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {status.label !== "Valide" && <AlertTriangle size={13} className={status.label === "Expiré" ? "text-[#C53030]" : "text-[#E8B564]"} />}
                <span className={`text-xs px-2 py-1 rounded-sm ${status.style}`}>{status.label}</span>
              </div>
            </button>
          );
        })}
        {drivers.length === 0 && <div className="p-5 text-sm text-[#7A8399]">Aucun chauffeur déclaré pour l'instant.</div>}
      </div>
    </div>
  );
}
