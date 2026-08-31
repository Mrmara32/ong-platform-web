import React, { useEffect, useState } from "react";
import { Lock, Mail, Eye, EyeOff, Building2, CheckCircle2 } from "lucide-react";
import { getInvitation, acceptInvitation, setAuthToken } from "./lib/api";

const mono = { fontFamily: "'IBM Plex Mono', monospace" };

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

export default function AcceptInviteScreen({ token, onAccepted }) {
  const [invitation, setInvitation] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    getInvitation(token)
      .then(setInvitation)
      .catch((e) => setLoadError(e.message || "Invitation introuvable ou expirée."));
  }, [token]);

  const submit = async (e) => {
    e.preventDefault();
    if (!password || (!invitation?.accountAlreadyExists && !fullName)) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await acceptInvitation(token, { fullName: fullName || undefined, password });
      setAuthToken(result.token);
      onAccepted(result);
    } catch (e) {
      setError(e.message || "Impossible d'accepter cette invitation pour le moment.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F6F9] flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-8 justify-center">
          <div className="w-8 h-8 rounded-sm bg-[#101B33] flex items-center justify-center">
            <Lock size={14} className="text-[#E8B564]" />
          </div>
          <div className="text-[#101B33] font-semibold tracking-wide text-sm uppercase" style={mono}>ONG Club des Amis du Monde (CAM)</div>
        </div>

        <div className="bg-white border border-[#E4E7EE] rounded-md p-6">
          {loadError ? (
            <div className="text-sm text-[#9B2C2C] bg-[#FDECEC] rounded-md px-3 py-2.5">{loadError}</div>
          ) : !invitation ? (
            <div className="text-sm text-[#7A8399]">Chargement de l'invitation…</div>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-1">
                <Building2 size={14} className="text-[#9AA3B5]" />
                <span className="text-xs text-[#7A8399] uppercase tracking-wide">Invitation</span>
              </div>
              <h2 className="text-lg font-semibold text-[#101B33] mb-1">Rejoindre {invitation.organizationName}</h2>
              <p className="text-sm text-[#7A8399] mb-5">
                En tant que <span className="text-[#101B33] font-medium">{ROLE_LABELS[invitation.role]}</span>, avec l'adresse{" "}
                <span className="text-[#101B33] font-medium">{invitation.email}</span>.
              </p>

              <form onSubmit={submit} className="space-y-4">
                {!invitation.accountAlreadyExists && (
                  <div>
                    <label className="text-xs text-[#7A8399] uppercase tracking-wide font-medium">Nom complet</label>
                    <div className="relative mt-1.5">
                      <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B7BFCE]" />
                      <input
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Ton nom complet"
                        className="w-full border border-[#D8DCE6] rounded-md pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2A4A]/20 focus:border-[#1B2A4A]"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-xs text-[#7A8399] uppercase tracking-wide font-medium">
                    {invitation.accountAlreadyExists ? "Mot de passe de ton compte existant" : "Choisis un mot de passe"}
                  </label>
                  <div className="relative mt-1.5">
                    <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B7BFCE]" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={invitation.accountAlreadyExists ? "••••••••" : "8 caractères minimum"}
                      className="w-full border border-[#D8DCE6] rounded-md pl-9 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2A4A]/20 focus:border-[#1B2A4A]"
                    />
                    <button type="button" onClick={() => setShowPassword((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#B7BFCE] hover:text-[#7A8399]" tabIndex={-1}>
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {invitation.accountAlreadyExists && (
                    <div className="text-xs text-[#9AA3B5] mt-1">Tu as déjà un compte sur la plateforme — connecte-toi pour rejoindre cette organisation.</div>
                  )}
                </div>

                {error && <div className="text-xs text-[#9B2C2C] bg-[#FDECEC] rounded-md px-3 py-2.5">{error}</div>}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-[#1B2A4A] text-white text-sm font-medium py-2.5 rounded-md hover:bg-[#233459] disabled:opacity-40"
                >
                  {submitting ? "Validation…" : "Rejoindre l'organisation"}
                </button>
              </form>
            </>
          )}
        </div>

        <div className="mt-5 flex items-center gap-2 text-xs text-[#9AA3B5] justify-center">
          <CheckCircle2 size={13} className="text-[#2F855A]" /> Tes données restent isolées de celles des autres organisations.
        </div>
      </div>
    </div>
  );
}
