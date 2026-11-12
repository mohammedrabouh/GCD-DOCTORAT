/**
 * DOCTORIA — Candidate Candidatures & Drafts Management
 * Complete workflow: Start application, Save/resume draft, Delete draft with ConfirmModal,
 * Submit definitively, View corrections & upload missing docs, View decisions & audit history.
 */

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Send,
  Eye,
  Plus,
  BookOpen,
  Calendar,
  FolderOpen,
  Upload,
  Camera,
  History,
  X,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  Candidature,
  ThesisSubject,
  DoctoralCampaign,
  DocumentItem,
  DocumentCategory,
} from '../../types';
import { StorageService, subscribeToStorage } from '../../services/storage';
import { CANDIDATURE_STATUS_CONFIG, DOCUMENT_CATEGORIES } from '../../constants';
import { DocumentCaptureModal } from '../../components/DocumentCaptureModal';
import { DocumentViewerModal } from '../../components/DocumentViewerModal';
import { ConfirmModal } from '../../components/ConfirmModal';

interface CandidateCandidaturesProps {
  onNavigateTab: (tab: string) => void;
  preSelectedSubject?: ThesisSubject | null;
  onClearPreSelectedSubject?: () => void;
}

export const CandidateCandidatures: React.FC<CandidateCandidaturesProps> = ({
  onNavigateTab,
  preSelectedSubject,
  onClearPreSelectedSubject,
}) => {
  const { user } = useAuth();
  const [candidatures, setCandidatures] = useState<Candidature[]>([]);
  const [subjects, setSubjects] = useState<ThesisSubject[]>([]);
  const [campaign, setCampaign] = useState<DoctoralCampaign | undefined>(undefined);
  const [userDocs, setUserDocs] = useState<DocumentItem[]>([]);

  // Active view: list or detail/edit
  const [selectedCandidature, setSelectedCandidature] = useState<Candidature | null>(null);

  // New Application Modal / Drawer
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newSubjectId, setNewSubjectId] = useState<string>('');

  // Delete draft modal
  const [draftToDelete, setDraftToDelete] = useState<Candidature | null>(null);

  // Document modals
  const [captureCategory, setCaptureCategory] = useState<DocumentCategory | null>(null);
  const [viewingDoc, setViewingDoc] = useState<DocumentItem | null>(null);

  // Correction response state
  const [correctionDocs, setCorrectionDocs] = useState<Record<string, string>>({});

  const loadData = () => {
    if (!user) return;
    const userCands = StorageService.getCandidaturesForCandidate(user.id);
    setCandidatures(userCands);
    setSubjects(StorageService.getPublishedSubjects());
    setCampaign(StorageService.getActiveCampaign());
    setUserDocs(StorageService.getDocumentsByOwner(user.id));

    // Keep selected candidature fresh
    if (selectedCandidature) {
      const fresh = userCands.find((c) => c.id === selectedCandidature.id);
      if (fresh) setSelectedCandidature(fresh);
    }
  };

  useEffect(() => {
    loadData();
    const unsub = subscribeToStorage(loadData);
    return unsub;
  }, [user]);

  // Handle incoming preSelectedSubject from Catalogue
  useEffect(() => {
    if (preSelectedSubject && user && campaign) {
      // Check if already applied
      const existing = StorageService.getCandidaturesForCandidate(user.id).find(
        (c) => c.subjectId === preSelectedSubject.id && c.campaignId === campaign.id
      );
      if (existing) {
        setSelectedCandidature(existing);
      } else {
        // Start draft directly for this subject
        try {
          const draft = StorageService.saveDraftCandidature({
            candidate: user,
            subject: preSelectedSubject,
            campaignId: campaign.id,
            documents: {},
          });
          setSelectedCandidature(draft);
        } catch (err) {
          console.error(err);
        }
      }
      if (onClearPreSelectedSubject) onClearPreSelectedSubject();
    }
  }, [preSelectedSubject, user, campaign, onClearPreSelectedSubject]);

  if (!user) return null;

  // Start new draft from modal
  const handleCreateDraft = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectId || !campaign) return;

    const targetSubj = subjects.find((s) => s.id === newSubjectId);
    if (!targetSubj) return;

    try {
      const draft = StorageService.saveDraftCandidature({
        candidate: user,
        subject: targetSubj,
        campaignId: campaign.id,
        documents: {},
      });
      setIsNewModalOpen(false);
      setNewSubjectId('');
      setSelectedCandidature(draft);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de la création.';
      alert(msg);
    }
  };

  // Attach an existing document from library or new one to current candidature
  const handleAttachDocument = (category: DocumentCategory, docId: string) => {
    if (!selectedCandidature) return;

    const updatedDocuments = {
      ...selectedCandidature.documents,
      [category]: docId,
    };

    // Update in storage if draft
    if (selectedCandidature.isDraft) {
      const targetSubj = subjects.find((s) => s.id === selectedCandidature.subjectId) || {
        id: selectedCandidature.subjectId,
        title: selectedCandidature.subjectTitle,
        supervisorId: selectedCandidature.supervisorId,
        laboratoryId: selectedCandidature.laboratoryId,
        establishmentId: selectedCandidature.establishmentId,
      } as ThesisSubject;

      const updated = StorageService.saveDraftCandidature({
        candidate: user,
        subject: targetSubj,
        campaignId: selectedCandidature.campaignId,
        documents: updatedDocuments,
      });
      setSelectedCandidature(updated);
    } else {
      // Temporarily store for correction
      setCorrectionDocs((prev) => ({ ...prev, [category]: docId }));
    }
  };

  // Submit candidature definitively
  const handleSubmitFinal = (candId: string) => {
    if (!campaign) {
      alert("Aucune campagne doctorale n'est ouverte.");
      return;
    }

    // Verify required documents
    const requiredCats: DocumentCategory[] = ['CIN', 'BAC', 'LICENCE', 'MASTER', 'RELEVES_NOTES', 'CV', 'PROJET_RECHERCHE'];
    const currentDocs = selectedCandidature?.documents || {};
    const missing = requiredCats.filter((cat) => !currentDocs[cat]);

    if (missing.length > 0) {
      const missingNames = missing.map((m) => DOCUMENT_CATEGORIES[m]?.label || m).join('\n• ');
      alert(`Pièces obligatoires manquantes avant soumission définitive :\n• ${missingNames}`);
      return;
    }

    try {
      const submitted = StorageService.submitCandidature(candId, user);
      setSelectedCandidature(submitted);
      alert('Votre candidature a été officiellement soumise au Directeur de Thèse.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur de soumission.';
      alert(msg);
    }
  };

  // Submit corrections
  const handleResolveCorrections = () => {
    if (!selectedCandidature) return;
    if (Object.keys(correctionDocs).length === 0) {
      alert('Veuillez joindre au moins une pièce demandée pour valider la correction.');
      return;
    }

    try {
      const updated = StorageService.resolveCorrection(selectedCandidature.id, user, correctionDocs);
      setSelectedCandidature(updated);
      setCorrectionDocs({});
      alert('Vos pièces complémentaires ont été transmises avec succès au directeur.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur.';
      alert(msg);
    }
  };

  // Delete draft confirmation
  const handleConfirmDeleteDraft = () => {
    if (!draftToDelete) return;
    try {
      StorageService.deleteDraft(draftToDelete.id, user);
      if (selectedCandidature?.id === draftToDelete.id) {
        setSelectedCandidature(null);
      }
      setDraftToDelete(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de la suppression.';
      alert(msg);
    }
  };

  // Mandatory candidature categories
  const MANDATORY_DOCS: DocumentCategory[] = [
    'CIN',
    'BAC',
    'LICENCE',
    'MASTER',
    'RELEVES_NOTES',
    'CV',
    'PROJET_RECHERCHE',
    'LETTRE_MOTIVATION',
  ];

  return (
    <div className="space-y-6">
      {/* Detail or Edit View */}
      {selectedCandidature ? (
        <div className="space-y-6">
          {/* Back link & Title */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setSelectedCandidature(null)}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1"
            >
              ← Retour à mes candidatures
            </button>

            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-bold px-2.5 py-1 rounded-md border ${
                  CANDIDATURE_STATUS_CONFIG[selectedCandidature.status].bgClass
                } ${CANDIDATURE_STATUS_CONFIG[selectedCandidature.status].textClass} ${
                  CANDIDATURE_STATUS_CONFIG[selectedCandidature.status].borderClass
                }`}
              >
                {CANDIDATURE_STATUS_CONFIG[selectedCandidature.status].label}
              </span>
            </div>
          </div>

          {/* Dossier Summary Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
            <div>
              <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">
                Dossier de candidature doctorale
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 mt-0.5">
                {selectedCandidature.subjectTitle}
              </h2>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-2">
                <span>Directeur de thèse : <strong className="text-slate-700">Professeur responsable</strong></span>
                <span aria-hidden="true">·</span>
                <span>
                  Date de dépôt :{' '}
                  <strong className="text-slate-700">
                    {selectedCandidature.submissionDate
                      ? new Date(selectedCandidature.submissionDate).toLocaleDateString('fr-FR')
                      : 'Brouillon non soumis'}
                  </strong>
                </span>
              </div>
            </div>

            {/* If correction requested banner */}
            {selectedCandidature.status === 'CORRECTION_DEMANDEE' && (
              <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl space-y-3">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-amber-900">Demande de correction du dossier</h4>
                    {selectedCandidature.corrections
                      .filter((c) => !c.resolved)
                      .map((c) => (
                        <div key={c.id} className="mt-1 text-xs text-amber-800 space-y-1">
                          <p className="font-semibold">« {c.message} »</p>
                          <p className="text-[11px] text-amber-700">
                            Pièces demandées : {c.requestedDocuments.join(', ')} (demandé le{' '}
                            {new Date(c.requestedAt).toLocaleDateString('fr-FR')})
                          </p>
                        </div>
                      ))}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2 border-t border-amber-200">
                  <button
                    type="button"
                    onClick={handleResolveCorrections}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg shadow-2xs"
                  >
                    Valider et renvoyer les corrections
                  </button>
                </div>
              </div>
            )}

            {/* If Draft, Action Buttons */}
            {selectedCandidature.isDraft && (
              <div className="p-4 bg-blue-50/50 border border-blue-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-xs text-blue-900">
                  <p className="font-bold">Ce dossier est actuellement au statut Brouillon.</p>
                  <p className="text-blue-700 mt-0.5">
                    Assurez-vous d'avoir joint l'ensemble des pièces obligatoires avant de le soumettre définitivement.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setDraftToDelete(selectedCandidature)}
                    className="px-3 py-2 border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Supprimer ce brouillon
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSubmitFinal(selectedCandidature.id)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-2xs transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Soumettre définitivement
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Documents Checklist for this Application */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Pièces justificatives du dossier</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Joignez vos documents numérisés ou photographiez-les directement avec votre caméra.
                </p>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {MANDATORY_DOCS.map((cat) => {
                const docId =
                  selectedCandidature.documents[cat] ||
                  correctionDocs[cat];
                const attachedDoc = docId ? StorageService.getDocumentById(docId) : null;
                const catMeta = DOCUMENT_CATEGORIES[cat];

                return (
                  <div key={cat} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="max-w-md">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{catMeta.label}</span>
                        {catMeta.requiredForCandidature && (
                          <span className="text-[10px] text-rose-600 font-bold uppercase tracking-wider">
                            Obligatoire
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{catMeta.description}</p>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                      {attachedDoc ? (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setViewingDoc(attachedDoc)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5 text-blue-600" />
                            <span className="truncate max-w-[130px]">{attachedDoc.fileName}</span>
                          </button>

                          {/* Allow replace if draft or correction requested */}
                          {(selectedCandidature.isDraft || selectedCandidature.status === 'CORRECTION_DEMANDEE') && (
                            <button
                              type="button"
                              onClick={() => setCaptureCategory(cat)}
                              className="text-xs text-blue-600 hover:underline font-semibold"
                            >
                              Remplacer
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          {/* Pick from existing documents or scan new */}
                          <button
                            type="button"
                            onClick={() => setCaptureCategory(cat)}
                            className="px-3 py-1.5 border border-dashed border-blue-400 bg-blue-50/50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Déposer la pièce
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Audit History Timeline */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <History className="w-4 h-4 text-slate-400" />
              Historique et traçabilité des décisions
            </h3>

            <div className="space-y-4 relative pl-4 border-l-2 border-slate-200">
              {selectedCandidature.history.map((entry, idx) => (
                <div key={idx} className="relative">
                  <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-blue-600 border-2 border-white" />
                  <div className="text-xs">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span>{entry.toStatus}</span>
                      <span className="text-slate-400 font-normal">·</span>
                      <span className="text-slate-500 font-normal">
                        {new Date(entry.timestamp).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-slate-600 mt-0.5 leading-relaxed">
                      Par <strong className="text-slate-800">{entry.authorName}</strong> ({entry.authorRole})
                      {entry.justification && ` : « ${entry.justification} »`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* List View of all candidatures & drafts */
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Mes Candidatures au Doctorat</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Consultez l'avancement de vos dossiers, gérez vos brouillons et répondez aux demandes d'examen.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsNewModalOpen(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs transition-colors"
              >
                <Plus className="w-4 h-4" />
                Déposer une nouvelle candidature
              </button>
            </div>
          </div>

          {candidatures.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-900">Aucune candidature enregistrée</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                Vous n'avez pas encore sélectionné de sujet pour la campagne doctorale active.
              </p>
              <button
                type="button"
                onClick={() => onNavigateTab('catalogue')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5"
              >
                <BookOpen className="w-3.5 h-3.5" />
                Explorer le catalogue des sujets
              </button>
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
                      <div className="flex items-center gap-2 mb-1.5">
                        <span
                          className={`text-xs font-bold px-2.5 py-0.5 rounded-md border ${statusCfg.bgClass} ${statusCfg.textClass} ${statusCfg.borderClass}`}
                        >
                          {statusCfg.label}
                        </span>
                        {cand.isDraft && (
                          <span className="text-[11px] text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            Brouillon
                          </span>
                        )}
                        {cand.status === 'LISTE_ATTENTE' && cand.waitlistRank && (
                          <span className="text-[11px] text-slate-600 font-semibold">
                            (Rang : {cand.waitlistRank})
                          </span>
                        )}
                      </div>

                      <h3
                        onClick={() => setSelectedCandidature(cand)}
                        className="text-base font-bold text-slate-900 hover:text-blue-600 cursor-pointer leading-snug line-clamp-1"
                      >
                        {cand.subjectTitle}
                      </h3>

                      <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                        {statusCfg.description}
                      </p>

                      <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-2">
                        <span>
                          Modifié le{' '}
                          {new Date(cand.updatedAt).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                        <span>·</span>
                        <span>{Object.keys(cand.documents || {}).length} pièce(s) jointe(s)</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                      {cand.isDraft && (
                        <button
                          type="button"
                          onClick={() => setDraftToDelete(cand)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Supprimer ce brouillon"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setSelectedCandidature(cand)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-2xs transition-colors"
                      >
                        {cand.isDraft ? 'Reprendre le brouillon' : 'Consulter le dossier'}
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal: Start New Candidature */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Nouvelle candidature</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Sélectionnez un sujet publié dans le catalogue de la campagne active.
                </p>
              </div>
              <button
                onClick={() => setIsNewModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDraft} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Sujet de thèse accrédité *
                </label>
                <select
                  required
                  value={newSubjectId}
                  onChange={(e) => setNewSubjectId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Choisissez un sujet de thèse --</option>
                  {subjects.map((subj) => (
                    <option key={subj.id} value={subj.id}>
                      [{subj.code}] {subj.title} ({subj.discipline})
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-blue-50 p-3 rounded-lg text-xs text-blue-800 leading-relaxed">
                <span className="font-bold block mb-0.5">Règle de candidature :</span>
                Le dossier sera initialement créé au statut Brouillon. Vous pourrez téléverser vos pièces justificatives à votre rythme avant la soumission définitive.
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={!newSubjectId}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-lg shadow-2xs"
                >
                  Créer le dossier brouillon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Camera / Upload Document Modal */}
      {captureCategory && (
        <DocumentCaptureModal
          isOpen={!!captureCategory}
          onClose={() => setCaptureCategory(null)}
          category={captureCategory}
          currentUser={user}
          onDocumentSaved={(doc) => {
            handleAttachDocument(captureCategory, doc.id);
            setCaptureCategory(null);
          }}
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

      {/* Confirm Delete Draft Modal */}
      {draftToDelete && (
        <ConfirmModal
          isOpen={!!draftToDelete}
          title="Supprimer ce brouillon ?"
          message={`Êtes-vous certain de vouloir supprimer le brouillon pour « ${draftToDelete.subjectTitle} » ? Cette action est irréversible.`}
          confirmLabel="Supprimer définitivement"
          cancelLabel="Conserver le brouillon"
          isDestructive={true}
          onConfirm={handleConfirmDeleteDraft}
          onCancel={() => setDraftToDelete(null)}
        />
      )}
    </div>
  );
};
