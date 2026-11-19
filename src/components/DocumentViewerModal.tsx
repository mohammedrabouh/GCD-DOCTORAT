/**
 * DOCTORIA — Document Viewer & OCR Inspector Modal
 * Fetches the original document blob from IndexedDB and displays high-res image / PDF preview,
 * alongside OCR extracted text inspection, re-analysis, and manual correction.
 */

import React, { useEffect, useState } from 'react';
import {
  X,
  Download,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  ScanText,
  RefreshCw,
  Check,
  Languages,
} from 'lucide-react';
import { DocumentItem, OcrVerificationStatus } from '../types';
import { documentDB, StoredBlobRecord } from '../services/db';
import { StorageService } from '../services/storage';
import { OCR_LANGUAGE_OPTIONS, OCR_STATUS_CONFIG } from '../constants';
import { analyzeDocumentOcr } from '../services/ocr';
import { useAuth } from '../context/AuthContext';

interface DocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentItem: DocumentItem | null;
  initialShowOcr?: boolean;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  isOpen,
  onClose,
  documentItem,
  initialShowOcr = false,
}) => {
  const { user } = useAuth();
  const [blobRecord, setBlobRecord] = useState<StoredBlobRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // OCR workspace state
  const [showOcrPanel, setShowOcrPanel] = useState(initialShowOcr);
  const [liveDoc, setLiveDoc] = useState<DocumentItem | null>(documentItem);
  const [ocrLanguage, setOcrLanguage] = useState<string>('fra+ara+eng');
  const [editableText, setEditableText] = useState<string>('');
  const [selectedOcrStatus, setSelectedOcrStatus] =
    useState<OcrVerificationStatus>('EN_ATTENTE_VERIFICATION');
  const [isAnalyzingOcr, setIsAnalyzingOcr] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrStage, setOcrStage] = useState('');
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

  useEffect(() => {
    setLiveDoc(documentItem);
    setShowOcrPanel(initialShowOcr || Boolean(documentItem?.ocr));
    setSaveFeedback(null);
    if (documentItem?.ocr) {
      setEditableText(documentItem.ocr.correctedText ?? documentItem.ocr.extractedText ?? '');
      setSelectedOcrStatus(documentItem.ocr.status);
      if (documentItem.ocr.languages) {
        setOcrLanguage(documentItem.ocr.languages);
      }
    } else {
      setEditableText('');
      setSelectedOcrStatus('EN_ATTENTE_VERIFICATION');
    }
  }, [documentItem, initialShowOcr]);

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

  if (!isOpen || !liveDoc) return null;

  const isCandidateOwner = user?.role === 'CANDIDAT' && user.id === liveDoc.ownerId;
  const isAdmin = user?.role === 'ADMINISTRATEUR';
  const canEditOcrText = isCandidateOwner || isAdmin;

  const handleRelaunchOcr = async () => {
    if (!blobRecord) return;
    setSaveFeedback(null);
    setIsAnalyzingOcr(true);
    setOcrProgress(5);
    setOcrStage('Relance de l’analyse OCR...');

    const result = await analyzeDocumentOcr({
      dataUrl: blobRecord.dataUrl,
      fileName: blobRecord.fileName || liveDoc.fileName,
      mimeType: blobRecord.mimeType || liveDoc.fileType,
      fileSize: blobRecord.size || liveDoc.fileSize,
      languages: ocrLanguage,
      onProgress: (u) => {
        setOcrProgress(u.progress);
        setOcrStage(u.stage);
      },
    });

    setIsAnalyzingOcr(false);
    setOcrProgress(100);
    setEditableText(result.extractedText || '');
    setSelectedOcrStatus(result.status);

    // Persist new raw OCR extraction (never auto-validates)
    try {
      const updated = StorageService.saveDocumentOcr(liveDoc.id, result, user || undefined);
      setLiveDoc(updated);
      setSaveFeedback('Analyse OCR terminée. Vérifiez le texte puis enregistrez si besoin.');
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveOcrChanges = () => {
    if (!user) return;
    setSaveFeedback(null);

    try {
      if (isAdmin) {
        const updated = StorageService.updateOcrVerificationStatus(liveDoc.id, {
          status: selectedOcrStatus,
          correctedText: editableText,
          reviewer: user,
        });
        setLiveDoc(updated);
        setSaveFeedback('Informations et statut OCR enregistrés.');
      } else if (isCandidateOwner) {
        const currentOcr = liveDoc.ocr || {
          status: 'EN_ATTENTE_VERIFICATION' as OcrVerificationStatus,
          extractedText: editableText,
        };
        const updated = StorageService.saveDocumentOcr(
          liveDoc.id,
          {
            ...currentOcr,
            status:
              currentOcr.status === 'ERREUR_OCR' && !editableText.trim()
                ? 'ERREUR_OCR'
                : 'EN_ATTENTE_VERIFICATION',
            extractedText: currentOcr.extractedText || editableText,
            correctedText: editableText,
          },
          user
        );
        setLiveDoc(updated);
        setSaveFeedback('Informations OCR enregistrées (en attente de vérification humaine).');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'enregistrement.");
    }
  };

  const ocrCfg = liveDoc.ocr ? OCR_STATUS_CONFIG[liveDoc.ocr.status] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className={`bg-white rounded-xl shadow-2xl border border-slate-200 w-full h-[88vh] flex flex-col overflow-hidden ${
          showOcrPanel ? 'max-w-6xl' : 'max-w-4xl'
        }`}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-blue-700 uppercase">
                {liveDoc.categoryLabel}
              </span>
              <span className="text-slate-300">·</span>
              <span className="text-xs text-slate-500 font-mono">
                {liveDoc.fileSize ? `${(liveDoc.fileSize / 1024 / 1024).toFixed(2)} Mo` : ''}
              </span>
              {ocrCfg && (
                <>
                  <span className="text-slate-300">·</span>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded border ${ocrCfg.bgClass} ${ocrCfg.textClass} ${ocrCfg.borderClass}`}
                  >
                    OCR : {ocrCfg.label}
                  </span>
                </>
              )}
            </div>
            <h3 className="text-base font-bold text-slate-900 truncate max-w-xl mt-0.5">
              {liveDoc.fileName}
            </h3>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowOcrPanel((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                showOcrPanel
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              <ScanText className="w-3.5 h-3.5" />
              {showOcrPanel ? 'Masquer panneau OCR' : 'Texte extrait (OCR)'}
            </button>

            {blobRecord?.dataUrl && (
              <a
                href={blobRecord.dataUrl}
                download={liveDoc.fileName}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Télécharger
              </a>
            )}
            <button
              type="button"
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
            {liveDoc.status === 'VALIDE' && (
              <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" /> Validé conforme
              </span>
            )}
            {liveDoc.status === 'REFUSE' && (
              <span className="inline-flex items-center gap-1 text-rose-700 font-medium">
                <XCircle className="w-3.5 h-3.5" /> Rejeté / Non conforme
              </span>
            )}
            {liveDoc.status === 'EN_ATTENTE' && (
              <span className="inline-flex items-center gap-1 text-amber-700 font-medium">
                <Clock className="w-3.5 h-3.5" /> En cours d'examen
              </span>
            )}
          </div>
          {liveDoc.isCameraCapture && (
            <span className="text-slate-500 italic">Capture photo numérique certifiée</span>
          )}
        </div>

        {/* Main Split Body */}
        <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
          {/* Document Body Viewport */}
          <div className="flex-1 bg-slate-900/95 overflow-auto p-4 flex items-center justify-center min-h-[260px]">
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
                    alt={liveDoc.fileName}
                    className="max-w-full max-h-full object-contain rounded shadow-lg"
                  />
                ) : blobRecord.mimeType === 'application/pdf' ? (
                  <iframe
                    src={blobRecord.dataUrl}
                    title={liveDoc.fileName}
                    className="w-full h-full rounded border border-slate-700 bg-white"
                  />
                ) : (
                  <div className="text-center text-white p-8">
                    <FileText className="w-16 h-16 text-slate-400 mx-auto mb-3" />
                    <p className="text-base font-semibold">{liveDoc.fileName}</p>
                    <p className="text-xs text-slate-400 mt-1 mb-4">
                      Format : {blobRecord.mimeType}
                    </p>
                    <a
                      href={blobRecord.dataUrl}
                      download={liveDoc.fileName}
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

          {/* OCR Inspection & Correction Panel */}
          {showOcrPanel && (
            <div className="w-full lg:w-[440px] border-t lg:border-t-0 lg:border-l border-slate-200 bg-white flex flex-col min-h-0">
              <div className="p-4 border-b border-slate-200 bg-slate-50 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <ScanText className="w-4 h-4 text-blue-600" />
                    Extraction & Vérification OCR
                  </span>
                  {liveDoc.ocr?.method && (
                    <span className="text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded">
                      {liveDoc.ocr.method === 'PDF_TEXT'
                        ? 'PDF Texte'
                        : liveDoc.ocr.method === 'PDF_OCR'
                        ? 'PDF Scanné OCR'
                        : 'Image OCR'}
                    </span>
                  )}
                </div>

                {canEditOcrText && blobRecord && (
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2 py-1 flex-1 min-w-[160px]">
                      <Languages className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <select
                        value={ocrLanguage}
                        onChange={(e) => setOcrLanguage(e.target.value)}
                        disabled={isAnalyzingOcr}
                        className="text-xs text-slate-700 bg-transparent w-full focus:outline-hidden"
                      >
                        {OCR_LANGUAGE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={handleRelaunchOcr}
                      disabled={isAnalyzingOcr}
                      className="px-3 py-1.5 bg-white border border-blue-300 hover:bg-blue-50 disabled:opacity-50 text-blue-700 text-xs font-semibold rounded-lg flex items-center gap-1.5"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzingOcr ? 'animate-spin' : ''}`} />
                      Relancer l'analyse
                    </button>
                  </div>
                )}

                {isAnalyzingOcr && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-medium text-slate-700">
                      <span>{ocrStage}</span>
                      <span className="font-mono font-bold">{ocrProgress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 transition-all duration-200"
                        style={{ width: `${ocrProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {liveDoc.ocr?.status === 'ERREUR_OCR' && liveDoc.ocr.errorMessage && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-[11px] text-rose-800">
                    {liveDoc.ocr.errorMessage}
                  </div>
                )}
              </div>

              <div className="flex-1 p-4 flex flex-col gap-3 overflow-y-auto">
                {isAdmin && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Statut de vérification OCR
                    </label>
                    <select
                      value={selectedOcrStatus}
                      onChange={(e) => setSelectedOcrStatus(e.target.value as OcrVerificationStatus)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="EN_ATTENTE_VERIFICATION">En attente de vérification</option>
                      <option value="VERIFIE">Vérifié</option>
                      <option value="ERREUR_OCR">Erreur OCR</option>
                    </select>
                  </div>
                )}

                <div className="flex-1 flex flex-col min-h-[200px]">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    {canEditOcrText ? 'Texte extrait (modifiable)' : 'Texte extrait (lecture seule)'}
                  </label>
                  <textarea
                    dir="auto"
                    value={editableText}
                    onChange={(e) => setEditableText(e.target.value)}
                    readOnly={!canEditOcrText || isAnalyzingOcr}
                    placeholder="Aucun texte OCR extrait pour ce document."
                    className="flex-1 w-full p-3 text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-lg resize-none leading-relaxed focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 read-only:bg-slate-50"
                  />
                </div>

                {saveFeedback && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 font-medium">
                    {saveFeedback}
                  </div>
                )}

                <p className="text-[11px] text-slate-500 leading-snug">
                  La validation finale d’un dossier et de ses pièces reste strictement humaine.
                </p>

                {canEditOcrText && (
                  <button
                    type="button"
                    onClick={handleSaveOcrChanges}
                    disabled={isAnalyzingOcr}
                    className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 shadow-2xs transition-colors"
                  >
                    <Check className="w-4 h-4" />
                    Enregistrer les informations
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
