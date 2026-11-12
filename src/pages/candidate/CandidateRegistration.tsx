/**
 * DOCTORIA — Candidate Administrative Registration View
 * For admitted doctoral candidates: registration deadline countdown,
 * required administrative files deposit, validation tracking, waitlist notice.
 */

import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  Upload,
  Camera,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Candidature, DocumentCategory, DocumentItem } from '../../types';
import { StorageService, subscribeToStorage } from '../../services/storage';
import { DocumentCaptureModal } from '../../components/DocumentCaptureModal';
import { DocumentViewerModal } from '../../components/DocumentViewerModal';

export const CandidateRegistration: React.FC = () => {
  const { user } = useAuth();
  const [candidatures, setCandidatures] = useState<Candidature[]>([]);
  const [selectedAdmitted, setSelectedAdmitted] = useState<Candidature | null>(null);

  // Capture modal
  const [captureCat, setCaptureCat] = useState<DocumentCategory | null>(null);
  const [viewingDoc, setViewingDoc] = useState<DocumentItem | null>(null);

  const loadData = () => {
    if (!user) return;
    const all = StorageService.getCandidaturesForCandidate(user.id);
    setCandidatures(all);
    const adm = all.find((c) => c.status === 'ADMISE');
    if (adm) setSelectedAdmitted(adm);
  };

  useEffect(() => {
    loadData();
    const unsub = subscribeToStorage(loadData);
    return unsub;
  }, [user]);

  if (!user) return null;

  const waitlisted = candidatures.filter((c) => c.status === 'LISTE_ATTENTE');
  const cancelledDeadline = candidatures.filter((c) => c.status === 'ADMISSION_ANNULEE_DELAI_DEPASSE');

  const handleDocumentAttached = (doc: DocumentItem) => {
    if (!selectedAdmitted) return;
    try {
      const updated = StorageService.submitRegistrationDocuments(selectedAdmitted.id, user, {
        [doc.category]: doc.id,
      });
      setSelectedAdmitted(updated);
      alert("Votre pièce d'inscription administrative a été enregistrée.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur';
      alert(msg);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs">
        <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">
          Inscription Administrative en 1ère Année
        </span>
        <h2 className="text-xl font-bold text-slate-900 mt-0.5">
          Finalisation de l'inscription doctorale
        </h2>
        <p className="text-xs text-slate-500 mt-1 max-w-2xl">
          Après acceptation scientifique et validation par la structure de recherche, l'inscription administrative officielle confère le statut de doctorant au sein de l'université.
        </p>
      </div>

      {/* Case 1: Active Admitted Candidature */}
      {selectedAdmitted ? (
        <div className="space-y-6">
          {/* Status & Deadline Banner */}
          <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-base font-bold text-emerald-950">
                    Admission accordée pour le sujet : {selectedAdmitted.subjectTitle}
                  </h3>
                  <p className="text-xs text-emerald-800 mt-1">
                    Directeur de thèse : {selectedAdmitted.supervisorReview?.reviewerName || 'Professeur responsable'}
                  </p>
                </div>
              </div>

              {selectedAdmitted.structureReview?.registrationDeadline && (
                <div className="bg-white/80 border border-emerald-300 px-4 py-2.5 rounded-lg text-right shrink-0">
                  <span className="text-[11px] font-bold text-emerald-900 uppercase block">
                    Date limite d'inscription
                  </span>
                  <span className="text-sm font-black text-rose-700 tabular-nums">
                    {selectedAdmitted.structureReview.registrationDeadline}
                  </span>
                </div>
              )}
            </div>

            {/* Registration status progress */}
            <div className="mt-5 pt-4 border-t border-emerald-200 flex flex-wrap items-center gap-6 text-xs text-emerald-900">
              <div className="flex items-center gap-2">
                <span className="font-semibold">Statut du dossier :</span>
                {selectedAdmitted.registrationFile?.status === 'VALIDEE' ? (
                  <span className="bg-emerald-600 text-white font-bold px-2.5 py-0.5 rounded">
                    Inscription Validée Définitivement
                  </span>
                ) : selectedAdmitted.registrationFile?.status === 'DOSSIER_DEPOSE' ? (
                  <span className="bg-blue-600 text-white font-bold px-2.5 py-0.5 rounded">
                    Dossier Déposé (En cours de vérification administrative)
                  </span>
                ) : (
                  <span className="bg-amber-600 text-white font-bold px-2.5 py-0.5 rounded">
                    En attente de vos pièces d'inscription
                  </span>
                )}
              </div>

              {selectedAdmitted.registrationFile?.verifiedBy && (
                <div className="text-emerald-800 text-[11px]">
                  Validé par : <strong>{selectedAdmitted.registrationFile.verifiedBy}</strong>
                </div>
              )}
            </div>
          </div>

          {/* Registration Documents Upload */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900">
              Pièces d'inscription administrative à fournir
            </h3>

            <div className="divide-y divide-slate-100">
              {/* Piece 1: Formulaire d'inscription / Charte des thèses */}
              <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    Charte des thèses et engagement d'assiduité signés
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Document conjointement paraphé par le doctorant et le directeur de thèse.
                  </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center">
                  {selectedAdmitted.registrationFile?.documents?.DOCUMENT_INSCRIPTION ? (
                    <button
                      type="button"
                      onClick={() => {
                        const d = StorageService.getDocumentById(selectedAdmitted.registrationFile!.documents.DOCUMENT_INSCRIPTION);
                        if (d) setViewingDoc(d);
                      }}
                      className="px-3 py-1.5 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-lg flex items-center gap-1.5 border border-emerald-200"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Document déposé
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setCaptureCat('DOCUMENT_INSCRIPTION')}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-2xs"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      Déposer ou photographier
                    </button>
                  )}
                </div>
              </div>

              {/* Piece 2: Attestation d'assurance complémentaire */}
              <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    Attestation d'assurance ou couverture médicale universitaire
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Police d'assurance responsabilité civile ou affiliation AMO étudiant.
                  </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center">
                  {selectedAdmitted.registrationFile?.documents?.AUTRE ? (
                    <button
                      type="button"
                      onClick={() => {
                        const d = StorageService.getDocumentById(selectedAdmitted.registrationFile!.documents.AUTRE);
                        if (d) setViewingDoc(d);
                      }}
                      className="px-3 py-1.5 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-lg flex items-center gap-1.5 border border-emerald-200"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Document déposé
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setCaptureCat('AUTRE')}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-2xs"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      Déposer ou photographier
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Case 2: Not yet admitted, or on waitlist */
        <div className="space-y-4">
          {waitlisted.length > 0 && (
            <div className="bg-amber-50 border border-amber-300 rounded-xl p-5 flex items-start gap-3">
              <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-amber-900">
                  Candidature classée sur liste d'attente
                </h3>
                <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                  Votre candidature pour « {waitlisted[0].subjectTitle} » est actuellement sur liste d'attente
                  {waitlisted[0].waitlistRank ? ` (Rang : ${waitlisted[0].waitlistRank})` : ''}. Si un candidat admis se désiste ou dépasse la date limite d'inscription, vous serez immédiatement notifié(e) par la direction de structure.
                </p>
              </div>
            </div>
          )}

          {cancelledDeadline.length > 0 && (
            <div className="bg-rose-50 border border-rose-300 rounded-xl p-5 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-rose-900">
                  Admission annulée pour dépassement de délai
                </h3>
                <p className="text-xs text-rose-800 mt-1 leading-relaxed">
                  Votre admission pour « {cancelledDeadline[0].subjectTitle} » a été déclarée caduque suite au non-respect de la date limite légale d'inscription fixée par le calendrier universitaire.
                </p>
              </div>
            </div>
          )}

          {!waitlisted.length && !cancelledDeadline.length && (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <UserCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">
                Aucune admission active nécessitant une inscription
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                L'inscription administrative en 1ère année n'est accessible qu'aux candidats ayant reçu une décision définitive d'admission de la part de la direction du CED.
              </p>
            </div>
          )}
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
            handleDocumentAttached(doc);
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
