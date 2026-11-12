/**
 * DOCTORIA — Central Local Storage Service
 * Enforces business rules, relationships, audit logging, and strict account restrictions.
 */

import {
  User,
  UserRole,
  DoctoralCampaign,
  Establishment,
  Laboratory,
  ThesisSubject,
  Candidature,
  DocumentItem,
  ReinscriptionRequest,
  InternalNotification,
  AuditLog,
  StatusHistoryEntry,
  CandidatureStatus,
  SubjectStatus,
  ReinscriptionStatus,
} from '../types';
import { hashPassword } from '../constants';
import { USMBA_ESTABLISHMENTS, USMBA_LABORATORIES, USMBA_THESIS_SUBJECTS } from '../data/usmbaSubjects';

const STORAGE_KEYS = {
  USERS: 'doctoria_users_v2',
  CAMPAIGNS: 'doctoria_campaigns_v2',
  ESTABLISHMENTS: 'doctoria_establishments_v2',
  LABORATORIES: 'doctoria_laboratories_v2',
  SUBJECTS: 'doctoria_subjects_v2',
  CANDIDATURES: 'doctoria_candidatures_v2',
  DOCUMENTS: 'doctoria_documents_meta_v2',
  REINSCRIPTIONS: 'doctoria_reinscriptions_v2',
  NOTIFICATIONS: 'doctoria_notifications_v2',
  AUDIT_LOGS: 'doctoria_audit_logs_v2',
  CURRENT_USER_SESSION: 'doctoria_session_v2',
  INITIALIZED: 'doctoria_db_initialized_v2_usmba',
};

type Listener = () => void;
const listeners: Set<Listener> = new Set();

export function subscribeToStorage(callback: Listener): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

function notifySubscribers() {
  listeners.forEach((cb) => {
    try {
      cb();
    } catch (e) {
      console.error('Storage listener error:', e);
    }
  });
}

function getItem<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.error(`Error reading ${key} from localStorage:`, err);
    return defaultValue;
  }
}

function setItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    notifySubscribers();
  } catch (err) {
    console.error(`Error saving ${key} to localStorage:`, err);
    throw new Error('Erreur de stockage local: espace insuffisant ou écriture refusée.');
  }
}

