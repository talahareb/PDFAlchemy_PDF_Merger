# Changes from the uploaded original PDFAlchemy

**What is preserved unchanged:** `public/index.html`, `public/styles.css`, `public/script.js`, `public/history.html`, `public/history.css`, `public/merged-pdfs.html`, `controllers/pdfController.js`, `database.js`, `models/mergedModel.js`, and `routes/pdfRoutes.js` are byte-for-byte copies of the original history-enabled upload. The original aesthetic, layout, upload form and separate history page are retained.

**Only application behavior fixes:**

1. `index.js`: repaired upload handling and PDF validation; limits 2–5 PDFs at 12 MB each; stores temporary uploads privately and removes them after merging; saves final merged PDFs so history links remain downloadable; adds `/download/:id`; records history consistently; retains original `GET /get-history` and `POST /merge-pdfs` routes.
2. `historyStore.js` (new): provides persistent JSON file history by default so the site works without MongoDB, plus optional MongoDB storage if you configure `MONGODB_URI`.
3. `public/history.js`: uses the existing original history-page layout, displays filenames safely and adds download links and basic empty/error messages.
4. `package.json`: provides real `npm start`/`npm test` scripts and only runtime dependencies; updated `package-lock.json` is generated from local test installation when available.
5. `.gitignore`, `.env.example`, `README.md`, `VERIFICATION.md`, `tests/`: new supporting files for safe public-source publishing.

**Excluded from public source (not discarded from private backup):** original `.env` secrets, `node_modules`, personal uploaded/merged PDF documents, unrelated saved `fj.html` webpage, and any local Git metadata. Original saved PDFs remain in the private backup that was provided separately; copying or importing private documents is a separate local-only action.

**Original limitations:** The old server deleted the merged file after returning a download, so its history could not be used to download a document again. It also depended on a live MongoDB instance and used a public uploads folder. This restored edition corrects those behaviors without replacing the original interface.
