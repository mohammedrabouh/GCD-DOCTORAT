/**
 * DOCTORIA — Constants, Labels & Centralized Configuration
 */

import { DocumentCategory, UserRole, CandidatureStatus, SubjectStatus, ReinscriptionStatus } from '../types';

export const DOCUMENT_CATEGORIES: Record<DocumentCategory, { label: string; description: string; requiredForCandidature: boolean }> = {
  CIN: {
    label: "Carte d'Identité Nationale ou Passeport",
    description: "Copie recto-verso de la CNIE ou des pages principales du passeport",
    requiredForCandidature: true,
  },
  BAC: {
    label: "Diplôme du Baccalauréat",
    description: "Attestation originale ou copie certifiée conforme du Baccalauréat",
    requiredForCandidature: true,
  },
  LICENCE: {
    label: "Diplôme de Licence ou équivalent",
    description: "Attestation de réussite ou diplôme de Licence fondamentale/professionnelle",
    requiredForCandidature: true,
  },
  MASTER: {
    label: "Diplôme de Master ou diplôme d'Ingénieur",
    description: "Diplôme de Master de recherche, Master spécialisé ou Diplôme d'Ingénieur d'État",
    requiredForCandidature: true,
  },
  RELEVES_NOTES: {
    label: "Relevés de notes universitaires globaux",
    description: "Relevés de notes de l'ensemble des années de Licence et Master / Cycle Ingénieur",
    requiredForCandidature: true,
  },
  CV: {
    label: "Curriculum Vitae détaillé (CV)",
    description: "Parcours académique, compétences techniques, stages et éventuelles publications",
    requiredForCandidature: true,
  },
  PROJET_RECHERCHE: {
    label: "Avant-projet de recherche doctoral",
    description: "Synthèse problématique, objectifs, méthodologie envisagée (3 à 5 pages)",
    requiredForCandidature: true,
  },
  LETTRE_MOTIVATION: {
    label: "Lettre de motivation académique",
    description: "Exposé des motivations pour le sujet de thèse et le laboratoire d'accueil",
    requiredForCandidature: false,
  },
  RAPPORT_AVANCEMENT: {
    label: "Rapport annuel d'avancement des travaux",
    description: "Bilan scientifique obligatoire des travaux réalisés durant l'année doctorale",
    requiredForCandidature: false,
  },
  AVIS_DIRECTEUR: {
    label: "Avis favorable du Directeur de Thèse",
    description: "Attestation formelle signée par le directeur de thèse autorisant la réinscription",
    requiredForCandidature: false,
  },
  FORMATIONS_DOCTORALES: {
    label: "Relevé des formations doctorales suivies",
    description: "Justificatifs des crédits ou heures de formations transversales et scientifiques",
    requiredForCandidature: false,
  },
  DOCUMENT_INSCRIPTION: {
    label: "Dossier d'inscription administrative finale",
    description: "Formulaire d'engagement, charte des thèses signée et attestation d'assurance",
    requiredForCandidature: false,
  },
  AUTRE: {
    label: "Autre justificatif académique complémentaire",
    description: "Certificats de langues, publications antérieures, prix ou distinctions",
    requiredForCandidature: false,
  },
};

export const CANDIDATURE_STATUS_CONFIG: Record<
  CandidatureStatus,
  { label: string; textClass: string; bgClass: string; borderClass: string; description: string }
