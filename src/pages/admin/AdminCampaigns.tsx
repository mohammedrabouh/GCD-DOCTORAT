/**
 * DOCTORIA — Administrator Doctoral Campaigns Management
 * Configure academic years, opening/closing dates, registration deadlines, and limits.
 */

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Plus,
  CheckCircle2,
  Clock,
  Settings,
  X,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { DoctoralCampaign } from '../../types';
import { StorageService, subscribeToStorage } from '../../services/storage';

export const AdminCampaigns: React.FC = () => {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<DoctoralCampaign[]>([]);

  // Create Campaign Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [academicYear, setAcademicYear] = useState('2026-2027');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [registrationDeadline, setRegistrationDeadline] = useState('');
  const [description, setDescription] = useState('');
  const [maxCandidatures, setMaxCandidatures] = useState(3);
  const [isActive, setIsActive] = useState(true);

  const loadData = () => {
    setCampaigns(StorageService.getCampaigns());
  };

  useEffect(() => {
    loadData();
    const unsub = subscribeToStorage(loadData);
    return unsub;
  }, []);

  useEffect(() => {
    const now = new Date();
    setStartDate(new Date(now.getFullYear(), 8, 15).toISOString().split('T')[0]);
    setEndDate(new Date(now.getFullYear(), 11, 20).toISOString().split('T')[0]);
    setRegistrationDeadline(new Date(now.getFullYear() + 1, 0, 15).toISOString().split('T')[0]);
  }, []);

  if (!user) return null;

  const handleCreateCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !academicYear.trim()) return;

    try {
      const code = `DOC-${academicYear}-${Math.floor(10 + Math.random() * 90)}`;
      StorageService.createCampaign(
        {
          code,
          title: title.trim(),
          academicYear: academicYear.trim(),
          startDate,
          endDate,
          registrationDeadline,
          isActive,
          description: description.trim(),
          maxCandidaturesPerCandidate: maxCandidatures,
          allowWaitlistPromotion: true,
        },
        user
      );

      setTitle('');
      setDescription('');
      setIsModalOpen(false);
      alert('Campagne doctorale configurée avec succès.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur';
      alert(msg);
    }
  };

  const handleToggleActive = (camp: DoctoralCampaign) => {
    try {
      StorageService.updateCampaign({ ...camp, isActive: !camp.isActive }, user);
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
            Calendrier Universitaire
          </span>
          <h2 className="text-xl font-bold text-slate-900 mt-0.5">
            Campagnes Doctorales & Délais Officiels
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Configurez les périodes de dépôt des candidatures, les dates d'admissions et les dates limites d'inscription administrative.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          Nouvelle campagne doctorale
        </button>
      </div>

      {/* Campaigns List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">
            Campagnes enregistrées ({campaigns.length})
          </h3>
        </div>

        <div className="divide-y divide-slate-100">
          {campaigns.map((camp) => (
            <div key={camp.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="font-mono text-xs font-bold text-blue-700">{camp.code}</span>
                  <span aria-hidden="true">·</span>
                  <span className="text-xs font-bold text-slate-800">Année : {camp.academicYear}</span>
                  {camp.isActive ? (
                    <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded border border-emerald-200">
                      Campagne Active (Dépôts ouverts)
                    </span>
                  ) : (
                    <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded border border-slate-200">
                      Clôturée
                    </span>
                  )}
                </div>

                <h4 className="text-sm font-bold text-slate-900">{camp.title}</h4>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{camp.description}</p>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 mt-2">
                  <span>
                    Dépôts : <strong>{camp.startDate}</strong> au <strong>{camp.endDate}</strong>
                  </span>
                  <span>·</span>
                  <span>
                    Date limite d'inscription : <strong className="text-rose-700">{camp.registrationDeadline}</strong>
                  </span>
                  <span>·</span>
                  <span>
                    Plafond par candidat : <strong>{camp.maxCandidaturesPerCandidate} sujets</strong>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                <button
                  type="button"
                  onClick={() => handleToggleActive(camp)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors ${
                    camp.isActive
                      ? 'border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100'
                      : 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                  }`}
                >
                  {camp.isActive ? 'Clôturer la campagne' : 'Activer la campagne'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal: New Campaign */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Configurer une campagne doctorale</h3>
                <p className="text-xs text-slate-500 mt-0.5">Calendrier d'admission et inscriptions</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCampaign} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Intitulé officiel de la campagne *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Campagne Doctorale Pôle Sciences 2026-2027"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Année universitaire *
                  </label>
                  <input
                    type="text"
                    required
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    placeholder="2026-2027"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Max candidatures / candidat *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    required
                    value={maxCandidatures}
                    onChange={(e) => setMaxCandidatures(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Ouverture des candidatures *
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Clôture des candidatures *
                  </label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Date limite d'inscription administrative finale *
                </label>
                <input
                  type="date"
                  required
                  value={registrationDeadline}
                  onChange={(e) => setRegistrationDeadline(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Description & Orientations prioritaires
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Modalités d'éligibilité, bourses disponibles, conditions particulières..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="campActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded text-blue-600"
                />
                <label htmlFor="campActive" className="text-xs font-bold text-slate-700">
                  Définir immédiatement comme campagne active
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-2xs"
                >
                  Enregistrer la campagne
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
