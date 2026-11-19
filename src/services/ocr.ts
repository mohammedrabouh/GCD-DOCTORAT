/**
 * DOCTORIA — OCR & PDF Text Extraction Service
 * Uses PDF.js (pdfjs-dist) for PDF text extraction & page rendering,
 * and Tesseract.js for OCR on JPG/PNG images and scanned PDFs (French, Arabic, English).
 *
 * Security rule: OCR output is NEVER automatically validated; final validation remains human.
 */

import './polyfills';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { createWorker, type ImageLike } from 'tesseract.js';
import {
  ALLOWED_DOCUMENT_EXTENSIONS,
  ALLOWED_DOCUMENT_MIME_TYPES,
  MAX_DOCUMENT_SIZE_BYTES,
} from '../constants';
import { DocumentOcrData, OcrExtractionMethod } from '../types';

export interface OcrProgressUpdate {
  progress: number; // 0 to 100
  stage: string;
}

export interface FileValidationResult {
  valid: boolean;
  kind?: 'IMAGE' | 'PDF';
  error?: string;
}

export function dataUrlToUint8Array(dataUrl: string): Uint8Array {
  const commaIdx = dataUrl.indexOf(',');
  if (commaIdx === -1) {
    throw new Error('Format Data URL invalide.');
  }
  const base64 = dataUrl.slice(commaIdx + 1);
  const binaryStr = atob(base64);
  const len = binaryStr.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  return bytes;
}

function getLowerExtension(fileName: string): string {
  const dotIdx = fileName.lastIndexOf('.');
  return dotIdx >= 0 ? fileName.slice(dotIdx).toLowerCase() : '';
}

function detectBinarySignature(bytes: Uint8Array): 'PDF' | 'JPEG' | 'PNG' | 'UNKNOWN' {
  if (bytes.length >= 5) {
    // Check %PDF- within first 1024 bytes
    const limit = Math.min(bytes.length - 4, 1024);
    for (let i = 0; i <= limit; i++) {
      if (
        bytes[i] === 0x25 && // %
        bytes[i + 1] === 0x50 && // P
        bytes[i + 2] === 0x44 && // D
        bytes[i + 3] === 0x46 && // F
        bytes[i + 4] === 0x2d // -
      ) {
        return 'PDF';
      }
    }
  }
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'JPEG';
  }
  if (
    bytes.length >= 4 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return 'PNG';
  }
  return 'UNKNOWN';
}

export function validateDocumentFile(
  fileMeta: { name: string; type: string; size: number },
  bytes?: Uint8Array
): FileValidationResult {
  if (!fileMeta.size || fileMeta.size <= 0) {
    return {
      valid: false,
      error: 'Le fichier sélectionné est vide ou illisible.',
    };
  }

  if (fileMeta.size > MAX_DOCUMENT_SIZE_BYTES) {
    return {
      valid: false,
      error: 'Le fichier dépasse la taille maximale autorisée (15 Mo).',
    };
  }

  const ext = getLowerExtension(fileMeta.name || '');
  const mime = (fileMeta.type || '').toLowerCase();

  const hasValidMime = mime !== '' && ALLOWED_DOCUMENT_MIME_TYPES.includes(mime);
  const hasValidExt = ext !== '' && ALLOWED_DOCUMENT_EXTENSIONS.includes(ext);

  if (!hasValidMime && !hasValidExt) {
    return {
      valid: false,
      error: 'Format de fichier non pris en charge. Formats acceptés : PDF, JPG, JPEG, PNG.',
    };
  }

  const expectedKind: 'IMAGE' | 'PDF' =
    mime === 'application/pdf' || ext === '.pdf' ? 'PDF' : 'IMAGE';

  if (bytes) {
    const signature = detectBinarySignature(bytes);
    if (signature === 'UNKNOWN') {
      return {
        valid: false,
        error: 'Le contenu du fichier est corrompu ou ne correspond pas à un PDF, JPG ou PNG valide.',
      };
    }
    if (expectedKind === 'PDF' && signature !== 'PDF') {
      return {
        valid: false,
        error: "L'en-tête du fichier ne correspond pas à un document PDF valide.",
      };
    }
    if (expectedKind === 'IMAGE' && signature !== 'JPEG' && signature !== 'PNG') {
      return {
        valid: false,
        error: "L'en-tête du fichier ne correspond pas à une image JPG ou PNG valide.",
      };
    }
  }

  return { valid: true, kind: expectedKind };
}

