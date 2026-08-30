import React, { useCallback, useEffect, useState } from "react";
import { Users, Mail, Plus, X, Shield } from "lucide-react";
import { listMembers, listPendingInvitations, inviteMember, revokeInvitation, updateMemberRole, removeMember } from "./lib/api";
import { Banner } from "./shared.jsx";

const ROLE_LABELS = {
  ADMIN: "Admin / Président",
  CHEF_PROJET: "Chef de projet",
  COMPTABLE: "Comptable",
  LOGISTICIEN: "Logisticien",
  RH: "RH",
  MEMBRE: "Membre d'équipe",
  PARTENAIRE_EXTERNE: "Partenaire externe",
  BAILLEUR_LECTURE: "Bailleur (lecture)",
};
const ROLE_OPTIONS = Object.entries(ROLE_LABELS);

function InviteForm({ onInvite, onCancel }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("MEMBRE");

  return (
    <div className="bg-white border border-[#E4E7EE] rounded-sm p-5 space-y-3 mb-6 max-w-lg">
      <div className="text-sm font-medium text-[#101B33]">Inviter un collaborateur</div>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="email@collaborateur.org"
        className="w-full border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm"
      />
      <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full border border-[#D8DCE6] rounded-sm px-3 py-2 text-sm">
        {ROLE_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select>
      <div className="flex gap-2">
        <button onClick={() => email && onInvite({ email, role })} className="text-xs px-3 py-1.5 bg-[#1B2A4A] text-white rounded-sm hover:bg-[#233459]">
          Envoyer l'invitation
        </button>
        <button onClick={onCancel} className="text-xs px-3 py-1.5 text-[#7A8399]">Annuler</button>
      </div>
    </div>
  );
}

export default function TeamView({ currentUserId }) {
  const [members, setMembers] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState(null);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setMembers(await listMembers());
    try {
      setInvitations(await listPendingInvitations());
    } catch {
      setInvitations([]); // non-Admin : pas d'accès à la liste des invitations, ce n'est pas bloquant
    }
  }, []);
  useEffect(() => { refresh(); }, [refresh]);

  const handleInvite = async ({ email, role }) => {
    try {
      const result = await inviteMember({ email, role });
      setShowForm(false);
      await refresh();
      setToast(
        result.simulated
          ? `Invitation créée pour ${email} — lien : ${result.acceptUrl} (envoi email simulé, SMTP non configuré).`
          : `Invitation envoyée à ${email}.`
      );
    } catch (e) {
      setError(e.message);
    }
  };

  const handleRevoke = async (id) => {
    try {
      await revokeInvitation(id);
      await refresh();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleRoleChange = async (userId, role) => {
    try {
      await updateMemberRole(userId, role);
      await refresh();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleRemove = async (userId, fullName) => {
    try {
      await removeMember(userId);
      await refresh();
      setToast(`${fullName} a été retiré(e) de l'organisation.`);
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl text-[#101B33] font-semibold">Équipe</h1>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 bg-[#1B2A4A] text-white text-sm px-3.5 py-2 rounded-sm hover:bg-[#233459]">
            <Plus size={15} /> Inviter un collaborateur
          </button>
        )}
      </div>
      {toast && <Banner>{toast}</Banner>}
      {error && <Banner tone="error">{error}</Banner>}
      {showForm && <InviteForm onInvite={handleInvite} onCancel={() => setShowForm(false)} />}

      <div className="bg-white border border-[#E4E7EE] rounded-sm mb-6">
        <div className="px-5 py-3 border-b border-[#E4E7EE] text-sm font-medium text-[#101B33]">Membres actuels</div>
        <div className="divide-y divide-[#F0F1F5]">
          {members.map((m) => (
            <div key={m.id} className="flex items-center justify-between px-5 py-3">
              <div className="flex items-center gap-3">
                <Users size={16} className="text-[#9AA3B5]" />
                <div>
                  <div className="text-sm text-[#101B33]">
                    {m.user.fullName}
                    {m.user.id === currentUserId && <span className="text-xs text-[#9AA3B5]"> · toi</span>}
                  </div>
                  <div className="text-xs text-[#9AA3B5] mt-0.5">{m.user.email}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={m.role}
                  onChange={(e) => handleRoleChange(m.user.id, e.target.value)}
                  className="text-xs border border-[#D8DCE6] rounded-sm px-2 py-1.5"
                >
                  {ROLE_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
                {m.user.id !== currentUserId && (
                  <button onClick={() => handleRemove(m.user.id, m.user.fullName)} className="text-[#B7BFCE] hover:text-[#9B2C2C]" title="Retirer de l'organisation">
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {invitations.length > 0 && (
        <div className="bg-white border border-[#E4E7EE] rounded-sm">
          <div className="px-5 py-3 border-b border-[#E4E7EE] flex items-center gap-2 text-sm font-medium text-[#101B33]">
            <Mail size={15} className="text-[#9AA3B5]" /> Invitations en attente
          </div>
          <div className="divide-y divide-[#F0F1F5]">
            {invitations.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <div className="text-sm text-[#101B33]">{inv.email}</div>
                  <div className="text-xs text-[#9AA3B5] mt-0.5 flex items-center gap-1">
                    <Shield size={11} /> {ROLE_LABELS[inv.role]}
                  </div>
                </div>
                <button onClick={() => handleRevoke(inv.id)} className="flex items-center gap-1 text-xs px-2.5 py-1.5 text-[#9B2C2C] hover:bg-[#FDECEC] rounded-sm">
                  <X size={12} /> Révoquer
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
