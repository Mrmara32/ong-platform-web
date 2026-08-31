const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

let authToken = localStorage.getItem("ong_token") || null;

export function setAuthToken(token) {
  authToken = token;
  if (token) localStorage.setItem("ong_token", token);
  else localStorage.removeItem("ong_token");
}

export function getAuthToken() {
  return authToken;
}

/**
 * Transforme une erreur brute de l'API (souvent un objet Zod flatten(), ex.
 * {"formErrors":[],"fieldErrors":{"totalBudget":["Number must be greater than 0"]}})
 * en un message lisible pour l'utilisateur, plutôt que d'afficher du JSON
 * brut à l'écran. Corrige un défaut présent sur tous les formulaires de
 * l'application, pas seulement celui où il a été repéré.
 */
function formatApiError(error) {
  if (!error) return "Erreur inconnue";
  if (typeof error === "string") return error;
  if (typeof error === "object") {
    if (Array.isArray(error.formErrors) || error.fieldErrors) {
      const fieldMessages = Object.entries(error.fieldErrors || {}).flatMap(([field, msgs]) =>
        (msgs || []).map((m) => `${field} : ${m}`)
      );
      const all = [...(error.formErrors || []), ...fieldMessages];
      if (all.length > 0) return all.join(" — ");
    }
    try {
      return JSON.stringify(error);
    } catch {
      return "Erreur inconnue";
    }
  }
  return String(error);
}

/**
 * Exécute un fetch en transformant toute erreur réseau brute (ex. "Load
 * failed" sur Safari iOS, "Failed to fetch" sur Chrome — coupure de
 * connexion, changement de wifi/4G en cours de requête) en un message
 * clair en français, plutôt que de laisser remonter le texte natif du
 * navigateur tel quel jusqu'à l'écran.
 */
async function safeFetch(url, options) {
  try {
    return await fetch(url, options);
  } catch {
    throw new Error("Connexion au serveur impossible — vérifie ta connexion internet et réessaie.");
  }
}