export function hasMeaningfulSelectableText(text: string): boolean {
  // Strip whitespace and control characters; check for at least 15 meaningful letters/digits (Latin or Arabic)
  const meaningful = text.replace(/[^\p{L}\p{N}]/gu, '');
  return meaningful.length >= 15;
}

export async function extractPdfSelectableText(
  bytes: Uint8Array,
  onProgress?: (update: OcrProgressUpdate) => void
): Promise<{
  pageCount: number;
  text: string;
  hasSelectableText: boolean;
}> {
  onProgress?.({ progress: 15, stage: 'Ouverture du document PDF...' });
  const loadingTask = pdfjsLib.getDocument({
    data: bytes.slice(),
    verbosity: 0,
  });

  const pdfDoc = await loadingTask.promise;
  const pageCount = pdfDoc.numPages;
  const pageTexts: string[] = [];

  try {
    for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
      onProgress?.({
        progress: 15 + Math.round((pageNum / pageCount) * 25),
        stage: `Lecture du texte PDF (page ${pageNum}/${pageCount})...`,
      });
      const page = await pdfDoc.getPage(pageNum);
      const content = await page.getTextContent();
      const strings = content.items
        .map((item) => ('str' in item ? item.str : ''))
        .filter((s) => s.trim().length > 0);
      const joined = strings.join(' ').replace(/\s+/g, ' ').trim();
      if (joined) {
        pageTexts.push(pageCount > 1 ? `[Page ${pageNum}]\n${joined}` : joined);
      }
    }
  } finally {
    await pdfDoc.cleanup();
    await loadingTask.destroy();
  }

  const combinedText = pageTexts.join('\n\n').trim();
  return {
    pageCount,
    text: combinedText,
    hasSelectableText: hasMeaningfulSelectableText(combinedText),
  };
}

export async function renderPdfToPngDataUrls(
  bytes: Uint8Array,
  maxPages = 8,
  onProgress?: (update: OcrProgressUpdate) => void
): Promise<{ pageCount: number; renderedPages: string[] }> {
  if (typeof document === 'undefined') {
    throw new Error('Le rendu graphique PDF vers image nécessite un environnement navigateur.');
  }

  const loadingTask = pdfjsLib.getDocument({
    data: bytes.slice(),
    verbosity: 0,
  });

  const pdfDoc = await loadingTask.promise;
  const pageCount = pdfDoc.numPages;
  const pagesToRender = Math.min(pageCount, maxPages);
  const renderedPages: string[] = [];

  try {
    for (let pageNum = 1; pageNum <= pagesToRender; pageNum++) {
      onProgress?.({
        progress: 40 + Math.round((pageNum / pagesToRender) * 20),
        stage: `Conversion de la page scannée ${pageNum}/${pagesToRender} en image...`,
      });

      const page = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale: 2.0 });
      const canvas = document.createElement('canvas');
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);

      const context = canvas.getContext('2d');
      if (!context) {
        throw new Error('Impossible d’initialiser le contexte graphique pour le rendu PDF.');
      }

      await page.render({
        canvasContext: context,
        canvas,
        viewport,
      }).promise;

      renderedPages.push(canvas.toDataURL('image/png'));
    }
  } finally {
    await pdfDoc.cleanup();
    await loadingTask.destroy();
  }

  return { pageCount, renderedPages };
}

