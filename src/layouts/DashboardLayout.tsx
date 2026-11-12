/**
 * DOCTORIA — Main Academic Dashboard Layout
 * Features dedicated sidebar navigation per role, top bar contract, responsive drawer,
 * and persistent local storage compliance notice.
 */

import React, { useState } from 'react';
import {
  GraduationCap,
  LayoutDashboard,
  BookOpen,
  FileText,
  FolderOpen,
  UserCheck,
  RefreshCw,
  User as UserIcon,
  LogOut,
  Menu,
  X,
  Shield,
  Layers,
  Calendar,
  Building2,
  Clock,
  Award,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ROLE_LABELS } from '../constants';
import { NotificationsDropdown } from '../components/NotificationsDropdown';

interface DashboardLayoutProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  currentTab,
  onSelectTab,
  children,
}) => {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!user) return null;

  // Build navigation items based on user role
  const getNavItems = () => {
    switch (user.role) {
      case 'CANDIDAT':
        return [
          { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
          { id: 'catalogue', label: 'Catalogue des Sujets', icon: BookOpen },
          { id: 'candidatures', label: 'Mes Candidatures', icon: FileText },
          { id: 'documents', label: 'Pièces & Scanner', icon: FolderOpen },
          { id: 'inscription', label: 'Inscription Administrative', icon: UserCheck },
          { id: 'reinscription', label: 'Réinscription Annuelle', icon: RefreshCw },
          { id: 'profil', label: 'Mon Profil', icon: UserIcon },
        ];
      case 'DIRECTEUR_THESE':
        return [
          { id: 'dt-dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
          { id: 'dt-sujets', label: 'Mes Sujets de Thèse', icon: BookOpen },
          { id: 'dt-candidatures', label: 'Examen des Dossiers', icon: FileText },
          { id: 'dt-doctorants', label: 'Doctorants & Réinscriptions', icon: Award },
        ];
      case 'DIRECTEUR_STRUCTURE':
        return [
          { id: 'ds-dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
          { id: 'ds-sujets', label: 'Validation des Sujets', icon: BookOpen },
          { id: 'ds-admissions', label: 'Admissions & Décisions', icon: FileText },
          { id: 'ds-delais', label: 'Délais & Listes d’Attente', icon: Clock },
          { id: 'ds-reinscriptions', label: 'Validation Réinscriptions', icon: RefreshCw },
        ];
      case 'ADMINISTRATEUR':
        return [
          { id: 'admin-dashboard', label: 'Vue d’ensemble', icon: LayoutDashboard },
          { id: 'admin-comptes', label: 'Gestion des Comptes', icon: Shield },
          { id: 'admin-campagnes', label: 'Campagnes Doctorales', icon: Calendar },
          { id: 'admin-structures', label: 'Établissements & Labos', icon: Building2 },
          { id: 'admin-audit', label: 'Journaux d’Audit', icon: Layers },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  const handleTabClick = (tabId: string) => {
    onSelectTab(tabId);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Zone 1: Brand & Academic Identity */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => handleTabClick(navItems[0]?.id || 'dashboard')}>
              <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-black tracking-tight text-slate-900 leading-none">
                  DOCTORIA
                </span>
                <span className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase mt-0.5">
                  USMBA Fès · CEDoc
                </span>
              </div>
            </div>
          </div>

          {/* Zone 2: Middle Breadcrumb / Section Context */}
          <div className="hidden md:flex items-center gap-2 text-xs text-slate-500 font-medium truncate">
            <span>USMBA Fès</span>
            <span aria-hidden="true">·</span>
            <span>CEDoc</span>
            <span aria-hidden="true">·</span>
            <span className="text-slate-900 font-semibold truncate">
              {navItems.find((item) => item.id === currentTab)?.label || 'Espace de Travail'}
            </span>
          </div>

          {/* Zone 3: Actions, Notifications & Account */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Notifications */}
            <NotificationsDropdown userId={user.id} onNavigate={handleTabClick} />

            {/* User Profile Badge */}
            <div className="hidden sm:flex items-center gap-2.5 pl-3 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold text-xs uppercase">
                {user.firstName[0]}
                {user.lastName[0]}
              </div>
              <div className="flex flex-col text-left leading-tight">
                <span className="text-xs font-semibold text-slate-900 truncate max-w-[140px]">
                  {user.firstName} {user.lastName}
                </span>
                <span className="text-[10px] text-blue-700 font-medium">
                  {ROLE_LABELS[user.role]}
                </span>
              </div>
            </div>

            {/* Logout Action */}
            <button
              type="button"
              onClick={logout}
              className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-1"
              title="Déconnexion"
              aria-label="Déconnexion"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1 flex flex-col lg:flex-row gap-6">
        {/* Desktop Sidebar Navigation */}
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-2xs sticky top-22 space-y-1">
            <div className="px-3 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              {ROLE_LABELS[user.role]}
            </div>

            <nav className="space-y-0.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleTabClick(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-semibold rounded-lg transition-colors text-left ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Storage notice in sidebar */}
            <div className="pt-4 mt-4 border-t border-slate-100 px-3">
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80 text-[11px] text-slate-500 leading-snug">
                <span className="font-semibold text-slate-700 block mb-0.5">Mode Local Sécurisé</span>
                Données & documents conservés dans votre navigateur (IndexedDB).
              </div>
            </div>
          </div>
        </aside>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex">
            <div className="w-72 bg-white h-full shadow-2xl p-4 flex flex-col">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-slate-900 text-sm">DOCTORIA</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="py-3 px-2 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-900">{user.firstName} {user.lastName}</p>
                <p className="text-[11px] text-blue-700 font-medium">{ROLE_LABELS[user.role]}</p>
              </div>

              <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleTabClick(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-semibold rounded-lg transition-colors text-left ${
                        isActive
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>

              <button
                type="button"
                onClick={logout}
                className="mt-auto pt-3 border-t border-slate-200 flex items-center gap-2 text-rose-600 text-xs font-semibold px-2 py-2 hover:bg-rose-50 rounded-lg"
              >
                <LogOut className="w-4 h-4" />
                Déconnexion
              </button>
            </div>
          </div>
        )}

        {/* Dynamic Viewport Content */}
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>

      {/* Global Academic Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">DOCTORIA</span>
            <span>—</span>
            <span>Système de Gestion du Cycle Doctoral Universitaire</span>
          </div>
          <div className="flex items-center gap-3 text-slate-400">
            <span>Version 1.0 (Architecture Locale Indépendante)</span>
            <span>·</span>
            <span className="font-mono text-[11px]">Réf: CED-MA</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
