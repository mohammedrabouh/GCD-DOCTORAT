/**
 * DOCTORIA — Public Information Pages
 * Calendrier Doctoral, Guide du Candidat, and À Propos du CED
 */

import React from 'react';
import { Calendar, FileText, CheckCircle2, Clock, Camera, GraduationCap, Building2 } from 'lucide-react';
import { StorageService } from '../services/storage';

export const PublicCalendrierPage: React.FC = () => {
  const campaign = StorageService.getActiveCampaign();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-2xs">
        <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">
          Calendrier Officiel
        </span>
        <h1 className="text-2xl font-bold text-slate-900 mt-1">
          Calendrier de la Campagne Doctorale {campaign?.academicYear || '2026-2027'}
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
          Retrouvez les étapes et jalons réglementaires fixés par le conseil du Centre d'Études Doctorales pour l'admission et les inscriptions.
        </p>

        <div className="mt-8 space-y-4">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
              01
            </div>
            <div>
              <span className="text-xs font-bold text-blue-700 uppercase">Étape 1 — Dépôt des dossiers</span>
              <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                Ouverture et soumission en ligne des candidatures
              </h4>
              <p className="text-xs text-slate-600 mt-1">
                Du <strong>{campaign?.startDate || '15 Septembre 2026'}</strong> au <strong>{campaign?.endDate || '20 Décembre 2026'}</strong>.
              </p>
            </div>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-xs shrink-0">
              02
            </div>
            <div>
              <span className="text-xs font-bold text-teal-700 uppercase">Étape 2 — Évaluation scientifique</span>
              <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                Examen des dossiers par les directeurs de thèse et commissions de sélection
              </h4>
              <p className="text-xs text-slate-600 mt-1">
                Examen de conformité, entretiens scientifiques et délibérations des laboratoires d'accueil.
              </p>
            </div>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
              03
            </div>
            <div>
              <span className="text-xs font-bold text-emerald-700 uppercase">Étape 3 — Décisions & Inscriptions</span>
              <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                Validation finale par le CED et clôture des inscriptions administratives
              </h4>
              <p className="text-xs text-slate-600 mt-1">
                Date limite impérative d'inscription fixée au <strong>{campaign?.registrationDeadline || '15 Janvier 2027'}</strong>. Tout retard entraîne l'attribution de la place au candidat suivant sur liste d'attente.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const PublicGuidePage: React.FC = () => {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-2xs space-y-6">
        <div>
          <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">
            Guide du Candidat
          </span>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            Comment postuler et préparer votre dossier doctoral
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
            Conseils pour la numérisation avec la caméra, constitution des pièces justificatives et respect des étapes de candidature.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center mb-2">
              <Camera className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">Numérisation par Caméra</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              La plateforme intègre un outil de numérisation directe. Vous pouvez photographier vos diplômes et CNIE directement depuis votre smartphone ou webcam. Prenez soin de photographier un document à la fois avec un bon éclairage.
            </p>
          </div>

          <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center mb-2">
              <FileText className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">Pièces Obligatoires</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Votre dossier de candidature doit contenir : CNIE, Baccalauréat, Licence, Master ou Diplôme d'Ingénieur, Relevés de notes universitaires globaux, CV détaillé et un Avant-projet de recherche de 3 à 5 pages.
            </p>
          </div>
        </div>

        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 space-y-1">
          <span className="font-bold block">Principe des brouillons :</span>
          <p className="leading-relaxed">
            Vous pouvez enregistrer votre candidature sous forme de brouillon et y revenir ultérieurement pour compléter vos pièces. Aucun dossier n'est transmis au directeur de thèse tant que vous n'avez pas cliqué sur « Soumettre définitivement ».
          </p>
        </div>
      </div>
    </div>
  );
};

export const PublicAproposPage: React.FC = () => {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-2xs space-y-6">
        <div>
          <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">
            Organisation Universitaire
          </span>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            À Propos de la Plateforme DOCTORIA et du CED
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
            DOCTORIA est la nouvelle plateforme institutionnelle de gestion intégrée du cycle doctoral, conçue pour remplacer l'ancien système GCD et garantir un suivi transparent, fiable et sans doublon des candidatures et thèses.
          </p>
        </div>

        <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
          <p>
            Le Centre d'Études Doctorales (CED) coordonne les formations doctorales, assure la cohérence des sujets de recherche accrédités et veille au respect de la charte des thèses et des délais légaux d'inscription.
          </p>
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <h4 className="font-bold text-slate-900">Les 4 acteurs clés du système :</h4>
            <ul className="list-disc list-inside space-y-1 text-slate-600">
              <li><strong>Le Candidat :</strong> Dépose ses candidatures, numérise ses pièces et finalise son inscription.</li>
              <li><strong>Le Directeur de Thèse :</strong> Propose les sujets, examine la valeur scientifique des dossiers et encadre les doctorants.</li>
              <li><strong>Le Directeur de Structure :</strong> Arbitre les admissions administratives, valide les sujets et gère les listes d'attente.</li>
              <li><strong>L'Administrateur Système :</strong> Gère la configuration des campagnes, crée les comptes institutionnels et audite l'ensemble des opérations.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
