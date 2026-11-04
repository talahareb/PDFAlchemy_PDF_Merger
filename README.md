# PDFAlchemy — PDF Merger

PDFAlchemy is a student-built web application for **merging PDF documents** and managing previously generated files. It features a straightforward upload interface, a merge-history page, and persistent storage so completed PDFs can be downloaded again later.

This repository preserves the original interface and styling, with targeted backend fixes to support merging, downloads, and history management.

## Preview

![PDFAlchemy upload interface](screenshots/pdfalchemy-homepage.png)

*PDFAlchemy's upload page running locally.*

## Features

- **Merge 2–5 PDFs** into one document, in the order selected.
- **Download automatically** when a merge is complete.
- **Browse merge history** with source filenames and dates.
- **Download past results** directly from the History page.
- **Keep files between sessions** using local storage, with optional MongoDB support for history.

## Getting started

**Requirements:** Node.js 20 or newer and npm.

```bash
npm install
npm start
```

Open **http://127.0.0.1:3000** in your browser, select 2–5 PDF files, and merge them. Use the **History** page to access previous results.

### Storage

No database setup is needed for local use. By default, PDFAlchemy stores:

- Merge history in `data/history.json`
- Generated PDFs in `data/merged/`

These files persist between runs and are excluded from Git.

**Optional MongoDB:** Create a `.env` file using `.env.example`, set the connection string below, and start your MongoDB service before running the app.

```env
MONGODB_URI=mongodb://127.0.0.1:27017/pdfalchemy
```

## Testing

Run the integration tests with:

```bash
npm test
```

The tests use local storage and do not require MongoDB. See [`VERIFICATION.md`](VERIFICATION.md) for the project's recorded verification details.

## Project structure

```text
PDFAlchemy-PDF-Merger/
├── index.js                 # Application server
├── historyStore.js          # Local JSON and optional MongoDB history
├── public/
│   ├── index.html           # PDF upload page
│   ├── styles.css           # Upload page styling
│   ├── script.js            # Upload interactions
│   ├── history.html         # Merge history page
│   ├── history.css          # History page styling
│   ├── history.js           # History display and download links
│   └── merged-pdfs.html     # Preserved placeholder page
├── controllers/             # Coursework modules
├── models/                  # Coursework modules
├── routes/                  # Coursework modules
├── database.js              # MongoDB connection module
├── data/                    # Local history and PDFs (gitignored)
├── screenshots/             # README screenshots
├── tests/                   # Integration tests
├── .env.example             # Example configuration
├── VERIFICATION.md          # Testing and verification notes
└── README.md
```

## Key concepts

- **Full-stack web development:** connecting a browser-based interface with server-side PDF processing.
- **File upload and processing:** accepting multiple documents, merging them in order, and returning a downloadable result.
- **Data persistence:** keeping generated PDFs and their merge history available across application restarts.
- **Storage flexibility:** using local JSON-based history by default, with optional MongoDB integration.
- **Integration testing:** checking the complete merge-and-download workflow through automated tests.

PDFAlchemy brings together file handling, backend development, and persistent data management in a practical web application.
