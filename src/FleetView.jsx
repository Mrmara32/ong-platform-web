import React, { useCallback, useEffect, useState } from "react";
import { Truck, Bike, Tractor, Plus, AlertTriangle, Bell, ChevronRight, ArrowLeft, User, FolderKanban, Fuel, X, Gauge, Route } from "lucide-react";
import {
  getFleetDashboard, listVehicles, getVehicle, createVehicle,
  listFleetAlerts, createMaintenance, createFuelLog,
  listDrivers, createDriver, listStaff, listProjects,
  assignVehicleToProject, unassignVehicleFromProject, reportVehicleBreakdown, getFuelConsumption,
  exportVehiclesXlsx, createTrip, closeTrip,
} from "./lib/api";
import { fmt, mono, Banner, KpiCard, licenseStatus, ExportMenu } from "./shared.jsx";

const TYPE_ICON = { VOITURE: Truck, MOTO: Bike, ENGIN: Tractor, AUTRE: Truck };
const TYPE_LABEL = { VOITURE: "Voiture", MOTO: "Moto", ENGIN: "Engin", AUTRE: "Autre" };
const STATUS_STYLE = {
  DISPONIBLE: "bg-[#EFF6EE] text-[#2F5233]",
  EN_MISSION: "bg-[#E5F0FF] text-[#1D4E8F]",
  EN_MAINTENANCE: "bg-[#FFF6E5] text-[#8A6116]",
  HORS_SERVICE: "bg-[#FDECEC] text-[#9B2C2C]",
};
const URGENCY_STYLE = {
  DEPASSEE: "bg-[#FDECEC] text-[#9B2C2C]",
  IMMINENTE: "bg-[#FFF6E5] text-[#8A6116]",
  A_VENIR: "bg-[#F0F1F5] text-[#7A8399]",
};
const URGENCY_LABEL = { DEPASSEE: "Dépassée", IMMINENTE: "Imminente", A_VENIR: "À venir" };

function NewVehicleForm({ onCreate, onCancel, drivers }) {
  const [type, setType] = useState("VOITURE");
  const [plateNumber, setPlateNumber] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [engineHours, setEngineHours] = useState("");
  const [assignedDriverId, setAssignedDriverId] = useState("");
  const isEngin = type === "ENGIN";

  return (
    <div className="bg-white border border-[#E4E7EE] rounded-sm p-5 space-y-3 mb-6 max-w-lg">
      <select value={type} onChange={(e) => setType(e.target.value)} className="w-full border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm">
        <option value="VOITURE">Voiture</option>
        <option value="MOTO">Moto</option>
        <option value="ENGIN">Engin (tracteur, groupe mobile...)</option>
        <option value="AUTRE">Autre</option>
      </select>
      <input
        value={plateNumber}
        onChange={(e) => setPlateNumber(e.target.value)}
        placeholder={isEngin ? "Immatriculation ou n° de série (si applicable)" : "Immatriculation"}
        className="w-full border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm"
      />
      <div className="grid grid-cols-2 gap-3">
        <input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Marque" className="border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm" />
        <input value={model} onChange={(e) => setModel(e.target.value)} placeholder="Modèle" className="border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm" />
      </div>
      {isEngin && (
        <div>
          <input
            value={engineHours}
            onChange={(e) => setEngineHours(e.target.value)}
            placeholder="Heures moteur actuelles"
            style={mono}
            className="w-full border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm"
          />
          <p className="text-xs text-[#9AA3B5] mt-1">
            Pour un engin, le suivi se fait en heures moteur plutôt qu'en kilomètres — utilisé pour le calcul des alertes d'entretien.
          </p>
        </div>
      )}
      <div>
        <label className="text-xs text-[#7A8399] uppercase tracking-wide">Chauffeur attitré (optionnel)</label>
        <select
          value={assignedDriverId}
          onChange={(e) => setAssignedDriverId(e.target.value)}
          className="w-full mt-1 border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm"
        >
          <option value="">Aucun pour l'instant</option>
          {drivers.map((d) => (
            <option key={d.id} value={d.id}>{d.staff?.fullName} — permis n° {d.licenseNumber}</option>
          ))}
        </select>
        {drivers.length === 0 && (
          <p className="text-xs text-[#9AA3B5] mt-1">
            Aucun chauffeur enregistré. Un chauffeur doit d'abord exister comme employé (module RH) puis être déclaré chauffeur ci-dessous.
          </p>
        )}
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => plateNumber && brand && model && onCreate({
            type, plateNumber, brand, model,
            ...(isEngin && engineHours ? { engineHours: parseInt(engineHours, 10) } : {}),
            ...(assignedDriverId ? { assignedDriverId } : {}),
          })}
          className="text-xs px-3 py-1.5 bg-[#1B2A4A] text-white rounded-sm hover:bg-[#233459]"
        >
          Ajouter au parc
        </button>
        <button onClick={onCancel} className="text-xs px-3 py-1.5 text-[#7A8399]">Annuler</button>
      </div>
    </div>
  );
}

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
      <select value={staffId} onChange={(e) => setStaffId(e.target.value)} className="w-full border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm">
        {staff.length === 0 && <option value="">Aucun employé disponible</option>}
        {staff.map((s) => <option key={s.id} value={s.id}>{s.fullName} — {s.jobTitle}</option>)}
      </select>
      <div className="grid grid-cols-2 gap-3">
        <input value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} placeholder="N° de permis" className="border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm" />
        <input type="date" value={licenseExpiryDate} onChange={(e) => setLicenseExpiryDate(e.target.value)} className="border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm" />
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => staffId && licenseNumber && licenseExpiryDate && onCreate({ staffId, licenseNumber, licenseExpiryDate })}
          className="text-xs px-3 py-1.5 bg-[#1B2A4A] text-white rounded-sm hover:bg-[#233459]"
        >
          Déclarer chauffeur
        </button>
        <button onClick={onCancel} className="text-xs px-3 py-1.5 text-[#7A8399]">Annuler</button>
      </div>
    </div>
  );
}

