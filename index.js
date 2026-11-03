// Restored original PDFAlchemy backend, with working merge history and saved downloads.
"use strict";
require("dotenv").config();
const express = require("express");
const multer = require("multer");
const path = require("node:path");
const fs = require("node:fs");
const os = require("node:os");
const crypto = require("node:crypto");
const { createHistoryStore } = require("./historyStore");

const DATA_DIR = path.resolve(process.env.PDFALCHEMY_DATA_DIR || path.join(__dirname, "data"));
const MERGED_DIR = path.join(DATA_DIR, "merged");
const UPLOAD_DIR = path.join(DATA_DIR, "uploads");
for (const folder of [DATA_DIR, MERGED_DIR, UPLOAD_DIR]) fs.mkdirSync(folder, { recursive: true });
const app = express();
app.disable("x-powered-by");
app.use(express.static(path.join(__dirname, "public")));
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));

const upload = multer({
  dest: UPLOAD_DIR,
  limits: { fileSize: 12 * 1024 * 1024, files: 5 },
  fileFilter(req, file, cb) {
    if (!/\.pdf$/i.test(file.originalname) || !["application/pdf", "application/octet-stream"].includes(file.mimetype)) {
      return cb(new Error("Only PDF documents are supported."));
    }
    cb(null, true);
  },
}).array("pdfs", 5);

function receiveFiles(req, res, next) {
  upload(req, res, (err) => {
    if (!err) return next();
    for (const file of req.files || []) fs.rmSync(file.path, { force: true });
    const detail = err.code === "LIMIT_FILE_SIZE" ? "Each PDF must be 12 MB or smaller." :
      err.code === "LIMIT_FILE_COUNT" || err.code === "LIMIT_UNEXPECTED_FILE" ? "Please upload between 2 and 5 PDF files." :
      err.message || "Invalid PDF upload.";
    return res.status(400).json({ message: detail });
  });
}

async function makeServer() {
  const history = await createHistoryStore(DATA_DIR);
  // Files remain private on disk; this route locates only server-created names from saved records.
  app.get("/get-history", async (req, res) => {
    try {
      const entries = await history.list();
      res.json(entries.map((item) => ({
        id: item.id,
        originalFiles: item.originalFiles,
        mergedFileName: item.mergedFileName,
        date: item.date,
        downloadUrl: fs.existsSync(path.join(MERGED_DIR, path.basename(item.mergedFileName))) ? `/download/${item.id}` : null,
      })));
    } catch (err) { console.error(err); res.status(500).json({ message: "Failed to read merge history." }); }
  });

  app.get("/download/:id", async (req, res) => {
    try {
      const item = await history.get(req.params.id);
      if (!item) return res.status(404).send("Merged file not found.");
      const file = path.join(MERGED_DIR, path.basename(item.mergedFileName));
      if (!fs.existsSync(file)) return res.status(404).send("This saved file is missing.");
      res.download(file, "merged.pdf");
    } catch (err) { console.error(err); res.status(500).send("Unable to download this PDF."); }
  });

  app.post("/merge-pdfs", receiveFiles, async (req, res) => {
    const files = req.files || [];
    let outputFile;
    try {
      if (files.length < 2 || files.length > 5) return res.status(400).json({ message: "Please select between 2 and 5 PDF files." });
      for (const f of files) {
        const fh = fs.openSync(f.path, "r");
        try {
          const signature = Buffer.alloc(5);
          fs.readSync(fh, signature, 0, 5, 0);
          if (signature.toString("ascii") !== "%PDF-") return res.status(400).json({ message: "One uploaded file is not a valid PDF." });
        } finally { fs.closeSync(fh); }
      }
      const PDFMerger = (await import("pdf-merger-js")).default;
      const merger = new PDFMerger();
      for (const file of files) await merger.add(file.path);
      const id = crypto.randomUUID();
      const mergedFileName = `merged-${id}.pdf`;
      outputFile = path.join(MERGED_DIR, mergedFileName);
      await merger.save(outputFile);
      await history.add({ id, mergedFileName, originalFiles: files.map((file) => path.basename(file.originalname)), date: new Date().toISOString() });
      res.download(outputFile, "merged.pdf");
    } catch (err) {
      console.error("PDF merge failed:", err);
      if (outputFile) fs.rmSync(outputFile, { force: true });
      if (!res.headersSent) res.status(400).json({ message: "Could not merge the PDFs. Check that all files are valid." });
    } finally {
      for (const f of files) fs.rmSync(f.path, { force: true });
    }
  });
  app.use((err, req, res, next) => {
    console.error(err);
    if (!res.headersSent) res.status(500).json({ message: "Unexpected server error." });
  });
  return app;
}

if (require.main === module) {
  makeServer().then((server) => {
    const PORT = Number(process.env.PORT || 3000);
    server.listen(PORT, "127.0.0.1", () => {
      console.log(`PDFAlchemy running at http://127.0.0.1:${PORT}`);
      console.log(`Merge history stored in ${process.env.MONGODB_URI ? "MongoDB" : DATA_DIR}`);
    });
  }).catch((err) => { console.error("Could not start PDFAlchemy:", err.message); process.exitCode = 1; });
}
module.exports = { makeServer };
