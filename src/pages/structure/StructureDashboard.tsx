/**
 * DOCTORIA — Structure Director Dashboard (Centre d'Études Doctorales)
 * Overview of subjects to validate, scientific decisions forwarded by supervisors,
 * admissions, registration deadlines compliance, and waitlist allocations.
 */

import React, { useState, useEffect } from 'react';
import {
  Building2,
  BookOpen,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ThesisSubject, Candidature, ReinscriptionRequest } from '../../types';
import { StorageService, subscribeToStorage } from '../../services/storage';

interface StructureDashboardProps {
  onNavigateTab: (tab: string) => void;
}

export const StructureDashboard: React.FC<StructureDashboardProps> = ({ onNavigateTab }) => {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<ThesisSubject[]>([]);
  const [candidatures, setCandidatures] = useState<Candidature[]>([]);
  const [reinscriptions, setReinscriptions] = useState<ReinscriptionRequest[]>([]);

  const loadData = () => {
    setSubjects(StorageService.getSubjects());
    setCandidatures(StorageService.getCandidaturesForStructure());
    setReinscriptions(StorageService.getReinscriptionsForStructure());
  };

  useEffect(() => {
    loadData();
    const unsub = subscribeToStorage(loadData);
    return unsub;
  }, []);

  if (!user) return null;

  // Metrics
  const subjectsToValidate = subjects.filter((s) => s.status === 'SOUMIS_VALIDATION');
  const forwardedByDT = candidatures.filter(
    (c) => c.status === 'ACCEPTEE_DIRECTEUR_THESE' || c.status === 'EN_ATTENTE_DECISION_ADMINISTRATIVE'
  );
  const admittedCount = candidatures.filter((c) => c.status === 'ADMISE').length;
  const waitlistCount = candidatures.filter((c) => c.status === 'LISTE_ATTENTE').length;
  const expiredDeadlines = candidatures.filter(
    (c) => c.status === 'ADMISSION_ANNULEE_DELAI_DEPASSE'
  ).length;

  const pendingReinscriptions = reinscriptions.filter(
    (r) => r.status === 'AVIS_DT_FAVORABLE' || r.status === 'AVIS_DT_DEFAVORABLE'
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">
            Direction du Centre d'Études Doctorales (CED)
          </span>
          <h2 className="text-xl font-bold text-slate-900 mt-0.5">
            Tableau de Bord & Arbitrage Administratif
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Validation des sujets, arbitrage des admissions, contrôle des délais d'inscription et listes d'attente.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigateTab('ds-admissions')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs transition-colors"
          >
            Admissions à trancher ({forwardedByDT.length})
          </button>
        </div>
      </div>

      {/* Urgent actions banner */}
      {(subjectsToValidate.length > 0 || forwardedByDT.length > 0 || pendingReinscriptions.length > 0) && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-blue-950">
                Actions administratives en attente de décision de la Direction :
              </h4>
              <p className="text-xs text-blue-800 mt-0.5">
                • {subjectsToValidate.length} sujet(s) à accréditer et publier · {forwardedByDT.length} candidature(s) acceptées par les DT en attente d'admission · {pendingReinscriptions.length} réinscription(s) à valider.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab(subjectsToValidate.length > 0 ? 'ds-sujets' : 'ds-admissions')}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shrink-0 transition-colors"
          >
            Traiter les dossiers
          </button>
        </div>
      )}

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <span className="text-xs text-slate-500 font-medium block">Sujets à valider</span>
          <span className="text-2xl font-bold text-slate-900 tabular-nums mt-1 block">
            {subjectsToValidate.length}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">Sur {subjects.length} sujets au total</span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <span className="text-xs text-slate-500 font-medium block">Décisions transmises par DT</span>
          <span className="text-2xl font-bold text-amber-600 tabular-nums mt-1 block">
            {forwardedByDT.length}
          </span>
          <span className="text-[11px] text-amber-700 mt-1 block">En attente d'arbitrage</span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <span className="text-xs text-slate-500 font-medium block">Admissions prononcées</span>
          <span className="text-2xl font-bold text-emerald-600 tabular-nums mt-1 block">
            {admittedCount}
          </span>
          <span className="text-[11px] text-emerald-700 mt-1 block">Inscriptions en cours</span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <span className="text-xs text-slate-500 font-medium block">Candidats sur liste d'attente</span>
          <span className="text-2xl font-bold text-indigo-600 tabular-nums mt-1 block">
            {waitlistCount}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {expiredDeadlines} dépassement(s) de délai
          </span>
        </div>
      </div>

      {/* Navigation shortcuts */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          onClick={() => onNavigateTab('ds-sujets')}
          className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs hover:border-blue-400 cursor-pointer transition-all"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <BookOpen className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">Validation des Sujets</h4>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Examinez les propositions soumises par les directeurs, signez les accords et publiez les sujets au catalogue public.
          </p>
        </div>

        <div
          onClick={() => onNavigateTab('ds-delais')}
          className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs hover:border-blue-400 cursor-pointer transition-all"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">Délais & Listes d'Attente</h4>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Fixez les dates limites d'inscription, appliquez les annulations pour dépassement et promouvez les candidats suivants.
          </p>
        </div>

        <div
          onClick={() => onNavigateTab('ds-reinscriptions')}
          className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs hover:border-blue-400 cursor-pointer transition-all"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <RefreshCw className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">Validation des Réinscriptions</h4>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Consultez les 3 pièces obligatoires et l'avis motivé du DT avant d'accorder la réinscription en année supérieure.
          </p>
        </div>
      </div>
    </div>
  );
};
