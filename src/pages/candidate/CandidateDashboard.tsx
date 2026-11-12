/**
 * DOCTORIA — Candidate Dashboard
 * Overview of candidate's applications, drafts, pending corrections, and admission status.
 */

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Calendar,
  AlertCircle,
  FolderOpen,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Candidature, DoctoralCampaign, ReinscriptionRequest } from '../../types';
import { StorageService, subscribeToStorage } from '../../services/storage';
import { CANDIDATURE_STATUS_CONFIG } from '../../constants';

interface CandidateDashboardProps {
  onNavigateTab: (tab: string, extraData?: unknown) => void;
}

export const CandidateDashboard: React.FC<CandidateDashboardProps> = ({ onNavigateTab }) => {
  const { user } = useAuth();
  const [candidatures, setCandidatures] = useState<Candidature[]>([]);
  const [campaign, setCampaign] = useState<DoctoralCampaign | undefined>(undefined);
  const [reinscriptions, setReinscriptions] = useState<ReinscriptionRequest[]>([]);

  const loadData = () => {
    if (!user) return;
    setCandidatures(StorageService.getCandidaturesForCandidate(user.id));
    setCampaign(StorageService.getActiveCampaign());
    setReinscriptions(StorageService.getReinscriptionsForCandidate(user.id));
  };

  useEffect(() => {
    loadData();
    const unsub = subscribeToStorage(loadData);
    return unsub;
  }, [user]);

  if (!user) return null;

  const drafts = candidatures.filter((c) => c.isDraft);
  const submitted = candidatures.filter((c) => !c.isDraft);
  const admitted = candidatures.filter((c) => c.status === 'ADMISE');
  const needsCorrection = candidatures.filter((c) => c.status === 'CORRECTION_DEMANDEE');

  return (
    <div className="space-y-6">
      {/* Top Welcome / Campaign Card (No redundant Bonjour [nom] since in header) */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">
              Espace Candidat au Doctorat
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5">
              Suivi de votre parcours doctoral
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {campaign
                ? `${campaign.title} (${campaign.academicYear}) — Clôture des dépôts le ${campaign.endDate}.`
                : 'Aucune campagne doctorale en cours.'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigateTab('catalogue')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 shadow-2xs transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5" />
              Catalogue des sujets
            </button>
          </div>
        </div>
      </div>

      {/* Urgent Action Banner: Correction requested */}
      {needsCorrection.length > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-amber-900">
                Action requise : correction ou pièce demandée sur votre dossier
              </h4>
              <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                Le directeur de thèse a formulé des observations sur votre candidature pour «{' '}
                {needsCorrection[0].subjectTitle} ». Veuillez fournir les documents demandés.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('candidatures')}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shrink-0 transition-colors"
          >
            Compléter le dossier
          </button>
        </div>
      )}

      {/* Urgent Action Banner: Admitted with Registration Deadline */}
      {admitted.length > 0 && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-4 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-emerald-900">
                Félicitations ! Vous êtes admis(e) au doctorat
              </h4>
              <p className="text-xs text-emerald-800 mt-0.5 leading-relaxed">
                Votre candidature pour « {admitted[0].subjectTitle} » a été validée par la Direction du CED.
                {admitted[0].structureReview?.registrationDeadline && (
                  <span className="font-semibold block mt-1">
                    Date limite impérative d'inscription administrative :{' '}
                    {admitted[0].structureReview?.registrationDeadline}
                  </span>
                )}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('inscription')}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shrink-0 transition-colors"
          >
            Finaliser mon inscription
          </button>
        </div>
      )}

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <span className="text-xs text-slate-500 font-medium block">Candidatures soumises</span>
          <span className="text-2xl font-bold text-slate-900 tabular-nums mt-1 block">
            {submitted.length}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Max autorisé : {campaign?.maxCandidaturesPerCandidate || 3}
          </span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <span className="text-xs text-slate-500 font-medium block">Brouillons en cours</span>
          <span className="text-2xl font-bold text-slate-900 tabular-nums mt-1 block">
            {drafts.length}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">Non visibles par l'équipe</span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <span className="text-xs text-slate-500 font-medium block">Admissions prononcées</span>
          <span className="text-2xl font-bold text-emerald-600 tabular-nums mt-1 block">
            {admitted.length}
          </span>
          <span className="text-[11px] text-emerald-700 mt-1 block">Décision CED validée</span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <span className="text-xs text-slate-500 font-medium block">Réinscriptions annuelles</span>
          <span className="text-2xl font-bold text-indigo-600 tabular-nums mt-1 block">
            {reinscriptions.length}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">Historique doctorant</span>
        </div>
      </div>

      {/* Recent Candidatures Section */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-900">Vos candidatures récentes</h3>
          <button
            type="button"
            onClick={() => onNavigateTab('candidatures')}
            className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
          >
            Tout afficher →
          </button>
        </div>

        {candidatures.length === 0 ? (
          <div className="text-center py-10">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-xs text-slate-500 font-medium">Vous n'avez encore créé aucune candidature.</p>
            <button
              type="button"
              onClick={() => onNavigateTab('catalogue')}
              className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold"
            >
              Consulter les sujets et postuler
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {candidatures.slice(0, 3).map((cand) => {
              const statusCfg = CANDIDATURE_STATUS_CONFIG[cand.status];
              return (
                <div key={cand.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${statusCfg.bgClass} ${statusCfg.textClass} border ${statusCfg.borderClass}`}>
                        {statusCfg.label}
                      </span>
                      {cand.isDraft && (
                        <span className="text-[11px] text-slate-400 italic">Brouillon modifiable</span>
                      )}
                    </div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate max-w-lg">
                      {cand.subjectTitle}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Dernière mise à jour le{' '}
                      {new Date(cand.updatedAt).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => onNavigateTab('candidatures')}
                    className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg self-start sm:self-center shrink-0 transition-colors"
                  >
                    Consulter le dossier
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick shortcuts grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          onClick={() => onNavigateTab('documents')}
          className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs hover:border-blue-400 cursor-pointer transition-all flex items-start gap-3"
        >
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
            <FolderOpen className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900">Pièces & Scanner caméra</h4>
            <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
              Numérisez vos diplômes avec la caméra de votre smartphone ou importez des PDF.
            </p>
          </div>
        </div>

        <div
          onClick={() => onNavigateTab('reinscription')}
          className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs hover:border-blue-400 cursor-pointer transition-all flex items-start gap-3"
        >
          <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900">Réinscription annuelle</h4>
            <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
              Pour les doctorants admis : rapport d'avancement, avis du DT et formations.
            </p>
          </div>
        </div>

        <div
          onClick={() => onNavigateTab('profil')}
          className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs hover:border-blue-400 cursor-pointer transition-all flex items-start gap-3"
        >
          <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900">Informations personnelles</h4>
            <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
              Consultez et mettez à jour vos coordonnées de contact et identifiants académiques.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
