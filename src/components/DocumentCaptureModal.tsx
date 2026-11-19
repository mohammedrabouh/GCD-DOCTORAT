/**
 * DOCTORIA — Document Capture, Scanner & OCR Modal
 * Supports camera capture and file upload (PDF, JPG, PNG), validates file format/size,
 * runs PDF.js / Tesseract.js OCR (French, Arabic, English), lets the candidate edit extracted text,
 * and saves the binary file in IndexedDB while storing metadata + OCR text in StorageService.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Camera,
  Upload,
  RotateCcw,
  Check,
  X,
  AlertCircle,
  FileText,
  Image as ImageIcon,
  RefreshCw,
  ScanText,
  Languages,
} from 'lucide-react';
import { DocumentCategory, DocumentItem, DocumentOcrData, User } from '../types';
import { DOCUMENT_CATEGORIES, OCR_LANGUAGE_OPTIONS, OCR_STATUS_CONFIG } from '../constants';
import { documentDB } from '../services/db';
import { StorageService } from '../services/storage';
import { analyzeDocumentOcr, dataUrlToUint8Array, validateDocumentFile } from '../services/ocr';

interface DocumentCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: DocumentCategory;
  currentUser: User;
  onDocumentSaved: (doc: DocumentItem) => void;
  existingDocId?: string;
}

export const DocumentCaptureModal: React.FC<DocumentCaptureModalProps> = ({
  isOpen,
  onClose,
  category,
  currentUser,
  onDocumentSaved,
  existingDocId,
}) => {
  const [mode, setMode] = useState<'SELECT' | 'CAMERA' | 'PREVIEW_CAMERA' | 'FILE_SELECTED'>('SELECT');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<{
    name: string;
    type: string;
    size: number;
    dataUrl: string;
  } | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // OCR states
  const [ocrLanguage, setOcrLanguage] = useState<string>('fra+ara+eng');
  const [isAnalyzingOcr, setIsAnalyzingOcr] = useState(false);
  const [ocrProgress, setOcrProgress] = useState<number>(0);
  const [ocrStage, setOcrStage] = useState<string>('');
  const [ocrResult, setOcrResult] = useState<DocumentOcrData | null>(null);
  const [editableText, setEditableText] = useState<string>('');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const ocrRunIdRef = useRef<number>(0);

  const stopCameraStream = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  }, []);

  const resetOcrState = useCallback(() => {
    ocrRunIdRef.current += 1;
    setIsAnalyzingOcr(false);
    setOcrProgress(0);
    setOcrStage('');
    setOcrResult(null);
    setEditableText('');
  }, []);

  // Stop camera and reset when modal closes
  useEffect(() => {
    if (!isOpen) {
      stopCameraStream();
      setMode('SELECT');
      setCapturedImage(null);
      setSelectedFile(null);
      setCameraError(null);
      setFileError(null);
      resetOcrState();
    }
  }, [isOpen, stopCameraStream, resetOcrState]);

  const runOcrAnalysis = useCallback(
    async (
      source: { dataUrl: string; fileName: string; mimeType: string; fileSize: number },
      langOverride?: string
    ) => {
      const runId = ++ocrRunIdRef.current;
      const targetLang = langOverride || ocrLanguage;
      setIsAnalyzingOcr(true);
      setOcrProgress(5);
      setOcrStage('Initialisation de l’analyse OCR...');

      const result = await analyzeDocumentOcr({
        dataUrl: source.dataUrl,
        fileName: source.fileName,
        mimeType: source.mimeType,
        fileSize: source.fileSize,
        languages: targetLang,
        onProgress: (update) => {
          if (ocrRunIdRef.current !== runId) return;
          setOcrProgress(update.progress);
          setOcrStage(update.stage);
        },
      });

      if (ocrRunIdRef.current !== runId) return;

      setOcrResult(result);
      setEditableText(result.extractedText || '');
      setIsAnalyzingOcr(false);
      setOcrProgress(100);
    },
    [ocrLanguage]
  );

  const startCamera = async () => {
    setCameraError(null);
    setFileError(null);
    setMode('CAMERA');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: unknown) {
      console.error('Camera access error:', err);
      const msg = err instanceof Error ? err.message : 'Accès refusé ou caméra non disponible.';
      setCameraError(
        `Impossible d'accéder à la caméra : ${msg}. Vous pouvez importer votre document numérisé depuis vos fichiers.`
      );
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      const fileName = `Capture_${category}_${new Date().toISOString().split('T')[0]}.jpg`;
      const approxSize = Math.round(dataUrl.length * 0.75);
      setCapturedImage(dataUrl);
      setMode('PREVIEW_CAMERA');
      stopCameraStream();
      void runOcrAnalysis({
        dataUrl,
        fileName,
        mimeType: 'image/jpeg',
        fileSize: approxSize,
      });
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    resetOcrState();
    startCamera();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const preCheck = validateDocumentFile({
      name: file.name,
      type: file.type,
      size: file.size,
    });
    if (!preCheck.valid) {
      setFileError(preCheck.error || 'Fichier non pris en charge.');
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => {
      setFileError('Impossible de lire le fichier sélectionné. Veuillez vérifier qu’il n’est pas endommagé.');
    };
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) {
        setFileError('Le fichier est vide ou illisible.');
        return;
      }

      let bytes: Uint8Array;
      try {
        bytes = dataUrlToUint8Array(dataUrl);
      } catch {
        setFileError('Format de fichier invalide ou corrompu.');
        return;
      }

      const inferredMime =
        file.type || (file.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg');

      const binaryCheck = validateDocumentFile(
        { name: file.name, type: inferredMime, size: file.size },
        bytes
      );

      if (!binaryCheck.valid) {
        setFileError(binaryCheck.error || 'Fichier illisible ou non pris en charge.');
        return;
      }

      const fileObj = {
        name: file.name,
        type: inferredMime,
        size: file.size,
        dataUrl,
      };
      setSelectedFile(fileObj);
      setMode('FILE_SELECTED');

      void runOcrAnalysis({
        dataUrl,
        fileName: fileObj.name,
        mimeType: fileObj.type,
        fileSize: fileObj.size,
      });
    };
    reader.readAsDataURL(file);
  };

  const getCurrentSource = () => {
    if (mode === 'PREVIEW_CAMERA' && capturedImage) {
      return {
        dataUrl: capturedImage,
        fileName: `Capture_${category}_${new Date().toISOString().split('T')[0]}.jpg`,
        mimeType: 'image/jpeg',
        fileSize: Math.round(capturedImage.length * 0.75),
        isCamera: true,
      };
    }
    if (mode === 'FILE_SELECTED' && selectedFile) {
      return {
        dataUrl: selectedFile.dataUrl,
        fileName: selectedFile.name,
        mimeType: selectedFile.type,
        fileSize: selectedFile.size,
        isCamera: false,
      };
    }
    return null;
  };

  const handleRelaunchOcr = () => {
    const src = getCurrentSource();
    if (!src) return;
    void runOcrAnalysis(src, ocrLanguage);
  };

  const handleSave = async () => {
    setFileError(null);
    setIsSaving(true);
    try {
      const src = getCurrentSource();
      if (!src) {
        throw new Error('Aucun document sélectionné.');
      }

      const docId = existingDocId || `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const storageKey = `blob_${docId}`;

      // 1. Save binary file in IndexedDB (never store large base64 files in localStorage)
      await documentDB.saveBlob({
        id: storageKey,
        dataUrl: src.dataUrl,
        mimeType: src.mimeType,
        size: src.fileSize,
        fileName: src.fileName,
        createdAt: new Date().toISOString(),
      });

      const trimmedEdited = editableText.trim();
      const rawExtracted = (ocrResult?.extractedText || '').trim();
      const hasManualEdit = trimmedEdited !== rawExtracted;

      // Never auto-validate OCR output: stays EN_ATTENTE_VERIFICATION (or ERREUR_OCR if failed and no manual text)
      const finalOcrData: DocumentOcrData = {
        status:
          ocrResult?.status === 'ERREUR_OCR' && !trimmedEdited
            ? 'ERREUR_OCR'
            : 'EN_ATTENTE_VERIFICATION',
        extractedText: rawExtracted || trimmedEdited,
        correctedText: hasManualEdit ? editableText : undefined,
        method: ocrResult?.method,
        languages: ocrResult?.languages || ocrLanguage,
        confidence: ocrResult?.confidence,
        pageCount: ocrResult?.pageCount,
        errorMessage:
          ocrResult?.status === 'ERREUR_OCR' && !trimmedEdited ? ocrResult.errorMessage : undefined,
        analyzedAt: ocrResult?.analyzedAt || new Date().toISOString(),
        lastEditedAt: hasManualEdit ? new Date().toISOString() : undefined,
        lastEditedBy: hasManualEdit
          ? `${currentUser.firstName} ${currentUser.lastName}`
          : undefined,
      };

      // 2. Save metadata + OCR result in StorageService (localStorage)
      const docItem: DocumentItem = {
        id: docId,
        ownerId: currentUser.id,
        ownerName: `${currentUser.firstName} ${currentUser.lastName}`,
        category,
        categoryLabel: DOCUMENT_CATEGORIES[category]?.label || category,
        fileName: src.fileName,
        fileType: src.mimeType,
        fileSize: src.fileSize,
        uploadDate: new Date().toISOString(),
        status: 'EN_ATTENTE',
        isCameraCapture: src.isCamera,
        storageKey,
        ocr: finalOcrData,
      };

      StorageService.saveDocumentMetadata(docItem);

      StorageService.logAudit({
        userId: currentUser.id,
        userName: `${currentUser.firstName} ${currentUser.lastName}`,
        userRole: currentUser.role,
        action: 'DEPOT_DOCUMENT',
        entityType: 'DOCUMENT',
        entityId: docItem.id,
        details: `Dépôt du document "${src.fileName}" pour "${docItem.categoryLabel}" avec analyse OCR (${finalOcrData.status}).`,
      });

      onDocumentSaved(docItem);
      onClose();
    } catch (err: unknown) {
      console.error('Error saving document:', err);
      const msg = err instanceof Error ? err.message : "Erreur lors de l'enregistrement.";
      setFileError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const categoryMeta = DOCUMENT_CATEGORIES[category];
  const isOcrActiveMode = mode === 'PREVIEW_CAMERA' || mode === 'FILE_SELECTED';
  const currentSource = getCurrentSource();
  const ocrStatusCfg = ocrResult ? OCR_STATUS_CONFIG[ocrResult.status] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div
        className={`bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 ${
          isOcrActiveMode ? 'max-w-5xl' : 'max-w-2xl'
        }`}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div>
            <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">
              Dépôt de pièce justificative & Analyse OCR
            </span>
            <h3 className="text-lg font-bold text-slate-900 leading-tight">
              {categoryMeta?.label || category}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">{categoryMeta?.description}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              stopCameraStream();
              onClose();
            }}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {fileError && (
            <div className="mb-4 p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold">Erreur de validation ou de lecture du document</p>
                <p className="mt-0.5">{fileError}</p>
              </div>
            </div>
          )}

          {mode === 'SELECT' && (
            <div className="space-y-6">
              <div className="bg-blue-50/50 border border-blue-200 rounded-lg p-4 text-xs text-blue-900 flex items-start gap-3">
                <ScanText className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold mb-1">Numérisation et extraction automatique (OCR) :</p>
                  <ul className="list-disc list-inside space-y-0.5 text-blue-800">
                    <li>Formats acceptés : PDF (texte ou scanné), JPG, PNG (taille maximale 15 Mo).</li>
                    <li>Extraction multilingue automatique : Français, Arabe et Anglais.</li>
                    <li>Vous pourrez vérifier et corriger le texte extrait avant d’enregistrer.</li>
                  </ul>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Option A: Import file */}
                <label className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors group bg-slate-50/50 hover:bg-blue-50/30">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mb-3 group-hover:scale-105 transition-transform">
                    <Upload className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-semibold text-slate-900 mb-1">
                    Déposer un document (PDF / Image)
                  </span>
                  <span className="text-xs text-slate-500">
                    Sélectionnez un fichier PDF, JPG ou PNG depuis votre appareil
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                    onChange={handleFileUpload}
                  />
                </label>

                {/* Option B: Use device camera */}
                <button
                  type="button"
                  onClick={startCamera}
                  className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors group bg-slate-50/50 hover:bg-blue-50/30"
                >
                  <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mb-3 group-hover:scale-105 transition-transform">
                    <Camera className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-semibold text-slate-900 mb-1">
                    Photographier avec l'appareil
                  </span>
                  <span className="text-xs text-slate-500">
                    Capture directe avec la caméra de votre smartphone, tablette ou webcam
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Camera Viewfinder */}
          {mode === 'CAMERA' && (
            <div className="flex flex-col items-center">
              {cameraError ? (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-lg text-sm w-full text-center">
                  <p className="font-semibold">{cameraError}</p>
                  <button
                    type="button"
                    onClick={() => setMode('SELECT')}
                    className="mt-3 px-4 py-1.5 bg-white border border-rose-300 text-rose-700 text-xs font-semibold rounded-md hover:bg-rose-100"
                  >
                    Retour aux options
                  </button>
                </div>
              ) : (
                <div className="w-full flex flex-col items-center">
                  <div className="relative w-full aspect-4/3 bg-slate-900 rounded-lg overflow-hidden border border-slate-700 flex items-center justify-center">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-8 border-2 border-white/60 rounded pointer-events-none flex items-center justify-center">
                      <span className="text-xs font-medium text-white/80 bg-black/40 px-2 py-1 rounded">
                        Cadrez le document dans ce rectangle
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mt-5">
                    <button
                      type="button"
                      onClick={() => {
                        stopCameraStream();
                        setMode('SELECT');
                      }}
                      className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      onClick={capturePhoto}
                      className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg flex items-center gap-2 shadow-sm transition-colors"
                    >
                      <Camera className="w-4 h-4" />
                      Prendre la photo
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Document Preview + OCR Inspection Split View */}
          {isOcrActiveMode && currentSource && (
            <div className="space-y-5">
              {/* File info strip */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                    {currentSource.mimeType.startsWith('image/') ? (
                      <ImageIcon className="w-5 h-5" />
                    ) : (
                      <FileText className="w-5 h-5" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
                      {currentSource.fileName}
                    </h4>
                    <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                      <span>{(currentSource.fileSize / 1024 / 1024).toFixed(2)} Mo</span>
                      <span>·</span>
                      <span className="uppercase">{currentSource.mimeType.split('/')[1] || 'Fichier'}</span>
                      {ocrResult?.pageCount && (
                        <>
                          <span>·</span>
                          <span>{ocrResult.pageCount} page(s)</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* OCR language selector + relaunch */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5">
                    <Languages className="w-3.5 h-3.5 text-slate-500" />
                    <select
                      value={ocrLanguage}
                      onChange={(e) => setOcrLanguage(e.target.value)}
                      disabled={isAnalyzingOcr}
                      className="text-xs font-medium text-slate-700 bg-transparent focus:outline-hidden"
                      aria-label="Langues OCR"
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
                    className="px-3 py-1.5 bg-white border border-blue-300 hover:bg-blue-50 disabled:opacity-50 text-blue-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzingOcr ? 'animate-spin' : ''}`} />
                    Relancer l'analyse
                  </button>
                </div>
              </div>

              {/* OCR Progress Bar */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 font-semibold text-slate-800">
                    <ScanText className="w-4 h-4 text-blue-600" />
                    <span>{ocrStage || "Prêt pour l'analyse OCR"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {ocrStatusCfg && !isAnalyzingOcr && (
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded border ${ocrStatusCfg.bgClass} ${ocrStatusCfg.textClass} ${ocrStatusCfg.borderClass}`}
                      >
                        {ocrStatusCfg.label}
                      </span>
                    )}
                    <span className="font-mono text-xs font-bold text-slate-700 tabular-nums">
                      {ocrProgress}%
                    </span>
                  </div>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-200 ${
                      ocrResult?.status === 'ERREUR_OCR' && !isAnalyzingOcr
                        ? 'bg-rose-500'
                        : ocrProgress === 100 && !isAnalyzingOcr
                        ? 'bg-emerald-600'
                        : 'bg-blue-600'
                    }`}
                    style={{ width: `${ocrProgress}%` }}
                  />
                </div>
                {ocrResult?.status === 'ERREUR_OCR' && ocrResult.errorMessage && !isAnalyzingOcr && (
                  <p className="text-xs text-rose-700 font-medium">{ocrResult.errorMessage}</p>
                )}
              </div>

              {/* Split Preview & Extracted Text Editor */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Left: Document Preview */}
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-900 flex flex-col">
                  <div className="px-3 py-2 bg-slate-800 text-slate-200 text-[11px] font-semibold uppercase tracking-wider flex items-center justify-between">
                    <span>Aperçu du document</span>
                    <span className="text-slate-400">
                      {currentSource.mimeType.startsWith('image/') ? 'Image' : 'PDF'}
                    </span>
                  </div>
                  <div className="h-72 sm:h-80 flex items-center justify-center p-2 overflow-hidden">
                    {currentSource.mimeType.startsWith('image/') ? (
                      <img
                        src={currentSource.dataUrl}
                        alt="Aperçu du document"
                        className="max-h-full max-w-full object-contain rounded"
                      />
                    ) : (
                      <iframe
                        src={currentSource.dataUrl}
                        title={currentSource.fileName}
                        className="w-full h-full rounded bg-white"
                      />
                    )}
                  </div>
                </div>

                {/* Right: Extracted Text Area */}
                <div className="border border-slate-200 rounded-xl bg-white flex flex-col overflow-hidden">
                  <div className="px-3.5 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      Texte extrait (modifiable manuellement)
                    </span>
                    {ocrResult?.method && (
                      <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                        {ocrResult.method === 'PDF_TEXT'
                          ? 'PDF Sélectionnable'
                          : ocrResult.method === 'PDF_OCR'
                          ? 'PDF Scanné (OCR)'
                          : 'Image (OCR)'}
                        {typeof ocrResult.confidence === 'number' && ocrResult.method !== 'PDF_TEXT'
                          ? ` · ${ocrResult.confidence}%`
                          : ''}
                      </span>
                    )}
                  </div>
                  <textarea
                    dir="auto"
                    value={editableText}
                    onChange={(e) => setEditableText(e.target.value)}
                    disabled={isAnalyzingOcr}
                    placeholder={
                      isAnalyzingOcr
                        ? 'Extraction du texte en cours...'
                        : 'Le texte extrait apparaîtra ici. Vous pouvez le corriger manuellement en cas d’erreur.'
                    }
                    className="flex-1 min-h-[240px] sm:min-h-[280px] p-3.5 text-xs text-slate-800 leading-relaxed resize-none focus:outline-hidden focus:ring-2 focus:ring-inset focus:ring-blue-500 disabled:bg-slate-50"
                  />
                  <div className="px-3.5 py-2 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
                    <span>
                      Vérification humaine requise — l’OCR ne valide pas automatiquement le dossier.
                    </span>
                    <span className="font-mono">{editableText.length} car.</span>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200">
                {mode === 'PREVIEW_CAMERA' ? (
                  <button
                    type="button"
                    onClick={retakePhoto}
                    disabled={isSaving || isAnalyzingOcr}
                    className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 font-medium text-xs sm:text-sm rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Recommencer la photo
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      resetOcrState();
                      setMode('SELECT');
                    }}
                    disabled={isSaving || isAnalyzingOcr}
                    className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 font-medium text-xs sm:text-sm rounded-lg transition-colors"
                  >
                    Choisir un autre fichier
                  </button>
                )}

                <button
                  type="button"
                  disabled={isSaving || isAnalyzingOcr}
                  onClick={handleSave}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-xs sm:text-sm rounded-lg flex items-center gap-2 shadow-sm transition-colors"
                >
                  <Check className="w-4 h-4" />
                  {isSaving ? 'Enregistrement...' : 'Enregistrer les informations'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
