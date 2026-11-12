/**
 * DOCTORIA — Administrator Accounts Management
 * STRICT SECURITY RESTRICTION: ONLY CREATE & READ.
 * NO UPDATE. NO DELETE. NO EDIT/DELETE BUTTONS ANYWHERE IN THE UI.
 */

import React, { useState, useEffect } from 'react';
import {
  Shield,
  UserPlus,
  Eye,
  Mail,
  User as UserIcon,
  Phone,
  Building2,
  CheckCircle2,
  AlertCircle,
  X,
  Search,
  Lock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { User, UserRole, Establishment, Laboratory } from '../../types';
import { StorageService, subscribeToStorage } from '../../services/storage';
import { ROLE_LABELS } from '../../constants';

export const AdminAccounts: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [laboratories, setLaboratories] = useState<Laboratory[]>([]);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  // Selected account for READ details
  const [viewingUser, setViewingUser] = useState<User | null>(null);

  // CREATE Account Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('DIRECTEUR_THESE');
  const [phone, setPhone] = useState('');
  const [establishmentId, setEstablishmentId] = useState('');
  const [laboratoryId, setLaboratoryId] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [grade, setGrade] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = () => {
    setUsers(StorageService.getUsers());
    setEstablishments(StorageService.getEstablishments());
    setLaboratories(StorageService.getLaboratories());
  };

  useEffect(() => {
    loadData();
    const unsub = subscribeToStorage(loadData);
    return unsub;
  }, []);

  if (!user) return null;

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password.trim()) {
      setCreateError('Veuillez renseigner tous les champs obligatoires.');
      return;
    }

    if (password.length < 8) {
      setCreateError('Le mot de passe doit comporter au moins 8 caractères.');
      return;
    }

    setIsSubmitting(true);
    try {
      await StorageService.createUser(
        {
          firstName,
          lastName,
          email,
          passwordPlain: password,
          role,
          phone,
          establishmentId: establishmentId || undefined,
          laboratoryId: laboratoryId || undefined,
          specialty: specialty || undefined,
          grade: grade || undefined,
        },
        user
      );

      // Reset
      setFirstName('');
      setLastName('');
      setEmail('');
      setPassword('');
      setPhone('');
      setSpecialty('');
      setGrade('');
      setIsCreateModalOpen(false);
      alert(`Compte ${ROLE_LABELS[role]} créé avec succès pour ${firstName} ${lastName}.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de la création du compte.';
      setCreateError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      searchQuery === '' ||
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === '' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">
            Sécurité & Gestion des Identités
          </span>
          <h2 className="text-xl font-bold text-slate-900 mt-0.5">
            Répertoire des Comptes Professionnels
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Initialisez les comptes des Directeurs de Thèse, Directeurs de Structure et Administrateurs.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setIsCreateModalOpen(true);
            setCreateError(null);
          }}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs transition-colors shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          Créer un nouveau compte
        </button>
      </div>

      {/* Strict Policy Banner */}
      <div className="bg-slate-900 text-white rounded-xl p-4 flex items-start gap-3 shadow-2xs border border-slate-800">
        <Shield className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <p className="font-bold text-slate-100">
            Règle de gouvernance stricte appliquée (CRUD Restreint) :
          </p>
          <p className="text-slate-300 leading-relaxed">
            Seules les opérations de <strong>Création (Create)</strong> et de <strong>Consultation (Read)</strong> sont autorisées sur les comptes. Par mesure d'intégrité académique, aucune modification ou suppression de compte n'est permise dans l'interface ou dans les services métier.
          </p>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par nom, prénom ou e-mail..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
          >
            <option value="">Tous les rôles</option>
            <option value="CANDIDAT">Candidats</option>
            <option value="DIRECTEUR_THESE">Directeurs de Thèse</option>
            <option value="DIRECTEUR_STRUCTURE">Directeurs de Structure</option>
            <option value="ADMINISTRATEUR">Administrateurs</option>
          </select>
        </div>
      </div>

      {/* Accounts List (ONLY READ & DETAILS - NO UPDATE OR DELETE BUTTONS!) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">
            Comptes enregistrés ({filteredUsers.length})
          </h3>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredUsers.map((u) => (
            <div
              key={u.id}
              className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors"
            >
              <div className="flex items-start sm:items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-xs text-slate-700 shrink-0">
                  {u.firstName[0]}
                  {u.lastName[0]}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 truncate">
                      {u.firstName} {u.lastName}
                    </span>
                    <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.2 rounded border border-blue-200">
                      {ROLE_LABELS[u.role]}
                    </span>
                    {u.status === 'ACTIF' ? (
                      <span className="text-[10px] text-emerald-700 font-medium">Actif</span>
                    ) : (
                      <span className="text-[10px] text-rose-700 font-medium">{u.status}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                    <span className="font-mono text-[11px] text-slate-600 truncate">{u.email}</span>
                    <span>·</span>
                    <span className="text-[11px]">
                      Créé le {new Date(u.createdAt).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </div>
              </div>

              {/* ONLY READ / CONSULT ACTION */}
              <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                <button
                  type="button"
                  onClick={() => setViewingUser(u)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5 text-blue-600" />
                  Consulter les détails
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CREATE Account Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-base font-bold text-slate-900">Créer un nouveau compte</h3>
                <p className="text-xs text-slate-500 mt-0.5">Directeur de Thèse, Directeur de Structure ou Administrateur</p>
              </div>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 overflow-y-auto space-y-4">
              {createError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{createError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Rôle institutionnel attribué *
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-semibold focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  <option value="DIRECTEUR_THESE">Directeur de Thèse</option>
                  <option value="DIRECTEUR_STRUCTURE">Directeur de Structure (CED)</option>
                  <option value="ADMINISTRATEUR">Administrateur Système</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Prénom *</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Mohammed"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nom *</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Alami"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Adresse e-mail institutionnelle (Unique) *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nom@doctoria.ac.ma"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Mot de passe temporaire *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 8 caractères"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {role === 'DIRECTEUR_THESE' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Établissement
                      </label>
                      <select
                        value={establishmentId}
                        onChange={(e) => setEstablishmentId(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white"
                      >
                        <option value="">Sélectionner</option>
                        {establishments.map((est) => (
                          <option key={est.id} value={est.id}>
                            {est.code}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Laboratoire
                      </label>
                      <select
                        value={laboratoryId}
                        onChange={(e) => setLaboratoryId(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white"
                      >
                        <option value="">Sélectionner</option>
                        {laboratories.map((lab) => (
                          <option key={lab.id} value={lab.id}>
                            {lab.code}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Grade académique
                    </label>
                    <input
                      type="text"
                      value={grade}
                      onChange={(e) => setGrade(e.target.value)}
                      placeholder="Ex: Professeur de l'Enseignement Supérieur (PES)"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Domaine / Spécialité scientifique
                    </label>
                    <input
                      type="text"
                      value={specialty}
                      onChange={(e) => setSpecialty(e.target.value)}
                      placeholder="Ex: Intelligence Artificielle & Traitement du Signal"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                    />
                  </div>
                </>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-lg shadow-2xs"
                >
                  {isSubmitting ? 'Création en cours...' : 'Créer le compte'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* READ ONLY Details Modal */}
      {viewingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">
                  Fiche Utilisateur (Consultation Seule)
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  {viewingUser.firstName} {viewingUser.lastName}
                </h3>
              </div>
              <button onClick={() => setViewingUser(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div className="flex justify-between">
                <span className="text-slate-500">Identifiant système :</span>
                <strong className="font-mono text-slate-800">{viewingUser.id}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Adresse e-mail :</span>
                <strong className="text-slate-800">{viewingUser.email}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Rôle :</span>
                <strong className="text-blue-700">{ROLE_LABELS[viewingUser.role]}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">État du compte :</span>
                <strong className="text-emerald-700">{viewingUser.status}</strong>
              </div>
              {viewingUser.grade && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Grade :</span>
                  <strong className="text-slate-800">{viewingUser.grade}</strong>
                </div>
              )}
              {viewingUser.specialty && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Spécialité :</span>
                  <strong className="text-slate-800">{viewingUser.specialty}</strong>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">Date de création :</span>
                <strong className="text-slate-800">
                  {new Date(viewingUser.createdAt).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })}
                </strong>
              </div>
            </div>

            <div className="p-3 bg-slate-100 rounded-lg text-[11px] text-slate-600 leading-snug">
              Conformément à la politique de restriction, les boutons de modification et de suppression ne sont pas disponibles.
            </div>

            <div className="text-right pt-2">
              <button
                type="button"
                onClick={() => setViewingUser(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
