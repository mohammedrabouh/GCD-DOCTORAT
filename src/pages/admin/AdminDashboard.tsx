/**
 * DOCTORIA — System Administrator Dashboard (Administrateur)
 * Global statistics across accounts, campaigns, thesis subjects, candidatures,
 * registrations, and activity logs.
 */

import React, { useState, useEffect } from 'react';
import {
  Shield,
  Users,
  BookOpen,
  FileText,
  Calendar,
  Layers,
  Building2,
  RefreshCw,
  Clock,
  ArrowRight,
  ScanText,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { StorageService, subscribeToStorage } from '../../services/storage';
import { User, ThesisSubject, Candidature, DoctoralCampaign, AuditLog } from '../../types';

interface AdminDashboardProps {
  onNavigateTab: (tab: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigateTab }) => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [subjects, setSubjects] = useState<ThesisSubject[]>([]);
  const [candidatures, setCandidatures] = useState<Candidature[]>([]);
  const [campaigns, setCampaigns] = useState<DoctoralCampaign[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  const loadData = () => {
    setUsers(StorageService.getUsers());
    setSubjects(StorageService.getSubjects());
    setCandidatures(StorageService.getCandidatures());
    setCampaigns(StorageService.getCampaigns());
    setAuditLogs(StorageService.getAuditLogs());
  };

  useEffect(() => {
    loadData();
    const unsub = subscribeToStorage(loadData);
    return unsub;
  }, []);

  if (!user) return null;

  const candidatesCount = users.filter((u) => u.role === 'CANDIDAT').length;
  const supervisorsCount = users.filter((u) => u.role === 'DIRECTEUR_THESE').length;
  const structureDirectorsCount = users.filter((u) => u.role === 'DIRECTEUR_STRUCTURE').length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">
            Supervision du Système d'Information
          </span>
          <h2 className="text-xl font-bold text-slate-900 mt-0.5">
            Administration Centrale DOCTORIA
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Gestion des accès sécurisés, paramétrage des campagnes doctorales, cartographie des structures et audit d'activité.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigateTab('admin-comptes')}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs transition-colors shrink-0"
        >
          <Shield className="w-4 h-4" />
          Créer un compte professionnel
        </button>
      </div>

      {/* Global KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <span className="text-xs text-slate-500 font-medium block">Comptes utilisateurs</span>
          <span className="text-2xl font-bold text-slate-900 tabular-nums mt-1 block">
            {users.length}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {candidatesCount} candidats · {supervisorsCount} DT · {structureDirectorsCount} DS
          </span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <span className="text-xs text-slate-500 font-medium block">Sujets de thèse</span>
          <span className="text-2xl font-bold text-blue-600 tabular-nums mt-1 block">
            {subjects.length}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {subjects.filter((s) => s.status === 'PUBLIE').length} publiés au catalogue
          </span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <span className="text-xs text-slate-500 font-medium block">Dossiers de candidature</span>
          <span className="text-2xl font-bold text-teal-600 tabular-nums mt-1 block">
            {candidatures.length}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {candidatures.filter((c) => c.status === 'ADMISE').length} admissions confirmées
          </span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <span className="text-xs text-slate-500 font-medium block">Événements audités</span>
          <span className="text-2xl font-bold text-slate-700 tabular-nums mt-1 block font-mono">
            {auditLogs.length}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">Journalisation immuable</span>
        </div>
      </div>

      {/* Management Grid Shortcuts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
        <div
          onClick={() => onNavigateTab('admin-comptes')}
          className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs hover:border-blue-400 cursor-pointer transition-all"
        >
          <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
            <Users className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-slate-900">Gestion des Comptes</h4>
          <p className="text-xs text-slate-500 mt-1 leading-snug">
            Création et consultation des comptes DT, DS et Administrateurs (CRUD restreint).
          </p>
        </div>

        <div
          onClick={() => onNavigateTab('admin-campagnes')}
          className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs hover:border-blue-400 cursor-pointer transition-all"
        >
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
            <Calendar className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-slate-900">Campagnes Doctorales</h4>
          <p className="text-xs text-slate-500 mt-1 leading-snug">
            Ouverture/clôture des dépôts, paramétrage des dates et délais légaux.
          </p>
        </div>

        <div
          onClick={() => onNavigateTab('admin-structures')}
          className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs hover:border-blue-400 cursor-pointer transition-all"
        >
          <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
            <Building2 className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-slate-900">Établissements & Labos</h4>
          <p className="text-xs text-slate-500 mt-1 leading-snug">
            Structures universitaires, pôles de recherche et laboratoires d'accueil.
          </p>
        </div>

        <div
          onClick={() => onNavigateTab('admin-ocr')}
          className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs hover:border-blue-400 cursor-pointer transition-all"
        >
          <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
            <ScanText className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-slate-900">Vérification OCR</h4>
          <p className="text-xs text-slate-500 mt-1 leading-snug">
            Consultation des originaux, correction du texte extrait et validation humaine.
          </p>
        </div>

        <div
          onClick={() => onNavigateTab('admin-audit')}
          className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs hover:border-blue-400 cursor-pointer transition-all"
        >
          <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
            <Layers className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-slate-900">Journaux de Sécurité</h4>
          <p className="text-xs text-slate-500 mt-1 leading-snug">
            Traçabilité des connexions, décisions scientifiques et validations administratives.
          </p>
        </div>
      </div>

      {/* Recent System Activity Preview */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-900">Dernières opérations enregistrées</h3>
          <button
            type="button"
            onClick={() => onNavigateTab('admin-audit')}
            className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
          >
            Consulter le journal complet ({auditLogs.length}) →
          </button>
        </div>

        <div className="divide-y divide-slate-100 font-mono text-xs">
          {auditLogs.slice(0, 5).map((log) => (
            <div key={log.id} className="py-2.5 flex items-center justify-between gap-3 text-slate-600">
              <div className="truncate">
                <span className="font-bold text-slate-900">{log.action}</span>
                <span className="text-slate-400 mx-2">·</span>
                <span className="text-slate-700">{log.details}</span>
              </div>
              <span className="text-[11px] text-slate-400 shrink-0">
                {new Date(log.timestamp).toLocaleTimeString('fr-FR')}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
