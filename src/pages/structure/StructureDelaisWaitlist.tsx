/**
 * DOCTORIA — Structure Director Registration Deadlines & Waitlist Management
 * Follow-up registration files, trigger deadline expiration cancellation,
 * track waitlist rankings, promote next candidate when seats become vacant.
 */

import React, { useState, useEffect } from 'react';
import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  UserCheck,
  ArrowUpRight,
  ShieldAlert,
  Calendar,
  X,
  Eye,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Candidature, DocumentItem } from '../../types';
import { StorageService, subscribeToStorage } from '../../services/storage';
import { ConfirmModal } from '../../components/ConfirmModal';
import { DocumentViewerModal } from '../../components/DocumentViewerModal';

export const StructureDelaisWaitlist: React.FC = () => {
  const { user } = useAuth();
  const [candidatures, setCandidatures] = useState<Candidature[]>([]);

  // Selected for deadline cancellation
  const [candToCancel, setCandToCancel] = useState<Candidature | null>(null);

  // Promote from waitlist modal
  const [candToPromote, setCandToPromote] = useState<Candidature | null>(null);
  const [newDeadline, setNewDeadline] = useState('');

  // Validate submitted registration file
  const [candToValidateFile, setCandToValidateFile] = useState<Candidature | null>(null);
  const [adminNotes, setAdminNotes] = useState('');

  // Document viewer modal
  const [viewingDoc, setViewingDoc] = useState<DocumentItem | null>(null);

  const loadData = () => {
    setCandidatures(StorageService.getCandidatures());
  };

  useEffect(() => {
    loadData();
    const unsub = subscribeToStorage(loadData);
    return unsub;
  }, []);

  useEffect(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    setNewDeadline(d.toISOString().split('T')[0]);
  }, []);

  if (!user) return null;

  const admittedList = candidatures.filter((c) => c.status === 'ADMISE');
  const waitlist = candidatures
    .filter((c) => c.status === 'LISTE_ATTENTE')
    .sort((a, b) => (a.waitlistRank || 99) - (b.waitlistRank || 99));
  const cancelledList = candidatures.filter((c) => c.status === 'ADMISSION_ANNULEE_DELAI_DEPASSE');

  // Trigger deadline expiration
  const handleConfirmCancelDeadline = () => {
    if (!candToCancel) return;
    try {
      StorageService.handleDeadlineExpired({
        candidatureId: candToCancel.id,
        author: user,
        justification: "Dossier d'inscription administrative non déposé dans le délai réglementaire.",
        moveToWaitlist: false,
      });
      setCandToCancel(null);
      alert("L'admission a été annulée pour dépassement de délai. La place est désormais libérée pour le candidat suivant.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur';
      alert(msg);
    }
  };

  // Promote next candidate from waitlist
  const handleConfirmPromote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!candToPromote) return;
    try {
      StorageService.promoteFromWaitlist({
        candidatureId: candToPromote.id,
        structureDirector: user,
        newRegistrationDeadline: newDeadline,
      });
      setCandToPromote(null);
      alert(`Le candidat a été repêché et admis. Nouvelle date limite d'inscription fixée au ${newDeadline}.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur';
      alert(msg);
    }
  };

  // Validate registration file
  const handleValidateRegistrationFile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!candToValidateFile) return;
    try {
      StorageService.validateRegistrationFile(candToValidateFile.id, user, adminNotes);
      setCandToValidateFile(null);
      setAdminNotes('');
      alert("Dossier d'inscription administrative validé avec succès. Le doctorant est officiellement inscrit.");
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
          Contrôle des Flux d'Inscription
        </span>
        <h2 className="text-xl font-bold text-slate-900 mt-0.5">
          Gestion des Délais & Listes d'Attente
        </h2>
        <p className="text-xs text-slate-500 mt-1 max-w-2xl">
          Supervisez le respect des dates limites d'inscription administrative, enregistrez les dépassements de délais libérant des places, et gérez les promotions sur liste d'attente.
        </p>
      </div>

      {/* Section 1: Admitted Candidates & Registration Progress */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Candidats admis — Contrôle des délais d'inscription ({admittedList.length})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Vérifiez le dépôt effectif des pièces administratives avant expiration.
            </p>
          </div>
        </div>

        {admittedList.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            Aucun candidat actuellement en cours d'inscription administrative.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {admittedList.map((cand) => {
              const deadlineStr = cand.structureReview?.registrationDeadline;
              const isPast = deadlineStr ? new Date() > new Date(deadlineStr) : false;
              const regStatus = cand.registrationFile?.status || 'NON_COMMENCEE';

              return (
                <div key={cand.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-slate-900">{cand.candidateName}</span>
                      {isPast && regStatus !== 'VALIDEE' && (
                        <span className="text-[11px] font-bold bg-rose-50 text-rose-700 px-2 py-0.5 rounded border border-rose-200 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Délai dépassé
                        </span>
                      )}
                    </div>

                    <h4 className="text-xs text-slate-600 line-clamp-1">{cand.subjectTitle}</h4>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-2">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        Date limite : <strong className="text-slate-800">{deadlineStr || 'Non fixée'}</strong>
                      </span>
                      <span>·</span>
                      <span>
                        Dossier :{' '}
                        {regStatus === 'VALIDEE' ? (
                          <strong className="text-emerald-700">Validé conforme</strong>
                        ) : regStatus === 'DOSSIER_DEPOSE' ? (
                          <strong className="text-blue-700">Déposé (à vérifier)</strong>
                        ) : (
                          <strong className="text-amber-700">En attente de pièces</strong>
                        )}
                      </span>
                    </div>

                    {/* View registration documents if deposited */}
                    {cand.registrationFile?.documents && Object.keys(cand.registrationFile.documents).length > 0 && (
                      <div className="flex items-center gap-2 mt-2">
                        {Object.entries(cand.registrationFile.documents).map(([cat, docId]) => {
                          const doc = StorageService.getDocumentById(docId);
                          return (
                            doc && (
                              <button
                                key={cat}
                                type="button"
                                onClick={() => setViewingDoc(doc)}
                                className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 font-semibold"
                              >
                                <Eye className="w-3 h-3" /> {doc.fileName}
                              </button>
                            )
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                    {regStatus === 'DOSSIER_DEPOSE' && (
                      <button
                        type="button"
                        onClick={() => setCandToValidateFile(cand)}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-2xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Valider l'inscription
                      </button>
                    )}

                    {regStatus !== 'VALIDEE' && (
                      <button
                        type="button"
                        onClick={() => setCandToCancel(cand)}
                        className="px-3 py-1.5 border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors"
                      >
                        <ShieldAlert className="w-3.5 h-3.5" />
                        Déclarer délai dépassé
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Section 2: Waitlists (Listes d'Attente) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Listes d'attente & Repêchage ({waitlist.length})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Classement par rang de mérite. Promouvez le candidat suivant en cas de place vacante.
            </p>
          </div>
        </div>

        {waitlist.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            Aucun candidat actuellement classé sur liste d'attente.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {waitlist.map((cand) => (
              <div key={cand.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-300 font-mono">
                      Rang {cand.waitlistRank || 1}
                    </span>
                    <span className="text-sm font-bold text-slate-900">{cand.candidateName}</span>
                  </div>

                  <h4 className="text-xs text-slate-600 line-clamp-1">{cand.subjectTitle}</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Contact candidat : {cand.candidateEmail} ({cand.candidatePhone || 'Sans téléphone'})
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setCandToPromote(cand)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-2xs shrink-0 self-start sm:self-center"
                >
                  <ArrowUpRight className="w-4 h-4" />
                  Repêcher & Admettre
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 3: Annulations pour dépassement de délai */}
      {cancelledList.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">
              Historique des annulations pour délai dépassé ({cancelledList.length})
            </h3>
          </div>
          <div className="divide-y divide-slate-100">
            {cancelledList.map((c) => (
              <div key={c.id} className="p-4 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-900">{c.candidateName}</span>
                  <span className="text-slate-400 mx-2">·</span>
                  <span className="text-slate-500">{c.subjectTitle}</span>
                </div>
                <span className="text-rose-700 font-bold bg-rose-50 px-2.5 py-0.5 rounded border border-rose-200">
                  Admission annulée (Délai expiré)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Promote Modal */}
      {candToPromote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Repêchage depuis la liste d'attente</h3>
                <p className="text-xs text-slate-500 mt-0.5">{candToPromote.candidateName} (Rang {candToPromote.waitlistRank})</p>
              </div>
              <button onClick={() => setCandToPromote(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmPromote} className="space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Une place s'est libérée pour le sujet « {candToPromote.subjectTitle} ». Ce candidat passera automatiquement au statut <strong>Admis</strong> et sera invité à déposer son dossier d'inscription.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Nouvelle date limite d'inscription fixée *
                </label>
                <input
                  type="date"
                  required
                  value={newDeadline}
                  onChange={(e) => setNewDeadline(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCandToPromote(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-2xs"
                >
                  Confirmer le repêchage
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Validate Registration File Modal */}
      {candToValidateFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Validation du dossier d'inscription</h3>
                <p className="text-xs text-slate-500 mt-0.5">{candToValidateFile.candidateName}</p>
              </div>
              <button onClick={() => setCandToValidateFile(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleValidateRegistrationFile} className="space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Confirmez-vous que les pièces administratives fournies (charte des thèses signée, engagement, attestation d'assurance) sont complètes et conformes ?
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Observations administratives (Optionnel)
                </label>
                <textarea
                  rows={2}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Ex: Dossier physique complet reçu au secrétariat du CED..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCandToValidateFile(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-2xs"
                >
                  Valider définitivement l'inscription
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Deadline Cancellation Modal */}
      {candToCancel && (
        <ConfirmModal
          isOpen={!!candToCancel}
          title="Déclarer le dépassement de délai ?"
          message={`Le candidat « ${candToCancel.candidateName} » n'a pas finalisé son inscription pour « ${candToCancel.subjectTitle} ». Son admission sera annulée et la place libérée.`}
          confirmLabel="Annuler l'admission"
          cancelLabel="Retour"
          isDestructive={true}
          onConfirm={handleConfirmCancelDeadline}
          onCancel={() => setCandToCancel(null)}
        />
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
