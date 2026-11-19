/**
 * DOCTORIA — Administrator OCR Verification & Correction Workspace
 * Allows administrators to inspect original deposited documents from IndexedDB,
 * consult and manually correct OCR extracted text, re-run OCR if needed,
 * and set human verification status: "En attente de vérification", "Vérifié", or "Erreur OCR".
 *
 * Security rule: Human verification of OCR never auto-validates any candidature.
 */

import React, { useState, useEffect } from 'react';
import {
  ScanText,
  Search,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Clock,
  FileText,
  Download,
  RefreshCw,
  Check,
  Languages,
  User as UserIcon,
  FolderOpen,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { DocumentItem, OcrVerificationStatus } from '../../types';
import { StorageService, subscribeToStorage } from '../../services/storage';
import { documentDB, StoredBlobRecord } from '../../services/db';
import { OCR_LANGUAGE_OPTIONS, OCR_STATUS_CONFIG, CANDIDATURE_STATUS_CONFIG } from '../../constants';
import { analyzeDocumentOcr } from '../../services/ocr';

export const AdminOcrDocuments: React.FC = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | OcrVerificationStatus>('ALL');
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);

  // Blob loading for selected doc
  const [blobRecord, setBlobRecord] = useState<StoredBlobRecord | null>(null);
  const [blobLoading, setBlobLoading] = useState(false);
  const [blobError, setBlobError] = useState<string | null>(null);

  // Admin editing & verification state
  const [editedText, setEditedText] = useState('');
  const [selectedStatus, setSelectedStatus] =
    useState<OcrVerificationStatus>('EN_ATTENTE_VERIFICATION');
  const [ocrLanguage, setOcrLanguage] = useState('fra+ara+eng');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrStage, setOcrStage] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const loadData = () => {
    const allDocs = [...StorageService.getDocuments()].sort(
      (a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
    );
    setDocuments(allDocs);
    if (selectedDoc) {
      const fresh = allDocs.find((d) => d.id === selectedDoc.id);
      if (fresh) setSelectedDoc(fresh);
    }
  };

  useEffect(() => {
    loadData();
    const unsub = subscribeToStorage(loadData);
    return unsub;
  }, []);

  useEffect(() => {
    setFeedbackMessage(null);
    if (!selectedDoc) {
      setBlobRecord(null);
      setEditedText('');
      setSelectedStatus('EN_ATTENTE_VERIFICATION');
      return;
    }

    setEditedText(
      selectedDoc.ocr?.correctedText ?? selectedDoc.ocr?.extractedText ?? ''
    );
    setSelectedStatus(selectedDoc.ocr?.status || 'EN_ATTENTE_VERIFICATION');
    if (selectedDoc.ocr?.languages) {
      setOcrLanguage(selectedDoc.ocr.languages);
    }

    setBlobLoading(true);
    setBlobError(null);
    documentDB
      .getBlob(selectedDoc.storageKey)
      .then((rec) => {
        if (!rec) {
          setBlobError('Document original introuvable dans IndexedDB.');
          setBlobRecord(null);
        } else {
          setBlobRecord(rec);
        }
      })
      .catch(() => {
        setBlobError('Impossible de charger le document original.');
        setBlobRecord(null);
      })
      .finally(() => setBlobLoading(false));
  }, [selectedDoc?.id]);

  if (!user || user.role !== 'ADMINISTRATEUR') return null;

  const getDocOcrStatus = (doc: DocumentItem): OcrVerificationStatus =>
    doc.ocr?.status || 'EN_ATTENTE_VERIFICATION';

  const filteredDocs = documents.filter((doc) => {
    const st = getDocOcrStatus(doc);
    const matchesStatus = statusFilter === 'ALL' || st === statusFilter;
    const q = searchQuery.trim().toLowerCase();
    if (!q) return matchesStatus;
    const textContent = `${doc.ocr?.extractedText || ''} ${doc.ocr?.correctedText || ''}`.toLowerCase();
    const matchesQuery =
      doc.fileName.toLowerCase().includes(q) ||
      doc.ownerName.toLowerCase().includes(q) ||
      doc.categoryLabel.toLowerCase().includes(q) ||
      textContent.includes(q);
    return matchesStatus && matchesQuery;
  });

  const pendingCount = documents.filter(
    (d) => getDocOcrStatus(d) === 'EN_ATTENTE_VERIFICATION'
  ).length;
  const verifiedCount = documents.filter((d) => getDocOcrStatus(d) === 'VERIFIE').length;
  const errorCount = documents.filter((d) => getDocOcrStatus(d) === 'ERREUR_OCR').length;

  const handleRelaunchOcr = async () => {
    if (!selectedDoc || !blobRecord) return;
    setFeedbackMessage(null);
    setIsAnalyzing(true);
    setOcrProgress(5);
    setOcrStage('Relance de l’analyse OCR...');

    const result = await analyzeDocumentOcr({
      dataUrl: blobRecord.dataUrl,
      fileName: blobRecord.fileName || selectedDoc.fileName,
      mimeType: blobRecord.mimeType || selectedDoc.fileType,
      fileSize: blobRecord.size || selectedDoc.fileSize,
      languages: ocrLanguage,
      onProgress: (u) => {
        setOcrProgress(u.progress);
        setOcrStage(u.stage);
      },
    });

    setIsAnalyzing(false);
    setOcrProgress(100);
    setEditedText(result.extractedText || '');
    setSelectedStatus(result.status);

    const updated = StorageService.saveDocumentOcr(selectedDoc.id, result, user);
    setSelectedDoc(updated);
    setFeedbackMessage('Nouvelle extraction OCR effectuée (en attente de validation humaine).');
  };

  const handleSaveVerification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoc) return;
    setFeedbackMessage(null);

    const updated = StorageService.updateOcrVerificationStatus(selectedDoc.id, {
      status: selectedStatus,
      correctedText: editedText,
      reviewer: user,
    });
    setSelectedDoc(updated);
    setFeedbackMessage(
      `Vérification enregistrée : statut « ${OCR_STATUS_CONFIG[selectedStatus].label} ».`
    );
  };

  const linkedCandidatures = selectedDoc
    ? StorageService.getCandidaturesByDocumentId(selectedDoc.id)
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">
            Contrôle Qualité Documentaire & OCR
          </span>
          <h2 className="text-xl font-bold text-slate-900 mt-0.5">
            Vérification & Correction des Données OCR
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Consultez les pièces originales déposées par les doctorants, vérifiez le texte extrait par OCR et corrigez les éventuelles erreurs avant archivage.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <div className="px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 font-semibold">
            {pendingCount} en attente
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold">
            {verifiedCount} vérifié(s)
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 font-semibold">
            {errorCount} erreur(s)
          </div>
        </div>
      </div>

      {/* Human Validation Rule Banner */}
      <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-4 flex items-start gap-3 text-xs text-blue-950">
        <ShieldAlert className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Règle de validation humaine :</span>{' '}
          Les résultats OCR constituent une assistance à la lecture. La vérification ou la correction d’un texte OCR ne valide jamais automatiquement une candidature doctorale.
        </div>
      </div>

      {/* Selected Document Split Inspector */}
      {selectedDoc && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-blue-700 uppercase">
                  {selectedDoc.categoryLabel}
                </span>
                <span className="text-slate-300">·</span>
                <span className="text-xs font-semibold text-slate-800 flex items-center gap-1">
                  <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                  {selectedDoc.ownerName}
                </span>
                <span className="text-slate-300">·</span>
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded border ${
                    OCR_STATUS_CONFIG[getDocOcrStatus(selectedDoc)].bgClass
                  } ${OCR_STATUS_CONFIG[getDocOcrStatus(selectedDoc)].textClass} ${
                    OCR_STATUS_CONFIG[getDocOcrStatus(selectedDoc)].borderClass
                  }`}
                >
                  {OCR_STATUS_CONFIG[getDocOcrStatus(selectedDoc)].label}
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 mt-1">{selectedDoc.fileName}</h3>
            </div>

            <div className="flex items-center gap-2">
              {blobRecord?.dataUrl && (
                <a
                  href={blobRecord.dataUrl}
                  download={selectedDoc.fileName}
                  className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  Télécharger l’original
                </a>
              )}
              <button
                type="button"
                onClick={() => setSelectedDoc(null)}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg"
              >
                Fermer l’inspection
              </button>
            </div>
          </div>

          {/* Linked Candidatures Strip */}
          {linkedCandidatures.length > 0 && (
            <div className="px-6 py-2.5 bg-slate-50/70 border-b border-slate-200 flex flex-wrap items-center gap-2 text-xs">
              <span className="font-semibold text-slate-600">Candidature(s) associée(s) :</span>
              {linkedCandidatures.map((c) => (
                <span
                  key={c.id}
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-white border border-slate-200 text-slate-800 font-medium"
                >
                  <span className="truncate max-w-[260px]">{c.subjectTitle}</span>
                  <span className="text-[10px] text-slate-500">
                    ({CANDIDATURE_STATUS_CONFIG[c.status]?.label || c.status})
                  </span>
                </span>
              ))}
            </div>
          )}

          {/* Split Body: Original Document (Left) & OCR Correction Form (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* Left: Original Document Viewer */}
            <div className="bg-slate-900 p-4 flex flex-col min-h-[420px]">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-2 flex items-center justify-between">
                <span>Document original (IndexedDB)</span>
                <span className="font-mono text-slate-400">
                  {(selectedDoc.fileSize / 1024 / 1024).toFixed(2)} Mo
                </span>
              </div>
              <div className="flex-1 flex items-center justify-center overflow-hidden rounded-lg bg-slate-950/60 p-2">
                {blobLoading && (
                  <div className="text-center text-slate-300 text-xs">
                    Chargement du document original...
                  </div>
                )}
                {blobError && (
                  <div className="text-center text-rose-300 text-xs p-4">{blobError}</div>
                )}
                {!blobLoading && !blobError && blobRecord && (
                  blobRecord.mimeType.startsWith('image/') ? (
                    <img
                      src={blobRecord.dataUrl}
                      alt={selectedDoc.fileName}
                      className="max-h-[460px] max-w-full object-contain rounded"
                    />
                  ) : blobRecord.mimeType === 'application/pdf' ? (
                    <iframe
                      src={blobRecord.dataUrl}
                      title={selectedDoc.fileName}
                      className="w-full h-[460px] rounded bg-white"
                    />
                  ) : (
                    <div className="text-center text-slate-300 text-xs p-6">
                      <FileText className="w-10 h-10 mx-auto mb-2 text-slate-400" />
                      Aperçu direct indisponible ({blobRecord.mimeType})
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Right: OCR Text Consultation, Correction & Status */}
            <form onSubmit={handleSaveVerification} className="p-6 flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <ScanText className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Texte extrait & Correction manuelle
                  </span>
                </div>

                {blobRecord && (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1">
                      <Languages className="w-3.5 h-3.5 text-slate-400" />
                      <select
                        value={ocrLanguage}
                        onChange={(e) => setOcrLanguage(e.target.value)}
                        disabled={isAnalyzing}
                        className="text-[11px] font-medium text-slate-700 bg-transparent focus:outline-hidden"
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
                      disabled={isAnalyzing}
                      className="px-2.5 py-1.5 border border-blue-300 bg-blue-50/50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg flex items-center gap-1 disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
                      Relancer l'analyse
                    </button>
                  </div>
                )}
              </div>

              {isAnalyzing && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-medium text-slate-700">
                    <span>{ocrStage}</span>
                    <span className="font-mono font-bold">{ocrProgress}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 transition-all duration-200"
                      style={{ width: `${ocrProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {selectedDoc.ocr?.errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{selectedDoc.ocr.errorMessage}</span>
                </div>
              )}

              {/* Editable Textarea */}
              <div className="flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    Informations extraites (corrigibles)
                  </label>
                  {selectedDoc.ocr?.method && (
                    <span className="text-[10px] font-semibold text-slate-500 font-mono">
                      Méthode : {selectedDoc.ocr.method}
                      {typeof selectedDoc.ocr.confidence === 'number'
                        ? ` · Confiance : ${selectedDoc.ocr.confidence}%`
                        : ''}
                    </span>
                  )}
                </div>
                <textarea
                  dir="auto"
                  rows={10}
                  value={editedText}
                  onChange={(e) => setEditedText(e.target.value)}
                  disabled={isAnalyzing}
                  placeholder="Aucun texte OCR extrait. Vous pouvez saisir ou corriger le contenu manuellement."
                  className="w-full p-3 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-lg leading-relaxed focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Verification Status Buttons */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Statut de vérification OCR
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedStatus('EN_ATTENTE_VERIFICATION')}
                    className={`py-2 px-2.5 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      selectedStatus === 'EN_ATTENTE_VERIFICATION'
                        ? 'bg-amber-100 border-amber-400 text-amber-900 shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    En attente
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedStatus('VERIFIE')}
                    className={`py-2 px-2.5 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      selectedStatus === 'VERIFIE'
                        ? 'bg-emerald-100 border-emerald-400 text-emerald-900 shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Vérifié
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedStatus('ERREUR_OCR')}
                    className={`py-2 px-2.5 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      selectedStatus === 'ERREUR_OCR'
                        ? 'bg-rose-100 border-rose-400 text-rose-900 shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Erreur OCR
                  </button>
                </div>
              </div>

              {feedbackMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 font-semibold">
                  {feedbackMessage}
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="text-[11px] text-slate-500">
                  {selectedDoc.ocr?.verifiedByName
                    ? `Dernière vérification : ${selectedDoc.ocr.verifiedByName}`
                    : 'Non encore vérifié par un administrateur'}
                </span>
                <button
                  type="submit"
                  disabled={isAnalyzing}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-2xs transition-colors"
                >
                  <Check className="w-4 h-4" />
                  Enregistrer les informations
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par candidat, fichier, catégorie ou texte extrait..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'ALL' | OcrVerificationStatus)}
          className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-semibold focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
        >
          <option value="ALL">Tous les statuts OCR ({documents.length})</option>
          <option value="EN_ATTENTE_VERIFICATION">En attente de vérification ({pendingCount})</option>
          <option value="VERIFIE">Vérifié ({verifiedCount})</option>
          <option value="ERREUR_OCR">Erreur OCR ({errorCount})</option>
        </select>
      </div>

      {/* Documents List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {filteredDocs.length === 0 ? (
          <div className="p-12 text-center">
            <FolderOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-800">Aucun document trouvé</h3>
            <p className="text-xs text-slate-500 mt-1">
              Les pièces justificatives déposées par les doctorants apparaîtront ici pour vérification OCR.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredDocs.map((doc) => {
              const ocrStatus = getDocOcrStatus(doc);
              const cfg = OCR_STATUS_CONFIG[ocrStatus];
              const cands = StorageService.getCandidaturesByDocumentId(doc.id);
              const isSelected = selectedDoc?.id === doc.id;

              return (
                <div
                  key={doc.id}
                  className={`p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                    isSelected ? 'bg-blue-50/50' : 'hover:bg-slate-50/70'
                  }`}
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded border ${cfg.bgClass} ${cfg.textClass} ${cfg.borderClass}`}
                      >
                        {cfg.label}
                      </span>
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {doc.fileName}
                      </span>
                      <span className="text-[11px] font-semibold text-blue-700">
                        {doc.categoryLabel}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
                      <span>
                        Candidat : <strong className="text-slate-800">{doc.ownerName}</strong>
                      </span>
                      <span>·</span>
                      <span>
                        Déposé le {new Date(doc.uploadDate).toLocaleDateString('fr-FR')}
                      </span>
                      {cands.length > 0 && (
                        <>
                          <span>·</span>
                          <span className="text-slate-600">
                            {cands.length} candidature(s) liée(s)
                          </span>
                        </>
                      )}
                    </div>

                    {doc.ocr && (
                      <p dir="auto" className="text-[11px] text-slate-500 line-clamp-1 max-w-2xl">
                        {doc.ocr.correctedText || doc.ocr.extractedText || doc.ocr.errorMessage}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedDoc(doc)}
                    className="px-4 py-2 bg-white border border-slate-300 hover:border-blue-400 hover:text-blue-700 text-slate-700 text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-2xs shrink-0 self-start sm:self-center"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Consulter & Vérifier
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
