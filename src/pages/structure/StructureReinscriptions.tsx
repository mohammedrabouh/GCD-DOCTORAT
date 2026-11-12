/**
 * DOCTORIA — Structure Director Annual Re-enrollments Validation
 * Verify the 3 mandatory regulatory documents, review supervisor's opinion,
 * take final administrative acceptance or rejection decision with justification.
 */

import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  Eye,
  CheckCircle2,
  XCircle,
  FileText,
  Clock,
  X,
  User,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ReinscriptionRequest, DocumentItem } from '../../types';
import { StorageService, subscribeToStorage } from '../../services/storage';
import { REINSCRIPTION_STATUS_CONFIG } from '../../constants';
import { DocumentViewerModal } from '../../components/DocumentViewerModal';

export const StructureReinscriptions: React.FC = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<ReinscriptionRequest[]>([]);
  const [selectedReq, setSelectedReq] = useState<ReinscriptionRequest | null>(null);

  // Decision modal
  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState(false);
  const [decisionType, setDecisionType] = useState<'VALIDEE' | 'REFUSEE'>('VALIDEE');
  const [justification, setJustification] = useState('');

  // Document viewer modal
  const [viewingDoc, setViewingDoc] = useState<DocumentItem | null>(null);

  const loadData = () => {
    setRequests(StorageService.getReinscriptionsForStructure());
  };

  useEffect(() => {
    loadData();
    const unsub = subscribeToStorage(loadData);
    return unsub;
  }, []);

  if (!user) return null;

  const handleDecisionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReq) return;
    if (!justification.trim()) {
      alert('Une justification motivée est requise pour formaliser la décision du CED.');
      return;
    }

    try {
      StorageService.reviewReinscriptionByStructure({
        reinscriptionId: selectedReq.id,
        structureDirector: user,
        decision: decisionType,
        justification: justification.trim(),
      });
      setIsDecisionModalOpen(false);
      setSelectedReq(null);
      setJustification('');
      alert(`La réinscription a été ${decisionType === 'VALIDEE' ? 'validée' : 'refusée'} et le doctorant a été notifié.`);
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
          Gouvernance Pédagogique
        </span>
        <h2 className="text-xl font-bold text-slate-900 mt-0.5">
          Validation des Réinscriptions Annuelles
        </h2>
        <p className="text-xs text-slate-500 mt-1 max-w-2xl">
          Contrôlez la conformité des 3 pièces obligatoires (rapport d'avancement, avis motivé du DT et relevé des formations doctorales) avant d'octroyer la réinscription administrative.
        </p>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">
            Dossiers de réinscription reçus ({requests.length})
          </h3>
        </div>

        {requests.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            Aucun dossier de réinscription annuelle en attente.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {requests.map((req) => {
              const cfg = REINSCRIPTION_STATUS_CONFIG[req.status];
              return (
                <div key={req.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${cfg.bgClass} ${cfg.textClass} ${cfg.borderClass}`}>
                        {cfg.label}
                      </span>
                      <span className="text-sm font-bold text-slate-900">{req.candidateName}</span>
                      <span className="text-xs font-semibold text-slate-500">
                        ({req.doctoralYear}ème Année Doctorale)
                      </span>
                    </div>

                    <h4 className="text-xs text-slate-700 font-medium line-clamp-1">
                      Thèse : {req.subjectTitle}
                    </h4>

                    {req.supervisorReview ? (
                      <div className="mt-1 text-xs text-slate-600">
                        Avis du DT ({req.supervisorReview.supervisorName}) :{' '}
                        <strong className={req.supervisorReview.avis === 'FAVORABLE' ? 'text-teal-700' : 'text-rose-700'}>
                          {req.supervisorReview.avis}
                        </strong>{' '}
                        — « {req.supervisorReview.observation} »
                      </div>
                    ) : (
                      <p className="text-[11px] text-amber-700 italic mt-1">
                        En attente de l'avis formel du directeur de thèse.
                      </p>
                    )}

                    {/* View the 3 mandatory documents */}
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px]">
                      <button
                        type="button"
                        onClick={() => {
                          const d = StorageService.getDocumentById(req.rapportAvancementDocId);
                          if (d) setViewingDoc(d);
                        }}
                        className="text-blue-600 hover:underline flex items-center gap-1 font-semibold"
                      >
                        <Eye className="w-3 h-3" /> 1. Rapport d'avancement
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const d = StorageService.getDocumentById(req.avisDirecteurDocId);
                          if (d) setViewingDoc(d);
                        }}
                        className="text-blue-600 hover:underline flex items-center gap-1 font-semibold"
                      >
                        <Eye className="w-3 h-3" /> 2. Avis motivé DT
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const d = StorageService.getDocumentById(req.formationsDoctoralesDocId);
                          if (d) setViewingDoc(d);
                        }}
                        className="text-blue-600 hover:underline flex items-center gap-1 font-semibold"
                      >
                        <Eye className="w-3 h-3" /> 3. Relevé formations
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                    {(req.status === 'AVIS_DT_FAVORABLE' || req.status === 'AVIS_DT_DEFAVORABLE') && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedReq(req);
                          setDecisionType(req.status === 'AVIS_DT_FAVORABLE' ? 'VALIDEE' : 'REFUSEE');
                          setIsDecisionModalOpen(true);
                        }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-2xs"
                      >
                        Statuer définitivement
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Decision Modal */}
      {isDecisionModalOpen && selectedReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Décision Finale de Réinscription</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Doctorant : {selectedReq.candidateName} ({selectedReq.doctoralYear}ème année)
                </p>
              </div>
              <button onClick={() => setIsDecisionModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDecisionSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  Décision administrative de structure *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setDecisionType('VALIDEE')}
                    className={`py-2 px-3 text-xs font-bold rounded-lg border flex items-center justify-center gap-1.5 ${
                      decisionType === 'VALIDEE'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Valider la réinscription
                  </button>
                  <button
                    type="button"
                    onClick={() => setDecisionType('REFUSEE')}
                    className={`py-2 px-3 text-xs font-bold rounded-lg border flex items-center justify-center gap-1.5 ${
                      decisionType === 'REFUSEE'
                        ? 'bg-rose-50 border-rose-500 text-rose-800'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <XCircle className="w-4 h-4 text-rose-600" />
                    Refuser la réinscription
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Justification ou visa du Directeur de Structure *
                </label>
                <textarea
                  required
                  rows={4}
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  placeholder="Ex: Réinscription en année supérieure validée suite à l'examen favorable du rapport d'avancement et des heures de formation doctorale validées..."
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
                  Confirmer la décision
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
