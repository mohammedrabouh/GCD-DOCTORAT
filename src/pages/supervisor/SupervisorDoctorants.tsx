/**
 * DOCTORIA — Thesis Supervisor Doctorants & Re-enrollments Tracking
 * Track assigned doctorants, examine annual re-enrollment requests,
 * deliver favorable/unfavorable scientific opinion with observation.
 */

import React, { useState, useEffect } from 'react';
import {
  Award,
  RefreshCw,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  X,
  FileText,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ReinscriptionRequest, Candidature, DocumentItem } from '../../types';
import { StorageService, subscribeToStorage } from '../../services/storage';
import { REINSCRIPTION_STATUS_CONFIG } from '../../constants';
import { DocumentViewerModal } from '../../components/DocumentViewerModal';

export const SupervisorDoctorants: React.FC = () => {
  const { user } = useAuth();
  const [reinscriptions, setReinscriptions] = useState<ReinscriptionRequest[]>([]);
  const [admittedDoctorants, setAdmittedDoctorants] = useState<Candidature[]>([]);

  // Selected request for opinion
  const [selectedReq, setSelectedReq] = useState<ReinscriptionRequest | null>(null);
  const [opinionType, setOpinionType] = useState<'FAVORABLE' | 'DEFAVORABLE'>('FAVORABLE');
  const [observation, setObservation] = useState('');
  const [isOpinionModalOpen, setIsOpinionModalOpen] = useState(false);

  // Document viewer modal
  const [viewingDoc, setViewingDoc] = useState<DocumentItem | null>(null);

  const loadData = () => {
    if (!user) return;
    setReinscriptions(StorageService.getReinscriptionsForSupervisor(user.id));
    const allCands = StorageService.getCandidaturesForSupervisor(user.id);
    setAdmittedDoctorants(allCands.filter((c) => c.status === 'ADMISE'));
  };

  useEffect(() => {
    loadData();
    const unsub = subscribeToStorage(loadData);
    return unsub;
  }, [user]);

  if (!user) return null;

  const handleSubmitOpinion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReq) return;
    if (!observation.trim()) {
      alert('Une observation scientifique est requise pour formaliser votre avis.');
      return;
    }

    try {
      StorageService.reviewReinscriptionBySupervisor({
        reinscriptionId: selectedReq.id,
        supervisor: user,
        avis: opinionType,
        observation: observation.trim(),
      });
      setIsOpinionModalOpen(false);
      setSelectedReq(null);
      setObservation('');
      alert('Votre avis de directeur de thèse a été émis et transmis à la Direction de Structure.');
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
          Encadrement & Progression Scientifique
        </span>
        <h2 className="text-xl font-bold text-slate-900 mt-0.5">
          Doctorants Encadrés & Avis de Réinscription
        </h2>
        <p className="text-xs text-slate-500 mt-1 max-w-2xl">
          Évaluez les rapports annuels d'avancement de vos doctorants et émettez un avis motivé. La décision administrative finale relève du Directeur de Structure.
        </p>
      </div>

      {/* Section 1: Annual Re-enrollment Requests */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">
            Demandes de réinscription annuelle ({reinscriptions.length})
          </h3>
        </div>

        {reinscriptions.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            Aucune demande de réinscription annuelle en attente d'avis pour vos doctorants.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {reinscriptions.map((req) => {
              const cfg = REINSCRIPTION_STATUS_CONFIG[req.status];
              return (
                <div key={req.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${cfg.bgClass} ${cfg.textClass} ${cfg.borderClass}`}>
                        {cfg.label}
                      </span>
                      <span className="text-sm font-bold text-slate-900">{req.candidateName}</span>
                      <span className="text-xs text-slate-500">({req.doctoralYear}ème Année)</span>
                    </div>

                    <h4 className="text-xs text-slate-700 font-medium truncate max-w-xl">
                      {req.subjectTitle}
                    </h4>

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
                        <Eye className="w-3 h-3" /> 2. Formulaire d'avis
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

                    {req.supervisorReview && (
                      <div className="mt-2 text-xs bg-slate-50 p-2 rounded border border-slate-200">
                        <strong>Votre avis émis :</strong> {req.supervisorReview.avis} — « {req.supervisorReview.observation} »
                      </div>
                    )}
                  </div>

                  {req.status === 'SOUMISE' && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedReq(req);
                        setIsOpinionModalOpen(true);
                      }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-2xs self-start sm:self-center shrink-0"
                    >
                      Émettre mon avis
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Section 2: Assigned Admitted Doctorants */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">
            Doctorants admis en encadrement ({admittedDoctorants.length})
          </h3>
        </div>

        {admittedDoctorants.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            Aucun doctorant admis officiellement pour le moment.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {admittedDoctorants.map((doc) => (
              <div key={doc.id} className="p-4 sm:px-6 flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900">{doc.candidateName}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">{doc.subjectTitle}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Contact : {doc.candidateEmail}</p>
                </div>
                <span className="text-xs bg-emerald-50 text-emerald-800 font-semibold px-2.5 py-1 rounded-md border border-emerald-200">
                  Admis au doctorat
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Opinion Modal */}
      {isOpinionModalOpen && selectedReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Avis de réinscription annuelle</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Doctorant : {selectedReq.candidateName} ({selectedReq.doctoralYear}ème année)
                </p>
              </div>
              <button onClick={() => setIsOpinionModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitOpinion} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  Nature de l'avis scientifique *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setOpinionType('FAVORABLE')}
                    className={`py-2 px-3 text-xs font-bold rounded-lg border flex items-center justify-center gap-1.5 ${
                      opinionType === 'FAVORABLE'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Avis Favorable
                  </button>
                  <button
                    type="button"
                    onClick={() => setOpinionType('DEFAVORABLE')}
                    className={`py-2 px-3 text-xs font-bold rounded-lg border flex items-center justify-center gap-1.5 ${
                      opinionType === 'DEFAVORABLE'
                        ? 'bg-rose-50 border-rose-500 text-rose-800 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <XCircle className="w-4 h-4 text-rose-600" />
                    Avis Défavorable
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Observations et justifications scientifiques *
                </label>
                <textarea
                  required
                  rows={4}
                  value={observation}
                  onChange={(e) => setObservation(e.target.value)}
                  placeholder="Exposez l'état d'avancement des expérimentations, l'assiduité du doctorant et les perspectives de soutenance..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsOpinionModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-2xs"
                >
                  Enregistrer et transmettre l'avis
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
