"use strict";
const fs = require("node:fs");
const path = require("node:path");

function createLocalHistoryStore(dataDir) {
  const filename = path.join(dataDir, "history.json");
  function readAll() {
    if (!fs.existsSync(filename)) return [];
    const data = JSON.parse(fs.readFileSync(filename, "utf8"));
    if (!Array.isArray(data)) throw new Error("Local merge history is not an array");
    return data;
  }
  return {
    async add(record) {
      const items = readAll();
      items.unshift(record);
      const tmp = `${filename}.${process.pid}.tmp`;
      fs.writeFileSync(tmp, JSON.stringify(items, null, 2), { mode: 0o600 });
      fs.renameSync(tmp, filename);
    },
    async list() { return readAll(); },
    async get(id) { return readAll().find((item) => item.id === id) || null; },
  };
}

async function createHistoryStore(dataDir) {
  if (!process.env.MONGODB_URI) return createLocalHistoryStore(dataDir);
  const mongoose = require("mongoose");
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
  console.log("PDFAlchemy history: connected to MongoDB");
  const schema = new mongoose.Schema({
    id: { type: String, index: true },
    mergedFileName: { type: String, required: true },
    originalFiles: { type: [String], default: [] },
    date: { type: Date, default: Date.now },
  });
  // Reuse original `histories` collection, including older rows without a download id.
  const History = mongoose.models.History || mongoose.model("History", schema, "histories");
  return {
    async add(record) { await History.create(record); },
    async list() { return History.find().sort({ date: -1 }).lean(); },
    async get(id) { return History.findOne({ id }).lean(); },
  };
}

module.exports = { createHistoryStore, createLocalHistoryStore };