> = {
  BROUILLON: {
    label: 'Brouillon',
    textClass: 'text-slate-700',
    bgClass: 'bg-slate-100',
    borderClass: 'border-slate-200',
    description: 'Dossier en cours de rédaction par le candidat. Non visible par le directeur.',
  },
  SOUMISE: {
    label: 'Soumise',
    textClass: 'text-blue-700',
    bgClass: 'bg-blue-50',
    borderClass: 'border-blue-200',
    description: 'Dossier transmis avec succès, en attente de prise en charge scientifique.',
  },
  EN_COURS_EXAMEN: {
    label: "En cours d'examen",
    textClass: 'text-indigo-700',
    bgClass: 'bg-indigo-50',
    borderClass: 'border-indigo-200',
    description: "Le directeur de thèse examine les pièces et l'adéquation scientifique.",
  },
  CORRECTION_DEMANDEE: {
    label: 'Correction demandée',
    textClass: 'text-amber-800',
    bgClass: 'bg-amber-50',
    borderClass: 'border-amber-200',
    description: 'Des pièces complémentaires ou des corrections sont requises.',
  },
  ACCEPTEE_DIRECTEUR_THESE: {
    label: 'Acceptée par le Directeur de Thèse',
    textClass: 'text-teal-800',
    bgClass: 'bg-teal-50',
    borderClass: 'border-teal-200',
    description: 'Avis scientifique favorable émis. Transmis à la direction de structure pour validation.',
  },
  REJETEE_DIRECTEUR_THESE: {
    label: 'Rejetée par le Directeur de Thèse',
    textClass: 'text-rose-800',
    bgClass: 'bg-rose-50',
    borderClass: 'border-rose-200',
    description: 'Avis scientifique défavorable émis par le directeur de thèse.',
  },
  EN_ATTENTE_DECISION_ADMINISTRATIVE: {
    label: 'En attente de décision administrative',
    textClass: 'text-purple-800',
    bgClass: 'bg-purple-50',
    borderClass: 'border-purple-200',
    description: "Le dossier est soumis à l'arbitrage final du Directeur de Structure.",
  },
  ADMISE: {
    label: 'Admise',
    textClass: 'text-emerald-800',
    bgClass: 'bg-emerald-50',
    borderClass: 'border-emerald-200',
    description: "Candidature admise définitivement. Inscription administrative ouverte jusqu'à la date limite.",
  },
  REJETEE: {
    label: 'Non retenue',
    textClass: 'text-slate-800',
    bgClass: 'bg-slate-100',
    borderClass: 'border-slate-300',
    description: 'Candidature non retenue lors de la commission de sélection.',
  },
  LISTE_ATTENTE: {
    label: "Liste d'attente",
    textClass: 'text-amber-900',
    bgClass: 'bg-amber-100/70',
    borderClass: 'border-amber-300',
    description: "Candidature classée sur liste d'attente selon les places disponibles.",
  },
  ADMISSION_ANNULEE_DELAI_DEPASSE: {
    label: 'Délai dépassé (Annulée)',
    textClass: 'text-red-900',
    bgClass: 'bg-red-50',
    borderClass: 'border-red-200',
    description: "Admission annulée suite au non-respect de la date limite d'inscription.",
  },
};

export const SUBJECT_STATUS_CONFIG: Record<
  SubjectStatus,
  { label: string; textClass: string; bgClass: string; borderClass: string }
> = {
  BROUILLON: {
    label: 'Brouillon',
    textClass: 'text-slate-700',
    bgClass: 'bg-slate-100',
    borderClass: 'border-slate-200',
  },
  SOUMIS_VALIDATION: {
    label: 'Soumis à validation',
    textClass: 'text-blue-700',
    bgClass: 'bg-blue-50',
    borderClass: 'border-blue-200',
  },
  VALIDE: {
    label: 'Validé & Signé',
    textClass: 'text-teal-700',
    bgClass: 'bg-teal-50',
    borderClass: 'border-teal-200',
  },
  REFUSE: {
    label: 'Refusé par la structure',
    textClass: 'text-rose-700',
    bgClass: 'bg-rose-50',
    borderClass: 'border-rose-200',
  },
  PUBLIE: {
    label: 'Publié au catalogue',
    textClass: 'text-emerald-700',
    bgClass: 'bg-emerald-50',
    borderClass: 'border-emerald-200',
  },
  ARCHIVE: {
    label: 'Archivé',
    textClass: 'text-slate-500',
    bgClass: 'bg-slate-100',
    borderClass: 'border-slate-200',
  },
};

export const REINSCRIPTION_STATUS_CONFIG: Record<
  ReinscriptionStatus,
  { label: string; textClass: string; bgClass: string; borderClass: string }
> = {
  BROUILLON: {
    label: 'Brouillon',
    textClass: 'text-slate-700',
    bgClass: 'bg-slate-100',
    borderClass: 'border-slate-200',
  },
  SOUMISE: {
    label: 'Soumise au directeur',
    textClass: 'text-blue-700',
    bgClass: 'bg-blue-50',
    borderClass: 'border-blue-200',
  },
  AVIS_DT_FAVORABLE: {
    label: 'Avis DT Favorable',
    textClass: 'text-teal-700',
    bgClass: 'bg-teal-50',
    borderClass: 'border-teal-200',
  },
  AVIS_DT_DEFAVORABLE: {
    label: 'Avis DT Défavorable',
    textClass: 'text-rose-700',
    bgClass: 'bg-rose-50',
    borderClass: 'border-rose-200',
  },
  VALIDEE_STRUCTURE: {
    label: 'Réinscription Validée',
    textClass: 'text-emerald-700',
    bgClass: 'bg-emerald-50',
    borderClass: 'border-emerald-200',
  },
  REFUSEE_STRUCTURE: {
    label: 'Réinscription Refusée',
    textClass: 'text-red-700',
    bgClass: 'bg-red-50',
    borderClass: 'border-red-200',
  },
};

export const ROLE_LABELS: Record<UserRole, string> = {
  CANDIDAT: 'Candidat au Doctorat',
  DIRECTEUR_THESE: 'Directeur de Thèse',
  DIRECTEUR_STRUCTURE: 'Directeur de Structure (CED)',
  ADMINISTRATEUR: 'Administrateur Système',
};

// Simple cryptographic SHA-256 helper for client storage
export async function hashPassword(plainText: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(plainText.trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}
