import Tesseract from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist';

// Setting up worker for pdfjs-dist
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

/**
 * Perform OCR on an image file (PNG, JPG, WEBP, etc.)
 * @param {File|Blob|string} imageInput - File or DataURL of the image
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
  if (file.type.startsWith('image/')) {
    return await extractTextFromImage(file, onProgress);
  }

  if (file.type === 'application/pdf') {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item) => item.str).join(' ');
      fullText += pageText + '\n';
    }

    // If text extraction yielded minimal text, fallback to OCR on scanned PDF pages
    if (fullText.trim().length < 50) {
      console.log("PDF text is empty/minimal. Falling back to OCR Image Recognition on PDF pages...");
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

        await page.render({ canvasContext: context, viewport }).promise;
        const pageImage = canvas.toDataURL('image/png');
        const pageOcr = await extractTextFromImage(pageImage);
        ocrText += `--- Page ${i} ---\n` + pageOcr + '\n';
      }
      return ocrText.trim();
    }

    return fullText.trim();
  }

  throw new Error('Unsupported file format. Please upload a PDF or Image file (PNG, JPG, WEBP).');
}
