/**
 * DOCTORIA — Thesis Supervisor Dashboard (Directeur de Thèse)
 * High-density statistics, pending dossiers to review, and quick scientific actions.
 */

import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Award,
  ArrowRight,
  Plus,
  AlertCircle,
  Building2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ThesisSubject, Candidature, ReinscriptionRequest } from '../../types';
import { StorageService, subscribeToStorage } from '../../services/storage';
import { CANDIDATURE_STATUS_CONFIG } from '../../constants';

interface SupervisorDashboardProps {
  onNavigateTab: (tab: string) => void;
}

export const SupervisorDashboard: React.FC<SupervisorDashboardProps> = ({ onNavigateTab }) => {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<ThesisSubject[]>([]);
  const [candidatures, setCandidatures] = useState<Candidature[]>([]);
  const [reinscriptions, setReinscriptions] = useState<ReinscriptionRequest[]>([]);

  const loadData = () => {
    if (!user) return;
    const allSubjects = StorageService.getSubjects().filter((s) => s.supervisorId === user.id);
    setSubjects(allSubjects);
    setCandidatures(StorageService.getCandidaturesForSupervisor(user.id));
    setReinscriptions(StorageService.getReinscriptionsForSupervisor(user.id));
  };

  useEffect(() => {
    loadData();
    const unsub = subscribeToStorage(loadData);
    return unsub;
  }, [user]);

  if (!user) return null;

  // Metrics
  const pendingDossiers = candidatures.filter(
    (c) => c.status === 'SOUMISE' || c.status === 'EN_COURS_EXAMEN'
  );
  const acceptedCandidatures = candidatures.filter(
    (c) =>
      c.status === 'ACCEPTEE_DIRECTEUR_THESE' ||
      c.status === 'EN_ATTENTE_DECISION_ADMINISTRATIVE' ||
      c.status === 'ADMISE'
  );
  const rejectedCandidatures = candidatures.filter(
    (c) => c.status === 'REJETEE_DIRECTEUR_THESE'
  );

  const pendingReinscriptions = reinscriptions.filter((r) => r.status === 'SOUMISE');

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">
            Direction Scientifique de Thèse
          </span>
          <h2 className="text-xl font-bold text-slate-900 mt-0.5">
            Tableau de bord des Sujets & Candidatures
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {user.grade || 'Directeur de Thèse'} — {user.specialty || 'Pôle Sciences et Technologies'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigateTab('dt-sujets')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            Proposer un sujet de thèse
          </button>
        </div>
      </div>

      {/* Pending Action Banner if any */}
      {(pendingDossiers.length > 0 || pendingReinscriptions.length > 0) && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-blue-950">
                Dossiers en attente de votre examen scientifique
              </h4>
              <p className="text-xs text-blue-800 mt-0.5">
                {pendingDossiers.length} candidature{pendingDossiers.length > 1 ? 's' : ''} à évaluer et{' '}
                {pendingReinscriptions.length} demande{pendingReinscriptions.length > 1 ? 's' : ''} de réinscription annuelle.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('dt-candidatures')}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shrink-0 transition-colors"
          >
            Examiner les dossiers
          </button>
        </div>
      )}

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <span className="text-xs text-slate-500 font-medium block">Sujets proposés</span>
          <span className="text-2xl font-bold text-slate-900 tabular-nums mt-1 block">
            {subjects.length}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {subjects.filter((s) => s.status === 'PUBLIE').length} publiés au catalogue
          </span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <span className="text-xs text-slate-500 font-medium block">Dossiers à examiner</span>
          <span className="text-2xl font-bold text-amber-600 tabular-nums mt-1 block">
            {pendingDossiers.length}
          </span>
          <span className="text-[11px] text-amber-700 mt-1 block">En attente d'avis</span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <span className="text-xs text-slate-500 font-medium block">Avis favorables (Acceptés)</span>
          <span className="text-2xl font-bold text-teal-600 tabular-nums mt-1 block">
            {acceptedCandidatures.length}
          </span>
          <span className="text-[11px] text-teal-700 mt-1 block">Transmis à la structure</span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <span className="text-xs text-slate-500 font-medium block">Doctorants en suivi</span>
          <span className="text-2xl font-bold text-indigo-600 tabular-nums mt-1 block">
            {reinscriptions.length + acceptedCandidatures.filter((c) => c.status === 'ADMISE').length}
          </span>
          <span className="text-[11px] text-indigo-700 mt-1 block">Encadrement actif</span>
        </div>
      </div>

      {/* Pending Dossiers List Preview */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-900">
            Dernières candidatures reçues
          </h3>
          <button
            type="button"
            onClick={() => onNavigateTab('dt-candidatures')}
            className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
          >
            Voir tous les dossiers ({candidatures.length}) →
          </button>
        </div>

        {candidatures.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400">
            Aucune candidature reçue pour le moment sur vos sujets.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {candidatures.slice(0, 4).map((cand) => {
              const statusCfg = CANDIDATURE_STATUS_CONFIG[cand.status];
              return (
                <div key={cand.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${statusCfg.bgClass} ${statusCfg.textClass} border ${statusCfg.borderClass}`}>
                        {statusCfg.label}
                      </span>
                      <span className="text-xs font-bold text-slate-900">{cand.candidateName}</span>
                    </div>
                    <p className="text-xs text-slate-600 truncate max-w-lg">{cand.subjectTitle}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => onNavigateTab('dt-candidatures')}
                    className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg self-start sm:self-center shrink-0"
                  >
                    Examiner le dossier
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
