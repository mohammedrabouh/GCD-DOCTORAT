/**
 * DOCTORIA — Document Viewer Modal
 * Fetches the document blob from IndexedDB and displays high-res image / PDF preview.
 */

import React, { useEffect, useState } from 'react';
import { X, Download, FileText, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { DocumentItem } from '../types';
import { documentDB, StoredBlobRecord } from '../services/db';

interface DocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentItem: DocumentItem | null;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  isOpen,
  onClose,
  documentItem,
}) => {
  const [blobRecord, setBlobRecord] = useState<StoredBlobRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && documentItem) {
      setLoading(true);
      setError(null);
      documentDB
        .getBlob(documentItem.storageKey)
        .then((record) => {
          if (!record) {
            setError('Fichier physique introuvable dans le stockage local IndexedDB.');
          } else {
            setBlobRecord(record);
          }
        })
        .catch((err) => {
          console.error(err);
          setError('Erreur lors du chargement du document.');
        })
        .finally(() => setLoading(false));
    } else {
      setBlobRecord(null);
    }
  }, [isOpen, documentItem]);

  if (!isOpen || !documentItem) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-4xl w-full h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-blue-700 uppercase">{documentItem.categoryLabel}</span>
              <span className="text-slate-300">·</span>
              <span className="text-xs text-slate-500 font-mono">
                {documentItem.fileSize ? `${(documentItem.fileSize / 1024 / 1024).toFixed(2)} Mo` : ''}
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900 truncate max-w-xl mt-0.5">{documentItem.fileName}</h3>
          </div>

          <div className="flex items-center gap-3">
            {blobRecord?.dataUrl && (
              <a
                href={blobRecord.dataUrl}
                download={documentItem.fileName}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Télécharger
              </a>
            )}
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              aria-label="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Status banner */}
        <div className="px-6 py-2 bg-slate-100/70 border-b border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Statut de conformité :</span>
            {documentItem.status === 'VALIDE' && (
              <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" /> Validé conforme
              </span>
            )}
            {documentItem.status === 'REFUSE' && (
              <span className="inline-flex items-center gap-1 text-rose-700 font-medium">
                <XCircle className="w-3.5 h-3.5" /> Rejeté / Non conforme
              </span>
            )}
            {documentItem.status === 'EN_ATTENTE' && (
              <span className="inline-flex items-center gap-1 text-amber-700 font-medium">
                <Clock className="w-3.5 h-3.5" /> En cours d'examen
              </span>
            )}
          </div>
          {documentItem.isCameraCapture && (
            <span className="text-slate-500 italic">Capture photo numérique certifiée</span>
          )}
        </div>

        {/* Document Body Viewport */}
        <div className="flex-1 bg-slate-900/95 overflow-auto p-4 flex items-center justify-center">
          {loading && (
            <div className="text-center text-white">
              <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm">Chargement du document haute résolution...</p>
            </div>
          )}

          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 p-6 rounded-lg text-sm max-w-md text-center">
              <p className="font-semibold mb-1">Document introuvable</p>
              <p className="text-xs">{error}</p>
            </div>
          )}

          {!loading && !error && blobRecord && (
            <div className="w-full h-full flex items-center justify-center">
              {blobRecord.mimeType.startsWith('image/') ? (
                <img
                  src={blobRecord.dataUrl}
                  alt={documentItem.fileName}
                  className="max-w-full max-h-full object-contain rounded shadow-lg"
                />
              ) : blobRecord.mimeType === 'application/pdf' ? (
                <iframe
                  src={blobRecord.dataUrl}
                  title={documentItem.fileName}
                  className="w-full h-full rounded border border-slate-700 bg-white"
                />
              ) : (
                <div className="text-center text-white p-8">
                  <FileText className="w-16 h-16 text-slate-400 mx-auto mb-3" />
                  <p className="text-base font-semibold">{documentItem.fileName}</p>
                  <p className="text-xs text-slate-400 mt-1 mb-4">Format : {blobRecord.mimeType}</p>
                  <a
                    href={blobRecord.dataUrl}
                    download={documentItem.fileName}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
                  >
                    <Download className="w-4 h-4" />
                    Télécharger pour consulter
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