async function request(path, { method = "GET", body } = {}) {
  const res = await safeFetch(`${API_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return null;

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.error ? formatApiError(data.error) : `Erreur ${res.status}`);
  }
  return data;
}

/**
 * Télécharge un fichier binaire (PDF/Word/Excel) généré par /api/export/...
 * et déclenche le téléchargement navigateur, en conservant le nom de fichier
 * renvoyé par l'en-tête Content-Disposition du serveur quand disponible.
 */
async function downloadFile(path, fallbackName) {
  const res = await safeFetch(`${API_BASE}${path}`, {
    headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error ? formatApiError(data.error) : `Erreur ${res.status}`);
  }
  const disposition = res.headers.get("Content-Disposition") || "";
  const match = disposition.match(/filename="(.+)"/);
  const filename = match ? match[1] : fallbackName;

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Variante POST de downloadFile — pour les documents composés à partir de texte saisi (ex. rapport bailleur avec narratif). */
async function downloadFilePost(path, body, fallbackName) {
  const res = await safeFetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error ? formatApiError(data.error) : `Erreur ${res.status}`);
  }
  const disposition = res.headers.get("Content-Disposition") || "";
  const match = disposition.match(/filename="(.+)"/);
  const filename = match ? match[1] : fallbackName;

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/**
 * Ouvre un PDF dans un nouvel onglet pour impression directe (Ctrl+P dans le
 * visualiseur natif du navigateur), sans téléchargement préalable. Répond à
 * l'exigence "pouvoir imprimer tout document produit dans l'application".
 */
async function printFile(path) {
  const separator = path.includes("?") ? "&" : "?";
  const res = await safeFetch(`${API_BASE}${path}${separator}print=1`, {
    headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error ? formatApiError(data.error) : `Erreur ${res.status}`);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

// -------- Auth --------
export const login = (email, password, organizationId) =>
  request("/auth/login", { method: "POST", body: { email, password, organizationId } });
export const register = (payload) => request("/auth/register", { method: "POST", body: payload });
export const getInvitation = (token) => request(`/auth/invitations/${token}`);
export const acceptInvitation = (token, payload) => request(`/auth/invitations/${token}/accept`, { method: "POST", body: payload });

// -------- Équipe / Membres --------
export const listMembers = () => request("/members");
export const listPendingInvitations = () => request("/members/invitations");
export const inviteMember = (payload) => request("/members/invite", { method: "POST", body: payload });
export const revokeInvitation = (id) => request(`/members/invitations/${id}`, { method: "DELETE" });
export const updateMemberRole = (userId, role) => request(`/members/${userId}/role`, { method: "PATCH", body: { role } });
export const removeMember = (userId) => request(`/members/${userId}`, { method: "DELETE" });

// -------- Organisation --------
export const getMyOrganization = () => request("/organizations/me");
export const updateMyOrganization = (payload) => request("/organizations/me", { method: "PATCH", body: payload });

// -------- Projets --------
export const listProjects = () => request("/projects");
export const getProject = (id) => request(`/projects/${id}`);
export const createProject = (payload) => request("/projects", { method: "POST", body: payload });

// Activités filtrées par la portée d'accès de l'utilisateur (COMPLET vs PERSONNEL,
// cf. §2.1.1 du cahier des charges) — la réponse inclut { scope, activities }.
export const listActivities = (projectId) => request(`/projects/${projectId}/activities`);
export const createActivity = (projectId, payload) => request(`/projects/${projectId}/activities`, { method: "POST", body: payload });
export const addProjectMember = (projectId, payload) => request(`/projects/${projectId}/members`, { method: "POST", body: payload });
export const listProjectMembers = (projectId) => request(`/projects/${projectId}/members`);
export const removeProjectMember = (projectId, userId) => request(`/projects/${projectId}/members/${userId}`, { method: "DELETE" });

// -------- Finance --------
export const listBudgetLines = (projectId) => request(`/finance/projects/${projectId}/budget-lines`);
export const getBudgetLineAvailability = (id) => request(`/finance/budget-lines/${id}/availability`);
export const createExpense = (payload) => request("/finance/expenses", { method: "POST", body: payload });
export const createDisbursement = (payload) => request("/finance/disbursements", { method: "POST", body: payload });
export const getJournal = (projectId) => request(`/finance/journal${projectId ? `?projectId=${projectId}` : ""}`);

// -------- Logistique --------
export const listSuppliers = () => request("/logistics/suppliers");
export const createSupplier = (payload) => request("/logistics/suppliers", { method: "POST", body: payload });
export const listPurchaseOrders = () => request("/logistics/purchase-orders");
export const createPurchaseOrder = (payload) => request("/logistics/purchase-orders", { method: "POST", body: payload });
export const validatePurchaseOrder = (id) => request(`/logistics/purchase-orders/${id}/validate`, { method: "POST" });
export const rejectPurchaseOrder = (id, reason) => request(`/logistics/purchase-orders/${id}/reject`, { method: "POST", body: { reason } });
export const deliverPurchaseOrder = (id, deliveryNoteRef) => request(`/logistics/purchase-orders/${id}/deliver`, { method: "POST", body: { deliveryNoteRef } });
export const registerSupplierInvoice = (id, payload) => request(`/logistics/purchase-orders/${id}/supplier-invoice`, { method: "POST", body: payload });
export const listStockItems = () => request("/logistics/stock-items");

// -------- Rapport de stock --------
export const getStockReport = (stockItemId) => request(`/logistics/stock-report${stockItemId ? `?stockItemId=${stockItemId}` : ""}`);

// -------- Demandes de consommables --------
export const listConsumableRequests = () => request("/logistics/consumable-requests");
export const createConsumableRequest = (payload) => request("/logistics/consumable-requests", { method: "POST", body: payload });
export const decideConsumableRequest = (id, payload) => request(`/logistics/consumable-requests/${id}`, { method: "PATCH", body: payload });

// -------- Congés (RH) --------
export const listLeaveRequests = () => request("/hr/leave-requests");
export const createLeaveRequest = (payload) => request("/hr/leave-requests", { method: "POST", body: payload });
export const decideLeaveRequest = (id, status) => request(`/hr/leave-requests/${id}`, { method: "PATCH", body: { status } });

// -------- Écriture comptable manuelle --------
export const postManualEntry = (payload) => request("/finance/journal/manual", { method: "POST", body: payload });

// -------- Rapprochement bancaire --------
export const listBankStatementLines = () => request("/finance/bank-statement-lines");
export const createBankStatementLine = (payload) => request("/finance/bank-statement-lines", { method: "POST", body: payload });
export const listUnreconciledEntries = () => request("/finance/journal/unreconciled");
export const matchBankStatementLine = (lineId, journalEntryId) => request(`/finance/bank-statement-lines/${lineId}/match`, { method: "POST", body: { journalEntryId } });

// -------- États financiers --------
export const getBalance = (asOfDate) => request(`/financial-statements/balance${asOfDate ? `?asOfDate=${asOfDate}` : ""}`);
export const getBilan = (asOfDate) => request(`/financial-statements/bilan${asOfDate ? `?asOfDate=${asOfDate}` : ""}`);
export const getCompteResultat = (startDate, endDate) => {
  const params = new URLSearchParams();
  if (startDate) params.set("startDate", startDate);
  if (endDate) params.set("endDate", endDate);
  return request(`/financial-statements/compte-resultat${params.toString() ? `?${params}` : ""}`);
};
export const getFluxTresorerie = (startDate, endDate) => {
  const params = new URLSearchParams();
  if (startDate) params.set("startDate", startDate);
  if (endDate) params.set("endDate", endDate);
  return request(`/financial-statements/flux-tresorerie${params.toString() ? `?${params}` : ""}`);
};
export const createStockItem = (payload) => request("/logistics/stock-items", { method: "POST", body: payload });
export const createStockMovement = (payload) => request("/logistics/stock-movements", { method: "POST", body: payload });
export const listWarehouses = () => request("/logistics/warehouses");
export const createWarehouse = (payload) => request("/logistics/warehouses", { method: "POST", body: payload });

// -------- Flotte (véhicules, motos, engins) — module réservé Admin/Logisticien --------
export const getFleetDashboard = () => request("/fleet/dashboard");
export const listVehicles = (type) => request(`/fleet/vehicles${type ? `?type=${type}` : ""}`);
export const getVehicle = (id) => request(`/fleet/vehicles/${id}`); // renvoie { vehicle, history }
export const createVehicle = (payload) => request("/fleet/vehicles", { method: "POST", body: payload });
export const updateVehicle = (id, payload) => request(`/fleet/vehicles/${id}`, { method: "PATCH", body: payload });
export const listDrivers = () => request("/fleet/drivers");
export const getDriver = (id) => request(`/fleet/drivers/${id}`);
export const createDriver = (payload) => request("/fleet/drivers", { method: "POST", body: payload });
export const updateDriver = (id, payload) => request(`/fleet/drivers/${id}`, { method: "PATCH", body: payload });
export const removeDriver = (id) => request(`/fleet/drivers/${id}`, { method: "DELETE" });
export const listTrips = (vehicleId) => request(`/fleet/trips${vehicleId ? `?vehicleId=${vehicleId}` : ""}`);
export const createTrip = (payload) => request("/fleet/trips", { method: "POST", body: payload });
export const closeTrip = (id, endMileage) => request(`/fleet/trips/${id}/close`, { method: "PATCH", body: { endMileage } });
export const listFuelLogs = (vehicleId) => request(`/fleet/fuel-logs${vehicleId ? `?vehicleId=${vehicleId}` : ""}`);
export const createFuelLog = (payload) => request("/fleet/fuel-logs", { method: "POST", body: payload });
export const listMaintenances = (vehicleId) => request(`/fleet/maintenances${vehicleId ? `?vehicleId=${vehicleId}` : ""}`);
export const createMaintenance = (payload) => request("/fleet/maintenances", { method: "POST", body: payload });
export const listFleetAlerts = () => request("/fleet/alerts");
export const assignVehicleToProject = (vehicleId, payload) => request(`/fleet/vehicles/${vehicleId}/assignments`, { method: "POST", body: payload });
export const unassignVehicleFromProject = (vehicleId, projectId) => request(`/fleet/vehicles/${vehicleId}/assignments/${projectId}`, { method: "DELETE" });
export const reportVehicleBreakdown = (vehicleId, description) => request(`/fleet/vehicles/${vehicleId}/report-breakdown`, { method: "POST", body: { description } });
export const getFuelConsumption = (vehicleId) => request(`/fleet/vehicles/${vehicleId}/fuel-consumption`);

// -------- RH --------
export const listStaff = () => request("/hr/staff");
export const createStaff = (payload) => request("/hr/staff", { method: "POST", body: payload });
export const createAssignment = (payload) => request("/hr/assignments", { method: "POST", body: payload });
export const getStaffingCost = (projectId) => request(`/hr/projects/${projectId}/staffing-cost`);

// -------- Documents --------
export const listDocuments = () => request("/documents");
export const createDocument = (payload) => request("/documents", { method: "POST", body: payload });
export const shareDocument = (id, partnerOrganizationId) =>
  request(`/documents/${id}/share`, { method: "POST", body: { partnerOrganizationId } });
export const unshareDocument = (id, partnerOrganizationId) =>
  request(`/documents/${id}/share/${partnerOrganizationId}`, { method: "DELETE" });
export const listSharedWithUs = () => request("/documents/shared-with-us");

// -------- Facturation --------
export const listInvoices = () => request("/invoices");
export const createInvoice = (payload) => request("/invoices", { method: "POST", body: payload });
export const sendInvoice = (id) => request(`/invoices/${id}/send`, { method: "POST" });
export const recordInvoicePayment = (id, payload) => request(`/invoices/${id}/payments`, { method: "POST", body: payload });

// -------- Paie --------
export const listPayslips = (staffId) => request(`/payroll/payslips${staffId ? `?staffId=${staffId}` : ""}`);
export const createPayslip = (payload) => request("/payroll/payslips", { method: "POST", body: payload });
export const payPayslip = (id, payload) => request(`/payroll/payslips/${id}/pay`, { method: "POST", body: payload });
export const sharePayslip = (id, channel) => request(`/payroll/payslips/${id}/share`, { method: "POST", body: { channel } });

// -------- Paiement fournisseur --------
export const paySupplier = (payload) => request("/logistics/supplier-payments", { method: "POST", body: payload });

// -------- Équipements (matériel divers) et alertes de maintenance --------
export const listAssets = () => request("/logistics/assets");
export const createAsset = (payload) => request("/logistics/assets", { method: "POST", body: payload });
export const createAssetMaintenance = (assetId, payload) => request(`/logistics/assets/${assetId}/maintenances`, { method: "POST", body: payload });
export const listAlerts = () => request("/logistics/alerts");
export const listNotifications = () => request("/logistics/notifications");
export const acknowledgeNotification = (id) => request(`/logistics/notifications/${id}/acknowledge`, { method: "PATCH" });
export const notifyLogisticsOfficers = () => request("/logistics/alerts/notify", { method: "POST" });

// -------- Export (PDF / Word / Excel) --------
export const exportDocumentPdf = (id, title) => downloadFile(`/export/documents/${id}/pdf`, `${title || "document"}.pdf`);
export const printDocumentPdf = (id) => printFile(`/export/documents/${id}/pdf`);
export const exportDocumentDocx = (id, title) => downloadFile(`/export/documents/${id}/docx`, `${title || "document"}.docx`);
export const exportBudgetXlsx = (projectId, code) => downloadFile(`/export/projects/${projectId}/budget/xlsx`, `budget-${code || projectId}.xlsx`);
export const exportJournalXlsx = (projectId) => downloadFile(`/export/journal/xlsx${projectId ? `?projectId=${projectId}` : ""}`, "journal-comptable.xlsx");
export const exportInvoicePdf = (id, number) => downloadFile(`/export/invoices/${id}/pdf`, `${number || "facture"}.pdf`);
export const printInvoicePdf = (id) => printFile(`/export/invoices/${id}/pdf`);
export const exportPurchaseOrderPdf = (id) => downloadFile(`/export/purchase-orders/${id}/pdf`, `bon-de-commande.pdf`);
export const printPurchaseOrderPdf = (id) => printFile(`/export/purchase-orders/${id}/pdf`);
export const exportPayslipPdf = (id, name) => downloadFile(`/export/payslips/${id}/pdf`, `bulletin-${name || id}.pdf`);
export const printPayslipPdf = (id) => printFile(`/export/payslips/${id}/pdf`);
export const exportVehiclesXlsx = () => downloadFile("/export/vehicles/xlsx", "parc-vehicules.xlsx");

// -------- Demandes de paiement --------
export const listPaymentRequests = (projectId) => request(`/payment-requests${projectId ? `?projectId=${projectId}` : ""}`);
export const createPaymentRequest = (payload) => request("/payment-requests", { method: "POST", body: payload });
export const decidePaymentRequest = (id, status) => request(`/payment-requests/${id}`, { method: "PATCH", body: { status } });
export const exportPaymentRequestPdf = (id, repere) => downloadFile(`/export/payment-requests/${id}/pdf`, `demande-paiement-repere-${repere}.pdf`);
export const printPaymentRequestPdf = (id) => printFile(`/export/payment-requests/${id}/pdf`);

// -------- Lettres de transmission --------
export const listLetterTemplates = () => request("/letters/templates");
export const createLetterTemplate = (payload) => request("/letters/templates", { method: "POST", body: payload });
export const deleteLetterTemplate = (id) => request(`/letters/templates/${id}`, { method: "DELETE" });
export const listLetters = () => request("/letters");
export const createLetter = (payload) => request("/letters", { method: "POST", body: payload });
export const exportLetterPdf = (id, reference) => downloadFile(`/export/letters/${id}/pdf`, `${reference || "lettre"}.pdf`);
export const printLetterPdf = (id) => printFile(`/export/letters/${id}/pdf`);

// -------- Comptes utilisateurs (création directe par l'Admin) --------
export const createUserAccount = (payload) => request("/members/create-account", { method: "POST", body: payload });

// -------- Journal d'audit --------
export const listAuditLog = () => request("/members/audit-log");

// -------- Comptes bancaires (multi-comptes, multi-banques) --------
export const listBankAccounts = () => request("/organizations/bank-accounts");
export const createBankAccount = (payload) => request("/organizations/bank-accounts", { method: "POST", body: payload });
export const deleteBankAccount = (id) => request(`/organizations/bank-accounts/${id}`, { method: "DELETE" });

// -------- Cadre logique (S&E) --------
export const createLogframeIndicator = (projectId, payload) => request(`/projects/${projectId}/logframe`, { method: "POST", body: payload });
export const updateLogframeIndicator = (id, payload) => request(`/projects/logframe/${id}`, { method: "PATCH", body: payload });
export const deleteLogframeIndicator = (id) => request(`/projects/logframe/${id}`, { method: "DELETE" });

// -------- Collecte de données terrain --------
export const listActivityUpdates = (activityId) => request(`/projects/activities/${activityId}/updates`);
export const createActivityUpdate = (activityId, payload) => request(`/projects/activities/${activityId}/updates`, { method: "POST", body: payload });

// -------- Tableau de bord d'impact --------
export const getImpactDashboard = (projectId) => request(`/projects/${projectId}/impact-dashboard`);

// -------- Bailleurs et affectations financières --------
export const listDonors = () => request("/organizations/donors");
export const createDonor = (payload) => request("/organizations/donors", { method: "POST", body: payload });
export const listDonorAllocations = (projectId) => request(`/projects/${projectId}/donor-allocations`);
export const createDonorAllocation = (projectId, payload) => request(`/projects/${projectId}/donor-allocations`, { method: "POST", body: payload });
export const deleteDonorAllocation = (id) => request(`/projects/donor-allocations/${id}`, { method: "DELETE" });
export const linkBudgetLineToDonor = (budgetLineId, donorAllocationId) => request(`/projects/budget-lines/${budgetLineId}/donor-allocation`, { method: "PATCH", body: { donorAllocationId } });
export const getDonorReport = (projectId) => request(`/projects/${projectId}/donor-report`);

// -------- Rapport bailleur (UE / ONU / USAID) --------
export const exportDonorReportPdf = (projectId, payload) => downloadFilePost(`/export/projects/${projectId}/donor-report-pdf`, payload, "rapport-bailleur.pdf");
