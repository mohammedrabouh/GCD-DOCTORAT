/**
 * DOCTORIA — Thesis Supervisor Subjects Management (Directeur de Thèse)
 * Create new thesis subjects, view status, track structure validation, view details.
 */

import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  Eye,
  CheckCircle2,
  Clock,
  XCircle,
  Building2,
  X,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ThesisSubject, Establishment, Laboratory, DoctoralCampaign } from '../../types';
import { StorageService, subscribeToStorage } from '../../services/storage';
import { SUBJECT_STATUS_CONFIG } from '../../constants';

export const SupervisorSubjects: React.FC = () => {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<ThesisSubject[]>([]);
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [laboratories, setLaboratories] = useState<Laboratory[]>([]);
  const [campaign, setCampaign] = useState<DoctoralCampaign | undefined>(undefined);

  // New Subject Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [keywordsInput, setKeywordsInput] = useState('');
  const [discipline, setDiscipline] = useState('');
  const [establishmentId, setEstablishmentId] = useState('');
  const [laboratoryId, setLaboratoryId] = useState('');
  const [availableSeats, setAvailableSeats] = useState(1);
  const [requirements, setRequirements] = useState('');
  const [coSupervisorName, setCoSupervisorName] = useState('');

  // Details Modal
  const [selectedSubject, setSelectedSubject] = useState<ThesisSubject | null>(null);

  const loadData = () => {
    if (!user) return;
    setSubjects(StorageService.getSubjects().filter((s) => s.supervisorId === user.id));
    setEstablishments(StorageService.getEstablishments());
    setLaboratories(StorageService.getLaboratories());
    setCampaign(StorageService.getActiveCampaign());
  };

  useEffect(() => {
    loadData();
    const unsub = subscribeToStorage(loadData);
    return unsub;
  }, [user]);

  if (!user) return null;

  const handleCreateSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaign) {
      alert("Aucune campagne doctorale n'est active pour associer ce sujet.");
      return;
    }

    const keywords = keywordsInput
      .split(',')
      .map((k) => k.trim())
      .filter((k) => k.length > 0);

    try {
      StorageService.createSubject(
        {
          title,
          description,
          keywords,
          discipline,
          establishmentId: establishmentId || establishments[0]?.id || '',
          laboratoryId: laboratoryId || laboratories[0]?.id || '',
          availableSeats,
          requirements,
          campaignId: campaign.id,
          coSupervisorName: coSupervisorName || undefined,
        },
        user
      );

      // Reset
      setTitle('');
      setDescription('');
      setKeywordsInput('');
      setDiscipline('');
      setRequirements('');
      setCoSupervisorName('');
      setIsModalOpen(false);
      alert('Votre proposition de sujet a été enregistrée et soumise à la direction de structure pour validation.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur';
      alert(msg);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">
            Offre Doctorale de Recherche
          </span>
          <h2 className="text-xl font-bold text-slate-900 mt-0.5">
            Mes Sujets de Thèse
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Proposez de nouveaux thèmes de recherche doctorale pour la campagne 2026-2027 et suivez leur accréditation par la direction du CED.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          Nouveau sujet de thèse
        </button>
      </div>

      {/* Subjects Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">
            Sujets enregistrés ({subjects.length})
          </h3>
        </div>

        {subjects.length === 0 ? (
          <div className="p-12 text-center">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="text-sm font-bold text-slate-800">Aucun sujet de thèse déposé</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
              Cliquez ci-dessous pour proposer votre premier sujet pour la campagne doctorale active.
            </p>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Créer un sujet
            </button>
          </div>
        ) : (
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
                      <span className="text-xs text-slate-500 tabular-nums font-semibold">
                        {subj.availableSeats} place(s)
                      </span>
                    </div>

                    <h4
                      onClick={() => setSelectedSubject(subj)}
                      className="text-sm font-bold text-slate-900 hover:text-blue-600 cursor-pointer leading-snug line-clamp-1"
                    >
                      {subj.title}
                    </h4>

                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {subj.description}
                    </p>

                    {subj.validationComment && (
                      <div className="mt-2 text-xs bg-slate-50 p-2 rounded border border-slate-200 text-slate-700">
                        <strong>Retour structure :</strong> {subj.validationComment}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                    <button
                      type="button"
                      onClick={() => setSelectedSubject(subj)}
                      className="px-3.5 py-1.5 border border-slate-200 hover:bg-white text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-2xs"
                    >
                      <Eye className="w-3.5 h-3.5 text-blue-600" />
                      Détails complets
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal: Create Subject */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-base font-bold text-slate-900">
                Proposition d'un nouveau sujet de thèse
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubject} className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Intitulé du sujet de thèse *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Analyse prédictive des séries temporelles..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Description détaillée & Problématique scientifique *
                </label>
                <textarea
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Exposez le contexte scientifique, les verrous technologiques et les axes de recherche..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Discipline / Spécialité *
                  </label>
                  <input
                    type="text"
                    required
                    value={discipline}
                    onChange={(e) => setDiscipline(e.target.value)}
                    placeholder="Informatique, Physique, etc."
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Nombre de places ouvertes *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    required
                    value={availableSeats}
                    onChange={(e) => setAvailableSeats(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Établissement de rattachement *
                  </label>
                  <select
                    value={establishmentId}
                    onChange={(e) => setEstablishmentId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  >
                    {establishments.map((est) => (
                      <option key={est.id} value={est.id}>
                        {est.code} — {est.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Laboratoire de recherche *
                  </label>
                  <select
                    value={laboratoryId}
                    onChange={(e) => setLaboratoryId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  >
                    {laboratories.map((lab) => (
                      <option key={lab.id} value={lab.id}>
                        {lab.code} — {lab.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Mots-clés (séparés par des virgules) *
                </label>
                <input
                  type="text"
                  required
                  value={keywordsInput}
                  onChange={(e) => setKeywordsInput(e.target.value)}
                  placeholder="Intelligence Artificielle, Traitement d'Images, Deep Learning"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Prérequis et profil souhaité *
                </label>
                <textarea
                  required
                  rows={3}
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                  placeholder="Diplômes acceptés (Master Recherche, Ingénieur), compétences logicielles requises..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Co-Directeur de thèse (Optionnel)
                </label>
                <input
                  type="text"
                  value={coSupervisorName}
                  onChange={(e) => setCoSupervisorName(e.target.value)}
                  placeholder="Prof. Nom Prénom (Autre université ou organisme associé)"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-2xs"
                >
                  Soumettre pour validation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {selectedSubject && (
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

            <div className="text-xs text-slate-700 space-y-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
              <p><strong>Description :</strong> {selectedSubject.description}</p>
              <p><strong>Prérequis :</strong> {selectedSubject.requirements}</p>
              <p><strong>Places disponibles :</strong> {selectedSubject.availableSeats}</p>
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
