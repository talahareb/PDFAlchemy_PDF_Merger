'use strict';

const express = require('express');
const multer = require('multer');
const path = require('node:path');
const { PDFDocument } = require('pdf-lib');

const app = express();
const MAX_FILES = 5;
const MAX_FILE_BYTES = 10 * 1024 * 1024;

app.disable('x-powered-by');
app.use(express.static(path.join(__dirname, 'public')));

// Keep uploaded documents in memory. Nothing is stored in a public directory.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_BYTES,
    files: MAX_FILES,
    fields: 0,
    parts: MAX_FILES,
  },
  fileFilter(_req, file, callback) {
    const extensionIsPdf = path.extname(file.originalname).toLowerCase() === '.pdf';
    const mimeIsPdf = file.mimetype.toLowerCase() === 'application/pdf';

    if (!extensionIsPdf || !mimeIsPdf) {
      const error = new Error('Only .pdf files are accepted.');
      error.statusCode = 400;
      return callback(error);
    }
    return callback(null, true);
  },
}).array('pdfs', MAX_FILES);

app.post('/merge-pdfs', (req, res) => {
  upload(req, res, async (uploadError) => {
    if (uploadError) {
      if (uploadError instanceof multer.MulterError) {
        const tooLarge = uploadError.code === 'LIMIT_FILE_SIZE';
        const tooMany = uploadError.code === 'LIMIT_FILE_COUNT' ||
          uploadError.code === 'LIMIT_UNEXPECTED_FILE' ||
          uploadError.code === 'LIMIT_PART_COUNT';
        return res.status(tooLarge || tooMany ? 413 : 400).json({
          error: tooLarge
            ? 'Each PDF must be 10 MB or smaller.'
            : tooMany
              ? 'Please select between 2 and 5 PDF files.'
              : 'Invalid file upload.',
        });
      }
      return res.status(uploadError.statusCode || 400).json({
        error: uploadError.message || 'Upload failed.',
      });
    }

    const files = req.files || [];
    if (files.length < 2 || files.length > MAX_FILES) {
      return res.status(400).json({ error: 'Please select between 2 and 5 PDF files.' });
    }

    try {
      const result = await PDFDocument.create();
      let totalPages = 0;

      // The multipart upload order defines the resulting PDF page order.
      for (const file of files) {
        if (file.buffer.subarray(0, 5).toString('ascii') !== '%PDF-') {
          throw new Error('Invalid PDF signature');
        }
        const source = await PDFDocument.load(file.buffer);
        const pages = await result.copyPages(source, source.getPageIndices());
        for (const page of pages) result.addPage(page);
        totalPages += pages.length;
      }

      if (totalPages === 0) {
        return res.status(422).json({ error: 'The uploaded PDFs contain no pages.' });
      }

      const output = await result.save();
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="PDFAlchemy-Merged.pdf"',
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      });
      return res.send(Buffer.from(output));
    } catch (_error) {
      return res.status(422).json({
        error: 'Could not merge the files. Make sure each PDF is valid and not password-protected.',
      });
    }
  });
});

// Handles request errors from Express independently of upload errors.
app.use((error, _req, res, _next) => {
  if (res.headersSent) return;
  res.status(500).json({ error: 'Unexpected server error.' });
});

module.exports = app;
