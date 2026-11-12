/**
 * DOCTORIA — Administrator Audit Logs & Security History
 * Complete immutable trace of all system actions, status transitions, logins, and approvals.
 */

import React, { useState, useEffect } from 'react';
import {
  Layers,
  Search,
  Clock,
  User,
  Shield,
  Filter,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { AuditLog } from '../../types';
import { StorageService, subscribeToStorage } from '../../services/storage';

export const AdminAuditLogs: React.FC = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterEntity, setFilterEntity] = useState('');

  const loadData = () => {
    setLogs(StorageService.getAuditLogs());
  };

  useEffect(() => {
    loadData();
    const unsub = subscribeToStorage(loadData);
    return unsub;
  }, []);

  if (!user) return null;

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      searchQuery === '' ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesEntity = filterEntity === '' || log.entityType === filterEntity;
    return matchesSearch && matchesEntity;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs">
        <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">
          Sécurité & Conformité Réglementaire
        </span>
        <h2 className="text-xl font-bold text-slate-900 mt-0.5">
          Journaux d'Audit & Traçabilité des Décisions
        </h2>
        <p className="text-xs text-slate-500 mt-1 max-w-xl">
          Historique exhaustif et horodaté de toutes les actions : soumissions de candidatures, avis scientifiques des DT, validations de la direction et sessions.
        </p>
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par action, auteur, détails..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <select
          value={filterEntity}
          onChange={(e) => setFilterEntity(e.target.value)}
          className="w-full sm:w-auto px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:bg-white font-medium"
        >
          <option value="">Tous les types d'entités</option>
          <option value="CANDIDATURE">Candidatures</option>
          <option value="SUBJECT">Sujets de thèse</option>
          <option value="REINSCRIPTION">Réinscriptions</option>
          <option value="DOCUMENT">Documents & Scanner</option>
          <option value="USER">Comptes Utilisateurs</option>
          <option value="AUTH">Authentification & Sessions</option>
          <option value="CAMPAIGN">Campagnes Doctorales</option>
        </select>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">
            Événements enregistrés ({filteredLogs.length})
          </h3>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            Aucun événement ne correspond à vos critères de recherche.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 overflow-x-auto">
            {filteredLogs.map((log) => (
              <div key={log.id} className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-bold text-slate-900">
                      {log.action}
                    </span>
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-mono font-medium">
                      {log.entityType}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed">
                    {log.details}
                  </p>

                  <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                    <span>
                      Auteur : <strong className="text-slate-600">{log.userName}</strong> ({log.userRole})
                    </span>
                    <span>·</span>
                    <span className="font-mono">ID: {log.entityId}</span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 shrink-0 self-start sm:self-center font-mono">
                  {new Date(log.timestamp).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
