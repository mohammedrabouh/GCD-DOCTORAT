/**
 * DOCTORIA — Public Thesis Subjects Catalogue
 * Accessible to anyone without logging in. Allows searching, filtering,
 * viewing details, and applying to subjects.
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Filter,
  GraduationCap,
  Building2,
  User,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  Calendar,
  X,
  Sparkles,
} from 'lucide-react';
import { ThesisSubject, Establishment, Laboratory, DoctoralCampaign } from '../types';
import { StorageService, subscribeToStorage } from '../services/storage';
import { useAuth } from '../context/AuthContext';

interface PublicCataloguePageProps {
  onApplyToSubject?: (subject: ThesisSubject) => void;
  onNavigateLogin?: () => void;
  isInsideDashboard?: boolean;
}

export const PublicCataloguePage: React.FC<PublicCataloguePageProps> = ({
  onApplyToSubject,
  onNavigateLogin,
  isInsideDashboard = false,
}) => {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<ThesisSubject[]>([]);
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [laboratories, setLaboratories] = useState<Laboratory[]>([]);
  const [activeCampaign, setActiveCampaign] = useState<DoctoralCampaign | undefined>(undefined);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEstablishment, setSelectedEstablishment] = useState('');
  const [selectedDiscipline, setSelectedDiscipline] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<ThesisSubject | null>(null);

  const loadData = () => {
    // Only published subjects for public catalogue
    setSubjects(StorageService.getPublishedSubjects());
    setEstablishments(StorageService.getEstablishments());
    setLaboratories(StorageService.getLaboratories());
    setActiveCampaign(StorageService.getActiveCampaign());
  };

  useEffect(() => {
    loadData();
    const unsub = subscribeToStorage(loadData);
    return unsub;
  }, []);

  // Unique disciplines
  const disciplines = useMemo(() => {
    const set = new Set<string>();
    subjects.forEach((s) => set.add(s.discipline));
    return Array.from(set);
  }, [subjects]);

  // Filtered subjects
  const filteredSubjects = useMemo(() => {
    return subjects.filter((s) => {
      const matchesSearch =
        searchQuery === '' ||
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.supervisorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.keywords.some((k) => k.toLowerCase().includes(searchQuery.toLowerCase())) ||
        s.discipline.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesEstablishment =
        selectedEstablishment === '' || s.establishmentId === selectedEstablishment;

      const matchesDiscipline =
        selectedDiscipline === '' || s.discipline === selectedDiscipline;

      return matchesSearch && matchesEstablishment && matchesDiscipline;
    });
  }, [subjects, searchQuery, selectedEstablishment, selectedDiscipline]);

  const handleApplyClick = (subj: ThesisSubject) => {
    if (!user) {
      if (onNavigateLogin) {
        onNavigateLogin();
      } else {
        alert('Veuillez vous connecter avec votre compte candidat pour postuler à ce sujet.');
      }
      return;
    }

    if (user.role !== 'CANDIDAT') {
      alert('Seuls les candidats au doctorat peuvent déposer un dossier de candidature.');
      return;
    }

    if (onApplyToSubject) {
      onApplyToSubject(subj);
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero / Header Banner */}
      {!isInsideDashboard && (
        <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 rounded-2xl p-6 sm:p-10 text-white relative overflow-hidden shadow-lg border border-slate-800">
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs font-semibold mb-4 border border-blue-400/30">
              <Sparkles className="w-3.5 h-3.5" />
              Catalogue Officiel des Thèses 2026-2027
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
              Explorez les sujets de thèse proposés pour la campagne doctorale
            </h1>
            <p className="mt-3 text-sm sm:text-base text-slate-300 leading-relaxed">
              Consultez l'ensemble des sujets de recherche accrédités par les structures doctorales universitaires, prenez connaissance des prérequis et déposez votre candidature en ligne.
            </p>

            {activeCampaign && (
              <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-slate-300 pt-4 border-t border-white/10">
                <span className="flex items-center gap-1.5 font-medium">
                  <Calendar className="w-4 h-4 text-blue-400" />
                  Campagne active : <strong className="text-white">{activeCampaign.title}</strong>
                </span>
                <span className="text-slate-500">·</span>
                <span>
                  Clôture des candidatures : <strong className="text-white">{activeCampaign.endDate}</strong>
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search bar */}
          <div className="md:col-span-6 relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par titre, mot-clé, directeur de thèse..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter: Establishment */}
          <div className="md:col-span-3">
            <select
              value={selectedEstablishment}
              onChange={(e) => setSelectedEstablishment(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-700 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tous les établissements</option>
              {establishments.map((est) => (
                <option key={est.id} value={est.id}>
                  {est.code} — {est.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filter: Discipline */}
          <div className="md:col-span-3">
            <select
              value={selectedDiscipline}
              onChange={(e) => setSelectedDiscipline(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-700 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Toutes les disciplines</option>
              {disciplines.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Stats & Active Filter Tags */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <span className="font-medium">
            <strong className="text-slate-900 font-bold tabular-nums">{filteredSubjects.length}</strong> sujet{filteredSubjects.length > 1 ? 's' : ''} disponible{filteredSubjects.length > 1 ? 's' : ''}
          </span>
          {(selectedEstablishment || selectedDiscipline || searchQuery) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedEstablishment('');
                setSelectedDiscipline('');
              }}
              className="text-blue-600 hover:text-blue-800 font-semibold"
            >
              Réinitialiser les filtres
            </button>
          )}
        </div>
      </div>

      {/* Subjects Grid */}
      {filteredSubjects.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900">Aucun sujet ne correspond à vos critères</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            Essayez de modifier vos mots-clés ou réinitialisez les filtres pour afficher l'ensemble du catalogue.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSubjects.map((subj) => {
            const est = establishments.find((e) => e.id === subj.establishmentId);
            const lab = laboratories.find((l) => l.id === subj.laboratoryId);

            return (
              <div
                key={subj.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs hover:border-blue-400 hover:shadow-sm transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Metadata line without pill sandwich */}
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-2 font-medium">
                    <span className="text-blue-700 font-bold">{subj.code}</span>
                    <span aria-hidden="true">·</span>
                    <span className="truncate">{subj.discipline}</span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums font-semibold text-slate-700">
                      {subj.availableSeats} place{subj.availableSeats > 1 ? 's' : ''}
                    </span>
                  </div>

                  <h3
                    onClick={() => setSelectedSubject(subj)}
                    className="text-base font-bold text-slate-900 hover:text-blue-600 cursor-pointer leading-snug line-clamp-2 mb-2.5"
                  >
                    {subj.title}
                  </h3>

                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed mb-4">
                    {subj.description}
                  </p>

                  {/* Keywords */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {subj.keywords.slice(0, 4).map((kw, i) => (
                      <span
                        key={i}
                        className="text-[11px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md"
                      >
                        {kw}
                      </span>
                    ))}
                    {subj.keywords.length > 4 && (
                      <span className="text-[11px] text-slate-400 px-1 py-0.5">
                        +{subj.keywords.length - 4}
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
                  <div className="text-xs text-slate-500 flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 truncate">
                      <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-semibold text-slate-800 truncate">{subj.supervisorName}</span>
                    </div>
                    <div className="flex items-center gap-1.5 truncate text-[11px]">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{lab?.name || 'Laboratoire'} ({est?.code || ''})</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => setSelectedSubject(subj)}
                      className="text-xs text-slate-600 hover:text-slate-900 font-semibold"
                    >
                      Détails complets
                    </button>

                    <button
                      type="button"
                      onClick={() => handleApplyClick(subj)}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 shadow-2xs transition-colors"
                    >
                      Postuler
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Details Modal */}
      {selectedSubject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2 text-xs font-mono text-blue-700 font-bold">
                <span>{selectedSubject.code}</span>
                <span>·</span>
                <span>{selectedSubject.discipline}</span>
              </div>
              <button
                onClick={() => setSelectedSubject(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5">
              <div>
                <h3 className="text-xl font-bold text-slate-900 leading-snug">
                  {selectedSubject.title}
                </h3>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Description du projet doctoral
                </h4>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                  {selectedSubject.description}
                </p>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Prérequis et profil du candidat recherché
                </h4>
                <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                  {selectedSubject.requirements}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                <div>
                  <span className="text-slate-500 block">Directeur de thèse :</span>
                  <strong className="text-slate-900">{selectedSubject.supervisorName}</strong>
                </div>
                {selectedSubject.coSupervisorName && (
                  <div>
                    <span className="text-slate-500 block">Co-Directeur :</span>
                    <strong className="text-slate-900">{selectedSubject.coSupervisorName}</strong>
                  </div>
                )}
                <div>
                  <span className="text-slate-500 block">Nombre de places :</span>
                  <strong className="text-slate-900 tabular-nums">{selectedSubject.availableSeats} place(s)</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Structure de rattachement :</span>
                  <strong className="text-slate-900">
                    {laboratories.find((l) => l.id === selectedSubject.laboratoryId)?.name || 'Laboratoire'}
                  </strong>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Mots-clés scientifiques
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedSubject.keywords.map((kw, i) => (
                    <span
                      key={i}
                      className="text-xs font-medium bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md border border-blue-200/60"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setSelectedSubject(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Fermer
              </button>
              <button
                type="button"
                onClick={() => {
                  const s = selectedSubject;
                  setSelectedSubject(null);
                  handleApplyClick(s);
                }}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold inline-flex items-center gap-2 shadow-sm transition-colors"
              >
                Postuler à ce sujet
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
