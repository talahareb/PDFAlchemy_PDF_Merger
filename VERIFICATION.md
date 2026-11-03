# PDFAlchemy — Verification report

**Audited:** November 3, 2026. This is a restoration of the user's *original* PDFAlchemy history-enabled application, not the rewritten portfolio app.

## Checks completed

- Ten original source files are byte-for-byte unchanged: `public/index.html`, `public/styles.css`, `public/script.js`, `public/history.html`, `public/history.css`, `public/merged-pdfs.html`, `controllers/pdfController.js`, `database.js`, `models/mergedModel.js`, `routes/pdfRoutes.js`.
- JavaScript syntax checks pass for modified server and history files.
- Automated Node.js integration checks pass for original homepage and history routes, selecting 2–5 PDFs, rejecting an insufficient count, rejecting a bogus PDF or incorrect extension, creating a real merged PDF, listing its history, downloading the saved output again, and reloading the persisted history file.
- An independent HTTP test merged two sample PDFs; `pypdf` verified **two pages in the correct input order**.
- The original PDF upload page and history-page HTML and CSS were not replaced or redesigned.

## Not verified here

- A browser-driven end-to-end UI test: headless Chromium was blocked from opening local pages by this environment's administrator policy.
- A live MongoDB connection and reading historical MongoDB entries: MongoDB is not available in the test environment. MongoDB use remains optional; the default local-history mode was tested.
- A clean `npm ci` installation: the isolated environment's offline package cache lacks a transitive dependency. The original archived dependencies were used for test execution. On your computer, `npm ci` or `npm install` requires internet access to install packages.
- Every possible PDF type, password-protected PDFs, or deployment to the public internet. This is a **local demonstration app**, not a production system.

## Personal data protection

The original backup contained private PDF documents and local `.env` configuration. Those files are **excluded from this public-source ZIP** but are not deleted from the original private backup. New uploads and merged documents persist under the Git-ignored `data/` directory on the user's computer.
