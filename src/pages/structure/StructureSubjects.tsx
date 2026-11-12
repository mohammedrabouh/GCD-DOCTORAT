/**
 * DOCTORIA — Structure Director Subjects Accreditation & Publication
 * Review submitted thesis subjects, validate & sign, refuse with justification,
 * and publish validated subjects into the public catalogue.
 */

import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  CheckCircle2,
  XCircle,
  Eye,
  Send,
  Building2,
  User,
  X,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ThesisSubject, SubjectStatus } from '../../types';
import { StorageService, subscribeToStorage } from '../../services/storage';
import { SUBJECT_STATUS_CONFIG } from '../../constants';

export const StructureSubjects: React.FC = () => {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<ThesisSubject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<ThesisSubject | null>(null);

  // Action Modals
  const [isValidateModalOpen, setIsValidateModalOpen] = useState(false);
  const [isRefuseModalOpen, setIsRefuseModalOpen] = useState(false);
  const [justification, setJustification] = useState('');

  const loadData = () => {
    setSubjects(StorageService.getSubjects());
  };

  useEffect(() => {
    loadData();
    const unsub = subscribeToStorage(loadData);
    return unsub;
  }, []);

  if (!user) return null;

  const handleValidateAndPublish = (e: React.FormEvent, publishImmediately: boolean) => {
    e.preventDefault();
    if (!selectedSubject) return;

    try {
      const targetStatus: SubjectStatus = publishImmediately ? 'PUBLIE' : 'VALIDE';
      StorageService.changeSubjectStatus(
        selectedSubject.id,
        targetStatus,
        justification.trim() || 'Sujet validé et conforme aux axes de recherche prioritaires du pôle doctoral.',
        user
      );
      setIsValidateModalOpen(false);
      setSelectedSubject(null);
      setJustification('');
      alert(
        publishImmediately
          ? 'Le sujet a été validé, signé et immédiatement publié dans le catalogue public.'
          : 'Le sujet a été validé et signé. Vous pourrez le publier au catalogue ultérieurement.'
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur';
      alert(msg);
    }
  };

  const handleRefuse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubject) return;
    if (!justification.trim()) {
      alert('Une justification motivée est obligatoire pour refuser un sujet de thèse.');
      return;
    }

    try {
      StorageService.changeSubjectStatus(
        selectedSubject.id,
        'REFUSE',
        justification.trim(),
        user
      );
      setIsRefuseModalOpen(false);
      setSelectedSubject(null);
      setJustification('');
      alert('Le sujet a été refusé et le directeur de thèse a été notifié.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur';
      alert(msg);
    }
  };

  const handlePublishDirect = (subjId: string) => {
    try {
      StorageService.changeSubjectStatus(
        subjId,
        'PUBLIE',
        'Publication au catalogue officiel des thèses par la direction du CED.',
        user
      );
      alert('Le sujet est désormais accessible dans le catalogue public aux candidats.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur';
      alert(msg);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">
            Accréditation & Publication
          </span>
          <h2 className="text-xl font-bold text-slate-900 mt-0.5">
            Validation des Sujets de Thèse
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Examinez la conformité scientifique et matérielle des propositions formulées par les directeurs de thèse, signez les agréments et publiez les sujets.
          </p>
        </div>
      </div>

      {/* Subjects List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">
            Ensemble des propositions ({subjects.length})
          </h3>
        </div>

        <div className="divide-y divide-slate-100">
          {subjects.map((subj) => {
            const statusCfg = SUBJECT_STATUS_CONFIG[subj.status];
            return (
              <div
                key={subj.id}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="font-mono text-xs font-bold text-blue-700">{subj.code}</span>
                    <span aria-hidden="true">·</span>
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded border ${statusCfg.bgClass} ${statusCfg.textClass} ${statusCfg.borderClass}`}
                    >
                      {statusCfg.label}
                    </span>
                    <span className="text-xs text-slate-500 font-semibold">
                      {subj.discipline}
                    </span>
                  </div>

                  <h4
                    onClick={() => setSelectedSubject(subj)}
                    className="text-sm font-bold text-slate-900 hover:text-blue-600 cursor-pointer leading-snug line-clamp-1"
                  >
                    {subj.title}
                  </h4>

                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                    <span>Proposé par : <strong>{subj.supervisorName}</strong></span>
                    <span>·</span>
                    <span className="tabular-nums font-semibold">{subj.availableSeats} place(s)</span>
                  </div>

                  {subj.validationComment && (
                    <p className="text-xs text-slate-600 italic mt-1.5 bg-slate-50 p-2 rounded border border-slate-200">
                      Observation : « {subj.validationComment} »
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                  {subj.status === 'SOUMIS_VALIDATION' && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSubject(subj);
                          setIsRefuseModalOpen(true);
                        }}
                        className="px-3 py-1.5 border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-bold rounded-lg transition-colors"
                      >
                        Refuser
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSubject(subj);
                          setIsValidateModalOpen(true);
                        }}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-2xs transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Valider & Signer
                      </button>
                    </>
                  )}

                  {subj.status === 'VALIDE' && (
                    <button
                      type="button"
                      onClick={() => handlePublishDirect(subj.id)}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-2xs"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Publier au catalogue
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setSelectedSubject(subj)}
                    className="p-2 border border-slate-200 hover:bg-white text-slate-600 rounded-lg"
                    title="Voir détails"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Validate & Sign Modal */}
      {isValidateModalOpen && selectedSubject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Validation et Signature du Sujet</h3>
                <p className="text-xs text-slate-500 mt-0.5">{selectedSubject.title}</p>
              </div>
              <button onClick={() => setIsValidateModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Commentaire ou visa d'accréditation
                </label>
                <textarea
                  rows={3}
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  placeholder="Ex: Sujet accrédité conforme à la stratégie scientifique du centre doctoral..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsValidateModalOpen(false)}
                  className="px-3 py-2 text-xs font-semibold text-slate-600"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={(e) => handleValidateAndPublish(e, false)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-bold rounded-lg"
                >
                  Valider uniquement
                </button>
                <button
                  type="button"
                  onClick={(e) => handleValidateAndPublish(e, true)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-2xs"
                >
                  Valider et Publier immédiatement
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Refuse Modal */}
      {isRefuseModalOpen && selectedSubject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-rose-950">Refuser le Sujet de Thèse</h3>
                <p className="text-xs text-rose-800 mt-0.5">{selectedSubject.title}</p>
              </div>
              <button onClick={() => setIsRefuseModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRefuse} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Justification formelle du refus *
                </label>
                <textarea
                  required
                  rows={4}
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  placeholder="Ex: Chevauchement avec un projet doctoral en cours ou moyens expérimentaux indisponibles..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRefuseModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg shadow-2xs"
                >
                  Confirmer le refus
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {selectedSubject && !isValidateModalOpen && !isRefuseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="font-mono text-xs font-bold text-blue-700">{selectedSubject.code}</span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">{selectedSubject.title}</h3>
              </div>
              <button onClick={() => setSelectedSubject(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-700 space-y-2 bg-slate-50 p-4 rounded-lg border border-slate-200">
              <p><strong>Directeur :</strong> {selectedSubject.supervisorName}</p>
              <p><strong>Discipline :</strong> {selectedSubject.discipline}</p>
              <p><strong>Description :</strong> {selectedSubject.description}</p>
              <p><strong>Prérequis :</strong> {selectedSubject.requirements}</p>
              <p><strong>Mots-clés :</strong> {selectedSubject.keywords.join(', ')}</p>
            </div>

            <div className="text-right">
              <button
                type="button"
                onClick={() => setSelectedSubject(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
