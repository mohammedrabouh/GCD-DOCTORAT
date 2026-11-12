-- ============================================================================
-- DOCTORIA — Base de Données Relationnelle PostgreSQL (USMBA de Fès)
-- Système Intégré de Gestion du Cycle Doctoral (GCD-DOCTORAT)
-- Version : 2.0 (PostgreSQL 14+)
-- ============================================================================

-- Extensions recommandées
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "citext";

-- ----------------------------------------------------------------------------
-- 1. Établissements & Structures de Recherche
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS establishments (
    id VARCHAR(64) PRIMARY KEY,
    code VARCHAR(32) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    city VARCHAR(64) NOT NULL DEFAULT 'Fès',
    university_name VARCHAR(255) NOT NULL DEFAULT 'Université Sidi Mohamed Ben Abdellah',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS laboratories (
    id VARCHAR(64) PRIMARY KEY,
    code VARCHAR(32) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    establishment_id VARCHAR(64) NOT NULL REFERENCES establishments(id) ON DELETE RESTRICT,
    director_name VARCHAR(128) NOT NULL,
    research_pole VARCHAR(128) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 2. Utilisateurs & Authentification Sécurisée
-- ----------------------------------------------------------------------------
CREATE TYPE user_role AS ENUM (
    'ADMINISTRATEUR',
    'DIRECTEUR_STRUCTURE',
    'DIRECTEUR_THESE',
    'CANDIDAT'
);

CREATE TYPE user_status AS ENUM (
    'ACTIF',
    'SUSPENDU',
    'EN_ATTENTE'
);

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    email CITEXT NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(64) NOT NULL,
    last_name VARCHAR(64) NOT NULL,
    role user_role NOT NULL,
    status user_status NOT NULL DEFAULT 'ACTIF',
    phone VARCHAR(32),
    cin VARCHAR(32),
    cne VARCHAR(32),
    establishment_id VARCHAR(64) REFERENCES establishments(id) ON DELETE SET NULL,
    laboratory_id VARCHAR(64) REFERENCES laboratories(id) ON DELETE SET NULL,
    specialty VARCHAR(128),
    grade VARCHAR(128),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_email ON users(email);

-- ----------------------------------------------------------------------------
-- 3. Campagnes Doctorales & Délais
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS doctoral_campaigns (
    id VARCHAR(64) PRIMARY KEY,
    code VARCHAR(64) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    academic_year VARCHAR(32) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    registration_deadline DATE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT false,
    description TEXT,
    max_candidatures_per_candidate INTEGER NOT NULL DEFAULT 3,
    allow_waitlist_promotion BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 4. Sujets de Thèse (Offre de Recherche)
-- ----------------------------------------------------------------------------
CREATE TYPE subject_status AS ENUM (
    'BROUILLON',
    'SOUMIS_VALIDATION',
    'VALIDE',
    'REFUSE',
    'PUBLIE',
    'ARCHIVE'
);

CREATE TYPE subject_availability AS ENUM (
    'OUVERT',
    'FERME',
    'COMPLET'
);

CREATE TABLE IF NOT EXISTS thesis_subjects (
    id VARCHAR(64) PRIMARY KEY,
    code VARCHAR(64) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    domain VARCHAR(128) NOT NULL,
    discipline VARCHAR(128) NOT NULL,
    keywords TEXT[] NOT NULL DEFAULT '{}',
    problematique TEXT,
    objectifs TEXT[] NOT NULL DEFAULT '{}',
    methodologie TEXT,
    requirements TEXT NOT NULL,
    laboratory_id VARCHAR(64) NOT NULL REFERENCES laboratories(id) ON DELETE RESTRICT,
    establishment_id VARCHAR(64) NOT NULL REFERENCES establishments(id) ON DELETE RESTRICT,
    supervisor_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    supervisor_name VARCHAR(128) NOT NULL,
    supervisor_email VARCHAR(128),
    co_supervisor_name VARCHAR(128),
    available_seats INTEGER NOT NULL DEFAULT 1,
    admitted_count INTEGER NOT NULL DEFAULT 0,
    campaign_id VARCHAR(64) NOT NULL REFERENCES doctoral_campaigns(id) ON DELETE RESTRICT,
    academic_year VARCHAR(32) NOT NULL,
    status subject_status NOT NULL DEFAULT 'SOUMIS_VALIDATION',
    statut_offre subject_availability NOT NULL DEFAULT 'OUVERT',
    is_demo BOOLEAN NOT NULL DEFAULT false,
    validation_comment TEXT,
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_subjects_discipline ON thesis_subjects(discipline);
CREATE INDEX idx_subjects_status ON thesis_subjects(status);
CREATE INDEX idx_subjects_supervisor ON thesis_subjects(supervisor_id);

-- ----------------------------------------------------------------------------
-- 5. Candidatures & Circuits de Validation
-- ----------------------------------------------------------------------------
CREATE TYPE candidature_status AS ENUM (
    'BROUILLON',
    'SOUMISE',
    'EN_COURS_EXAMEN',
    'CORRECTION_DEMANDEE',
    'ACCEPTEE_DIRECTEUR_THESE',
    'REJETEE_DIRECTEUR_THESE',
    'EN_ATTENTE_DECISION_ADMINISTRATIVE',
    'ADMISE',
    'REJETEE',
    'LISTE_ATTENTE',
    'ADMISSION_ANNULEE_DELAI_DEPASSE'
);

CREATE TABLE IF NOT EXISTS candidatures (
    id VARCHAR(64) PRIMARY KEY,
    candidate_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    candidate_name VARCHAR(128) NOT NULL,
    candidate_email VARCHAR(128) NOT NULL,
    candidate_phone VARCHAR(32),
    candidate_cin VARCHAR(32),
    candidate_cne VARCHAR(32),
    subject_id VARCHAR(64) NOT NULL REFERENCES thesis_subjects(id) ON DELETE RESTRICT,
    subject_title VARCHAR(255) NOT NULL,
    supervisor_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    laboratory_id VARCHAR(64) NOT NULL REFERENCES laboratories(id) ON DELETE RESTRICT,
    establishment_id VARCHAR(64) NOT NULL REFERENCES establishments(id) ON DELETE RESTRICT,
    campaign_id VARCHAR(64) NOT NULL REFERENCES doctoral_campaigns(id) ON DELETE RESTRICT,
    status candidature_status NOT NULL DEFAULT 'BROUILLON',
    is_draft BOOLEAN NOT NULL DEFAULT true,
    submission_date TIMESTAMP WITH TIME ZONE,
    documents JSONB NOT NULL DEFAULT '{}'::jsonb,
    supervisor_review JSONB,
    structure_review JSONB,
    waitlist_rank INTEGER,
    registration_file JSONB,
    history JSONB NOT NULL DEFAULT '[]'::jsonb,
    corrections JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    -- Contrainte d'unicité : 1 seule candidature par candidat, sujet et campagne
    CONSTRAINT uq_candidat_subject_campaign UNIQUE (candidate_id, subject_id, campaign_id)
);

CREATE INDEX idx_candidatures_status ON candidatures(status);
CREATE INDEX idx_candidatures_candidate ON candidatures(candidate_id);
CREATE INDEX idx_candidatures_supervisor ON candidatures(supervisor_id);

-- ----------------------------------------------------------------------------
-- 6. Réinscriptions Annuelles (Années 2 à 6)
-- ----------------------------------------------------------------------------
CREATE TYPE reinscription_status AS ENUM (
    'BROUILLON',
    'SOUMISE',
    'AVIS_DT_FAVORABLE',
    'AVIS_DT_DEFAVORABLE',
    'VALIDEE_STRUCTURE',
    'REFUSEE_STRUCTURE'
);

CREATE TABLE IF NOT EXISTS reinscriptions (
    id VARCHAR(64) PRIMARY KEY,
    candidate_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    candidate_name VARCHAR(128) NOT NULL,
    candidate_email VARCHAR(128) NOT NULL,
    subject_id VARCHAR(64) NOT NULL REFERENCES thesis_subjects(id) ON DELETE RESTRICT,
    subject_title VARCHAR(255) NOT NULL,
    supervisor_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    supervisor_name VARCHAR(128) NOT NULL,
    campaign_id VARCHAR(64) NOT NULL REFERENCES doctoral_campaigns(id) ON DELETE RESTRICT,
    doctoral_year INTEGER NOT NULL,
    status reinscription_status NOT NULL DEFAULT 'SOUMISE',
    rapport_avancement_doc_id VARCHAR(64) NOT NULL,
    avis_directeur_doc_id VARCHAR(64) NOT NULL,
    formations_doctorales_doc_id VARCHAR(64) NOT NULL,
    supervisor_review JSONB,
    structure_review JSONB,
    history JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 7. Métadonnées des Documents & Scanner Caméra
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS documents (
    id VARCHAR(64) PRIMARY KEY,
    owner_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    owner_name VARCHAR(128) NOT NULL,
    category VARCHAR(64) NOT NULL,
    category_label VARCHAR(128) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(64) NOT NULL,
    file_size INTEGER NOT NULL,
    upload_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(32) NOT NULL DEFAULT 'EN_ATTENTE',
    validation_comment TEXT,
    is_camera_capture BOOLEAN NOT NULL DEFAULT false,
    storage_key VARCHAR(128) NOT NULL
);

-- ----------------------------------------------------------------------------
-- 8. Notifications & Journaux d'Audit Immuables
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS internal_notifications (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(32) NOT NULL DEFAULT 'INFO',
    link_to VARCHAR(128),
    read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user_unread ON internal_notifications(user_id, read);

CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(64) PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    user_id VARCHAR(64) NOT NULL,
    user_name VARCHAR(128) NOT NULL,
    user_role user_role NOT NULL,
    action VARCHAR(64) NOT NULL,
    entity_type VARCHAR(64) NOT NULL,
    entity_id VARCHAR(64) NOT NULL,
    details TEXT NOT NULL
);

CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
