/**
 * DOCTORIA — Document Capture & Scanner Modal
 * Supports both scanning via device camera with live viewfinder & preview/retake,
 * and importing pre-scanned digital PDF/images. Saves file data into IndexedDB.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, Upload, RotateCcw, Check, X, AlertCircle, FileText, Image as ImageIcon } from 'lucide-react';
import { DocumentCategory, DocumentItem, User } from '../types';
import { DOCUMENT_CATEGORIES } from '../constants';
import { documentDB } from '../services/db';
import { StorageService } from '../services/storage';

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
  const [selectedFile, setSelectedFile] = useState<{ name: string; type: string; size: number; dataUrl: string } | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const stopCameraStream = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  }, []);

  // Stop camera when unmounting or modal closes
  useEffect(() => {
    if (!isOpen) {
      stopCameraStream();
      setMode('SELECT');
      setCapturedImage(null);
      setSelectedFile(null);
      setCameraError(null);
    }
  }, [isOpen, stopCameraStream]);

  const startCamera = async () => {
    setCameraError(null);
    setMode('CAMERA');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' }, // Rear camera if on mobile
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
      setCameraError(`Impossible d'accéder à la caméra : ${msg}. Vous pouvez importer votre document numérisé depuis vos fichiers.`);
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
      setCapturedImage(dataUrl);
      setMode('PREVIEW_CAMERA');
      stopCameraStream();
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    startCamera();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 15MB)
    if (file.size > 15 * 1024 * 1024) {
      alert('Le fichier sélectionné dépasse la taille maximale autorisée (15 Mo).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setSelectedFile({
        name: file.name,
        type: file.type || 'application/pdf',
        size: file.size,
        dataUrl,
      });
      setMode('FILE_SELECTED');
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const docId = existingDocId || `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const storageKey = `blob_${docId}`;
      let dataUrl = '';
      let fileName = '';
      let mimeType = '';
      let fileSize = 0;
      let isCamera = false;

      if (mode === 'PREVIEW_CAMERA' && capturedImage) {
        dataUrl = capturedImage;
        fileName = `Capture_${category}_${new Date().toISOString().split('T')[0]}.jpg`;
        mimeType = 'image/jpeg';
        fileSize = Math.round(dataUrl.length * 0.75); // approx bytes
        isCamera = true;
      } else if (mode === 'FILE_SELECTED' && selectedFile) {
        dataUrl = selectedFile.dataUrl;
        fileName = selectedFile.name;
        mimeType = selectedFile.type;
        fileSize = selectedFile.size;
        isCamera = false;
      } else {
        throw new Error('Aucun document sélectionné.');
      }

      // 1. Save in IndexedDB (zero localStorage overhead)
      await documentDB.saveBlob({
        id: storageKey,
        dataUrl,
        mimeType,
        size: fileSize,
        fileName,
        createdAt: new Date().toISOString(),
      });

      // 2. Save metadata in StorageService
      const docItem: DocumentItem = {
        id: docId,
        ownerId: currentUser.id,
        ownerName: `${currentUser.firstName} ${currentUser.lastName}`,
        category,
        categoryLabel: DOCUMENT_CATEGORIES[category]?.label || category,
        fileName,
        fileType: mimeType,
        fileSize,
        uploadDate: new Date().toISOString(),
        status: 'EN_ATTENTE',
        isCameraCapture: isCamera,
        storageKey,
      };

      StorageService.saveDocumentMetadata(docItem);

      StorageService.logAudit({
        userId: currentUser.id,
        userName: `${currentUser.firstName} ${currentUser.lastName}`,
        userRole: currentUser.role,
        action: 'DEPOT_DOCUMENT',
        entityType: 'DOCUMENT',
        entityId: docItem.id,
        details: `Dépôt du document "${fileName}" pour la pièce "${docItem.categoryLabel}" (${isCamera ? 'Prise de vue Caméra' : 'Importation fichier'}).`,
      });

      onDocumentSaved(docItem);
      onClose();
    } catch (err: unknown) {
      console.error('Error saving document:', err);
      const msg = err instanceof Error ? err.message : "Erreur lors de l'enregistrement.";
      alert(`Erreur : ${msg}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const categoryMeta = DOCUMENT_CATEGORIES[category];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div>
            <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Dépôt de pièce justificative</span>
            <h3 className="text-lg font-bold text-slate-900 leading-tight">
              {categoryMeta?.label || category}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">{categoryMeta?.description}</p>
          </div>
          <button
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
          {mode === 'SELECT' && (
            <div className="space-y-6">
              <div className="bg-blue-50/50 border border-blue-200 rounded-lg p-4 text-xs text-blue-900 flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold mb-1">Recommandations de numérisation :</p>
                  <ul className="list-disc list-inside space-y-0.5 text-blue-800">
                    <li>Photographiez ou numérisez un document à la fois.</li>
                    <li>Veillez à un éclairage homogène sans reflet pour que le texte soit parfaitement lisible.</li>
                    <li>Formats acceptés : PDF, JPG, PNG (taille maximale 15 Mo).</li>
                  </ul>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Option A: Import file */}
                <label className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors group bg-slate-50/50 hover:bg-blue-50/30">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mb-3 group-hover:scale-105 transition-transform">
                    <Upload className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-semibold text-slate-900 mb-1">Importer un fichier numérisé</span>
                  <span className="text-xs text-slate-500">Sélectionnez un document PDF ou image depuis votre ordinateur ou mobile</span>
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png"
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
                  <span className="text-sm font-semibold text-slate-900 mb-1">Photographier avec l'appareil</span>
                  <span className="text-xs text-slate-500">Capture directe avec la caméra de votre smartphone, tablette ou webcam</span>
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
                    {/* Viewfinder target frame guide */}
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

          {/* Camera Photo Preview */}
          {mode === 'PREVIEW_CAMERA' && capturedImage && (
            <div className="flex flex-col items-center">
              <div className="relative w-full max-h-[50vh] bg-slate-900 rounded-lg overflow-hidden border border-slate-300 flex items-center justify-center p-2">
                <img
                  src={capturedImage}
                  alt="Aperçu de la capture"
                  className="max-h-[48vh] object-contain rounded"
                />
              </div>
              <p className="text-xs text-slate-500 mt-2 text-center">
                Vérifiez la netteté et la lisibilité du document avant validation.
              </p>
              <div className="flex items-center justify-between w-full mt-5 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={retakePhoto}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 font-medium text-sm rounded-lg flex items-center gap-2 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  Recommencer la photo
                </button>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleSave}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-sm rounded-lg flex items-center gap-2 shadow-sm transition-colors"
                >
                  <Check className="w-4 h-4" />
                  {isSaving ? 'Enregistrement...' : 'Valider ce document'}
                </button>
              </div>
            </div>
          )}

          {/* File Selected Preview */}
          {mode === 'FILE_SELECTED' && selectedFile && (
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                  {selectedFile.type.includes('image') ? <ImageIcon className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-slate-900 truncate">{selectedFile.name}</h4>
                  <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                    <span>{(selectedFile.size / 1024 / 1024).toFixed(2)} Mo</span>
                    <span>·</span>
                    <span className="uppercase">{selectedFile.type.split('/')[1] || 'Fichier'}</span>
                  </div>
                </div>
              </div>

              {selectedFile.type.includes('image') && (
                <div className="border border-slate-200 rounded-lg p-2 max-h-56 overflow-hidden flex items-center justify-center bg-slate-900">
                  <img
                    src={selectedFile.dataUrl}
                    alt="Aperçu fichier"
                    className="max-h-52 object-contain"
                  />
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    setMode('SELECT');
                  }}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 font-medium text-sm rounded-lg transition-colors"
                >
                  Choisir un autre fichier
                </button>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleSave}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-sm rounded-lg flex items-center gap-2 shadow-sm transition-colors"
                >
                  <Check className="w-4 h-4" />
                  {isSaving ? 'Enregistrement...' : 'Enregistrer le document'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