function AssignProjectInline({ projects, onSubmit, onCancel }) {
  const [projectId, setProjectId] = useState(projects[0]?.id ?? "");
  const [sharePct, setSharePct] = useState("100");
  return (
    <div className="mt-3 bg-[#FAFBFC] border border-[#E4E7EE] rounded-sm p-4 space-y-3">
      <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="w-full border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm">
        {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>
      <div>
        <label className="text-xs text-[#7A8399] uppercase tracking-wide">Part d'usage (%) — 100 si usage exclusif</label>
        <input value={sharePct} onChange={(e) => setSharePct(e.target.value)} style={mono} className="w-full mt-1 border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm" />
      </div>
      <div className="flex gap-2">
        <button onClick={() => projectId && onSubmit({ projectId, sharePct: parseInt(sharePct, 10) || 100 })} className="text-xs px-3 py-1.5 bg-[#1B2A4A] text-white rounded-sm hover:bg-[#233459]">
          Affecter au projet
        </button>
        <button onClick={onCancel} className="text-xs px-3 py-1.5 text-[#7A8399]">Annuler</button>
      </div>
    </div>
  );
}

function ReportBreakdownInline({ onSubmit, onCancel }) {
  const [description, setDescription] = useState("");
  return (
    <div className="mt-3 bg-[#FDECEC] border border-[#F5C2C2] rounded-sm p-4 space-y-3">
      <div className="text-xs text-[#9B2C2C] font-medium">Signaler une panne</div>
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={2}
        placeholder="Ex. : moteur ne démarre plus, pneu crevé..."
        className="w-full border border-[#E9B4B4] rounded-sm px-3 py-2 text-sm bg-white"
      />
      <div className="flex gap-2">
        <button onClick={() => description.length >= 3 && onSubmit(description)} className="text-xs px-3 py-1.5 bg-[#9B2C2C] text-white rounded-sm hover:bg-[#7F2424]">
          Confirmer la panne
        </button>
        <button onClick={onCancel} className="text-xs px-3 py-1.5 text-[#7A8399]">Annuler</button>
      </div>
    </div>
  );
}

function NewTripInline({ vehicleMileage, drivers, projects, onSubmit, onCancel }) {
  const [driverId, setDriverId] = useState(drivers[0]?.id ?? "");
  const [projectId, setProjectId] = useState("");
  const [purpose, setPurpose] = useState("");
  const [route, setRoute] = useState("");

  return (
    <div className="mt-3 bg-[#FAFBFC] border border-[#E4E7EE] rounded-sm p-4 space-y-3">
      <div className="text-xs text-[#7A8399] uppercase tracking-wide">Nouveau déplacement — km de départ : {vehicleMileage.toLocaleString("fr-FR")}</div>
      {drivers.length === 0 ? (
        <div className="text-xs text-[#9B2C2C] bg-[#FDECEC] rounded-sm px-3 py-2">Aucun chauffeur déclaré — déclare-en un d'abord.</div>
      ) : (
        <select value={driverId} onChange={(e) => setDriverId(e.target.value)} className="w-full border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm">
          {drivers.map((d) => <option key={d.id} value={d.id}>{d.staff.fullName}</option>)}
        </select>
      )}
      <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="w-full border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm">
        <option value="">Sans projet associé</option>
        {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>
      <input value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="Motif de mission" className="w-full border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm" />
      <input value={route} onChange={(e) => setRoute(e.target.value)} placeholder="Itinéraire (optionnel)" className="w-full border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm" />
      <div className="flex gap-2">
        <button
          disabled={!driverId || !purpose}
          onClick={() => onSubmit({
            driverId, purpose, ...(route ? { route } : {}), ...(projectId ? { projectId } : {}),
            startMileage: vehicleMileage, departureDate: new Date().toISOString(),
          })}
          className="text-xs px-3 py-1.5 bg-[#1B2A4A] text-white rounded-sm hover:bg-[#233459] disabled:opacity-40"
        >
          Démarrer le déplacement
        </button>
        <button onClick={onCancel} className="text-xs px-3 py-1.5 text-[#7A8399]">Annuler</button>
      </div>
    </div>
  );
}

function CloseTripInline({ trip, onSubmit, onCancel }) {
  const [endMileage, setEndMileage] = useState(trip.startMileage);
  return (
    <div className="mt-2 bg-[#FAFBFC] border border-[#E4E7EE] rounded-sm p-3 flex items-center gap-2">
      <input
        value={endMileage}
        onChange={(e) => setEndMileage(e.target.value)}
        placeholder="Km d'arrivée"
        style={mono}
        className="flex-1 border border-[#D8DCE6] rounded-sm px-3 py-1.5 text-sm"
      />
      <button
        onClick={() => onSubmit(parseInt(endMileage, 10) || trip.startMileage)}
        className="text-xs px-3 py-1.5 bg-[#1B2A4A] text-white rounded-sm hover:bg-[#233459]"
      >
        Clôturer
      </button>
      <button onClick={onCancel} className="text-xs px-3 py-1.5 text-[#7A8399]">Annuler</button>
    </div>
  );
}

function VehicleDetail({ vehicleId, drivers, onBack, onChanged }) {
  const [data, setData] = useState(null);
  const [projects, setProjects] = useState([]);
  const [consumption, setConsumption] = useState([]);
  const [showMaintenance, setShowMaintenance] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [showFuel, setShowFuel] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [showTrip, setShowTrip] = useState(false);
  const [closingTripId, setClosingTripId] = useState(null);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  const refresh = useCallback(async () => {
    setData(await getVehicle(vehicleId));
    setConsumption(await getFuelConsumption(vehicleId));
  }, [vehicleId]);
  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => { listProjects().then(setProjects); }, []);

  if (!data) return <div className="text-sm text-[#7A8399]">Chargement…</div>;
  const { vehicle, history } = data;
  const Icon = TYPE_ICON[vehicle.type] || Truck;
  const lastConsumption = consumption[0];

  const HISTORY_STYLE = {
    TRAJET: "text-[#1D4E8F]",
    CARBURANT: "text-[#8A6116]",
    MAINTENANCE: "text-[#9B2C2C]",
  };

  const handleAssign = async (payload) => {
    try {
      await assignVehicleToProject(vehicle.id, payload);
      setShowAssign(false);
      await refresh();
    } catch (e) { setError(e.message); }
  };

  const handleUnassign = async (projectId) => {
    try {
      await unassignVehicleFromProject(vehicle.id, projectId);
      await refresh();
    } catch (e) { setError(e.message); }
  };

  const handleBreakdown = async (description) => {
    try {
      const result = await reportVehicleBreakdown(vehicle.id, description);
      setShowBreakdown(false);
      await refresh();
      onChanged?.();
      setToast(
        result.recipients?.length
          ? `Panne signalée — notifié : ${result.recipients.join(", ")}${result.simulated ? " (envoi simulé, SMTP non configuré)" : ""}.`
          : "Panne signalée, mais aucun destinataire trouvé (aucun responsable de projet ni logisticien)."
      );
    } catch (e) { setError(e.message); }
  };

  const openTrip = vehicle.trips?.find((t) => t.endMileage == null);

  const handleStartTrip = async (payload) => {
    try {
      await createTrip({ vehicleId: vehicle.id, ...payload });
      setShowTrip(false);
      await refresh();
      onChanged?.();
      setToast("Déplacement démarré — véhicule marqué « En mission ».");
    } catch (e) { setError(e.message); }
  };

  const handleCloseTrip = async (tripId, endMileage) => {
    try {
      await closeTrip(tripId, endMileage);
      setClosingTripId(null);
      await refresh();
      onChanged?.();
      setToast("Déplacement clôturé — kilométrage du véhicule mis à jour.");
    } catch (e) { setError(e.message); }
  };

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1.5 text-xs text-[#7A8399] hover:text-[#101B33] mb-4">
        <ArrowLeft size={13} /> Retour au parc
      </button>
      {toast && <Banner>{toast}</Banner>}
      {error && <Banner tone="error">{error}</Banner>}

      <div className="bg-white border border-[#E4E7EE] rounded-sm p-5 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Icon size={22} className="text-[#9AA3B5]" />
            <div>
              <div className="text-lg text-[#101B33] font-semibold">{vehicle.brand} {vehicle.model}</div>
              <div className="text-xs text-[#9AA3B5] mt-0.5" style={mono}>
                {vehicle.plateNumber} · {TYPE_LABEL[vehicle.type]} ·{" "}
                {vehicle.type === "ENGIN" && vehicle.engineHours != null
                  ? `${vehicle.engineHours.toLocaleString("fr-FR")} h moteur`
                  : `${vehicle.currentMileage.toLocaleString("fr-FR")} km`}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2 py-1 rounded-sm ${STATUS_STYLE[vehicle.status]}`}>{vehicle.status}</span>
            {vehicle.status !== "HORS_SERVICE" && (
              <button onClick={() => setShowBreakdown((s) => !s)} className="text-xs px-3 py-1.5 border border-[#F5C2C2] text-[#9B2C2C] rounded-sm hover:bg-[#FDECEC]">
                Signaler une panne
              </button>
            )}
            {!openTrip && vehicle.status !== "HORS_SERVICE" && (
              <button onClick={() => setShowTrip((s) => !s)} className="flex items-center gap-1 text-xs px-3 py-1.5 border border-[#D8DCE6] rounded-sm text-[#3D4761] hover:bg-[#FAFBFC]">
                <Route size={12} /> Démarrer un déplacement
              </button>
            )}
            <button onClick={() => setShowFuel((s) => !s)} className="flex items-center gap-1 text-xs px-3 py-1.5 border border-[#D8DCE6] rounded-sm text-[#3D4761] hover:bg-[#FAFBFC]">
              <Fuel size={12} /> Enregistrer plein
            </button>
            <button onClick={() => setShowMaintenance((s) => !s)} className="text-xs px-3 py-1.5 border border-[#D8DCE6] rounded-sm text-[#3D4761] hover:bg-[#FAFBFC]">
              Enregistrer intervention
            </button>
          </div>
        </div>

        {openTrip && (
          <div className="mt-4 pt-4 border-t border-[#F0F1F5]">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-[#1D4E8F]">
                <Route size={14} />
                Déplacement en cours — {openTrip.purpose} (départ à {openTrip.startMileage.toLocaleString("fr-FR")} km)
              </div>
              {closingTripId !== openTrip.id && (
                <button onClick={() => setClosingTripId(openTrip.id)} className="text-xs px-3 py-1.5 border border-[#D8DCE6] rounded-sm text-[#3D4761] hover:bg-[#FAFBFC]">
                  Clôturer
                </button>
              )}
            </div>
            {closingTripId === openTrip.id && (
              <CloseTripInline trip={openTrip} onSubmit={(km) => handleCloseTrip(openTrip.id, km)} onCancel={() => setClosingTripId(null)} />
            )}
          </div>
        )}

        {showTrip && (
          <NewTripInline
            vehicleMileage={vehicle.currentMileage}
            drivers={drivers}
            projects={projects}
            onSubmit={handleStartTrip}
            onCancel={() => setShowTrip(false)}
          />
        )}

        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-[#F0F1F5]">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-[#7A8399] uppercase tracking-wide mb-1.5">
              <User size={12} /> Chauffeur attitré
            </div>
            {vehicle.assignedDriver ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-[#101B33]">{vehicle.assignedDriver.staff.fullName}</span>
                {(() => {
                  const status = licenseStatus(vehicle.assignedDriver.licenseExpiryDate);
                  return (
                    <span className={`text-xs px-2 py-0.5 rounded-sm flex items-center gap-1 ${status.style}`}>
                      {status.label !== "Valide" && <AlertTriangle size={10} />}
                      Permis : {status.label}
                    </span>
                  );
                })()}
              </div>
            ) : (
              <div className="text-sm text-[#9AA3B5]">Aucun chauffeur attitré</div>
            )}
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5 text-xs text-[#7A8399] uppercase tracking-wide">
                <FolderKanban size={12} /> Affecté / loué à
              </div>
              <button onClick={() => setShowAssign((s) => !s)} className="text-xs text-[#1B2A4A] hover:underline">+ Ajouter</button>
            </div>
            {vehicle.assignments?.length > 0 ? (
              <div className="space-y-1">
                {vehicle.assignments.map((a) => (
                  <div key={a.projectId} className="flex items-center justify-between text-sm">
                    <span className="text-[#101B33]">{a.project.name} <span className="text-[#9AA3B5]">({a.sharePct}%)</span></span>
                    <button onClick={() => handleUnassign(a.projectId)} className="text-[#B7BFCE] hover:text-[#9B2C2C]"><X size={13} /></button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-[#9AA3B5]">Non affecté à un projet</div>
            )}
          </div>
        </div>

        {lastConsumption?.litersPer100Km != null && (
          <div className={`mt-4 flex items-center gap-2 text-xs px-3 py-2 rounded-sm ${lastConsumption.isAnomaly ? "bg-[#FDECEC] text-[#9B2C2C]" : "bg-[#F0F1F5] text-[#7A8399]"}`}>
            <Gauge size={13} />
            Dernière consommation : {lastConsumption.litersPer100Km.toFixed(1)} L/100km
            {lastConsumption.isAnomaly && " — anomalie détectée (surconsommation suspecte par rapport à l'historique)"}
          </div>
        )}

        {showAssign && <AssignProjectInline projects={projects} onSubmit={handleAssign} onCancel={() => setShowAssign(false)} />}
        {showBreakdown && <ReportBreakdownInline onSubmit={handleBreakdown} onCancel={() => setShowBreakdown(false)} />}
        {showFuel && (
          <NewFuelInline
            onCancel={() => setShowFuel(false)}
            onSubmit={async (payload) => {
              try {
                const result = await createFuelLog({ vehicleId: vehicle.id, mileage: vehicle.currentMileage + (parseInt(payload.distance, 10) || 0), ...payload });
                setShowFuel(false);
                await refresh();
                onChanged?.();
                if (result.consumption?.isAnomaly) {
                  setToast(`Plein enregistré — ⚠ anomalie détectée : ${result.consumption.litersPer100Km.toFixed(1)} L/100km, bien au-dessus de la moyenne habituelle.`);
                } else {
                  setToast("Plein enregistré — écriture comptable générée automatiquement.");
                }
              } catch (e) { setError(e.message); }
            }}
          />
        )}
        {showMaintenance && (
          <NewMaintenanceInline
            onCancel={() => setShowMaintenance(false)}
            onSubmit={async (payload) => {
              try {
                await createMaintenance({ vehicleId: vehicle.id, mileage: vehicle.currentMileage, ...payload });
                setShowMaintenance(false);
                await refresh();
                onChanged?.();
              } catch (e) {
                setError(e.message);
              }
            }}
          />
        )}
      </div>

      <div className="bg-white border border-[#E4E7EE] rounded-sm">
        <div className="px-5 py-3 border-b border-[#E4E7EE] text-sm font-medium text-[#101B33]">Historique complet (déplacements, carburant, entretien)</div>
        <div className="divide-y divide-[#F0F1F5]">
          {history.length === 0 ? (
            <div className="p-5 text-sm text-[#7A8399]">Aucun historique pour l'instant.</div>
          ) : (
            history.map((h, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-3">
                <div>
                  <div className={`text-sm ${HISTORY_STYLE[h.kind]}`}>{h.label}</div>
                  <div className="text-xs text-[#9AA3B5] mt-0.5">{new Date(h.date).toLocaleDateString("fr-FR")} · {h.detail}</div>
                </div>
                <span className="text-xs text-[#9AA3B5] uppercase tracking-wide">{h.kind}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function NewFuelInline({ onSubmit, onCancel }) {
  const [liters, setLiters] = useState("");
  const [cost, setCost] = useState("");
  const [distance, setDistance] = useState("");
  const [projectId, setProjectId] = useState("");
  const [budgetLineId, setBudgetLineId] = useState("");

  return (
    <div className="mt-4 bg-[#FAFBFC] border border-[#E4E7EE] rounded-sm p-4 space-y-3">
      <p className="text-xs text-[#9AA3B5]">
        Renseigne le kilométrage parcouru depuis le dernier plein — la consommation (L/100km) et une éventuelle anomalie seront calculées automatiquement.
      </p>
      <div className="grid grid-cols-3 gap-3">
        <input value={liters} onChange={(e) => setLiters(e.target.value)} placeholder="Litres" style={mono} className="border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm" />
        <input value={cost} onChange={(e) => setCost(e.target.value)} placeholder="Coût" style={mono} className="border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm" />
        <input value={distance} onChange={(e) => setDistance(e.target.value)} placeholder="Km parcourus" style={mono} className="border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <input value={projectId} onChange={(e) => setProjectId(e.target.value)} placeholder="ID projet" className="border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm" />
        <input value={budgetLineId} onChange={(e) => setBudgetLineId(e.target.value)} placeholder="ID ligne budgétaire" className="border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm" />
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => liters && cost && onSubmit({
            liters: parseFloat(liters) || 0, cost: parseFloat(cost) || 0, distance, projectId, budgetLineId,
          })}
          className="text-xs px-3 py-1.5 bg-[#1B2A4A] text-white rounded-sm hover:bg-[#233459]"
        >
          Enregistrer le plein
        </button>
        <button onClick={onCancel} className="text-xs px-3 py-1.5 text-[#7A8399]">Annuler</button>
      </div>
    </div>
  );
}

function NewMaintenanceInline({ onSubmit, onCancel }) {
  const [type, setType] = useState("PREVENTIVE");
  const [description, setDescription] = useState("");
  const [provider, setProvider] = useState("");
  const [cost, setCost] = useState("");
  const [projectId, setProjectId] = useState("");
  const [budgetLineId, setBudgetLineId] = useState("");
  const [nextDueKm, setNextDueKm] = useState("");
  const [nextDueDate, setNextDueDate] = useState("");

  return (
    <div className="mt-4 bg-[#FAFBFC] border border-[#E4E7EE] rounded-sm p-4 space-y-3">
      <p className="text-xs text-[#9AA3B5]">
        Renseigne l'id du projet et de la ligne budgétaire à imputer (visibles dans l'onglet Budget) pour que la dépense soit comptabilisée automatiquement.
      </p>
      <div className="grid grid-cols-2 gap-3">
        <select value={type} onChange={(e) => setType(e.target.value)} className="border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm">
          <option value="PREVENTIVE">Préventive</option>
          <option value="CURATIVE">Curative</option>
        </select>
        <input value={cost} onChange={(e) => setCost(e.target.value)} placeholder="Coût" style={mono} className="border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm" />
      </div>
      <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" className="w-full border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm" />
      <input value={provider} onChange={(e) => setProvider(e.target.value)} placeholder="Prestataire" className="w-full border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm" />
      <div className="grid grid-cols-2 gap-3">
        <input value={projectId} onChange={(e) => setProjectId(e.target.value)} placeholder="ID projet" className="border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm" />
        <input value={budgetLineId} onChange={(e) => setBudgetLineId(e.target.value)} placeholder="ID ligne budgétaire" className="border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <input value={nextDueKm} onChange={(e) => setNextDueKm(e.target.value)} placeholder="Prochaine échéance (km ou heures moteur)" style={mono} className="border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm" />
        <input type="date" value={nextDueDate} onChange={(e) => setNextDueDate(e.target.value)} className="border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm" />
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onSubmit({
            type, description, provider, cost: parseFloat(cost) || 0,
            projectId, budgetLineId,
            nextDueKm: nextDueKm ? parseInt(nextDueKm, 10) : undefined,
            nextDueDate: nextDueDate || undefined,
          })}
          className="text-xs px-3 py-1.5 bg-[#1B2A4A] text-white rounded-sm hover:bg-[#233459]"
        >
          Enregistrer
        </button>
        <button onClick={onCancel} className="text-xs px-3 py-1.5 text-[#7A8399]">Annuler</button>
      </div>
    </div>
  );
}

export default function FleetView() {
  const [dashboard, setDashboard] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [staff, setStaff] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showDriverForm, setShowDriverForm] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [forbidden, setForbidden] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setDashboard(await getFleetDashboard());
      setVehicles(await listVehicles());
      setAlerts(await listFleetAlerts());
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
      <div className="p-8">
        <h1 className="text-xl text-[#101B33] font-semibold mb-2">Flotte</h1>
        <Banner tone="error">
          Accès réservé au chargé de logistique et à l'Admin/Président de l'organisation. Ce module n'est pas accessible avec ton rôle actuel.
        </Banner>
      </div>
    );
  }

  const handleCreate = async (payload) => {
    try {
      await createVehicle(payload);
      setShowForm(false);
      await refresh();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleCreateDriver = async (payload) => {
    try {
      await createDriver(payload);
      setShowDriverForm(false);
      await refresh();
      setToast("Chauffeur déclaré — disponible pour affectation à un véhicule.");
    } catch (e) {
      setError(e.message);
    }
  };

  // Employés qui ne sont pas déjà déclarés chauffeurs (un employé = une seule fiche chauffeur)
  const availableStaffForDriver = staff.filter((s) => !drivers.some((d) => d.staffId === s.id));

  if (selectedId) {
    return (
      <div className="p-8">
        <VehicleDetail vehicleId={selectedId} drivers={drivers} onBack={() => setSelectedId(null)} onChanged={refresh} />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-xl text-[#101B33] font-semibold">Flotte — véhicules, motos, engins</h1>
        <div className="flex items-center gap-2">
          <ExportMenu formats={[{ type: "xlsx", label: "Excel (.xlsx)" }]} onExport={exportVehiclesXlsx} />
          {!showDriverForm && (
            <button onClick={() => setShowDriverForm(true)} className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-[#D8DCE6] rounded-sm text-[#3D4761] hover:bg-[#FAFBFC]">
              <User size={13} /> Déclarer un chauffeur
            </button>
          )}
          {!showForm && (
            <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 bg-[#1B2A4A] text-white text-sm px-3.5 py-2 rounded-sm hover:bg-[#233459]">
              <Plus size={15} /> Ajouter au parc
            </button>
          )}
        </div>
      </div>
      <p className="text-xs text-[#9AA3B5] mb-6">
        Module réservé au chargé de logistique et à l'Admin/Président. Chaque chauffeur est obligatoirement un employé de l'organisation.
      </p>
      {toast && <Banner>{toast}</Banner>}
      {error && <Banner tone="error">{error}</Banner>}
      {showDriverForm && <NewDriverForm staff={availableStaffForDriver} onCreate={handleCreateDriver} onCancel={() => setShowDriverForm(false)} />}
      {showForm && <NewVehicleForm onCreate={handleCreate} onCancel={() => setShowForm(false)} drivers={drivers} />}

      {dashboard && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <KpiCard label="Parc total" value={dashboard.totalVehicles} accent="#1B2A4A" />
          <KpiCard label="Disponibles" value={dashboard.byStatus.DISPONIBLE ?? 0} accent="#2F855A" />
          <KpiCard label="Hors service" value={dashboard.byStatus.HORS_SERVICE ?? 0} accent="#C53030" />
          <KpiCard label="Coût logistique total" value={fmt(dashboard.totalLogisticsCost)} sub="carburant + maintenance" accent="#E8B564" />
        </div>
      )}

      {alerts.length > 0 && (
        <div className="bg-white border border-[#E4E7EE] rounded-sm mb-6">
          <div className="px-5 py-3 border-b border-[#E4E7EE] flex items-center gap-2 text-sm font-medium text-[#101B33]">
            <Bell size={16} className="text-[#E8B564]" /> Alertes flotte
            <span className="text-xs px-2 py-0.5 rounded-sm bg-[#FDECEC] text-[#9B2C2C]">{alerts.length}</span>
          </div>
          <div className="divide-y divide-[#F0F1F5]">
            {alerts.map((a, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-start gap-3">
                  <AlertTriangle size={15} className={a.urgency === "DEPASSEE" ? "text-[#C53030] mt-0.5" : "text-[#E8B564] mt-0.5"} />
                  <div className="text-sm text-[#101B33]">{a.message}</div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-sm ${URGENCY_STYLE[a.urgency]}`}>{URGENCY_LABEL[a.urgency]}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white border border-[#E4E7EE] rounded-sm divide-y divide-[#F0F1F5]">
        {vehicles.map((v) => {
          const Icon = TYPE_ICON[v.type] || Truck;
          return (
            <button key={v.id} onClick={() => setSelectedId(v.id)} className="w-full flex items-center justify-between px-5 py-3 text-left hover:bg-[#FAFBFC]">
              <div className="flex items-center gap-3">
                <Icon size={18} className="text-[#9AA3B5]" />
                <div>
                  <div className="text-sm text-[#101B33]">{v.brand} {v.model} <span className="text-[#9AA3B5]">· {v.plateNumber}</span></div>
                  <div className="text-xs text-[#9AA3B5] mt-0.5 flex items-center gap-2 flex-wrap">
                    <span>
                      {TYPE_LABEL[v.type]} · {v.type === "ENGIN" && v.engineHours != null
                        ? `${v.engineHours.toLocaleString("fr-FR")} h moteur`
                        : `${v.currentMileage.toLocaleString("fr-FR")} km`}
                    </span>
                    {v.assignedDriver && (
                      <span className={`flex items-center gap-1 ${licenseStatus(v.assignedDriver.licenseExpiryDate).label !== "Valide" ? "text-[#C53030]" : "text-[#1D4E8F]"}`}>
                        <User size={11} /> {v.assignedDriver.staff.fullName}
                        {licenseStatus(v.assignedDriver.licenseExpiryDate).label !== "Valide" && " (permis à surveiller)"}
                      </span>
                    )}
                    {v.assignments?.length > 0 && (
                      <span className="flex items-center gap-1 text-[#2F855A]"><FolderKanban size={11} /> {v.assignments.map((a) => a.project.name).join(", ")}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {v.status === "HORS_SERVICE" && <AlertTriangle size={14} className="text-[#C53030]" />}
                <span className={`text-xs px-2 py-1 rounded-sm ${STATUS_STYLE[v.status]}`}>{v.status}</span>
                <ChevronRight size={16} className="text-[#C9CEDA]" />
              </div>
            </button>
          );
        })}
        {vehicles.length === 0 && <div className="p-5 text-sm text-[#7A8399]">Aucun véhicule enregistré pour l'instant.</div>}
      </div>
    </div>
  );
}
