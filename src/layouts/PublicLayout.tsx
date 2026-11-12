/**
 * DOCTORIA — Public Portal Layout
 * Top Bar contract compliance:
 * Zone 1: DOCTORIA wordmark
 * Zone 2: 4-5 clean text links with whitespace-nowrap
 * Zone 3: 1 primary CTA button
 */

import React from 'react';
import { GraduationCap, LogIn } from 'lucide-react';

interface PublicLayoutProps {
  currentPublicPage: 'catalogue' | 'calendrier' | 'guide' | 'apropos';
  onSelectPublicPage: (page: 'catalogue' | 'calendrier' | 'guide' | 'apropos') => void;
  onNavigateLogin: () => void;
  children: React.ReactNode;
}

export const PublicLayout: React.FC<PublicLayoutProps> = ({
  currentPublicPage,
  onSelectPublicPage,
  onNavigateLogin,
  children,
}) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Bar Contract (3 zones separated by gap-8) */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single text element wordmark */}
          <div
            onClick={() => onSelectPublicPage('catalogue')}
            className="flex items-center gap-2.5 cursor-pointer shrink-0"
          >
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <GraduationCap className="w-5 h-5" />
            </div>
            <span className="text-lg font-black tracking-tight text-slate-900 whitespace-nowrap shrink-0">
              DOCTORIA
            </span>
          </div>

          {/* Zone 2: 4-5 clean single-line nav links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <button
              type="button"
              onClick={() => onSelectPublicPage('catalogue')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
                currentPublicPage === 'catalogue' ? 'text-blue-600 font-bold' : ''
              }`}
            >
              Catalogue des Sujets
            </button>
            <button
              type="button"
              onClick={() => onSelectPublicPage('calendrier')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
                currentPublicPage === 'calendrier' ? 'text-blue-600 font-bold' : ''
              }`}
            >
              Calendrier Doctoral
            </button>
            <button
              type="button"
              onClick={() => onSelectPublicPage('guide')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
                currentPublicPage === 'guide' ? 'text-blue-600 font-bold' : ''
              }`}
            >
              Guide du Candidat
            </button>
            <button
              type="button"
              onClick={() => onSelectPublicPage('apropos')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
                currentPublicPage === 'apropos' ? 'text-blue-600 font-bold' : ''
              }`}
            >
              À Propos du CED
            </button>
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onNavigateLogin}
              className="px-4 py-2 text-xs font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap shrink-0 shadow-2xs flex items-center gap-1.5"
            >
              <LogIn className="w-3.5 h-3.5" />
              Espace Candidat / Connexion
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Viewport */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        {children}
      </main>

      {/* Global Academic Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900">DOCTORIA</span>
            <span>—</span>
            <span>Université Sidi Mohamed Ben Abdellah (USMBA) · Fès · CEDoc</span>
          </div>
          <div className="flex items-center gap-3 text-slate-400">
            <span>Centres d’Études Doctorales (CED-ST & CED-LSHJES)</span>
            <span>·</span>
            <span className="font-mono text-[11px]">Plateforme Doctorale Officielle</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
