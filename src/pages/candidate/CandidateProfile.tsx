/**
 * DOCTORIA — Candidate Profile & Personal Details
 */

import React, { useState } from 'react';
import { User, Phone, Mail, CreditCard, Hash, CheckCircle2, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ROLE_LABELS } from '../../constants';

export const CandidateProfile: React.FC = () => {
  const { user } = useAuth();
  const [phone, setPhone] = useState(user?.phone || '');
  const [cin, setCin] = useState(user?.cin || '');
  const [cne, setCne] = useState(user?.cne || '');
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!user) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    // In this local architecture, user profile updates persist in session and localStorage
    const raw = localStorage.getItem('doctoria_users_v1');
    if (raw) {
      const users = JSON.parse(raw);
      const idx = users.findIndex((u: { id: string }) => u.id === user.id);
      if (idx >= 0) {
        users[idx].phone = phone;
        users[idx].cin = cin;
        users[idx].cne = cne;
        localStorage.setItem('doctoria_users_v1', JSON.stringify(users));
      }
    }
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs">
        <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">
          Compte et Informations Personnelles
        </span>
        <h2 className="text-xl font-bold text-slate-900 mt-0.5">
          Mon Profil Candidat
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Vérifiez vos coordonnées administratives utilisées pour l'édition de vos attestations et convocations.
        </p>
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
        {savedSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-lg flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Coordonnées mises à jour avec succès.
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Prénom</label>
            <input
              type="text"
              disabled
              value={user.firstName}
              className="w-full px-3 py-2 text-xs bg-slate-100 border border-slate-200 rounded-lg text-slate-600 cursor-not-allowed font-medium"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nom de famille</label>
            <input
              type="text"
              disabled
              value={user.lastName}
              className="w-full px-3 py-2 text-xs bg-slate-100 border border-slate-200 rounded-lg text-slate-600 cursor-not-allowed font-medium"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Adresse e-mail institutionnelle</label>
          <div className="relative">
            <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="email"
              disabled
              value={user.email}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-100 border border-slate-200 rounded-lg text-slate-600 cursor-not-allowed font-medium"
            />
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">L'identifiant e-mail ne peut pas être modifié après création du compte.</span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">CIN / Passeport *</label>
            <div className="relative">
              <CreditCard className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                required
                value={cin}
                onChange={(e) => setCin(e.target.value.toUpperCase())}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono uppercase focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Code Massar / CNE</label>
            <div className="relative">
              <Hash className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={cne}
                onChange={(e) => setCne(e.target.value.toUpperCase())}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono uppercase focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Numéro de téléphone mobile</label>
          <div className="relative">
            <Phone className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-500 flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-slate-400" /> Rôle : {ROLE_LABELS[user.role]}
          </span>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors"
          >
            Enregistrer les modifications
          </button>
        </div>
      </form>
    </div>
  );
};
