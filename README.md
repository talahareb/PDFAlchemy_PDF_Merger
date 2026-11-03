# PDFAlchemy — PDF Merger

A lightweight, browser-based PDF-merging application built with **Node.js, Express, Multer, and pdf-lib**. Upload 2–5 PDF documents, arrange their order, and download one merged PDF.

This repository is a cleaned-up, functional version of an earlier PDFAlchemy web-development project. Its original core workflow—select PDF files, merge them, and download the result—has been retained and improved.

## Features

- Upload **2–5 PDF files** (up to **10 MB per file**)
- Drag and drop PDFs or choose them using the file picker
- Reorder or remove files before merging
- Merge pages in the selected file order
- Download the resulting PDF immediately
- Client-side and server-side validation with readable error messages
- Process uploaded documents in server memory instead of saving them to public folders
- Automated tests for merging, validation, and invalid uploads

## Tech stack

| Component | Technology |
| --- | --- |
| Frontend | HTML5, CSS3, vanilla JavaScript |
| Backend | Node.js, Express |
| File uploads | Multer |
| PDF manipulation | pdf-lib |
| Testing | Node.js built-in test runner |

## Getting started

**Prerequisite:** Node.js **20 or later** and npm.

```bash
npm install
npm start
```

Open **http://127.0.0.1:3000** in your browser. Select 2–5 PDFs, reorder them using the arrows, and click **Merge PDFs**.

For automatic reloads during development:

```bash
npm run dev
```

To run automated tests:

```bash
npm test
```

By default, the server listens on `127.0.0.1:3000`. You can change the port with the `PORT` environment variable, and the host with `HOST`. This project is intended for **local development**, not public hosting as-is.

## Project structure

```text
PDFAlchemy-PDF-Merger/
├── app.js                 # Express app, upload validation, PDF merging
├── server.js              # Local server entry point
├── public/
│   ├── index.html         # Web interface
│   ├── styles.css         # Responsive styling
│   └── script.js          # File selection, reordering, and download
├── test/
│   └── merge.test.js      # Automated HTTP and PDF checks
├── .gitignore
├── package.json
└── README.md
```

## How it works

1. The browser sends the selected files to `POST /merge-pdfs` as multipart form data.
2. Multer enforces limits and holds uploaded files in memory during the request.
3. pdf-lib reads the PDFs, copies their pages in order, and creates a new PDF.
4. The server returns a downloadable PDF in the HTTP response without writing source or output PDFs to disk.

### API

`POST /merge-pdfs` — multipart form data with the field name `pdfs` repeated for each file. On success, returns an `application/pdf` attachment. Invalid requests return a JSON error message.

## Notes and limitations

- The app merges pages; it does **not** OCR, edit text, compress PDFs, or unlock password-protected documents.
- The earlier prototype included incomplete MongoDB/history components. **This edition intentionally focuses on working PDF merging and has no history database.**
- PDFs are handled **by the local Node.js server**, not entirely within the browser. No uploaded documents are intentionally retained on disk, but the app is not security-audited for public deployment.
- For public hosting, add rate limiting, comprehensive content scanning, hardened deployment settings, and operational monitoring.
- This application has no user authentication or cloud storage.

## Original-project improvements

Compared with the earlier prototype, this version removes unused dependencies, unfinished history pages, local `.env` secrets, uploaded documents, and `node_modules`; adds meaningful validations, reorder controls, in-memory processing, automated tests, a clearer folder structure, and documentation.

## Project context

Educational software-development project. If the original project was collaborative, retain appropriate collaborator credits when publishing to GitHub.
