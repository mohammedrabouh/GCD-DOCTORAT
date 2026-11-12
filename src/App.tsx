/**
 * DOCTORIA — Plateforme de Gestion du Cycle Doctoral
 * Main Application Router & State Coordinator
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PublicLayout } from './layouts/PublicLayout';
import { DashboardLayout } from './layouts/DashboardLayout';

// Public pages
import { PublicCataloguePage } from './pages/PublicCataloguePage';
import { PublicCalendrierPage, PublicGuidePage, PublicAproposPage } from './pages/PublicInfoPages';
import { AuthPage } from './pages/AuthPage';

// Candidate pages
import { CandidateDashboard } from './pages/candidate/CandidateDashboard';
import { CandidateCandidatures } from './pages/candidate/CandidateCandidatures';
import { CandidateDocuments } from './pages/candidate/CandidateDocuments';
import { CandidateRegistration } from './pages/candidate/CandidateRegistration';
import { CandidateReinscription } from './pages/candidate/CandidateReinscription';
import { CandidateProfile } from './pages/candidate/CandidateProfile';

// Thesis Supervisor pages
import { SupervisorDashboard } from './pages/supervisor/SupervisorDashboard';
import { SupervisorSubjects } from './pages/supervisor/SupervisorSubjects';
import { SupervisorCandidatures } from './pages/supervisor/SupervisorCandidatures';
import { SupervisorDoctorants } from './pages/supervisor/SupervisorDoctorants';

// Structure Director pages
import { StructureDashboard } from './pages/structure/StructureDashboard';
import { StructureSubjects } from './pages/structure/StructureSubjects';
import { StructureAdmissions } from './pages/structure/StructureAdmissions';
import { StructureDelaisWaitlist } from './pages/structure/StructureDelaisWaitlist';
import { StructureReinscriptions } from './pages/structure/StructureReinscriptions';

// Administrator pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminAccounts } from './pages/admin/AdminAccounts';
import { AdminCampaigns } from './pages/admin/AdminCampaigns';
import { AdminStructures } from './pages/admin/AdminStructures';
import { AdminAuditLogs } from './pages/admin/AdminAuditLogs';

import { ThesisSubject } from './types';

function MainApp() {
  const { user, loading } = useAuth();

  // Public portal state (when unauthenticated)
  const [showAuthPage, setShowAuthPage] = useState(false);
  const [currentPublicPage, setCurrentPublicPage] = useState<'catalogue' | 'calendrier' | 'guide' | 'apropos'>('catalogue');

  // Authenticated dashboard tab
  const [currentTab, setCurrentTab] = useState<string>('dashboard');

  // Transferred subject from catalogue to candidature
  const [preSelectedSubject, setPreSelectedSubject] = useState<ThesisSubject | null>(null);

  // Set default tab when user logs in based on their role
  useEffect(() => {
    if (user) {
      setShowAuthPage(false);
      switch (user.role) {
        case 'CANDIDAT':
          setCurrentTab('dashboard');
          break;
        case 'DIRECTEUR_THESE':
          setCurrentTab('dt-dashboard');
          break;
        case 'DIRECTEUR_STRUCTURE':
          setCurrentTab('ds-dashboard');
          break;
        case 'ADMINISTRATEUR':
          setCurrentTab('admin-dashboard');
          break;
      }
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-9 h-9 border-3 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Chargement de la plateforme DOCTORIA...
          </p>
        </div>
      </div>
    );
  }

  // 1. UN-AUTHENTICATED ROUTING
  if (!user) {
    if (showAuthPage) {
      return (
        <AuthPage
          onSuccessRedirect={() => setShowAuthPage(false)}
          onBackToCatalogue={() => {
            setShowAuthPage(false);
            setCurrentPublicPage('catalogue');
          }}
        />
      );
    }

    return (
      <PublicLayout
        currentPublicPage={currentPublicPage}
        onSelectPublicPage={(page) => setCurrentPublicPage(page)}
        onNavigateLogin={() => setShowAuthPage(true)}
      >
        {currentPublicPage === 'catalogue' && (
          <PublicCataloguePage
            onNavigateLogin={() => setShowAuthPage(true)}
            onApplyToSubject={(subj) => {
              setPreSelectedSubject(subj);
              setShowAuthPage(true);
            }}
          />
        )}
        {currentPublicPage === 'calendrier' && <PublicCalendrierPage />}
        {currentPublicPage === 'guide' && <PublicGuidePage />}
        {currentPublicPage === 'apropos' && <PublicAproposPage />}
      </PublicLayout>
    );
  }

  // 2. AUTHENTICATED DASHBOARD ROUTING (BY ROLE)
  const renderRoleContent = () => {
    switch (user.role) {
      // ----------------------------------------------------
      // PROFIL 1 : CANDIDAT
      // ----------------------------------------------------
      case 'CANDIDAT':
        switch (currentTab) {
          case 'dashboard':
            return (
              <CandidateDashboard
                onNavigateTab={(tab) => {
                  setCurrentTab(tab);
                }}
              />
            );
          case 'catalogue':
            return (
              <PublicCataloguePage
                isInsideDashboard={true}
                onApplyToSubject={(subj) => {
                  setPreSelectedSubject(subj);
                  setCurrentTab('candidatures');
                }}
              />
            );
          case 'candidatures':
            return (
              <CandidateCandidatures
                onNavigateTab={(tab) => setCurrentTab(tab)}
                preSelectedSubject={preSelectedSubject}
                onClearPreSelectedSubject={() => setPreSelectedSubject(null)}
              />
            );
          case 'documents':
            return <CandidateDocuments />;
          case 'inscription':
            return <CandidateRegistration />;
          case 'reinscription':
            return <CandidateReinscription />;
          case 'profil':
            return <CandidateProfile />;
          default:
            return (
              <CandidateDashboard
                onNavigateTab={(tab) => {
                  setCurrentTab(tab);
                }}
              />
            );
        }

      // ----------------------------------------------------
      // PROFIL 2 : DIRECTEUR DE THÈSE
      // ----------------------------------------------------
      case 'DIRECTEUR_THESE':
        switch (currentTab) {
          case 'dt-dashboard':
            return <SupervisorDashboard onNavigateTab={(tab) => setCurrentTab(tab)} />;
          case 'dt-sujets':
            return <SupervisorSubjects />;
          case 'dt-candidatures':
            return <SupervisorCandidatures />;
          case 'dt-doctorants':
            return <SupervisorDoctorants />;
          default:
            return <SupervisorDashboard onNavigateTab={(tab) => setCurrentTab(tab)} />;
        }

      // ----------------------------------------------------
      // PROFIL 3 : DIRECTEUR DE STRUCTURE
      // ----------------------------------------------------
      case 'DIRECTEUR_STRUCTURE':
        switch (currentTab) {
          case 'ds-dashboard':
            return <StructureDashboard onNavigateTab={(tab) => setCurrentTab(tab)} />;
          case 'ds-sujets':
            return <StructureSubjects />;
          case 'ds-admissions':
            return <StructureAdmissions />;
          case 'ds-delais':
            return <StructureDelaisWaitlist />;
          case 'ds-reinscriptions':
            return <StructureReinscriptions />;
          default:
            return <StructureDashboard onNavigateTab={(tab) => setCurrentTab(tab)} />;
        }

      // ----------------------------------------------------
      // PROFIL 4 : ADMINISTRATEUR
      // ----------------------------------------------------
      case 'ADMINISTRATEUR':
        switch (currentTab) {
          case 'admin-dashboard':
            return <AdminDashboard onNavigateTab={(tab) => setCurrentTab(tab)} />;
          case 'admin-comptes':
            return <AdminAccounts />;
          case 'admin-campagnes':
            return <AdminCampaigns />;
          case 'admin-structures':
            return <AdminStructures />;
          case 'admin-audit':
            return <AdminAuditLogs />;
          default:
            return <AdminDashboard onNavigateTab={(tab) => setCurrentTab(tab)} />;
        }

      default:
        return <div>Rôle non reconnu.</div>;
    }
  };

  return (
    <DashboardLayout currentTab={currentTab} onSelectTab={(tab) => setCurrentTab(tab)}>
      {renderRoleContent()}
    </DashboardLayout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