export const StorageService = {
  // ==========================================
  // INITIAL SEEDING — UNIVERSITÉ SIDI MOHAMED BEN ABDELLAH (USMBA)
  // ==========================================
  async initialize(): Promise<void> {
    const isInit = localStorage.getItem(STORAGE_KEYS.INITIALIZED);
    if (isInit) return;

    // 1. Establishments (FSDM, FST, ENSA, FSJES, ENCG, FMPDF, FLSH)
    setItem(STORAGE_KEYS.ESTABLISHMENTS, USMBA_ESTABLISHMENTS);

    // 2. Laboratories
    setItem(STORAGE_KEYS.LABORATORIES, USMBA_LABORATORIES);

    // 3. Campaigns
    const now = new Date();
    const startDate = new Date(now.getFullYear(), 8, 15).toISOString().split('T')[0]; // 15 Septembre
    const endDate = new Date(now.getFullYear(), 11, 20).toISOString().split('T')[0]; // 20 Décembre
    const registrationDeadline = new Date(now.getFullYear() + 1, 0, 15).toISOString().split('T')[0]; // 15 Janvier

    const campaigns: DoctoralCampaign[] = [
      {
        id: 'camp_usmba_2026_2027',
        code: 'DOC-USMBA-2026-2027',
        title: 'Campagne Doctorale USMBA 2026-2027',
        academicYear: '2026-2027',
        startDate: startDate,
        endDate: endDate,
        registrationDeadline: registrationDeadline,
        isActive: true,
        description: 'Campagne officielle des Centres d’Études Doctorales (CED-ST et CED-LSHJES) de l’Université Sidi Mohamed Ben Abdellah.',
        maxCandidaturesPerCandidate: 3,
        allowWaitlistPromotion: true,
      },
    ];
    setItem(STORAGE_KEYS.CAMPAIGNS, campaigns);

    // 4. Accounts (Pre-hashed passwords with @usmba.ac.ma official domain)
    // admin: DoctoriaAdmin2026!
    // ds: DirecteurStructure2026!
    // dt: DirecteurThese2026!
    // candidat: Candidat2026!
    const adminHash = await hashPassword('DoctoriaAdmin2026!');
    const dsHash = await hashPassword('DirecteurStructure2026!');
    const dtHash = await hashPassword('DirecteurThese2026!');
    const candidatHash = await hashPassword('Candidat2026!');

    const users: User[] = [
      {
        id: 'user_admin_cedoc',
        email: 'admin.cedoc@usmba.ac.ma',
        passwordHash: adminHash,
        firstName: 'Karim',
        lastName: 'El Mansouri',
        role: 'ADMINISTRATEUR',
        status: 'ACTIF',
        phone: '+212 5 35 60 96 60',
        grade: 'Administrateur Principal SI - CEDoc USMBA',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'user_ds_kaaouachi',
        email: 'abdelali.kaaouachi@usmba.ac.ma',
        passwordHash: dsHash,
        firstName: 'Abdelali',
        lastName: 'Kaaouachi',
        role: 'DIRECTEUR_STRUCTURE',
        status: 'ACTIF',
        phone: '+212 5 35 60 80 14',
        establishmentId: 'est_fsdm',
        specialty: 'Statistiques & Évaluation de la Recherche',
        grade: 'Directeur du CEDoc USMBA - Professeur de l’Enseignement Supérieur (PES)',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'usr_enc_qaraqe',
        email: 'mohammed.qaraqe@usmba.ac.ma',
        passwordHash: dtHash,
        firstName: 'Mohammed',
        lastName: 'Qaraqe',
        role: 'DIRECTEUR_THESE',
        status: 'ACTIF',
        phone: '+212 6 61 24 55 89',
        establishmentId: 'est_fsdm',
        laboratoryId: 'lab_lisac',
        specialty: 'Informatique & Intelligence Artificielle',
        grade: 'Professeur de l’Enseignement Supérieur (PES)',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'usr_enc_zenkouar',
        email: 'khalid.zenkouar@usmba.ac.ma',
        passwordHash: dtHash,
        firstName: 'Khalid',
        lastName: 'Zenkouar',
        role: 'DIRECTEUR_THESE',
        status: 'ACTIF',
        phone: '+212 6 62 10 33 44',
        establishmentId: 'est_ensa',
        laboratoryId: 'lab_lisa',
        specialty: 'Traitement du Signal & Systèmes Intelligents',
        grade: 'Professeur de l’Enseignement Supérieur (PES)',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'usr_enc_benbrahim',
        email: 'mohammed.benbrahim@usmba.ac.ma',
        passwordHash: dtHash,
        firstName: 'Mohammed',
        lastName: 'Benbrahim',
        role: 'DIRECTEUR_THESE',
        status: 'ACTIF',
        phone: '+212 6 63 45 78 90',
        establishmentId: 'est_fst',
        laboratoryId: 'lab_lerse',
        specialty: 'Énergies Renouvelables & Systèmes Électroniques',
        grade: 'Professeur Habilité (PH)',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'usr_enc_hmina',
        email: 'nabil.hmina@usmba.ac.ma',
        passwordHash: dtHash,
        firstName: 'Nabil',
        lastName: 'Hmina',
        role: 'DIRECTEUR_THESE',
        status: 'ACTIF',
        phone: '+212 6 61 70 80 90',
        establishmentId: 'est_ensa',
        laboratoryId: 'lab_labtic',
        specialty: 'Télécommunications & Cybersécurité',
        grade: 'Professeur de l’Enseignement Supérieur (PES)',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'usr_enc_amine',
        email: 'amina.amine@usmba.ac.ma',
        passwordHash: dtHash,
        firstName: 'Amina',
        lastName: 'Amine',
        role: 'DIRECTEUR_THESE',
        status: 'ACTIF',
        phone: '+212 6 64 12 34 88',
        establishmentId: 'est_encg',
        laboratoryId: 'lab_larego',
        specialty: 'Management Stratégique & Économie Circulaire',
        grade: 'Professeur de l’Enseignement Supérieur (PES)',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'user_candidat_youssef',
        email: 'youssef.elamrani@usmba.ac.ma',
        passwordHash: candidatHash,
        firstName: 'Youssef',
        lastName: 'El Amrani',
        role: 'CANDIDAT',
        status: 'ACTIF',
        phone: '+212 6 70 12 34 56',
        cin: 'CD782910',
        cne: 'N134098712',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
    setItem(STORAGE_KEYS.USERS, users);

    // 5. 32 USMBA Thesis Subjects (Across all 17 requested disciplines)
    setItem(STORAGE_KEYS.SUBJECTS, USMBA_THESIS_SUBJECTS);

    // Initial audit log
    const auditLogs: AuditLog[] = [
      {
        id: 'audit_init_usmba',
        timestamp: new Date().toISOString(),
        userId: 'user_admin_cedoc',
        userName: 'Karim El Mansouri',
        userRole: 'ADMINISTRATEUR',
        action: 'INITIALISATION_SYSTEME',
        entityType: 'CAMPAIGN',
        entityId: 'camp_usmba_2026_2027',
        details: 'Initialisation de la plateforme DOCTORIA pour les centres d’études doctorales de l’USMBA (32 sujets accrédités).',
      },
    ];
    setItem(STORAGE_KEYS.AUDIT_LOGS, auditLogs);

    localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
  },

  // ==========================================
  // ACCOUNTS & USERS — STRICT RESTRICTION:
  // ONLY CREATE & READ. NO UPDATE. NO DELETE.
  // ==========================================

  getUsers(): User[] {
    return getItem<User[]>(STORAGE_KEYS.USERS, []);
  },

  getUserById(id: string): User | undefined {
    return this.getUsers().find((u) => u.id === id);
  },

  getUserByEmail(email: string): User | undefined {
    const clean = email.trim().toLowerCase();
    return this.getUsers().find((u) => u.email.toLowerCase() === clean);
  },

  /**
   * CREATE USER (Permis uniquement pour Administrateur ou auto-inscription Candidat)
   * Prevents duplicate emails.
   */
  async createUser(userData: {
    firstName: string;
    lastName: string;
    email: string;
    passwordPlain: string;
    role: UserRole;
    phone?: string;
    cin?: string;
    cne?: string;
    establishmentId?: string;
    laboratoryId?: string;
    specialty?: string;
    grade?: string;
  }, creatorUser?: User): Promise<User> {
    const cleanEmail = userData.email.trim().toLowerCase();

    // Check duplicate email
    if (this.getUserByEmail(cleanEmail)) {
      throw new Error(`Un compte existe déjà avec l'adresse e-mail: ${cleanEmail}`);
    }

    const passwordHash = await hashPassword(userData.passwordPlain);
    const newUser: User = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      email: cleanEmail,
      passwordHash: passwordHash,
      firstName: userData.firstName.trim(),
      lastName: userData.lastName.trim(),
      role: userData.role,
      status: 'ACTIF',
      phone: userData.phone?.trim(),
      cin: userData.cin?.trim().toUpperCase(),
      cne: userData.cne?.trim().toUpperCase(),
      establishmentId: userData.establishmentId,
      laboratoryId: userData.laboratoryId,
      specialty: userData.specialty?.trim(),
      grade: userData.grade?.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const users = this.getUsers();
    users.push(newUser);
    setItem(STORAGE_KEYS.USERS, users);

    // Audit log
    this.logAudit({
      userId: creatorUser ? creatorUser.id : newUser.id,
      userName: creatorUser ? `${creatorUser.firstName} ${creatorUser.lastName}` : `${newUser.firstName} ${newUser.lastName}`,
      userRole: creatorUser ? creatorUser.role : newUser.role,
      action: 'CREATION_COMPTE',
      entityType: 'USER',
      entityId: newUser.id,
      details: `Création du compte (${newUser.role}) pour ${newUser.firstName} ${newUser.lastName} [${newUser.email}].`,
    });

    return newUser;
  },

  /**
   * RESTRICTION ABSOLUE : LES FONCTIONS DE MODIFICATION OU SUPPRESSION DE COMPTE
   * SONT FORMELLEMENT INTERDITES ET DÉCLENCHENT UNE ERREUR SYSTÈME.
   */
  updateUser(): never {
    throw new Error("Opération interdite : la modification de compte n'est pas autorisée par la politique de sécurité DOCTORIA.");
  },

  deleteUser(): never {
    throw new Error("Opération interdite : la suppression de compte n'est pas autorisée par la politique de sécurité DOCTORIA.");
  },

  // ==========================================
  // CAMPAIGNS & STRUCTURES
  // ==========================================
  getCampaigns(): DoctoralCampaign[] {
    return getItem<DoctoralCampaign[]>(STORAGE_KEYS.CAMPAIGNS, []);
  },

  getActiveCampaign(): DoctoralCampaign | undefined {
    return this.getCampaigns().find((c) => c.isActive);
  },

  createCampaign(campaign: Omit<DoctoralCampaign, 'id'>, author: User): DoctoralCampaign {
    const list = this.getCampaigns();
    const newCamp: DoctoralCampaign = {
      ...campaign,
      id: `camp_${Date.now()}`,
    };
    list.push(newCamp);
    setItem(STORAGE_KEYS.CAMPAIGNS, list);

    this.logAudit({
      userId: author.id,
      userName: `${author.firstName} ${author.lastName}`,
      userRole: author.role,
      action: 'CREATION_CAMPAGNE',
      entityType: 'CAMPAIGN',
      entityId: newCamp.id,
      details: `Création de la campagne doctorale ${newCamp.title} (${newCamp.academicYear}).`,
    });

    return newCamp;
  },

  updateCampaign(campaign: DoctoralCampaign, author: User): void {
    const list = this.getCampaigns().map((c) => (c.id === campaign.id ? campaign : c));
    setItem(STORAGE_KEYS.CAMPAIGNS, list);

    this.logAudit({
      userId: author.id,
      userName: `${author.firstName} ${author.lastName}`,
      userRole: author.role,
      action: 'MODIFICATION_CAMPAGNE',
      entityType: 'CAMPAIGN',
      entityId: campaign.id,
      details: `Mise à jour des paramètres de la campagne ${campaign.title}.`,
    });
  },

  getEstablishments(): Establishment[] {
    return getItem<Establishment[]>(STORAGE_KEYS.ESTABLISHMENTS, []);
  },

  getLaboratories(): Laboratory[] {
    return getItem<Laboratory[]>(STORAGE_KEYS.LABORATORIES, []);
  },

  createEstablishment(est: Omit<Establishment, 'id'>, author: User): Establishment {
    const list = this.getEstablishments();
    const item: Establishment = { ...est, id: `est_${Date.now()}` };
    list.push(item);
    setItem(STORAGE_KEYS.ESTABLISHMENTS, list);
    this.logAudit({
      userId: author.id,
      userName: `${author.firstName} ${author.lastName}`,
      userRole: author.role,
      action: 'CREATION_ETABLISSEMENT',
      entityType: 'CAMPAIGN',
      entityId: item.id,
      details: `Ajout de l'établissement ${item.name} (${item.code}).`,
    });
    return item;
  },

  createLaboratory(lab: Omit<Laboratory, 'id'>, author: User): Laboratory {
    const list = this.getLaboratories();
    const item: Laboratory = { ...lab, id: `lab_${Date.now()}` };
    list.push(item);
    setItem(STORAGE_KEYS.LABORATORIES, list);
    this.logAudit({
      userId: author.id,
      userName: `${author.firstName} ${author.lastName}`,
      userRole: author.role,
      action: 'CREATION_LABORATOIRE',
      entityType: 'CAMPAIGN',
      entityId: item.id,
      details: `Ajout du laboratoire ${item.name} (${item.code}).`,
    });
    return item;
  },

  // ==========================================
  // THESIS SUBJECTS
  // ==========================================
  getSubjects(): ThesisSubject[] {
    return getItem<ThesisSubject[]>(STORAGE_KEYS.SUBJECTS, []);
  },

  getSubjectById(id: string): ThesisSubject | undefined {
    return this.getSubjects().find((s) => s.id === id);
  },

  getPublishedSubjects(): ThesisSubject[] {
    return this.getSubjects().filter((s) => s.status === 'PUBLIE');
  },

  createSubject(subjectData: {
    title: string;
    description: string;
    keywords: string[];
    discipline: string;
    domain?: string;
    problematique?: string;
    objectifs?: string[];
    methodologie?: string;
    laboratoryId: string;
    establishmentId: string;
    availableSeats: number;
    requirements: string;
    campaignId: string;
    coSupervisorName?: string;
    academicYear?: string;
  }, supervisor: User): ThesisSubject {
    const code = `USMBA-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const newSubject: ThesisSubject = {
      id: `subj_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      code,
      title: subjectData.title.trim(),
      description: subjectData.description.trim(),
      keywords: subjectData.keywords,
      discipline: subjectData.discipline.trim(),
      domain: subjectData.domain || 'Sciences et Technologies',
      problematique: subjectData.problematique,
      objectifs: subjectData.objectifs || [],
      methodologie: subjectData.methodologie,
      laboratoryId: subjectData.laboratoryId,
      establishmentId: subjectData.establishmentId,
      supervisorId: supervisor.id,
      supervisorName: `Prof. ${supervisor.firstName} ${supervisor.lastName}`,
      supervisorEmail: supervisor.email,
      coSupervisorName: subjectData.coSupervisorName?.trim(),
      availableSeats: Math.max(1, subjectData.availableSeats),
      admittedCount: 0,
      requirements: subjectData.requirements.trim(),
      campaignId: subjectData.campaignId,
      academicYear: subjectData.academicYear || '2026-2027',
      status: 'SOUMIS_VALIDATION', // Submitted directly for validation to structure director
      statutOffre: 'OUVERT',
      isDemo: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const subjects = this.getSubjects();
    subjects.push(newSubject);
    setItem(STORAGE_KEYS.SUBJECTS, subjects);

    this.logAudit({
      userId: supervisor.id,
      userName: `${supervisor.firstName} ${supervisor.lastName}`,
      userRole: supervisor.role,
      action: 'CREATION_SUJET',
      entityType: 'SUBJECT',
      entityId: newSubject.id,
      details: `Proposition du sujet de thèse "${newSubject.title}" (${newSubject.code}).`,
    });

    // Notify structure directors
    const structureDirectors = this.getUsers().filter((u) => u.role === 'DIRECTEUR_STRUCTURE');
    structureDirectors.forEach((sd) => {
      this.createNotification({
        userId: sd.id,
        title: 'Nouveau sujet soumis à validation',
        message: `${newSubject.supervisorName} a soumis le sujet "${newSubject.title}" pour examen et publication.`,
        type: 'INFO',
        linkTo: '/structure/sujets',
      });
    });

    return newSubject;
  },

  updateSubject(subjectId: string, updates: Partial<ThesisSubject>, author: User): ThesisSubject {
    const subjects = this.getSubjects();
    const index = subjects.findIndex((s) => s.id === subjectId);
    if (index === -1) throw new Error('Sujet introuvable.');

    const current = subjects[index];
    const updated: ThesisSubject = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    subjects[index] = updated;
    setItem(STORAGE_KEYS.SUBJECTS, subjects);

    this.logAudit({
      userId: author.id,
      userName: `${author.firstName} ${author.lastName}`,
      userRole: author.role,
      action: 'MODIFICATION_SUJET',
      entityType: 'SUBJECT',
      entityId: updated.id,
      details: `Mise à jour du sujet "${updated.title}" (Statut: ${updated.status}).`,
    });

    return updated;
  },

  changeSubjectStatus(subjectId: string, newStatus: SubjectStatus, justification: string, reviewer: User): ThesisSubject {
    const subject = this.getSubjectById(subjectId);
    if (!subject) throw new Error('Sujet introuvable.');

    const oldStatus = subject.status;
    const updates: Partial<ThesisSubject> = {
      status: newStatus,
      validationComment: justification,
    };

    if (newStatus === 'PUBLIE') {
      updates.publishedAt = new Date().toISOString();
    }

    const updated = this.updateSubject(subjectId, updates, reviewer);

    // Notify supervisor
    this.createNotification({
      userId: subject.supervisorId,
      title: `Décision sur votre sujet: ${newStatus}`,
      message: `Votre sujet "${subject.title}" est désormais ${newStatus}. ${justification ? `Commentaire: ${justification}` : ''}`,
      type: newStatus === 'PUBLIE' || newStatus === 'VALIDE' ? 'SUCCESS' : 'WARNING',
      linkTo: '/directeur-these/sujets',
    });

    this.logAudit({
      userId: reviewer.id,
      userName: `${reviewer.firstName} ${reviewer.lastName}`,
      userRole: reviewer.role,
      action: 'CHANGEMENT_STATUT_SUJET',
      entityType: 'SUBJECT',
      entityId: subject.id,
      details: `Transition statut sujet ${oldStatus} -> ${newStatus}. Justification: ${justification || 'N/A'}.`,
    });

    return updated;
  },

  // ==========================================
  // CANDIDATURES & DRAFTS
  // ==========================================
  getCandidatures(): Candidature[] {
    return getItem<Candidature[]>(STORAGE_KEYS.CANDIDATURES, []);
  },

  getCandidatureById(id: string): Candidature | undefined {
    return this.getCandidatures().find((c) => c.id === id);
  },

  getCandidaturesForCandidate(candidateId: string): Candidature[] {
    return this.getCandidatures().filter((c) => c.candidateId === candidateId);
  },

  getCandidaturesForSupervisor(supervisorId: string): Candidature[] {
    return this.getCandidatures().filter((c) => c.supervisorId === supervisorId && !c.isDraft);
  },

  getCandidaturesForStructure(): Candidature[] {
    // Shows candidatures that are at least accepted by supervisor, in administrative review, admitted, or waitlist
    return this.getCandidatures().filter(
      (c) =>
        !c.isDraft &&
        (c.status === 'ACCEPTEE_DIRECTEUR_THESE' ||
          c.status === 'EN_ATTENTE_DECISION_ADMINISTRATIVE' ||
          c.status === 'ADMISE' ||
          c.status === 'LISTE_ATTENTE' ||
          c.status === 'ADMISSION_ANNULEE_DELAI_DEPASSE' ||
          c.status === 'REJETEE')
    );
  },

  /**
   * Save or start a draft candidature.
   * STRICT ENFORCEMENT: Only 1 draft per candidate + subject + campaign!
   * Never create automatic duplicates!
   */
  saveDraftCandidature(params: {
    candidate: User;
    subject: ThesisSubject;
    campaignId: string;
    documents: Record<string, string>;
  }): Candidature {
    const candidatures = this.getCandidatures();

    // Check if an existing candidature (submitted or draft) already exists for this subject & campaign
    const existing = candidatures.find(
      (c) =>
        c.candidateId === params.candidate.id &&
        c.subjectId === params.subject.id &&
        c.campaignId === params.campaignId
    );

    if (existing && !existing.isDraft) {
      throw new Error('Vous avez déjà soumis définitivement une candidature pour ce sujet de thèse.');
    }

    if (existing && existing.isDraft) {
      // Update existing draft
      existing.documents = { ...existing.documents, ...params.documents };
      existing.updatedAt = new Date().toISOString();
      setItem(STORAGE_KEYS.CANDIDATURES, candidatures);
      return existing;
    }

    // Create new draft
    const newDraft: Candidature = {
      id: `cand_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      candidateId: params.candidate.id,
      candidateName: `${params.candidate.firstName} ${params.candidate.lastName}`,
      candidateEmail: params.candidate.email,
      candidatePhone: params.candidate.phone,
      candidateCin: params.candidate.cin,
      candidateCne: params.candidate.cne,
      subjectId: params.subject.id,
      subjectTitle: params.subject.title,
      supervisorId: params.subject.supervisorId,
      laboratoryId: params.subject.laboratoryId,
      establishmentId: params.subject.establishmentId,
      campaignId: params.campaignId,
      status: 'BROUILLON',
      isDraft: true,
      documents: params.documents,
      history: [
        {
          fromStatus: 'AUCUN',
          toStatus: 'BROUILLON',
          timestamp: new Date().toISOString(),
          authorId: params.candidate.id,
          authorName: `${params.candidate.firstName} ${params.candidate.lastName}`,
          authorRole: 'CANDIDAT',
          justification: 'Création initiale du brouillon de candidature.',
        },
      ],
      corrections: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    candidatures.push(newDraft);
    setItem(STORAGE_KEYS.CANDIDATURES, candidatures);

    this.logAudit({
      userId: params.candidate.id,
      userName: `${params.candidate.firstName} ${params.candidate.lastName}`,
      userRole: 'CANDIDAT',
      action: 'CREATION_BROUILLON',
      entityType: 'CANDIDATURE',
      entityId: newDraft.id,
      details: `Création du brouillon pour le sujet "${params.subject.title}".`,
    });

    return newDraft;
  },

  /**
   * Delete draft candidature.
   * Can only delete own drafts.
   */
  deleteDraft(candidatureId: string, candidate: User): void {
    const candidatures = this.getCandidatures();
    const target = candidatures.find((c) => c.id === candidatureId);
    if (!target) throw new Error('Candidature introuvable.');

    if (target.candidateId !== candidate.id) {
      throw new Error('Vous n’êtes pas autorisé à supprimer ce brouillon.');
    }

    if (!target.isDraft || target.status !== 'BROUILLON') {
      throw new Error('Seuls les dossiers au statut Brouillon peuvent être supprimés.');
    }

    const filtered = candidatures.filter((c) => c.id !== candidatureId);
    setItem(STORAGE_KEYS.CANDIDATURES, filtered);

    this.logAudit({
      userId: candidate.id,
      userName: `${candidate.firstName} ${candidate.lastName}`,
      userRole: 'CANDIDAT',
      action: 'SUPPRESSION_BROUILLON',
      entityType: 'CANDIDATURE',
      entityId: candidatureId,
      details: `Suppression du brouillon de candidature pour le sujet "${target.subjectTitle}".`,
    });
  },

  /**
   * Submit candidature definitively.
   */
  submitCandidature(candidatureId: string, candidate: User): Candidature {
    const candidatures = this.getCandidatures();
    const cand = candidatures.find((c) => c.id === candidatureId);
    if (!cand) throw new Error('Candidature introuvable.');

    if (cand.candidateId !== candidate.id) {
      throw new Error('Action non autorisée.');
    }

    // Verify campaign is active
    const campaign = this.getActiveCampaign();
    if (!campaign) {
      throw new Error("Aucune campagne doctorale n'est actuellement ouverte.");
    }

    const oldStatus = cand.status;
    cand.status = 'SOUMISE';
    cand.isDraft = false;
    cand.submissionDate = new Date().toISOString();
    cand.updatedAt = new Date().toISOString();

    cand.history.push({
      fromStatus: oldStatus,
      toStatus: 'SOUMISE',
      timestamp: new Date().toISOString(),
      authorId: candidate.id,
      authorName: `${candidate.firstName} ${candidate.lastName}`,
      authorRole: 'CANDIDAT',
      justification: 'Dépôt et soumission définitive du dossier par le candidat.',
    });

    setItem(STORAGE_KEYS.CANDIDATURES, candidatures);

    // Notify Thesis Supervisor
    this.createNotification({
      userId: cand.supervisorId,
      title: 'Nouvelle candidature doctorale reçue',
      message: `${candidate.firstName} ${candidate.lastName} a soumis sa candidature pour le sujet "${cand.subjectTitle}".`,
      type: 'INFO',
      linkTo: '/directeur-these/candidatures',
    });

    // Notify Candidate confirmation
    this.createNotification({
      userId: candidate.id,
      title: 'Candidature soumise avec succès',
      message: `Votre dossier pour le sujet "${cand.subjectTitle}" a été transmis au Directeur de Thèse.`,
      type: 'SUCCESS',
      linkTo: '/candidat/candidatures',
    });

    this.logAudit({
      userId: candidate.id,
      userName: `${candidate.firstName} ${candidate.lastName}`,
      userRole: 'CANDIDAT',
      action: 'SOUMISSION_CANDIDATURE',
      entityType: 'CANDIDATURE',
      entityId: cand.id,
      details: `Soumission définitive de la candidature pour le sujet "${cand.subjectTitle}".`,
    });

    return cand;
  },

  /**
   * Thesis Supervisor reviews candidature
   */
  reviewBySupervisor(params: {
    candidatureId: string;
    supervisor: User;
    decision: 'ACCEPTEE' | 'REJETEE';
    justification: string;
  }): Candidature {
    const candidatures = this.getCandidatures();
    const cand = candidatures.find((c) => c.id === params.candidatureId);
    if (!cand) throw new Error('Candidature introuvable.');

    if (cand.supervisorId !== params.supervisor.id) {
      throw new Error('Vous n’êtes pas le directeur de thèse en charge de ce sujet.');
    }

    const oldStatus = cand.status;
    const newStatus: CandidatureStatus =
      params.decision === 'ACCEPTEE' ? 'ACCEPTEE_DIRECTEUR_THESE' : 'REJETEE_DIRECTEUR_THESE';

    cand.status = newStatus;
    cand.supervisorReview = {
      decisionDate: new Date().toISOString(),
      decision: params.decision,
      justification: params.justification,
      reviewedBy: params.supervisor.id,
      reviewerName: `Prof. ${params.supervisor.firstName} ${params.supervisor.lastName}`,
    };
    cand.updatedAt = new Date().toISOString();

    cand.history.push({
      fromStatus: oldStatus,
      toStatus: newStatus,
      timestamp: new Date().toISOString(),
      authorId: params.supervisor.id,
      authorName: `Prof. ${params.supervisor.firstName} ${params.supervisor.lastName}`,
      authorRole: 'DIRECTEUR_THESE',
      justification: params.justification,
    });

    setItem(STORAGE_KEYS.CANDIDATURES, candidatures);

    // If accepted scientifically, notify Structure Directors
    if (params.decision === 'ACCEPTEE') {
      const structureDirectors = this.getUsers().filter((u) => u.role === 'DIRECTEUR_STRUCTURE');
      structureDirectors.forEach((sd) => {
        this.createNotification({
          userId: sd.id,
          title: 'Candidature acceptée par DT en attente de décision administrative',
          message: `${cand.candidateName} a été retenu(e) scientifiquement par ${cand.supervisorReview?.reviewerName} pour "${cand.subjectTitle}".`,
          type: 'INFO',
          linkTo: '/structure/admissions',
        });
      });
    }

    // Notify Candidate
    this.createNotification({
      userId: cand.candidateId,
      title: params.decision === 'ACCEPTEE' ? 'Avis scientifique favorable du Directeur' : 'Décision du Directeur de Thèse',
      message:
        params.decision === 'ACCEPTEE'
          ? `Votre dossier a reçu un avis scientifique favorable de ${cand.supervisorReview?.reviewerName}. Il est transmis à la Direction de Structure pour validation finale.`
          : `Le Directeur de Thèse a émis un avis défavorable : ${params.justification}`,
      type: params.decision === 'ACCEPTEE' ? 'SUCCESS' : 'WARNING',
      linkTo: '/candidat/candidatures',
    });

    this.logAudit({
      userId: params.supervisor.id,
      userName: `${params.supervisor.firstName} ${params.supervisor.lastName}`,
      userRole: 'DIRECTEUR_THESE',
      action: 'AVIS_SCIENTIFIQUE_DT',
      entityType: 'CANDIDATURE',
      entityId: cand.id,
      details: `Avis scientifique ${params.decision} pour ${cand.candidateName}. Justification: ${params.justification}`,
    });

    return cand;
  },

  /**
   * Request corrections from candidate
   */
  requestCorrection(params: {
    candidatureId: string;
    author: User;
    message: string;
    requestedDocuments: string[];
  }): Candidature {
    const candidatures = this.getCandidatures();
    const cand = candidatures.find((c) => c.id === params.candidatureId);
    if (!cand) throw new Error('Candidature introuvable.');

    const oldStatus = cand.status;
    cand.status = 'CORRECTION_DEMANDEE';
    const correctionId = `corr_${Date.now()}`;
    cand.corrections.push({
      id: correctionId,
      requestedAt: new Date().toISOString(),
      authorId: params.author.id,
      authorName: `${params.author.firstName} ${params.author.lastName}`,
      message: params.message,
      requestedDocuments: params.requestedDocuments,
      resolved: false,
    });
    cand.updatedAt = new Date().toISOString();

    cand.history.push({
      fromStatus: oldStatus,
      toStatus: 'CORRECTION_DEMANDEE',
      timestamp: new Date().toISOString(),
      authorId: params.author.id,
      authorName: `${params.author.firstName} ${params.author.lastName}`,
      authorRole: params.author.role,
      justification: params.message,
    });

    setItem(STORAGE_KEYS.CANDIDATURES, candidatures);

    // Notify Candidate
    this.createNotification({
      userId: cand.candidateId,
      title: 'Correction ou document manquant demandé',
      message: `Des pièces ou corrections sont demandées sur votre candidature pour "${cand.subjectTitle}". Consultez votre espace pour les compléter.`,
      type: 'ALERT',
      linkTo: '/candidat/candidatures',
    });

    this.logAudit({
      userId: params.author.id,
      userName: `${params.author.firstName} ${params.author.lastName}`,
      userRole: params.author.role,
      action: 'DEMANDE_CORRECTION',
      entityType: 'CANDIDATURE',
      entityId: cand.id,
      details: `Demande de correction: ${params.message} (Pièces: ${params.requestedDocuments.join(', ')})`,
    });

    return cand;
  },

  /**
   * Candidate submits requested corrections
   */
  resolveCorrection(candidatureId: string, candidate: User, addedDocuments: Record<string, string>): Candidature {
    const candidatures = this.getCandidatures();
    const cand = candidatures.find((c) => c.id === candidatureId);
    if (!cand) throw new Error('Candidature introuvable.');

    if (cand.candidateId !== candidate.id) throw new Error('Action non autorisée.');

    cand.documents = { ...cand.documents, ...addedDocuments };
    cand.status = 'SOUMISE';
    cand.updatedAt = new Date().toISOString();

    // Mark active corrections as resolved
    cand.corrections.forEach((c) => {
      if (!c.resolved) {
        c.resolved = true;
        c.resolvedAt = new Date().toISOString();
      }
    });

    cand.history.push({
      fromStatus: 'CORRECTION_DEMANDEE',
      toStatus: 'SOUMISE',
      timestamp: new Date().toISOString(),
      authorId: candidate.id,
      authorName: `${candidate.firstName} ${candidate.lastName}`,
      authorRole: 'CANDIDAT',
      justification: 'Le candidat a complété les documents et corrections demandées.',
    });

    setItem(STORAGE_KEYS.CANDIDATURES, candidatures);

    // Notify supervisor
    this.createNotification({
      userId: cand.supervisorId,
      title: 'Corrections déposées par le candidat',
      message: `${candidate.firstName} ${candidate.lastName} a complété son dossier pour "${cand.subjectTitle}".`,
      type: 'INFO',
      linkTo: '/directeur-these/candidatures',
    });

    this.logAudit({
      userId: candidate.id,
      userName: `${candidate.firstName} ${candidate.lastName}`,
      userRole: 'CANDIDAT',
      action: 'RESOLUTION_CORRECTION',
      entityType: 'CANDIDATURE',
      entityId: cand.id,
      details: 'Soumission des pièces complémentaires demandées.',
    });

    return cand;
  },

  /**
   * Structure Director makes final administrative decision (ADMISE, REJETEE, LISTE_ATTENTE)
   */
  reviewByStructure(params: {
    candidatureId: string;
    structureDirector: User;
    decision: 'ADMISE' | 'REJETEE' | 'LISTE_ATTENTE';
    justification: string;
    registrationDeadline?: string;
    waitlistRank?: number;
  }): Candidature {
    const candidatures = this.getCandidatures();
    const cand = candidatures.find((c) => c.id === params.candidatureId);
    if (!cand) throw new Error('Candidature introuvable.');

    const oldStatus = cand.status;
    const newStatus: CandidatureStatus =
      params.decision === 'ADMISE'
        ? 'ADMISE'
        : params.decision === 'LISTE_ATTENTE'
        ? 'LISTE_ATTENTE'
        : 'REJETEE';

    cand.status = newStatus;
    cand.structureReview = {
      decisionDate: new Date().toISOString(),
      decision: params.decision,
      justification: params.justification,
      reviewedBy: params.structureDirector.id,
      reviewerName: `Prof. ${params.structureDirector.firstName} ${params.structureDirector.lastName}`,
      registrationDeadline: params.registrationDeadline,
    };

    if (params.decision === 'LISTE_ATTENTE' && params.waitlistRank) {
      cand.waitlistRank = params.waitlistRank;
    }

    if (params.decision === 'ADMISE') {
      cand.registrationFile = {
        status: 'NON_COMMENCEE',
        documents: {},
      };
      // Increment admitted count on subject
      const subject = this.getSubjectById(cand.subjectId);
      if (subject) {
        this.updateSubject(subject.id, { admittedCount: (subject.admittedCount || 0) + 1 }, params.structureDirector);
      }
    }

    cand.updatedAt = new Date().toISOString();

    cand.history.push({
      fromStatus: oldStatus,
      toStatus: newStatus,
      timestamp: new Date().toISOString(),
      authorId: params.structureDirector.id,
      authorName: `Prof. ${params.structureDirector.firstName} ${params.structureDirector.lastName}`,
      authorRole: 'DIRECTEUR_STRUCTURE',
      justification: `Décision administrative: ${params.decision}. ${params.justification}`,
    });

    setItem(STORAGE_KEYS.CANDIDATURES, candidatures);

    // Notify Candidate with tailored message
    let notificationTitle = 'Résultat de votre candidature doctorale';
    let notificationMsg = '';
    let notificationType: 'SUCCESS' | 'INFO' | 'WARNING' = 'INFO';

    if (params.decision === 'ADMISE') {
      notificationTitle = 'Félicitations ! Admission au doctorat confirmée';
      notificationMsg = `Vous avez été définitivement admis(e) pour le sujet "${cand.subjectTitle}". Vous devez déposer votre dossier d'inscription administrative avant le ${params.registrationDeadline || 'la date limite fixée'}.`;
      notificationType = 'SUCCESS';
    } else if (params.decision === 'LISTE_ATTENTE') {
      notificationTitle = "Classement sur liste d'attente";
      notificationMsg = `Votre candidature pour "${cand.subjectTitle}" a été classée sur liste d'attente${params.waitlistRank ? ` (Rang: ${params.waitlistRank})` : ''}. Vous serez contacté(e) si un désistement intervient.`;
      notificationType = 'INFO';
    } else {
      notificationTitle = 'Décision de non-admission';
      notificationMsg = `Votre candidature pour "${cand.subjectTitle}" n'a pas été retenue. Motif : ${params.justification}`;
      notificationType = 'WARNING';
    }

    this.createNotification({
      userId: cand.candidateId,
      title: notificationTitle,
      message: notificationMsg,
      type: notificationType,
      linkTo: '/candidat/candidatures',
    });

    // Also notify thesis supervisor
    this.createNotification({
      userId: cand.supervisorId,
      title: `Décision administrative pour ${cand.candidateName}`,
      message: `La direction de structure a validé la décision: ${params.decision} pour le candidat ${cand.candidateName}.`,
      type: 'INFO',
      linkTo: '/directeur-these/candidatures',
    });

    this.logAudit({
      userId: params.structureDirector.id,
      userName: `${params.structureDirector.firstName} ${params.structureDirector.lastName}`,
      userRole: 'DIRECTEUR_STRUCTURE',
      action: 'DECISION_ADMINISTRATIVE_DS',
      entityType: 'CANDIDATURE',
      entityId: cand.id,
      details: `Validation administrative ${params.decision} pour ${cand.candidateName}. Date limite: ${params.registrationDeadline || 'N/A'}.`,
    });

    return cand;
  },

  /**
   * Deadline Expiration & Waitlist Reallocation
   * Mark candidate as canceled due to deadline exceeded and re-allocate to waitlist
   */
  handleDeadlineExpired(params: {
    candidatureId: string;
    author: User;
    justification: string;
    moveToWaitlist: boolean;
  }): Candidature {
    const candidatures = this.getCandidatures();
    const cand = candidatures.find((c) => c.id === params.candidatureId);
    if (!cand) throw new Error('Candidature introuvable.');

    const oldStatus = cand.status;
    const newStatus: CandidatureStatus = 'ADMISSION_ANNULEE_DELAI_DEPASSE';
    cand.status = newStatus;
    cand.updatedAt = new Date().toISOString();

    if (cand.registrationFile) {
      cand.registrationFile.status = 'DELAI_DEPASSE';
    }

    // Free seat on subject
    const subject = this.getSubjectById(cand.subjectId);
    if (subject && subject.admittedCount > 0) {
      this.updateSubject(subject.id, { admittedCount: subject.admittedCount - 1 }, params.author);
    }

    cand.history.push({
      fromStatus: oldStatus,
      toStatus: newStatus,
      timestamp: new Date().toISOString(),
      authorId: params.author.id,
      authorName: `${params.author.firstName} ${params.author.lastName}`,
      authorRole: params.author.role,
      justification: `Dépassement du délai légal d'inscription. ${params.justification}`,
    });

    setItem(STORAGE_KEYS.CANDIDATURES, candidatures);

    // Notify Candidate
    this.createNotification({
      userId: cand.candidateId,
      title: "Annulation d'admission pour dépassement de délai",
      message: `Votre admission pour "${cand.subjectTitle}" a été annulée car votre dossier d'inscription n'a pas été déposé dans le délai imparti.`,
      type: 'ALERT',
      linkTo: '/candidat/candidatures',
    });

    this.logAudit({
      userId: params.author.id,
      userName: `${params.author.firstName} ${params.author.lastName}`,
      userRole: params.author.role,
      action: 'DELAI_INSCRIPTION_DEPASSE',
      entityType: 'CANDIDATURE',
      entityId: cand.id,
      details: `Admission annulée pour dépassement de délai d'inscription pour ${cand.candidateName}.`,
    });

    return cand;
  },

  /**
   * Promote candidate from waitlist
   */
  promoteFromWaitlist(params: {
    candidatureId: string;
    structureDirector: User;
    newRegistrationDeadline: string;
  }): Candidature {
    const candidatures = this.getCandidatures();
    const cand = candidatures.find((c) => c.id === params.candidatureId);
    if (!cand) throw new Error('Candidature introuvable.');

    if (cand.status !== 'LISTE_ATTENTE') {
      throw new Error('Seuls les candidats sur liste d’attente peuvent être repêchés.');
    }

    const oldStatus = cand.status;
    cand.status = 'ADMISE';
    cand.waitlistRank = undefined;
    cand.registrationFile = {
      status: 'NON_COMMENCEE',
      documents: {},
    };
    if (cand.structureReview) {
      cand.structureReview.decision = 'ADMISE';
      cand.structureReview.registrationDeadline = params.newRegistrationDeadline;
      cand.structureReview.justification = 'Promotion depuis la liste d’attente suite à désistement ou place vacante.';
    }
    cand.updatedAt = new Date().toISOString();

    // Increment subject admitted count
    const subject = this.getSubjectById(cand.subjectId);
    if (subject) {
      this.updateSubject(subject.id, { admittedCount: (subject.admittedCount || 0) + 1 }, params.structureDirector);
    }

    cand.history.push({
      fromStatus: oldStatus,
      toStatus: 'ADMISE',
      timestamp: new Date().toISOString(),
      authorId: params.structureDirector.id,
      authorName: `Prof. ${params.structureDirector.firstName} ${params.structureDirector.lastName}`,
      authorRole: 'DIRECTEUR_STRUCTURE',
      justification: `Repêchage depuis la liste d'attente. Date limite d'inscription fixée au ${params.newRegistrationDeadline}.`,
    });

    setItem(STORAGE_KEYS.CANDIDATURES, candidatures);

    // Notify Candidate
    this.createNotification({
      userId: cand.candidateId,
      title: 'Bonne nouvelle ! Place vacante attribuée (Liste d’attente)',
      message: `Une place s'est libérée pour le sujet "${cand.subjectTitle}". Vous êtes désormais admis(e) ! Veuillez finaliser votre inscription avant le ${params.newRegistrationDeadline}.`,
      type: 'SUCCESS',
      linkTo: '/candidat/candidatures',
    });

    this.logAudit({
      userId: params.structureDirector.id,
      userName: `${params.structureDirector.firstName} ${params.structureDirector.lastName}`,
      userRole: 'DIRECTEUR_STRUCTURE',
      action: 'REPECHAGE_LISTE_ATTENTE',
      entityType: 'CANDIDATURE',
      entityId: cand.id,
      details: `Repêchage depuis la liste d'attente pour ${cand.candidateName}. Nouvelle date limite: ${params.newRegistrationDeadline}.`,
    });

    return cand;
  },

  /**
   * Submit registration file (Dossier d'inscription administrative)
   */
  submitRegistrationDocuments(candidatureId: string, candidate: User, documents: Record<string, string>): Candidature {
    const candidatures = this.getCandidatures();
    const cand = candidatures.find((c) => c.id === candidatureId);
    if (!cand) throw new Error('Candidature introuvable.');

    if (cand.candidateId !== candidate.id) throw new Error('Action non autorisée.');

    cand.registrationFile = {
      submittedAt: new Date().toISOString(),
      status: 'DOSSIER_DEPOSE',
      documents: { ...(cand.registrationFile?.documents || {}), ...documents },
    };
    cand.updatedAt = new Date().toISOString();

    setItem(STORAGE_KEYS.CANDIDATURES, candidatures);

    // Notify structure director
    const structureDirectors = this.getUsers().filter((u) => u.role === 'DIRECTEUR_STRUCTURE');
    structureDirectors.forEach((sd) => {
      this.createNotification({
        userId: sd.id,
        title: "Dossier d'inscription administrative déposé",
        message: `${candidate.firstName} ${candidate.lastName} a déposé ses pièces d'inscription pour "${cand.subjectTitle}".`,
        type: 'INFO',
        linkTo: '/structure/delais',
      });
    });

    this.logAudit({
      userId: candidate.id,
      userName: `${candidate.firstName} ${candidate.lastName}`,
      userRole: 'CANDIDAT',
      action: 'DEPOT_INSCRIPTION_ADMINISTRATIVE',
      entityType: 'CANDIDATURE',
      entityId: cand.id,
      details: `Dépôt des pièces d'inscription administrative par ${candidate.firstName} ${candidate.lastName}.`,
    });

    return cand;
  },

  /**
   * Validate registration file by Structure Director
   */
  validateRegistrationFile(candidatureId: string, structureDirector: User, notes?: string): Candidature {
    const candidatures = this.getCandidatures();
    const cand = candidatures.find((c) => c.id === candidatureId);
    if (!cand) throw new Error('Candidature introuvable.');

    if (!cand.registrationFile) {
      cand.registrationFile = { status: 'VALIDEE', documents: {} };
    }
    cand.registrationFile.status = 'VALIDEE';
    cand.registrationFile.verifiedAt = new Date().toISOString();
    cand.registrationFile.verifiedBy = `${structureDirector.firstName} ${structureDirector.lastName}`;
    cand.registrationFile.notes = notes;
    cand.updatedAt = new Date().toISOString();

    setItem(STORAGE_KEYS.CANDIDATURES, candidatures);

    this.createNotification({
      userId: cand.candidateId,
      title: 'Inscription administrative validée avec succès',
      message: `Votre inscription en 1ère année de doctorat a été officiellement enregistrée. Bienvenue dans l'école doctorale !`,
      type: 'SUCCESS',
      linkTo: '/candidat/inscription',
    });

    this.logAudit({
      userId: structureDirector.id,
      userName: `${structureDirector.firstName} ${structureDirector.lastName}`,
      userRole: 'DIRECTEUR_STRUCTURE',
      action: 'VALIDATION_INSCRIPTION_ADMINISTRATIVE',
      entityType: 'CANDIDATURE',
      entityId: cand.id,
      details: `Validation définitive du dossier d'inscription de ${cand.candidateName}.`,
    });

    return cand;
  },

  // ==========================================
  // DOCUMENTS METADATA
  // ==========================================
  getDocuments(): DocumentItem[] {
    return getItem<DocumentItem[]>(STORAGE_KEYS.DOCUMENTS, []);
  },

  getDocumentById(id: string): DocumentItem | undefined {
    return this.getDocuments().find((d) => d.id === id);
  },

  getDocumentsByOwner(ownerId: string): DocumentItem[] {
    return this.getDocuments().filter((d) => d.ownerId === ownerId);
  },

  saveDocumentMetadata(doc: DocumentItem): void {
    const docs = this.getDocuments();
    const index = docs.findIndex((d) => d.id === doc.id);
    if (index >= 0) {
      docs[index] = doc;
    } else {
      docs.push(doc);
    }
    setItem(STORAGE_KEYS.DOCUMENTS, docs);
  },

  updateDocumentStatus(docId: string, status: DocumentItem['status'], comment?: string, reviewer?: User): DocumentItem {
    const docs = this.getDocuments();
    const index = docs.findIndex((d) => d.id === docId);
    if (index === -1) throw new Error('Document introuvable.');

    docs[index].status = status;
    docs[index].validationComment = comment;
    setItem(STORAGE_KEYS.DOCUMENTS, docs);

    if (reviewer) {
      this.logAudit({
        userId: reviewer.id,
        userName: `${reviewer.firstName} ${reviewer.lastName}`,
        userRole: reviewer.role,
        action: 'VERIFICATION_DOCUMENT',
        entityType: 'DOCUMENT',
        entityId: docId,
        details: `Vérification du document ${docs[index].fileName} -> ${status}.`,
      });
    }

    return docs[index];
  },

  // ==========================================
  // ANNUAL RE-ENROLLMENTS (RÉINSCRIPTIONS ANNUELLES)
  // Strictly requires 3 mandatory documents:
  // 1. Rapport annuel d'avancement des travaux de recherche
  // 2. Attestation ou avis favorable du directeur de thèse
  // 3. Relevé des formations doctorales suivies
  // ==========================================
  getReinscriptions(): ReinscriptionRequest[] {
    return getItem<ReinscriptionRequest[]>(STORAGE_KEYS.REINSCRIPTIONS, []);
  },

  getReinscriptionById(id: string): ReinscriptionRequest | undefined {
    return this.getReinscriptions().find((r) => r.id === id);
  },

  getReinscriptionsForCandidate(candidateId: string): ReinscriptionRequest[] {
    return this.getReinscriptions().filter((r) => r.candidateId === candidateId);
  },

  getReinscriptionsForSupervisor(supervisorId: string): ReinscriptionRequest[] {
    return this.getReinscriptions().filter((r) => r.supervisorId === supervisorId);
  },

  getReinscriptionsForStructure(): ReinscriptionRequest[] {
    return this.getReinscriptions();
  },

  /**
   * Check if candidate is eligible for re-enrollment:
   * Must have an admitted/validated candidature in a previous cycle
   */
  isCandidateEligibleForReinscription(candidateId: string): { eligible: boolean; candidature?: Candidature; nextYear?: number; reason?: string } {
    const candidatures = this.getCandidaturesForCandidate(candidateId);
    // Find an admitted candidature with completed registration or admitted status
    const admittedCand = candidatures.find(
      (c) => c.status === 'ADMISE' && (!c.registrationFile || c.registrationFile.status === 'VALIDEE' || c.registrationFile.status === 'DOSSIER_DEPOSE')
    );

    if (!admittedCand) {
      return {
        eligible: false,
        reason: 'Vous devez disposer d’une première inscription validée en doctorat pour accéder à la réinscription annuelle.',
      };
    }

    // Check existing reinscriptions
    const existing = this.getReinscriptionsForCandidate(candidateId);
    const lastReinscription = existing[existing.length - 1];

    let nextYear = 2; // Default to 2nd year
    if (lastReinscription) {
      if (lastReinscription.status === 'SOUMISE' || lastReinscription.status === 'AVIS_DT_FAVORABLE') {
        return {
          eligible: false,
          reason: 'Une demande de réinscription pour cette année est déjà en cours d’examen.',
        };
      }
      if (lastReinscription.status === 'VALIDEE_STRUCTURE') {
        nextYear = lastReinscription.doctoralYear + 1;
      }
    }

    if (nextYear > 6) {
      return {
        eligible: false,
        reason: 'La durée maximale du cycle doctoral autorisée par la réglementation est atteinte (6 ans). Une dérogation spéciale du conseil est requise.',
      };
    }

    return {
      eligible: true,
      candidature: admittedCand,
      nextYear: nextYear,
    };
  },

  /**
   * Create & submit annual re-enrollment request with the 3 mandatory documents
   */
  submitReinscription(params: {
    candidate: User;
    admittedCandidature: Candidature;
    doctoralYear: number;
    campaignId: string;
    rapportAvancementDocId: string;
    avisDirecteurDocId: string;
    formationsDoctoralesDocId: string;
  }): ReinscriptionRequest {
    if (!params.rapportAvancementDocId || !params.avisDirecteurDocId || !params.formationsDoctoralesDocId) {
      throw new Error(
        'Les 3 documents obligatoires sont strictement requis : 1. Rapport d’avancement, 2. Avis du directeur, 3. Relevé des formations doctorales.'
      );
    }

    const list = this.getReinscriptions();
    const newReq: ReinscriptionRequest = {
      id: `reins_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      candidateId: params.candidate.id,
      candidateName: `${params.candidate.firstName} ${params.candidate.lastName}`,
      candidateEmail: params.candidate.email,
      subjectId: params.admittedCandidature.subjectId,
      subjectTitle: params.admittedCandidature.subjectTitle,
      supervisorId: params.admittedCandidature.supervisorId,
      supervisorName: params.admittedCandidature.supervisorReview?.reviewerName || 'Directeur de Thèse',
      campaignId: params.campaignId,
      doctoralYear: params.doctoralYear,
      status: 'SOUMISE',
      rapportAvancementDocId: params.rapportAvancementDocId,
      avisDirecteurDocId: params.avisDirecteurDocId,
      formationsDoctoralesDocId: params.formationsDoctoralesDocId,
      history: [
        {
          fromStatus: 'AUCUN',
          toStatus: 'SOUMISE',
          timestamp: new Date().toISOString(),
          authorId: params.candidate.id,
          authorName: `${params.candidate.firstName} ${params.candidate.lastName}`,
          authorRole: 'CANDIDAT',
          justification: `Soumission de la demande de réinscription en ${params.doctoralYear}ème année doctorale avec les 3 pièces obligatoires.`,
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    list.push(newReq);
    setItem(STORAGE_KEYS.REINSCRIPTIONS, list);

    // Notify Supervisor
    this.createNotification({
      userId: newReq.supervisorId,
      title: 'Demande de réinscription annuelle à examiner',
      message: `${params.candidate.firstName} ${params.candidate.lastName} a déposé sa demande de réinscription pour sa ${params.doctoralYear}ème année.`,
      type: 'INFO',
      linkTo: '/directeur-these/doctorants',
    });

    this.logAudit({
      userId: params.candidate.id,
      userName: `${params.candidate.firstName} ${params.candidate.lastName}`,
      userRole: 'CANDIDAT',
      action: 'SOUMISSION_REINSCRIPTION',
      entityType: 'REINSCRIPTION',
      entityId: newReq.id,
      details: `Dépôt demande de réinscription en ${params.doctoralYear}e année pour "${newReq.subjectTitle}".`,
    });

    return newReq;
  },

  /**
   * Thesis Supervisor gives scientific opinion on re-enrollment
   * (Avis favorable ou défavorable avec observation)
   */
  reviewReinscriptionBySupervisor(params: {
    reinscriptionId: string;
    supervisor: User;
    avis: 'FAVORABLE' | 'DEFAVORABLE';
    observation: string;
  }): ReinscriptionRequest {
    const list = this.getReinscriptions();
    const req = list.find((r) => r.id === params.reinscriptionId);
    if (!req) throw new Error('Demande introuvable.');

    if (req.supervisorId !== params.supervisor.id) {
      throw new Error('Vous n’êtes pas le directeur de thèse de ce doctorant.');
    }

    const oldStatus = req.status;
    const newStatus: ReinscriptionStatus =
      params.avis === 'FAVORABLE' ? 'AVIS_DT_FAVORABLE' : 'AVIS_DT_DEFAVORABLE';

    req.status = newStatus;
    req.supervisorReview = {
      date: new Date().toISOString(),
      avis: params.avis,
      observation: params.observation,
      supervisorId: params.supervisor.id,
      supervisorName: `Prof. ${params.supervisor.firstName} ${params.supervisor.lastName}`,
    };
    req.updatedAt = new Date().toISOString();

    req.history.push({
      fromStatus: oldStatus,
      toStatus: newStatus,
      timestamp: new Date().toISOString(),
      authorId: params.supervisor.id,
      authorName: `Prof. ${params.supervisor.firstName} ${params.supervisor.lastName}`,
      authorRole: 'DIRECTEUR_THESE',
      justification: `Avis ${params.avis} du directeur de thèse. Observation: ${params.observation}`,
    });

    setItem(STORAGE_KEYS.REINSCRIPTIONS, list);

    // Notify structure director
    const structureDirectors = this.getUsers().filter((u) => u.role === 'DIRECTEUR_STRUCTURE');
    structureDirectors.forEach((sd) => {
      this.createNotification({
        userId: sd.id,
        title: 'Avis du DT émis sur demande de réinscription',
        message: `${req.supervisorReview?.supervisorName} a émis un avis ${params.avis} pour la réinscription de ${req.candidateName}.`,
        type: 'INFO',
        linkTo: '/structure/reinscriptions',
      });
    });

    // Notify Doctorant
    this.createNotification({
      userId: req.candidateId,
      title: `Avis de votre Directeur de Thèse: ${params.avis}`,
      message: `Votre directeur de thèse a émis un avis ${params.avis} sur votre avancement annuel : "${params.observation}". En attente de la décision finale de la structure.`,
      type: params.avis === 'FAVORABLE' ? 'SUCCESS' : 'WARNING',
      linkTo: '/candidat/reinscription',
    });

    this.logAudit({
      userId: params.supervisor.id,
      userName: `${params.supervisor.firstName} ${params.supervisor.lastName}`,
      userRole: 'DIRECTEUR_THESE',
      action: 'AVIS_REINSCRIPTION_DT',
      entityType: 'REINSCRIPTION',
      entityId: req.id,
      details: `Avis ${params.avis} pour la réinscription de ${req.candidateName}.`,
    });

    return req;
  },

  /**
   * Structure Director makes final decision on re-enrollment
   */
  reviewReinscriptionByStructure(params: {
    reinscriptionId: string;
    structureDirector: User;
    decision: 'VALIDEE' | 'REFUSEE';
    justification: string;
  }): ReinscriptionRequest {
    const list = this.getReinscriptions();
    const req = list.find((r) => r.id === params.reinscriptionId);
    if (!req) throw new Error('Demande introuvable.');

    const oldStatus = req.status;
    const newStatus: ReinscriptionStatus =
      params.decision === 'VALIDEE' ? 'VALIDEE_STRUCTURE' : 'REFUSEE_STRUCTURE';

    req.status = newStatus;
    req.structureReview = {
      date: new Date().toISOString(),
      decision: params.decision,
      justification: params.justification,
      reviewerId: params.structureDirector.id,
      reviewerName: `Prof. ${params.structureDirector.firstName} ${params.structureDirector.lastName}`,
    };
    req.updatedAt = new Date().toISOString();

    req.history.push({
      fromStatus: oldStatus,
      toStatus: newStatus,
      timestamp: new Date().toISOString(),
      authorId: params.structureDirector.id,
      authorName: `Prof. ${params.structureDirector.firstName} ${params.structureDirector.lastName}`,
      authorRole: 'DIRECTEUR_STRUCTURE',
      justification: `Décision finale de réinscription: ${params.decision}. ${params.justification}`,
    });

    setItem(STORAGE_KEYS.REINSCRIPTIONS, list);

    // Notify Doctorant
    this.createNotification({
      userId: req.candidateId,
      title: params.decision === 'VALIDEE' ? 'Réinscription annuelle accordée' : 'Réinscription annuelle refusée',
      message:
        params.decision === 'VALIDEE'
          ? `Votre réinscription en ${req.doctoralYear}ème année doctorale a été officiellement validée par la Direction de Structure.`
          : `Votre demande de réinscription n'a pas été autorisée : ${params.justification}`,
      type: params.decision === 'VALIDEE' ? 'SUCCESS' : 'ALERT',
      linkTo: '/candidat/reinscription',
    });

    this.logAudit({
      userId: params.structureDirector.id,
      userName: `${params.structureDirector.firstName} ${params.structureDirector.lastName}`,
      userRole: 'DIRECTEUR_STRUCTURE',
      action: 'DECISION_REINSCRIPTION_DS',
      entityType: 'REINSCRIPTION',
      entityId: req.id,
      details: `Décision finale ${params.decision} pour la réinscription de ${req.candidateName}.`,
    });

    return req;
  },

  // ==========================================
  // NOTIFICATIONS
  // ==========================================
  getNotificationsForUser(userId: string): InternalNotification[] {
    const all = getItem<InternalNotification[]>(STORAGE_KEYS.NOTIFICATIONS, []);
    return all.filter((n) => n.userId === userId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  createNotification(notif: Omit<InternalNotification, 'id' | 'createdAt' | 'read'>): InternalNotification {
    const list = getItem<InternalNotification[]>(STORAGE_KEYS.NOTIFICATIONS, []);
    const item: InternalNotification = {
      ...notif,
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      read: false,
      createdAt: new Date().toISOString(),
    };
    list.unshift(item);
    // Keep max 200 notifications
    if (list.length > 200) list.pop();
    setItem(STORAGE_KEYS.NOTIFICATIONS, list);
    return item;
  },

  markNotificationAsRead(id: string): void {
    const list = getItem<InternalNotification[]>(STORAGE_KEYS.NOTIFICATIONS, []);
    const notif = list.find((n) => n.id === id);
    if (notif) {
      notif.read = true;
      setItem(STORAGE_KEYS.NOTIFICATIONS, list);
    }
  },

  markAllNotificationsAsRead(userId: string): void {
    const list = getItem<InternalNotification[]>(STORAGE_KEYS.NOTIFICATIONS, []);
    list.forEach((n) => {
      if (n.userId === userId) n.read = true;
    });
    setItem(STORAGE_KEYS.NOTIFICATIONS, list);
  },

  // ==========================================
  // AUDIT LOGS
  // ==========================================
  getAuditLogs(): AuditLog[] {
    const logs = getItem<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, []);
    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },

  logAudit(entry: Omit<AuditLog, 'id' | 'timestamp'>): void {
    const logs = getItem<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, []);
    const newLog: AuditLog = {
      ...entry,
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
    };
    logs.unshift(newLog);
    if (logs.length > 500) logs.pop();
    setItem(STORAGE_KEYS.AUDIT_LOGS, logs);
  },
};
