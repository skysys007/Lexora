import Tesseract from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist';

// Setting up worker for pdfjs-dist
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

/**
 * Perform OCR on an image file or HTML Canvas element.
 * @param {File|Blob|HTMLCanvasElement|string} imageInput - Input source for OCR
 * @param {Function} [onProgress] - Optional progress callback
 * @returns {Promise<string>} Recognized text
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
    return result.data.text.trim();
  } catch (error) {
    console.error("OCR Image Recognition Error:", error);
    throw new Error("Failed to read text from image. " + error.message);
  }
}

/**
 * Extract text from a document (PDF or Image file).
 * If PDF contains embedded text, it extracts directly.
 * If PDF is scanned (empty text), it performs OCR page-by-page.
 * @param {File} file 
 * @param {Function} [onProgress] 
 * @returns {Promise<string>} Extracted text
 */
export async function extractTextFromDocument(file, onProgress) {
  if (!file) {
    throw new Error('No file provided for text extraction.');
  }

  if (file.type.startsWith('image/') || /\.(png|jpe?g|webp|bmp)$/i.test(file.name)) {
    return await extractTextFromImage(file, onProgress);
  }

  if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
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
        console.log("PDF text is empty/minimal. Falling back to direct canvas OCR on PDF pages...");
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
            // Pass canvas directly to Tesseract to avoid memory-heavy base64 string creation
            const pageOcr = await extractTextFromImage(canvas);
            ocrText += `--- Page ${i} ---\n` + pageOcr + '\n';
          } finally {
            // Free canvas memory buffer immediately
            context.clearRect(0, 0, canvas.width, canvas.height);
            canvas.width = 0;
            canvas.height = 0;
          }
        }
        return ocrText.trim();
      }

      return fullText.trim();
    } finally {
      if (pdf && typeof pdf.destroy === 'function') {
        await pdf.destroy();
      }
    }
  }

  throw new Error('Unsupported file format. Please upload a PDF or Image file (PNG, JPG, WEBP).');
}