export async function runTesseractOnImages(
  images: ImageLike[],
  languages = 'fra+ara+eng',
  baseProgress = 20,
  onProgress?: (update: OcrProgressUpdate) => void
): Promise<{ text: string; confidence: number }> {
  if (images.length === 0) {
    throw new Error('Aucune page ou image disponible pour l’analyse OCR.');
  }

  const langsList = languages
    .split('+')
    .map((l) => l.trim())
    .filter(Boolean);

  onProgress?.({
    progress: baseProgress,
    stage: `Chargement du moteur OCR (${langsList.join(', ')})...`,
  });

  let currentImageIndex = 0;
  const totalImages = images.length;
  const span = 100 - baseProgress;

  const worker = await createWorker(langsList.length > 0 ? langsList : ['fra', 'ara', 'eng'], undefined, {
    logger: (m) => {
      if (m.status === 'recognizing text' && typeof m.progress === 'number') {
        const overall =
          baseProgress +
          Math.round(((currentImageIndex + m.progress) / totalImages) * span);
        onProgress?.({
          progress: Math.min(99, overall),
          stage:
            totalImages > 1
              ? `Reconnaissance optique OCR (page ${currentImageIndex + 1}/${totalImages})...`
              : 'Reconnaissance optique des caractères (OCR)...',
        });
      }
    },
  });

  const texts: string[] = [];
  let totalConfidence = 0;

  try {
    for (let i = 0; i < totalImages; i++) {
      currentImageIndex = i;
      const result = await worker.recognize(images[i]);
      const pageText = (result.data.text || '').trim();
      if (pageText) {
        texts.push(totalImages > 1 ? `[Page ${i + 1}]\n${pageText}` : pageText);
      }
      totalConfidence += result.data.confidence || 0;
    }
  } finally {
    await worker.terminate();
  }

  const combinedText = texts.join('\n\n').trim();
  const avgConfidence = totalImages > 0 ? Math.round(totalConfidence / totalImages) : 0;

  return {
    text: combinedText,
    confidence: avgConfidence,
  };
}

export async function analyzeDocumentOcr(params: {
  dataUrl: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  languages?: string;
  onProgress?: (update: OcrProgressUpdate) => void;
}): Promise<DocumentOcrData> {
  const languages = params.languages || 'fra+ara+eng';
  const nowIso = new Date().toISOString();

  try {
    params.onProgress?.({ progress: 5, stage: 'Vérification du format et de l’intégrité du fichier...' });

    const bytes = dataUrlToUint8Array(params.dataUrl);
    const validation = validateDocumentFile(
      {
        name: params.fileName,
        type: params.mimeType,
        size: params.fileSize || bytes.byteLength,
      },
      bytes
    );

    if (!validation.valid || !validation.kind) {
      return {
        status: 'ERREUR_OCR',
        extractedText: '',
        languages,
        errorMessage: validation.error || 'Fichier non pris en charge ou illisible.',
        analyzedAt: nowIso,
      };
    }

    let extractedText = '';
    let method: OcrExtractionMethod = 'IMAGE_OCR';
    let confidence: number | undefined;
    let pageCount: number | undefined = 1;

    if (validation.kind === 'IMAGE') {
      method = 'IMAGE_OCR';
      const ocrResult = await runTesseractOnImages([params.dataUrl], languages, 20, params.onProgress);
      extractedText = ocrResult.text;
      confidence = ocrResult.confidence;
    } else {
      // PDF workflow: check selectable text first via PDF.js
      const pdfTextResult = await extractPdfSelectableText(bytes, params.onProgress);
      pageCount = pdfTextResult.pageCount;

      if (pdfTextResult.hasSelectableText) {
        method = 'PDF_TEXT';
        extractedText = pdfTextResult.text;
        confidence = 100;
        params.onProgress?.({
          progress: 100,
          stage: 'Texte PDF sélectionnable extrait avec succès.',
        });
      } else {
        // Scanned PDF: render pages to PNG images then run Tesseract OCR
        method = 'PDF_OCR';
        const rendered = await renderPdfToPngDataUrls(bytes, 8, params.onProgress);
        const ocrResult = await runTesseractOnImages(
          rendered.renderedPages,
          languages,
          60,
          params.onProgress
        );
        extractedText = ocrResult.text;
        confidence = ocrResult.confidence;
      }
    }

    if (!extractedText.trim()) {
      return {
        status: 'ERREUR_OCR',
        extractedText: '',
        method,
        languages,
        confidence,
        pageCount,
        errorMessage:
          'Aucun texte lisible n’a pu être détecté. Vérifiez la netteté du scan ou saisissez le texte manuellement.',
        analyzedAt: nowIso,
      };
    }

    params.onProgress?.({
      progress: 100,
      stage: 'Analyse terminée — en attente de vérification humaine.',
    });

    // CRITICAL: Never auto-validate OCR output; always starts at EN_ATTENTE_VERIFICATION
    return {
      status: 'EN_ATTENTE_VERIFICATION',
      extractedText,
      method,
      languages,
      confidence,
      pageCount,
      analyzedAt: nowIso,
    };
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : 'Une erreur technique est survenue lors de l’analyse OCR.';
    return {
      status: 'ERREUR_OCR',
      extractedText: '',
      languages,
      errorMessage: message,
      analyzedAt: nowIso,
    };
  }
}
