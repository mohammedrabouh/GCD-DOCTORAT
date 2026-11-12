/**
 * DOCTORIA — Types & Enums
 * Plateforme de Gestion du Cycle Doctoral
 */

export type UserRole = 'CANDIDAT' | 'DIRECTEUR_THESE' | 'DIRECTEUR_STRUCTURE' | 'ADMINISTRATEUR';

export type AccountStatus = 'ACTIF' | 'SUSPENDU' | 'EN_ATTENTE';

export interface User {
  id: string;
  email: string;
  passwordHash: string; // SHA-256 hash
  firstName: string;
  lastName: string;
  role: UserRole;
  status: AccountStatus;
  phone?: string;
  cin?: string; // Carte d'Identité Nationale
  cne?: string; // Code National de l'Étudiant (Massar)
  establishmentId?: string;
  laboratoryId?: string;
  specialty?: string;
  grade?: string; // e.g. Professeur de l'Enseignement Supérieur, Habilité
  createdAt: string;
  updatedAt: string;
}

export interface DoctoralCampaign {
  id: string;
  code: string;
  title: string;
  academicYear: string; // e.g. "2026-2027"
  startDate: string;
  endDate: string;
  registrationDeadline: string; // Date limite d'inscription administrative
  isActive: boolean;
  description: string;
  maxCandidaturesPerCandidate: number;
  allowWaitlistPromotion: boolean;
}

export interface Establishment {
  id: string;
  code: string;
  name: string;
  city: string;
  universityName: string;
}

export interface Laboratory {
  id: string;
  code: string;
  name: string;
  establishmentId: string;
  directorName: string;
  researchPole: string;
}

export type SubjectStatus =
  | 'BROUILLON'
  | 'SOUMIS_VALIDATION'
  | 'VALIDE'
  | 'REFUSE'
  | 'PUBLIE'
  | 'ARCHIVE';

export type SubjectAvailability = 'OUVERT' | 'FERME' | 'COMPLET';

export interface ThesisSubject {
  id: string;
  code: string;
  title: string;
  description: string;
  discipline: string;
  domain: string; // Domaine scientifique
  keywords: string[];
  problematique?: string; // Problématique scientifique détaillée
  objectifs?: string[]; // Objectifs scientifiques
  methodologie?: string; // Méthodologie envisagée
  requirements: string; // Prérequis académiques
  laboratoryId: string;
  establishmentId: string;
  supervisorId: string; // Directeur de thèse / Encadrant
  supervisorName: string;
  supervisorEmail?: string;
  coSupervisorName?: string;
  availableSeats: number;
  admittedCount: number;
  campaignId: string;
  academicYear: string; // e.g. "2026-2027"
  status: SubjectStatus; // Workflow status
  statutOffre: SubjectAvailability; // Ouvert, Fermé, Complet
  isDemo?: boolean; // Données d'expérimentation identifiées
  validationComment?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type CandidatureStatus =
  | 'BROUILLON'
  | 'SOUMISE'
  | 'EN_COURS_EXAMEN'
  | 'CORRECTION_DEMANDEE'
  | 'ACCEPTEE_DIRECTEUR_THESE'
  | 'REJETEE_DIRECTEUR_THESE'
  | 'EN_ATTENTE_DECISION_ADMINISTRATIVE'
  | 'ADMISE'
  | 'REJETEE'
  | 'LISTE_ATTENTE'
  | 'ADMISSION_ANNULEE_DELAI_DEPASSE';

export interface StatusHistoryEntry {
  fromStatus: string;
  toStatus: string;
  timestamp: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  justification?: string;
}

export interface CorrectionRequest {
  id: string;
  requestedAt: string;
  authorId: string;
  authorName: string;
  message: string;
  requestedDocuments: string[];
  resolved: boolean;
  resolvedAt?: string;
}

export type DocumentCategory =
  | 'CIN'
  | 'BAC'
  | 'LICENCE'
  | 'MASTER'
  | 'RELEVES_NOTES'
  | 'CV'
  | 'PROJET_RECHERCHE'
  | 'LETTRE_MOTIVATION'
  | 'RAPPORT_AVANCEMENT'
  | 'AVIS_DIRECTEUR'
  | 'FORMATIONS_DOCTORALES'
  | 'DOCUMENT_INSCRIPTION'
  | 'AUTRE';

export type DocumentStatus = 'EN_ATTENTE' | 'VALIDE' | 'REFUSE';

export interface DocumentItem {
  id: string;
  ownerId: string;
  ownerName: string;
  category: DocumentCategory;
  categoryLabel: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadDate: string;
  status: DocumentStatus;
  validationComment?: string;
  isCameraCapture: boolean;
  // Reference to IndexedDB blob storage
  storageKey: string;
}

export interface RegistrationFile {
  submittedAt?: string;
  status: 'NON_COMMENCEE' | 'DOSSIER_DEPOSE' | 'EN_COURS_VERIFICATION' | 'VALIDEE' | 'DELAI_DEPASSE';
  documents: Record<string, string>; // category -> documentId
  verifiedAt?: string;
  verifiedBy?: string;
  notes?: string;
}

export interface Candidature {
  id: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone?: string;
  candidateCin?: string;
  candidateCne?: string;
  subjectId: string;
  subjectTitle: string;
  supervisorId: string;
  laboratoryId: string;
  establishmentId: string;
  campaignId: string;
  status: CandidatureStatus;
  isDraft: boolean;
  submissionDate?: string;
  documents: Record<string, string>; // category -> documentId
  supervisorReview?: {
    decisionDate: string;
    decision: 'ACCEPTEE' | 'REJETEE';
    justification: string;
    reviewedBy: string;
    reviewerName: string;
  };
  structureReview?: {
    decisionDate: string;
    decision: 'ADMISE' | 'REJETEE' | 'LISTE_ATTENTE';
    justification: string;
    reviewedBy: string;
    reviewerName: string;
    registrationDeadline?: string;
  };
  waitlistRank?: number;
  registrationFile?: RegistrationFile;
  history: StatusHistoryEntry[];
  corrections: CorrectionRequest[];
  createdAt: string;
  updatedAt: string;
}

export type ReinscriptionStatus =
  | 'BROUILLON'
  | 'SOUMISE'
  | 'AVIS_DT_FAVORABLE'
  | 'AVIS_DT_DEFAVORABLE'
  | 'VALIDEE_STRUCTURE'
  | 'REFUSEE_STRUCTURE';

export interface ReinscriptionRequest {
  id: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  subjectId: string;
  subjectTitle: string;
  supervisorId: string;
  supervisorName: string;
  campaignId: string;
  doctoralYear: number; // 2ème année, 3ème année, etc.
  status: ReinscriptionStatus;
  // 3 mandatory documents strictly required:
  rapportAvancementDocId: string;
  avisDirecteurDocId: string;
  formationsDoctoralesDocId: string;
  supervisorReview?: {
    date: string;
    avis: 'FAVORABLE' | 'DEFAVORABLE';
    observation: string;
    supervisorId: string;
    supervisorName: string;
  };
  structureReview?: {
    date: string;
    decision: 'VALIDEE' | 'REFUSEE';
    justification: string;
    reviewerId: string;
    reviewerName: string;
  };
  history: StatusHistoryEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface InternalNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ALERT';
  linkTo?: string;
  read: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  entityType: 'USER' | 'SUBJECT' | 'CANDIDATURE' | 'DOCUMENT' | 'REINSCRIPTION' | 'CAMPAIGN' | 'AUTH';
  entityId: string;
  details: string;
}
