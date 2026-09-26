import Tesseract from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist';

// Setting up worker for pdfjs-dist
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

// LRU Memory Cache for Extracted Text (Max 20 entries)
const extractionCache = new Map();
const MAX_CACHE_SIZE = 20;

/**
 * Generates a unique cache key for a File object.
 * @param {File} file 
 * @returns {string} Unique cache key
 */
function getFileCacheKey(file) {
  if (!file) return '';
  return `${file.name}_${file.size}_${file.lastModified || 0}`;
}

/**
 * Perform OCR on an image file or HTML Canvas element.
 * @param {File|Blob|HTMLCanvasElement|string} imageInput - Input source for OCR
 * @param {Function} [onProgress] - Optional progress callback
 * @returns {Promise<string>} Recognized plain text
 * @throws {Error} If OCR recognition fails
 */
export async function extractTextFromImage(imageInput, onProgress) {
  try {
    const result = await Tesseract.recognize(imageInput, 'eng', {
      logger: (m) => {
        if (onProgress && m.status === 'recognizing text') {
          onProgress(Math.round(m.progress * 100));
        }
      },
    });
    return (result?.data?.text || '').trim();
  } catch (error) {
    console.error("OCR Image Recognition Error:", error);
    throw new Error("Failed to read text from image: " + error.message);
  }
}

/**
 * Extract text from a document (PDF or Image file) with LRU caching.
 * If PDF contains embedded text, it extracts directly.
 * If PDF is scanned (empty text), it performs OCR page-by-page.
 * @param {File} file - Document File object to extract
 * @param {Function} [onProgress] - Optional progress report callback
 * @returns {Promise<string>} Extracted document text
 * @throws {Error} If file is missing or format is unsupported
 */
export async function extractTextFromDocument(file, onProgress) {
  if (!file) {
    throw new Error('No file provided for text extraction.');
  }

  const cacheKey = getFileCacheKey(file);
  if (cacheKey && extractionCache.has(cacheKey)) {
    return extractionCache.get(cacheKey);
  }

  let extractedText = '';

  if (file.type && (file.type.startsWith('image/') || /\.(png|jpe?g|webp|bmp)$/i.test(file.name))) {
    extractedText = await extractTextFromImage(file, onProgress);
  } else if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    try {
      let fullText = '';

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item) => item.str).join(' ');
        fullText += pageText + '\n';
      }

      // If text extraction yielded minimal text, fallback to OCR on scanned PDF pages
      if (fullText.trim().length < 50) {
        let ocrText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          if (onProgress) {
            onProgress(Math.round(((i - 1) / pdf.numPages) * 100));
          }
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 1.8 });
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          canvas.height = viewport.height;
          canvas.width = viewport.width;

          try {
            await page.render({ canvasContext: context, viewport }).promise;
            const pageOcr = await extractTextFromImage(canvas);
            ocrText += `--- Page ${i} ---\n` + pageOcr + '\n';
          } finally {
            context.clearRect(0, 0, canvas.width, canvas.height);
            canvas.width = 0;
            canvas.height = 0;
          }
        }
        extractedText = ocrText.trim();
      } else {
        extractedText = fullText.trim();
      }
    } finally {
      if (pdf && typeof pdf.destroy === 'function') {
        await pdf.destroy();
      }
    }
  } else {
    throw new Error('Unsupported file format. Please upload a PDF or Image file (PNG, JPG, WEBP).');
  }

  // Cache extracted result (LRU eviction if over max size)
  if (cacheKey && extractedText) {
    if (extractionCache.size >= MAX_CACHE_SIZE) {
      const oldestKey = extractionCache.keys().next().value;
      extractionCache.delete(oldestKey);
    }
    extractionCache.set(cacheKey, extractedText);
  }

  return extractedText;
}

/**
 * Clear the text extraction memory cache (Utility for memory management or unit testing).
 */
export function clearExtractionCache() {
  extractionCache.clear();
}


