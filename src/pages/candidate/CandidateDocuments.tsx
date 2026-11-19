/**
 * DOCTORIA — Candidate Document Locker & Camera Scanner
 * Comprehensive document repository: camera capture, file upload, status badges, and viewer.
 */

import React, { useState, useEffect } from 'react';
import {
  FolderOpen,
  Camera,
  Upload,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  AlertCircle,
  Plus,
  ScanText,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { DocumentItem, DocumentCategory } from '../../types';
import { StorageService, subscribeToStorage } from '../../services/storage';
import { DOCUMENT_CATEGORIES, OCR_STATUS_CONFIG } from '../../constants';
import { DocumentCaptureModal } from '../../components/DocumentCaptureModal';
import { DocumentViewerModal } from '../../components/DocumentViewerModal';

export const CandidateDocuments: React.FC = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<DocumentCategory | null>(null);
  const [viewingDoc, setViewingDoc] = useState<DocumentItem | null>(null);
  const [viewingInitialOcr, setViewingInitialOcr] = useState(false);

  const loadDocs = () => {
    if (!user) return;
    setDocuments(StorageService.getDocumentsByOwner(user.id));
  };

  useEffect(() => {
    loadDocs();
    const unsub = subscribeToStorage(loadDocs);
    return unsub;
  }, [user]);

  if (!user) return null;

  const categoriesList = Object.keys(DOCUMENT_CATEGORIES) as DocumentCategory[];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">
            Porte-documents numérique
          </span>
          <h2 className="text-xl font-bold text-slate-900 mt-0.5">
            Mes pièces justificatives & Numérisation
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Importez vos fichiers ou utilisez la caméra de votre smartphone/tablette pour photographier vos diplômes et justificatifs originaux un à un.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveCategory('CIN')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold inline-flex items-center gap-2 shadow-2xs transition-colors"
          >
            <Upload className="w-4 h-4" />
            Déposer un document (OCR)
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('CIN')}
            className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold inline-flex items-center gap-2 shadow-2xs transition-colors"
          >
            <Camera className="w-4 h-4 text-blue-600" />
            Scanner un document
          </button>
        </div>
      </div>

      {/* Info Notice about IndexedDB Storage */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-start gap-3 text-xs text-slate-600">
        <AlertCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-slate-800">Sécurité et intégrité de la numérisation :</p>
          <p className="mt-0.5 leading-relaxed">
            Vos fichiers haute résolution sont stockés localement dans la base IndexedDB de votre navigateur. Assurez-vous que les mentions légales, tampons et signatures restent lisibles après la capture.
          </p>
        </div>
      </div>

      {/* Documents Grid / Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">
            Répertoire des documents ({documents.length})
          </h3>
        </div>

        {documents.length === 0 ? (
          <div className="p-12 text-center">
            <FolderOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="text-sm font-bold text-slate-800">Aucun document numérisé pour le moment</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
              Commencez par déposer votre Carte d'Identité, Baccalauréat, Licence ou Master pour préparer vos candidatures.
            </p>
            <button
              type="button"
              onClick={() => setActiveCategory('CIN')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Ajouter un premier document
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {documents.map((doc) => {
              const catMeta = DOCUMENT_CATEGORIES[doc.category];
              return (
                <div
                  key={doc.id}
                  className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors"
                >
                  <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      {doc.isCameraCapture ? <Camera className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {doc.fileName}
                        </span>
                        {doc.isCameraCapture && (
                          <span className="text-[10px] bg-slate-100 text-slate-600 font-medium px-1.5 py-0.2 rounded">
                            Photo caméra
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5 flex-wrap">
                        <span className="font-semibold text-blue-700">
                          {catMeta?.label || doc.category}
                        </span>
                        <span>·</span>
                        <span className="tabular-nums font-mono text-[11px]">
                          {(doc.fileSize / 1024 / 1024).toFixed(2)} Mo
                        </span>
                        <span>·</span>
                        <span>
                          {new Date(doc.uploadDate).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: 'short',
                          })}
                        </span>
                      </div>
                      {doc.ocr && (
                        <p
                          dir="auto"
                          className="text-[11px] text-slate-500 mt-1 line-clamp-1 max-w-xl"
                        >
                          <span className="font-semibold text-slate-600">Texte OCR :</span>{' '}
                          {doc.ocr.correctedText || doc.ocr.extractedText || doc.ocr.errorMessage || 'Aucun texte extrait'}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Status & Actions */}
                  <div className="flex flex-wrap items-center gap-2.5 self-end sm:self-center shrink-0">
                    {/* OCR status badge */}
                    {doc.ocr && (
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md border ${
                          OCR_STATUS_CONFIG[doc.ocr.status].bgClass
                        } ${OCR_STATUS_CONFIG[doc.ocr.status].textClass} ${
                          OCR_STATUS_CONFIG[doc.ocr.status].borderClass
                        }`}
                      >
                        <ScanText className="w-3 h-3" />
                        OCR : {OCR_STATUS_CONFIG[doc.ocr.status].label}
                      </span>
                    )}

                    {/* Compliance status badge */}
                    {doc.status === 'VALIDE' && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Validé
                      </span>
                    )}
                    {doc.status === 'REFUSE' && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                        <XCircle className="w-3.5 h-3.5" /> Refusé
                      </span>
                    )}
                    {doc.status === 'EN_ATTENTE' && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                        <Clock className="w-3.5 h-3.5" /> En attente
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setViewingInitialOcr(true);
                        setViewingDoc(doc);
                      }}
                      className="px-3 py-1.5 border border-blue-200 bg-blue-50/60 hover:bg-blue-100/70 text-blue-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
                    >
                      <ScanText className="w-3.5 h-3.5" />
                      OCR & Texte
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setViewingInitialOcr(false);
                        setViewingDoc(doc);
                      }}
                      className="px-3 py-1.5 border border-slate-200 hover:bg-white text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-2xs transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5 text-blue-600" />
                      Visualiser
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveCategory(doc.category)}
                      className="text-xs text-blue-600 hover:underline font-semibold"
                    >
                      Remplacer
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Category Uploader Cards */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900">
          Ajouter ou renouveler une catégorie de pièce justificative
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {categoriesList.slice(0, 6).map((cat) => {
            const meta = DOCUMENT_CATEGORIES[cat];
            const hasDoc = documents.some((d) => d.category === cat);
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`p-3.5 rounded-lg border text-left transition-all flex flex-col justify-between ${
                  hasDoc
                    ? 'border-emerald-200 bg-emerald-50/30 hover:border-emerald-300'
                    : 'border-slate-200 bg-slate-50/50 hover:border-blue-300 hover:bg-blue-50/30'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-900 leading-tight">
                      {meta.label}
                    </span>
                    {hasDoc ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <Plus className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-2 leading-snug">
                    {meta.description}
                  </p>
                </div>
                <span className="text-[11px] font-semibold text-blue-600 mt-2 block">
                  {hasDoc ? 'Ajouter une version plus récente' : 'Déposer ce document'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Capture Modal */}
      {activeCategory && (
        <DocumentCaptureModal
          isOpen={!!activeCategory}
          onClose={() => setActiveCategory(null)}
          category={activeCategory}
          currentUser={user}
          onDocumentSaved={() => {
            loadDocs();
            setActiveCategory(null);
          }}
        />
      )}

      {/* Viewer Modal */}
      {viewingDoc && (
        <DocumentViewerModal
          isOpen={!!viewingDoc}
          onClose={() => {
            setViewingDoc(null);
            setViewingInitialOcr(false);
          }}
          documentItem={viewingDoc}
          initialShowOcr={viewingInitialOcr}
        />
      )}
    </div>
  );
};
