/**
 * DOCTORIA — Candidate Annual Re-enrollment View (Réinscription Annuelle)
 * Strict eligibility check, mandatory 3 documents upload/camera capture,
 * submission, tracking supervisor's opinion & structure director final decision.
 */

import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  Upload,
  Camera,
  History,
  ShieldCheck,
  Send,
  Eye,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  ReinscriptionRequest,
  Candidature,
  DocumentCategory,
  DocumentItem,
  DoctoralCampaign,
} from '../../types';
import { StorageService, subscribeToStorage } from '../../services/storage';
import { REINSCRIPTION_STATUS_CONFIG } from '../../constants';
import { DocumentCaptureModal } from '../../components/DocumentCaptureModal';
import { DocumentViewerModal } from '../../components/DocumentViewerModal';

export const CandidateReinscription: React.FC = () => {
  const { user } = useAuth();
  const [eligibility, setEligibility] = useState<{
    eligible: boolean;
    candidature?: Candidature;
    nextYear?: number;
    reason?: string;
  }>({ eligible: false });

  const [campaign, setCampaign] = useState<DoctoralCampaign | undefined>(undefined);
  const [requests, setRequests] = useState<ReinscriptionRequest[]>([]);

  // 3 mandatory documents IDs
  const [rapportDocId, setRapportDocId] = useState<string>('');
  const [avisDocId, setAvisDocId] = useState<string>('');
  const [formationsDocId, setFormationsDocId] = useState<string>('');

  // Modals
  const [captureCat, setCaptureCat] = useState<DocumentCategory | null>(null);
  const [viewingDoc, setViewingDoc] = useState<DocumentItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = () => {
    if (!user) return;
    setEligibility(StorageService.isCandidateEligibleForReinscription(user.id));
    setCampaign(StorageService.getActiveCampaign());
    setRequests(StorageService.getReinscriptionsForCandidate(user.id));
  };

  useEffect(() => {
    loadData();
    const unsub = subscribeToStorage(loadData);
    return unsub;
  }, [user]);

  if (!user) return null;

  const handleSubmitReinscription = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eligibility.eligible || !eligibility.candidature || !campaign) return;

    if (!rapportDocId || !avisDocId || !formationsDocId) {
      alert(
        'Les trois documents sont strictement obligatoires pour valider votre demande de réinscription :\n1. Rapport d’avancement des travaux\n2. Attestation ou avis du directeur de thèse\n3. Relevé des formations doctorales suivies'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      StorageService.submitReinscription({
        candidate: user,
        admittedCandidature: eligibility.candidature,
        doctoralYear: eligibility.nextYear || 2,
        campaignId: campaign.id,
        rapportAvancementDocId: rapportDocId,
        avisDirecteurDocId: avisDocId,
        formationsDoctoralesDocId: formationsDocId,
      });

      setRapportDocId('');
      setAvisDocId('');
      setFormationsDocId('');
      alert('Votre dossier de réinscription annuelle a été transmis au Directeur de Thèse.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur';
      alert(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentActiveRequest = requests.find(
    (r) => r.status === 'SOUMISE' || r.status === 'AVIS_DT_FAVORABLE' || r.status === 'AVIS_DT_DEFAVORABLE'
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs">
        <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">
          Cycle Doctoral — Années 2 à 6
        </span>
        <h2 className="text-xl font-bold text-slate-900 mt-0.5">
          Demande de Réinscription Annuelle
        </h2>
        <p className="text-xs text-slate-500 mt-1 max-w-2xl">
          Conformément au cahier des normes pédagogiques nationales du doctorat, la réinscription annuelle est conditionnée par l'avis motivé du directeur de thèse et la validation de la direction du CED.
        </p>
      </div>

      {/* Case 1: Active request in progress */}
      {currentActiveRequest && (
        <div className="bg-white rounded-xl border border-blue-200 p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <span className="text-xs font-bold text-blue-700 uppercase">
                Demande en cours — {currentActiveRequest.doctoralYear}ème Année
              </span>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">
                {currentActiveRequest.subjectTitle}
              </h3>
            </div>
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-md border ${
                REINSCRIPTION_STATUS_CONFIG[currentActiveRequest.status].bgClass
              } ${REINSCRIPTION_STATUS_CONFIG[currentActiveRequest.status].textClass} ${
                REINSCRIPTION_STATUS_CONFIG[currentActiveRequest.status].borderClass
              }`}
            >
              {REINSCRIPTION_STATUS_CONFIG[currentActiveRequest.status].label}
            </span>
          </div>

          {/* Supervisor review notice */}
          {currentActiveRequest.supervisorReview ? (
            <div
              className={`p-4 rounded-xl border ${
                currentActiveRequest.supervisorReview.avis === 'FAVORABLE'
                  ? 'bg-teal-50 border-teal-200 text-teal-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
            >
              <h4 className="text-xs font-bold uppercase tracking-wider mb-1">
                Avis du Directeur de Thèse ({currentActiveRequest.supervisorReview.supervisorName}) :
              </h4>
              <p className="text-xs leading-relaxed">
                Avis : <strong>{currentActiveRequest.supervisorReview.avis}</strong> — «{' '}
                {currentActiveRequest.supervisorReview.observation} »
              </p>
              <p className="text-[11px] text-slate-500 mt-2">
                Le dossier est actuellement entre les mains du Directeur de Structure pour la décision finale.
              </p>
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-xs text-slate-600 flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400 shrink-0" />
              <span>
                Votre dossier a été transmis. En attente de l'avis scientifique de votre directeur de thèse.
              </span>
            </div>
          )}

          {/* Submitted 3 documents */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase mb-2">Documents déposés :</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  const d = StorageService.getDocumentById(currentActiveRequest.rapportAvancementDocId);
                  if (d) setViewingDoc(d);
                }}
                className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-left text-xs flex items-center justify-between"
              >
                <span className="font-semibold text-slate-800 truncate">1. Rapport d'avancement</span>
                <Eye className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              </button>
              <button
                type="button"
                onClick={() => {
                  const d = StorageService.getDocumentById(currentActiveRequest.avisDirecteurDocId);
                  if (d) setViewingDoc(d);
                }}
                className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-left text-xs flex items-center justify-between"
              >
                <span className="font-semibold text-slate-800 truncate">2. Avis du directeur</span>
                <Eye className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              </button>
              <button
                type="button"
                onClick={() => {
                  const d = StorageService.getDocumentById(currentActiveRequest.formationsDoctoralesDocId);
                  if (d) setViewingDoc(d);
                }}
                className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-left text-xs flex items-center justify-between"
              >
                <span className="font-semibold text-slate-800 truncate">3. Relevé formations</span>
                <Eye className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Case 2: Eligible to submit new re-enrollment */}
      {eligibility.eligible && !currentActiveRequest && (
        <form onSubmit={handleSubmitReinscription} className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
              Conditions d'éligibilité remplies
            </span>
            <h3 className="text-base font-bold text-slate-900 mt-2">
              Dépôt de la demande de réinscription pour la {eligibility.nextYear}ème Année Doctorale
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Thèse : <strong>{eligibility.candidature?.subjectTitle}</strong>
            </p>
          </div>

          {/* The 3 mandatory documents section */}
          <div className="space-y-4">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Les 3 pièces obligatoires (Réglementation nationale)
            </div>

            {/* Doc 1: Rapport annuel d'avancement */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="max-w-md">
                <span className="text-xs font-bold text-slate-900 block">
                  1. Rapport annuel d'avancement des travaux de recherche *
                </span>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  Synthèse scientifique rédigée par le doctorant sur les résultats obtenus et calendrier des travaux futurs.
                </span>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-center">
                {rapportDocId ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Pièce prête
                    </span>
                    <button
                      type="button"
                      onClick={() => setCaptureCat('RAPPORT_AVANCEMENT')}
                      className="text-xs text-blue-600 hover:underline font-semibold"
                    >
                      Remplacer
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setCaptureCat('RAPPORT_AVANCEMENT')}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-2xs"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Déposer le rapport
                  </button>
                )}
              </div>
            </div>

            {/* Doc 2: Attestation ou avis favorable du DT */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="max-w-md">
                <span className="text-xs font-bold text-slate-900 block">
                  2. Attestation ou avis favorable signé du Directeur de Thèse *
                </span>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  Formulaire officiel signé attestant du bon déroulement des travaux de recherche en laboratoire.
                </span>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-center">
                {avisDocId ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Pièce prête
                    </span>
                    <button
                      type="button"
                      onClick={() => setCaptureCat('AVIS_DIRECTEUR')}
                      className="text-xs text-blue-600 hover:underline font-semibold"
                    >
                      Remplacer
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setCaptureCat('AVIS_DIRECTEUR')}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-2xs"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Déposer l'avis du DT
                  </button>
                )}
              </div>
            </div>

            {/* Doc 3: Relevé des formations doctorales */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="max-w-md">
                <span className="text-xs font-bold text-slate-900 block">
                  3. Relevé des formations doctorales suivies *
                </span>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  Attestations de participation aux séminaires, modules transversaux ou cours scientifiques agréés CED.
                </span>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-center">
                {formationsDocId ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Pièce prête
                    </span>
                    <button
                      type="button"
                      onClick={() => setCaptureCat('FORMATIONS_DOCTORALES')}
                      className="text-xs text-blue-600 hover:underline font-semibold"
                    >
                      Remplacer
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setCaptureCat('FORMATIONS_DOCTORALES')}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-2xs"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Déposer le relevé
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Assurez-vous de la conformité des 3 pièces avant envoi.
            </span>
            <button
              type="submit"
              disabled={isSubmitting || !rapportDocId || !avisDocId || !formationsDocId}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-2 transition-colors"
            >
              <Send className="w-4 h-4" />
              {isSubmitting ? 'Transmission...' : 'Envoyer ma demande de réinscription'}
            </button>
          </div>
        </form>
      )}

      {/* Case 3: Ineligible */}
      {!eligibility.eligible && !currentActiveRequest && (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
          <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">
            Réinscription annuelle non accessible
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
            {eligibility.reason ||
              'Vous devez être officiellement inscrit en doctorat pour accéder à la procédure de réinscription annuelle.'}
          </p>
        </div>
      )}

      {/* Re-enrollment History List */}
      {requests.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <History className="w-4 h-4 text-slate-400" />
            Historique annuel de vos réinscriptions
          </h3>

          <div className="divide-y divide-slate-100">
            {requests.map((r) => {
              const cfg = REINSCRIPTION_STATUS_CONFIG[r.status];
              return (
                <div key={r.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900">
                      {r.doctoralYear}ème Année Doctorale
                    </span>
                    <span className="text-slate-400 mx-2">·</span>
                    <span className="text-slate-500">
                      Déposée le {new Date(r.createdAt).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                  <span
                    className={`font-semibold px-2 py-0.5 rounded border text-[11px] ${cfg.bgClass} ${cfg.textClass} ${cfg.borderClass}`}
                  >
                    {cfg.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Capture Modal */}
      {captureCat && (
        <DocumentCaptureModal
          isOpen={!!captureCat}
          onClose={() => setCaptureCat(null)}
          category={captureCat}
          currentUser={user}
          onDocumentSaved={(doc) => {
            if (captureCat === 'RAPPORT_AVANCEMENT') setRapportDocId(doc.id);
            if (captureCat === 'AVIS_DIRECTEUR') setAvisDocId(doc.id);
            if (captureCat === 'FORMATIONS_DOCTORALES') setFormationsDocId(doc.id);
            setCaptureCat(null);
          }}
        />
      )}

      {/* Viewer Modal */}
      {viewingDoc && (
        <DocumentViewerModal
          isOpen={!!viewingDoc}
          onClose={() => setViewingDoc(null)}
          documentItem={viewingDoc}
        />
      )}
    </div>
  );
};
