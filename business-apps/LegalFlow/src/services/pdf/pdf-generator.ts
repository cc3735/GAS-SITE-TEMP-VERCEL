import { PDFDocument, StandardFonts, rgb, PDFFont, PDFPage } from 'pdf-lib';
import { logger } from '../../utils/logger.js';

export interface PDFOptions {
  title?: string;
  author?: string;
  subject?: string;
  margins?: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  fontSize?: number;
  lineHeight?: number;
}

const DEFAULT_OPTIONS: PDFOptions = {
  margins: {
    top: 72,
    bottom: 72,
    left: 72,
    right: 72,
  },
  fontSize: 12,
  lineHeight: 1.5,
};

interface TextPosition {
  x: number;
  y: number;
}

/**
 * Create a simple text-based PDF document
 */
export async function createTextPDF(
  content: string,
  options: PDFOptions = {}
): Promise<Uint8Array> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const pdfDoc = await PDFDocument.create();

  // Set metadata
  if (opts.title) pdfDoc.setTitle(opts.title);
  if (opts.author) pdfDoc.setAuthor(opts.author);
  if (opts.subject) pdfDoc.setSubject(opts.subject);
  pdfDoc.setCreator('LegalFlow');
  pdfDoc.setCreationDate(new Date());

  const font = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const boldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  const fontSize = opts.fontSize || 12;
  const lineHeight = (opts.lineHeight || 1.5) * fontSize;

  // Split content into lines
  const lines = content.split('\n');
  
  let page = pdfDoc.addPage();
  const { width, height } = page.getSize();
  const margins = opts.margins || DEFAULT_OPTIONS.margins!;
  
  let y = height - margins.top;
  const maxWidth = width - margins.left - margins.right;

  for (const line of lines) {
    // Check if we need a new page
    if (y < margins.bottom + fontSize) {
      page = pdfDoc.addPage();
      y = height - margins.top;
    }

    // Handle headers (lines starting with #)
    if (line.startsWith('# ')) {
      const headerText = line.substring(2);
      page.drawText(headerText, {
        x: margins.left,
        y,
        size: fontSize + 8,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      y -= lineHeight * 1.5;
    } else if (line.startsWith('## ')) {
      const headerText = line.substring(3);
      page.drawText(headerText, {
        x: margins.left,
        y,
        size: fontSize + 4,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      y -= lineHeight * 1.3;
    } else if (line.startsWith('### ')) {
      const headerText = line.substring(4);
      page.drawText(headerText, {
        x: margins.left,
        y,
        size: fontSize + 2,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      y -= lineHeight * 1.2;
    } else if (line.trim() === '') {
      // Empty line - add spacing
      y -= lineHeight * 0.5;
    } else {
      // Regular text - wrap if needed
      const wrappedLines = wrapText(line, font, fontSize, maxWidth);
      for (const wrappedLine of wrappedLines) {
        if (y < margins.bottom + fontSize) {
          page = pdfDoc.addPage();
          y = height - margins.top;
        }
        page.drawText(wrappedLine, {
          x: margins.left,
          y,
          size: fontSize,
          font,
          color: rgb(0, 0, 0),
        });
        y -= lineHeight;
      }
    }
  }

  return pdfDoc.save();
}

/**
 * Create a legal document PDF with proper formatting
 */
export async function createLegalDocumentPDF(
  title: string,
  sections: { heading: string; content: string }[],
  options: PDFOptions = {}
): Promise<Uint8Array> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const pdfDoc = await PDFDocument.create();

  // Set metadata
  pdfDoc.setTitle(title);
  if (opts.author) pdfDoc.setAuthor(opts.author);
  pdfDoc.setSubject('Legal Document');
  pdfDoc.setCreator('LegalFlow');
  pdfDoc.setCreationDate(new Date());

  const font = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const boldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  const fontSize = opts.fontSize || 12;
  const lineHeight = (opts.lineHeight || 1.5) * fontSize;

  let page = pdfDoc.addPage();
  const { width, height } = page.getSize();
  const margins = opts.margins || DEFAULT_OPTIONS.margins!;
  
  let y = height - margins.top;
  const maxWidth = width - margins.left - margins.right;
  const centerX = width / 2;

  // Draw title centered
  const titleWidth = boldFont.widthOfTextAtSize(title, fontSize + 6);
  page.drawText(title, {
    x: centerX - titleWidth / 2,
    y,
    size: fontSize + 6,
    font: boldFont,
    color: rgb(0, 0, 0),
  });
  y -= lineHeight * 2;

  // Draw each section
  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];

    // Check if we need a new page for section header
    if (y < margins.bottom + lineHeight * 4) {
      page = pdfDoc.addPage();
      y = height - margins.top;
    }

    // Section number and heading
    const sectionTitle = `${i + 1}. ${section.heading}`;
    page.drawText(sectionTitle, {
      x: margins.left,
      y,
      size: fontSize + 2,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    y -= lineHeight * 1.5;

    // Section content
    const contentLines = section.content.split('\n');
    for (const line of contentLines) {
      if (line.trim() === '') {
        y -= lineHeight * 0.5;
        continue;
      }

      const wrappedLines = wrapText(line, font, fontSize, maxWidth);
      for (const wrappedLine of wrappedLines) {
        if (y < margins.bottom + fontSize) {
          page = pdfDoc.addPage();
          y = height - margins.top;
        }
        page.drawText(wrappedLine, {
          x: margins.left,
          y,
          size: fontSize,
          font,
          color: rgb(0, 0, 0),
        });
        y -= lineHeight;
      }
    }

    y -= lineHeight; // Extra space between sections
  }

  return pdfDoc.save();
}

/**
 * Fill a PDF form with provided values
 */
export async function fillPDFForm(
  templateBytes: Uint8Array,
  fieldValues: Record<string, string>
): Promise<Uint8Array> {
  try {
    const pdfDoc = await PDFDocument.load(templateBytes);
    const form = pdfDoc.getForm();

    for (const [fieldName, value] of Object.entries(fieldValues)) {
      try {
        const field = form.getField(fieldName);
        if (field) {
          if ('setText' in field) {
            (field as { setText: (text: string) => void }).setText(value);
          } else if ('check' in field && value === 'true') {
            (field as { check: () => void }).check();
          }
        }
      } catch (error) {
        logger.warn(`Could not fill field ${fieldName}:`, error);
      }
    }

    // Flatten the form to prevent editing
    form.flatten();

    return pdfDoc.save();
  } catch (error) {
    logger.error('Error filling PDF form:', error);
    throw error;
  }
}

/**
 * Add signature line to a PDF
 */
export async function addSignatureLine(
  pdfBytes: Uint8Array,
  signerName: string,
  position: TextPosition,
  pageIndex: number = 0
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pages = pdfDoc.getPages();
  const page = pages[pageIndex];
  
  if (!page) {
    throw new Error(`Page ${pageIndex} not found`);
  }

  const font = await pdfDoc.embedFont(StandardFonts.TimesRoman);

  // Draw signature line
  page.drawLine({
    start: { x: position.x, y: position.y },
    end: { x: position.x + 200, y: position.y },
    thickness: 1,
    color: rgb(0, 0, 0),
  });

  // Draw signer name below line
  page.drawText(signerName, {
    x: position.x,
    y: position.y - 15,
    size: 10,
    font,
    color: rgb(0, 0, 0),
  });

  // Draw "Date:" line
  page.drawLine({
    start: { x: position.x + 250, y: position.y },
    end: { x: position.x + 400, y: position.y },
    thickness: 1,
    color: rgb(0, 0, 0),
  });

  page.drawText('Date:', {
    x: position.x + 220,
    y: position.y - 3,
    size: 10,
    font,
    color: rgb(0, 0, 0),
  });

  return pdfDoc.save();
}

/**
 * Merge multiple PDFs into one
 */
export async function mergePDFs(pdfBytesArray: Uint8Array[]): Promise<Uint8Array> {
  const mergedPdf = await PDFDocument.create();

  for (const pdfBytes of pdfBytesArray) {
    const pdf = await PDFDocument.load(pdfBytes);
    const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    pages.forEach((page) => mergedPdf.addPage(page));
  }

  return mergedPdf.save();
}

/**
 * Add page numbers to a PDF
 */
export async function addPageNumbers(pdfBytes: Uint8Array): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pages = pdfDoc.getPages();
  const font = await pdfDoc.embedFont(StandardFonts.TimesRoman);

  pages.forEach((page, index) => {
    const { width } = page.getSize();
    const pageNumber = `Page ${index + 1} of ${pages.length}`;
    const textWidth = font.widthOfTextAtSize(pageNumber, 10);

    page.drawText(pageNumber, {
      x: width / 2 - textWidth / 2,
      y: 30,
      size: 10,
      font,
      color: rgb(0.5, 0.5, 0.5),
    });
  });

  return pdfDoc.save();
}

/**
 * Helper function to wrap text to fit within a given width
 */
function wrapText(
  text: string,
  font: PDFFont,
  fontSize: number,
  maxWidth: number
): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = font.widthOfTextAtSize(testLine, fontSize);

    if (testWidth > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

export default {
  createTextPDF,
  createLegalDocumentPDF,
  fillPDFForm,
  addSignatureLine,
  mergePDFs,
  addPageNumbers,
};

