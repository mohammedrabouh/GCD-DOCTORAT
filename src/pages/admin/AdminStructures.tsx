/**
 * DOCTORIA — Administrator Research Structures & Establishments
 * Manage university faculties, schools, research poles, and laboratories.
 */

import React, { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  Building,
  User,
  X,
  MapPin,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Establishment, Laboratory } from '../../types';
import { StorageService, subscribeToStorage } from '../../services/storage';

export const AdminStructures: React.FC = () => {
  const { user } = useAuth();
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [laboratories, setLaboratories] = useState<Laboratory[]>([]);

  // Add Est Modal
  const [isEstModalOpen, setIsEstModalOpen] = useState(false);
  const [estCode, setEstCode] = useState('');
  const [estName, setEstName] = useState('');
  const [estCity, setEstCity] = useState('Rabat');
  const [estUniversity, setEstUniversity] = useState('Université Mohammed V de Rabat');

  // Add Lab Modal
  const [isLabModalOpen, setIsLabModalOpen] = useState(false);
  const [labCode, setLabCode] = useState('');
  const [labName, setLabName] = useState('');
  const [labEstId, setLabEstId] = useState('');
  const [labDirector, setLabDirector] = useState('');
  const [labPole, setLabPole] = useState('Sciences et Technologies');

  const loadData = () => {
    setEstablishments(StorageService.getEstablishments());
    setLaboratories(StorageService.getLaboratories());
  };

  useEffect(() => {
    loadData();
    const unsub = subscribeToStorage(loadData);
    return unsub;
  }, []);

  if (!user) return null;

  const handleCreateEst = (e: React.FormEvent) => {
    e.preventDefault();
    if (!estCode.trim() || !estName.trim()) return;
    try {
      StorageService.createEstablishment(
        {
          code: estCode.trim().toUpperCase(),
          name: estName.trim(),
          city: estCity.trim(),
          universityName: estUniversity.trim(),
        },
        user
      );
      setEstCode('');
      setEstName('');
      setIsEstModalOpen(false);
      alert('Établissement ajouté avec succès.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur';
      alert(msg);
    }
  };

  const handleCreateLab = (e: React.FormEvent) => {
    e.preventDefault();
    if (!labCode.trim() || !labName.trim() || !labEstId) return;
    try {
      StorageService.createLaboratory(
        {
          code: labCode.trim().toUpperCase(),
          name: labName.trim(),
          establishmentId: labEstId,
          directorName: labDirector.trim() || 'Directeur de laboratoire',
          researchPole: labPole.trim(),
        },
        user
      );
      setLabCode('');
      setLabName('');
      setLabDirector('');
      setIsLabModalOpen(false);
      alert('Laboratoire de recherche enregistré.');
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
            Cartographie de la Recherche
          </span>
          <h2 className="text-xl font-bold text-slate-900 mt-0.5">
            Établissements & Laboratoires Universitaires
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Gestion des facultés, grandes écoles d'ingénieurs et structures d'accueil des doctorants.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsEstModalOpen(true)}
            className="px-3 py-2 border border-slate-300 hover:bg-slate-50 text-slate-800 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            Établissement
          </button>
          <button
            type="button"
            onClick={() => {
              setLabEstId(establishments[0]?.id || '');
              setIsLabModalOpen(true);
            }}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            Laboratoire
          </button>
        </div>
      </div>

      {/* Establishments List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">
            Établissements ({establishments.length})
          </h3>
        </div>

        <div className="divide-y divide-slate-100">
          {establishments.map((est) => {
            const estLabs = laboratories.filter((l) => l.establishmentId === est.id);
            return (
              <div key={est.id} className="p-4 sm:px-6 flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono">
                      {est.code}
                    </span>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900">{est.name}</h4>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {est.city} — {est.universityName}
                    </span>
                    <span>·</span>
                    <span>{estLabs.length} laboratoire(s) rattaché(s)</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Laboratories List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">
            Laboratoires de Recherche ({laboratories.length})
          </h3>
        </div>

        <div className="divide-y divide-slate-100">
          {laboratories.map((lab) => {
            const est = establishments.find((e) => e.id === lab.establishmentId);
            return (
              <div key={lab.id} className="p-4 sm:px-6 flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-mono">
                      {lab.code}
                    </span>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900">{lab.name}</h4>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                    <span>Établissement : <strong className="text-slate-700">{est?.name || est?.code}</strong></span>
                    <span>·</span>
                    <span>Pôle : <strong className="text-slate-700">{lab.researchPole}</strong></span>
                    <span>·</span>
                    <span>Directeur : <strong className="text-slate-700">{lab.directorName}</strong></span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal: Add Establishment */}
      {isEstModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-6">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900">Ajouter un établissement</h3>
              <button onClick={() => setIsEstModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEst} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Sigle / Code *</label>
                <input
                  type="text"
                  required
                  value={estCode}
                  onChange={(e) => setEstCode(e.target.value.toUpperCase())}
                  placeholder="Ex: FSR, ENSIAS, FSJES"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nom complet *</label>
                <input
                  type="text"
                  required
                  value={estName}
                  onChange={(e) => setEstName(e.target.value)}
                  placeholder="Ex: Faculté des Sciences de Rabat"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Ville *</label>
                  <input
                    type="text"
                    required
                    value={estCity}
                    onChange={(e) => setEstCity(e.target.value)}
                    placeholder="Rabat"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Université *</label>
                  <input
                    type="text"
                    required
                    value={estUniversity}
                    onChange={(e) => setEstUniversity(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEstModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-2xs"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Laboratory */}
      {isLabModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-6">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900">Ajouter un laboratoire</h3>
              <button onClick={() => setIsLabModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLab} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Établissement *</label>
                <select
                  required
                  value={labEstId}
                  onChange={(e) => setLabEstId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white"
                >
                  {establishments.map((est) => (
                    <option key={est.id} value={est.id}>
                      {est.code} — {est.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Code / Acronyme *</label>
                <input
                  type="text"
                  required
                  value={labCode}
                  onChange={(e) => setLabCode(e.target.value.toUpperCase())}
                  placeholder="Ex: LIASE, LIST, LRIT"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Intitulé du laboratoire *</label>
                <input
                  type="text"
                  required
                  value={labName}
                  onChange={(e) => setLabName(e.target.value)}
                  placeholder="Ex: Laboratoire d'Informatique et Systèmes Embarqués"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Pôle de recherche</label>
                  <input
                    type="text"
                    value={labPole}
                    onChange={(e) => setLabPole(e.target.value)}
                    placeholder="Sciences & Technologies"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Directeur de labo</label>
                  <input
                    type="text"
                    value={labDirector}
                    onChange={(e) => setLabDirector(e.target.value)}
                    placeholder="Prof. Nom Prénom"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsLabModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-2xs"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
