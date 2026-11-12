/**
 * DOCTORIA — Structure Director Admissions Decision Management
 * Review scientific decisions from thesis supervisors, examine full candidate folders,
 * confirm final administrative admission (with registration deadline) or rejection.
 */

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  AlertTriangle,
  History,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Candidature, DocumentItem, DocumentCategory } from '../../types';
import { StorageService, subscribeToStorage } from '../../services/storage';
import { CANDIDATURE_STATUS_CONFIG, DOCUMENT_CATEGORIES } from '../../constants';
import { DocumentViewerModal } from '../../components/DocumentViewerModal';

export const StructureAdmissions: React.FC = () => {
  const { user } = useAuth();
  const [candidatures, setCandidatures] = useState<Candidature[]>([]);
  const [selectedCand, setSelectedCand] = useState<Candidature | null>(null);

  // Decision Modal
  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState(false);
  const [decisionType, setDecisionType] = useState<'ADMISE' | 'REJETEE' | 'LISTE_ATTENTE'>('ADMISE');
  const [justification, setJustification] = useState('');
  const [registrationDeadline, setRegistrationDeadline] = useState('');
  const [waitlistRank, setWaitlistRank] = useState(1);

  // Document viewer modal
  const [viewingDoc, setViewingDoc] = useState<DocumentItem | null>(null);

  const loadData = () => {
    const list = StorageService.getCandidaturesForStructure();
    setCandidatures(list);
    if (selectedCand) {
      const fresh = list.find((c) => c.id === selectedCand.id);
      if (fresh) setSelectedCand(fresh);
    }
  };

  useEffect(() => {
    loadData();
    const unsub = subscribeToStorage(loadData);
    return unsub;
  }, []);

  useEffect(() => {
    // Default deadline to 3 weeks from now
    const d = new Date();
    d.setDate(d.getDate() + 21);
    setRegistrationDeadline(d.toISOString().split('T')[0]);
  }, []);

  if (!user) return null;

  const handleConfirmDecision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCand) return;

    try {
      const updated = StorageService.reviewByStructure({
        candidatureId: selectedCand.id,
        structureDirector: user,
        decision: decisionType,
        justification: justification.trim() || `Validation administrative de la candidature par la direction du CED.`,
        registrationDeadline: decisionType === 'ADMISE' ? registrationDeadline : undefined,
        waitlistRank: decisionType === 'LISTE_ATTENTE' ? waitlistRank : undefined,
      });

      setSelectedCand(updated);
      setIsDecisionModalOpen(false);
      setJustification('');
      alert(
        decisionType === 'ADMISE'
          ? `Admission confirmée avec succès. Date limite d'inscription fixée au ${registrationDeadline}. Le candidat a été notifié.`
          : `Décision administrative (${decisionType}) enregistrée avec succès.`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur';
      alert(msg);
    }
  };

  return (
    <div className="space-y-6">
      {/* Detail View of Candidature */}
      {selectedCand ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setSelectedCand(null)}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1"
            >
              ← Retour aux dossiers d'admission
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

          {/* Dossier Header */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">
                  Décision Administrative Finale
                </span>
                <h2 className="text-xl font-bold text-slate-900 mt-0.5">
                  Candidat : {selectedCand.candidateName}
                </h2>
                <p className="text-xs text-slate-600 mt-1">
                  Sujet : <strong>{selectedCand.subjectTitle}</strong>
                </p>
              </div>

              {/* Action Button */}
              {selectedCand.status === 'ACCEPTEE_DIRECTEUR_THESE' && (
                <button
                  type="button"
                  onClick={() => setIsDecisionModalOpen(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors shrink-0"
                >
                  Prononcer la décision administrative
                </button>
              )}
            </div>

            {/* Supervisor opinion banner */}
            {selectedCand.supervisorReview && (
              <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl text-teal-950 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold uppercase tracking-wider">
                    Avis scientifique émis par le DT ({selectedCand.supervisorReview.reviewerName}) :
                  </span>
                  <span className="text-teal-800 text-[11px]">
                    {new Date(selectedCand.supervisorReview.decisionDate).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                <p className="italic text-teal-900">
                  « {selectedCand.supervisorReview.justification} »
                </p>
              </div>
            )}

            {/* Structure review banner if already decided */}
            {selectedCand.structureReview && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold uppercase tracking-wider">
                    Décision de Structure : {selectedCand.structureReview.decision}
                  </span>
                  <span className="text-slate-500 text-[11px]">
                    {new Date(selectedCand.structureReview.decisionDate).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                <p>« {selectedCand.structureReview.justification} »</p>
                {selectedCand.structureReview.registrationDeadline && (
                  <p className="font-bold text-rose-700">
                    Date limite d'inscription fixée au : {selectedCand.structureReview.registrationDeadline}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Uploaded Documents */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900">
              Pièces justificatives du dossier ({Object.keys(selectedCand.documents || {}).length})
            </h3>

            <div className="divide-y divide-slate-100">
              {Object.entries(selectedCand.documents || {}).map(([category, docId]) => {
                const doc = StorageService.getDocumentById(docId);
                const catMeta = DOCUMENT_CATEGORIES[category as DocumentCategory];
                return (
                  <div key={category} className="py-3 flex items-center justify-between gap-3">
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">
                        {catMeta?.label || category}
                      </span>
                      <span className="text-[11px] text-slate-500 block">
                        {doc ? doc.fileName : 'Fichier introuvable'}
                      </span>
                    </div>

                    {doc && (
                      <button
                        type="button"
                        onClick={() => setViewingDoc(doc)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5"
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
        </div>
      ) : (
        /* List View */
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Admissions & Décisions CED</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Validez les candidatures retenues par les directeurs de thèse et prononcez les admissions officielles.
            </p>
          </div>

          {candidatures.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-xs text-slate-400">
              Aucune candidature transmise par les directeurs de thèse pour le moment.
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
                        {cand.subjectTitle}
                      </h4>

                      <p className="text-[11px] text-teal-800 font-semibold mt-1">
                        Avis DT : Favorable ({cand.supervisorReview?.reviewerName || 'Directeur de thèse'})
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedCand(cand)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-2xs shrink-0"
                    >
                      Examiner & Décider
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Decision Modal */}
      {isDecisionModalOpen && selectedCand && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Décision Administrative Finale</h3>
                <p className="text-xs text-slate-500 mt-0.5">{selectedCand.candidateName} — {selectedCand.subjectTitle}</p>
              </div>
              <button onClick={() => setIsDecisionModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmDecision} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  Décision finale retenue *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setDecisionType('ADMISE')}
                    className={`py-2 px-2 text-xs font-bold rounded-lg border text-center ${
                      decisionType === 'ADMISE'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    Admettre
                  </button>
                  <button
                    type="button"
                    onClick={() => setDecisionType('LISTE_ATTENTE')}
                    className={`py-2 px-2 text-xs font-bold rounded-lg border text-center ${
                      decisionType === 'LISTE_ATTENTE'
                        ? 'bg-amber-50 border-amber-500 text-amber-800'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    Liste d'attente
                  </button>
                  <button
                    type="button"
                    onClick={() => setDecisionType('REJETEE')}
                    className={`py-2 px-2 text-xs font-bold rounded-lg border text-center ${
                      decisionType === 'REJETEE'
                        ? 'bg-rose-50 border-rose-500 text-rose-800'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    Non retenu
                  </button>
                </div>
              </div>

              {decisionType === 'ADMISE' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Date limite impérative d'inscription administrative *
                  </label>
                  <input
                    type="date"
                    required
                    value={registrationDeadline}
                    onChange={(e) => setRegistrationDeadline(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Si le candidat ne dépose pas ses pièces avant cette date, son admission sera déclarée caduque.
                  </span>
                </div>
              )}

              {decisionType === 'LISTE_ATTENTE' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Rang de classement sur liste d'attente *
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={waitlistRank}
                    onChange={(e) => setWaitlistRank(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Justification ou motif de la commission *
                </label>
                <textarea
                  required
                  rows={3}
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  placeholder="Ex: Candidature validée par le conseil du CED suite à la délibération de la commission..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsDecisionModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-2xs"
                >
                  Enregistrer et notifier le candidat
                </button>
              </div>
            </form>
          </div>
        </div>
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
