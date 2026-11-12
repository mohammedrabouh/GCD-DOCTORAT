/**
 * DOCTORIA — Thesis Supervisor Candidatures Review (Directeur de Thèse)
 * Scientific examination of dossiers: view personal info, examine uploaded documents,
 * request corrections, give definitive scientific acceptance or rejection with justification,
 * view decision history.
 */

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Eye,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Send,
  User as UserIcon,
  Phone,
  Mail,
  CreditCard,
  Hash,
  X,
  History,
  Building2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Candidature, DocumentItem, DocumentCategory } from '../../types';
import { StorageService, subscribeToStorage } from '../../services/storage';
import { CANDIDATURE_STATUS_CONFIG, DOCUMENT_CATEGORIES } from '../../constants';
import { DocumentViewerModal } from '../../components/DocumentViewerModal';

export const SupervisorCandidatures: React.FC = () => {
  const { user } = useAuth();
  const [candidatures, setCandidatures] = useState<Candidature[]>([]);
  const [selectedCand, setSelectedCand] = useState<Candidature | null>(null);

  // Modals for actions
  const [isAcceptModalOpen, setIsAcceptModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState(false);

  // Form states
  const [justification, setJustification] = useState('');
  const [correctionMsg, setCorrectionMsg] = useState('');
  const [requestedDocs, setRequestedDocs] = useState<string[]>([]);

  // Document viewer modal
  const [viewingDoc, setViewingDoc] = useState<DocumentItem | null>(null);

  const loadData = () => {
    if (!user) return;
    const cands = StorageService.getCandidaturesForSupervisor(user.id);
    setCandidatures(cands);
    if (selectedCand) {
      const fresh = cands.find((c) => c.id === selectedCand.id);
      if (fresh) setSelectedCand(fresh);
    }
  };

  useEffect(() => {
    loadData();
    const unsub = subscribeToStorage(loadData);
    return unsub;
  }, [user]);

  if (!user) return null;

  const handleAccept = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCand) return;
    try {
      const updated = StorageService.reviewBySupervisor({
        candidatureId: selectedCand.id,
        supervisor: user,
        decision: 'ACCEPTEE',
        justification: justification.trim() || 'Avis scientifique très favorable. Profil parfaitement adapté aux exigences du sujet.',
      });
      setSelectedCand(updated);
      setIsAcceptModalOpen(false);
      setJustification('');
      alert('Avis scientifique favorable émis. Le dossier a été transmis à la direction de structure pour validation administrative.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur';
      alert(msg);
    }
  };

  const handleReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCand) return;
    if (!justification.trim()) {
      alert('Une justification scientifique est obligatoire pour un avis défavorable.');
      return;
    }
    try {
      const updated = StorageService.reviewBySupervisor({
        candidatureId: selectedCand.id,
        supervisor: user,
        decision: 'REJETEE',
        justification: justification.trim(),
      });
      setSelectedCand(updated);
      setIsRejectModalOpen(false);
      setJustification('');
      alert('Avis défavorable enregistré.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur';
      alert(msg);
    }
  };

  const handleRequestCorrection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCand) return;
    if (!correctionMsg.trim()) {
      alert('Veuillez préciser la nature de la correction ou des pièces attendues.');
      return;
    }
    try {
      const updated = StorageService.requestCorrection({
        candidatureId: selectedCand.id,
        author: user,
        message: correctionMsg.trim(),
        requestedDocuments: requestedDocs.length > 0 ? requestedDocs : ['Complément de dossier'],
      });
      setSelectedCand(updated);
      setIsCorrectionModalOpen(false);
      setCorrectionMsg('');
      setRequestedDocs([]);
      alert('Demande de correction notifiée au candidat.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur';
      alert(msg);
    }
  };

  return (
    <div className="space-y-6">
      {/* Detail View of Candidate Dossier */}
      {selectedCand ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setSelectedCand(null)}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1"
            >
              ← Retour à la liste des candidatures
            </button>

            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-md border ${
                CANDIDATURE_STATUS_CONFIG[selectedCand.status].bgClass
              } ${CANDIDATURE_STATUS_CONFIG[selectedCand.status].textClass} ${
                CANDIDATURE_STATUS_CONFIG[selectedCand.status].borderClass
              }`}
            >
              {CANDIDATURE_STATUS_CONFIG[selectedCand.status].label}
            </span>
          </div>

          {/* Dossier Header & Candidate Info */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">
                  Examen Scientifique du Dossier
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 mt-0.5">
                  Candidat : {selectedCand.candidateName}
                </h2>
                <p className="text-xs text-slate-600 font-medium mt-1">
                  Sujet : <strong>{selectedCand.subjectTitle}</strong>
                </p>
              </div>

              {/* Action Buttons if under review */}
              {(selectedCand.status === 'SOUMISE' || selectedCand.status === 'EN_COURS_EXAMEN') && (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsCorrectionModalOpen(true)}
                    className="px-3 py-1.5 border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Demander correction
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsRejectModalOpen(true)}
                    className="px-3 py-1.5 border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Avis défavorable
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAcceptModalOpen(true)}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-2xs transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Accepter le dossier
                  </button>
                </div>
              )}
            </div>

            {/* Candidate Metadata Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-xs">
              <div>
                <span className="text-slate-500 block">E-mail :</span>
                <strong className="text-slate-900 truncate block">{selectedCand.candidateEmail}</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Téléphone :</span>
                <strong className="text-slate-900">{selectedCand.candidatePhone || 'Non renseigné'}</strong>
              </div>
              <div>
                <span className="text-slate-500 block">CIN :</span>
                <strong className="text-slate-900 font-mono">{selectedCand.candidateCin || 'N/A'}</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Code Massar (CNE) :</span>
                <strong className="text-slate-900 font-mono">{selectedCand.candidateCne || 'N/A'}</strong>
              </div>
            </div>

            {/* Supervisor review report if already done */}
            {selectedCand.supervisorReview && (
              <div
                className={`p-4 rounded-xl border ${
                  selectedCand.supervisorReview.decision === 'ACCEPTEE'
                    ? 'bg-teal-50 border-teal-200 text-teal-900'
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-xs font-bold uppercase tracking-wider">
                    Votre décision scientifique : {selectedCand.supervisorReview.decision}
                  </h4>
                  <span className="text-[11px] text-slate-500">
                    {new Date(selectedCand.supervisorReview.decisionDate).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                <p className="text-xs leading-relaxed mt-1">
                  « {selectedCand.supervisorReview.justification} »
                </p>
              </div>
            )}
          </div>

          {/* Candidate Uploaded Documents */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900">
              Pièces justificatives du dossier ({Object.keys(selectedCand.documents || {}).length})
            </h3>

            <div className="divide-y divide-slate-100">
              {Object.entries(selectedCand.documents || {}).map(([category, docId]) => {
                const doc = StorageService.getDocumentById(docId);
                const catMeta = DOCUMENT_CATEGORIES[category as DocumentCategory];
                return (
                  <div key={category} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">
                        {catMeta?.label || category}
                      </span>
                      <span className="text-[11px] text-slate-500 block">
                        {doc ? `${doc.fileName} (${(doc.fileSize / 1024 / 1024).toFixed(2)} Mo)` : 'Document introuvable'}
                      </span>
                    </div>

                    {doc && (
                      <button
                        type="button"
                        onClick={() => setViewingDoc(doc)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors self-start sm:self-center"
                      >
                        <Eye className="w-3.5 h-3.5 text-blue-600" />
                        Examiner la pièce
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Audit History */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <History className="w-4 h-4 text-slate-400" />
              Journal des statuts & Décisions
            </h3>

            <div className="space-y-3 relative pl-4 border-l-2 border-slate-200">
              {selectedCand.history.map((entry, idx) => (
                <div key={idx} className="relative text-xs">
                  <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-blue-600 border-2 border-white" />
                  <span className="font-bold text-slate-900">{entry.toStatus}</span>
                  <span className="text-slate-400 mx-2">·</span>
                  <span className="text-slate-500">
                    {new Date(entry.timestamp).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  <p className="text-slate-600 mt-0.5">
                    Par {entry.authorName} ({entry.authorRole}) {entry.justification && `— « ${entry.justification} »`}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* List View */
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Examen des Candidatures</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Évaluez l'adéquation scientifique des dossiers reçus sur vos sujets de thèse.
              </p>
            </div>
          </div>

          {candidatures.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">Aucune candidature reçue</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                Les dossiers soumis par les candidats pour vos sujets s'afficheront ici.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {candidatures.map((cand) => {
                const statusCfg = CANDIDATURE_STATUS_CONFIG[cand.status];
                return (
                  <div
                    key={cand.id}
                    className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`text-xs font-bold px-2.5 py-0.5 rounded border ${statusCfg.bgClass} ${statusCfg.textClass} ${statusCfg.borderClass}`}
                        >
                          {statusCfg.label}
                        </span>
                        <span className="text-sm font-bold text-slate-900">{cand.candidateName}</span>
                      </div>

                      <h4 className="text-xs text-slate-700 font-medium line-clamp-1">
                        Sujet : {cand.subjectTitle}
                      </h4>

                      <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-2">
                        <span>
                          Reçu le{' '}
                          {cand.submissionDate
                            ? new Date(cand.submissionDate).toLocaleDateString('fr-FR')
                            : 'N/A'}
                        </span>
                        <span>·</span>
                        <span>{Object.keys(cand.documents || {}).length} documents joints</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedCand(cand)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg self-start sm:self-center shrink-0 shadow-2xs transition-colors"
                    >
                      Examiner le dossier
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal: Accept Candidature */}
      {isAcceptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Avis scientifique favorable</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Le dossier sera transmis au Directeur de Structure pour la décision administrative finale.
                </p>
              </div>
              <button onClick={() => setIsAcceptModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAccept} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Justification scientifique & Motivation de l'encadrement
                </label>
                <textarea
                  rows={3}
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  placeholder="Ex: Candidat disposant d'un excellent cursus en mathématiques appliquées et d'une motivation solide pour le projet..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAcceptModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-2xs"
                >
                  Confirmer l'acceptation scientifique
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Reject Candidature */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-rose-950">Avis scientifique défavorable</h3>
                <p className="text-xs text-rose-800 mt-0.5">
                  Veuillez motiver précisément le rejet du dossier.
                </p>
              </div>
              <button onClick={() => setIsRejectModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReject} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Justification scientifique du rejet *
                </label>
                <textarea
                  required
                  rows={3}
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  placeholder="Ex: Prérequis insuffisants en algorithmique avancée ou cursus non conforme aux axes du sujet..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRejectModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg shadow-2xs"
                >
                  Confirmer le rejet scientifique
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Request Correction */}
      {isCorrectionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Demande de correction</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Le candidat sera notifié pour compléter ou remplacer ses pièces.
                </p>
              </div>
              <button onClick={() => setIsCorrectionModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRequestCorrection} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Message d'observation au candidat *
                </label>
                <textarea
                  required
                  rows={3}
                  value={correctionMsg}
                  onChange={(e) => setCorrectionMsg(e.target.value)}
                  placeholder="Ex: Veuillez fournir un relevé de notes global officiel certifié conforme du Master..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCorrectionModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg shadow-2xs"
                >
                  Transmettre la demande de correction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document Viewer Modal */}
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
