"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const { Blob } = require("node:buffer");
const testDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "pdfalchemy-test-"));
process.env.PDFALCHEMY_DATA_DIR = testDataDir;
delete process.env.MONGODB_URI;
const { makeServer } = require("../index");
const one = fs.readFileSync(path.join(__dirname, "fixtures", "first.pdf"));
const two = fs.readFileSync(path.join(__dirname, "fixtures", "second.pdf"));

test("Original PDFAlchemy interface, merging, history, saved downloads and persistence", async (t) => {
  const app = await makeServer();
  let server;
  await new Promise(resolve => server = app.listen(0, "127.0.0.1", resolve));
  const addr = `http://127.0.0.1:${server.address().port}`;
  t.after(async () => { await new Promise(resolve => server.close(resolve)); fs.rmSync(testDataDir,{force:true,recursive:true}); });
  const home = await fetch(addr);
  assert.equal(home.status, 200);
  assert.match(await home.text(), /PDFAlchemy/);
  const historyPage = await fetch(addr + "/history.html");
  assert.equal(historyPage.status, 200);
  assert.match(await historyPage.text(), /Merge History/);
  const empty = await fetch(addr + "/get-history");
  assert.equal(empty.status, 200);
  assert.deepEqual(await empty.json(), []);

  const shortForm = new FormData();
  shortForm.append("pdfs", new Blob([one],{type:"application/pdf"}), "first.pdf");
  const shortResponse = await fetch(addr + "/merge-pdfs", {method:"POST",body:shortForm});
  assert.equal(shortResponse.status,400);
  assert.match((await shortResponse.json()).message, /between 2 and 5/);

  const invalid = new FormData();
  invalid.append("pdfs",new Blob([Buffer.from('not a pdf')],{type:"application/pdf"}),"bad.pdf");
  invalid.append("pdfs",new Blob([two],{type:"application/pdf"}),"second.pdf");
  const invalidRes = await fetch(addr + "/merge-pdfs", {method:"POST",body:invalid});
  assert.equal(invalidRes.status,400);
  assert.match((await invalidRes.json()).message, /not a valid PDF/);

  const badExtension = new FormData();
  badExtension.append("pdfs",new Blob([one],{type:"text/plain"}),"first.txt");
  badExtension.append("pdfs",new Blob([two],{type:"application/pdf"}),"second.pdf");
  const wrongExtRes = await fetch(addr + "/merge-pdfs", {method:"POST",body:badExtension});
  assert.equal(wrongExtRes.status,400);

  const form = new FormData();
  form.append("pdfs", new Blob([one],{type:"application/pdf"}), "first.pdf");
  form.append("pdfs", new Blob([two],{type:"application/pdf"}), "second.pdf");
  const mergedResponse = await fetch(addr + "/merge-pdfs", { method: "POST", body: form });
  assert.equal(mergedResponse.status, 200);
  assert.match(mergedResponse.headers.get('content-type'),/application\/pdf/);
  const output = Buffer.from(await mergedResponse.arrayBuffer());
  assert.ok(output.subarray(0,5).equals(Buffer.from('%PDF-')));
  assert.ok(output.length>500);
  const h = await fetch(addr + "/get-history");
  const entries = await h.json();
  assert.equal(entries.length, 1);
  assert.deepEqual(entries[0].originalFiles, ['first.pdf','second.pdf']);
  assert.match(entries[0].downloadUrl, /^\/download\/[a-f0-9-]+$/);
  const repeatedDownload = await fetch(addr + entries[0].downloadUrl);
  assert.equal(repeatedDownload.status, 200);
  assert.deepEqual(Buffer.from(await repeatedDownload.arrayBuffer()),output);
  assert.equal((await fetch(addr + '/download/no-such-file')).status,404);

  const extraUploadFiles = fs.readdirSync(path.join(process.env.PDFALCHEMY_DATA_DIR || path.join(__dirname,'..','data'),'uploads'));
  assert.equal(extraUploadFiles.length,0);
  const savedFiles = fs.readdirSync(path.join(process.env.PDFALCHEMY_DATA_DIR || path.join(__dirname,'..','data'),'merged'));
  assert.equal(savedFiles.length,1);
  // Re-open the history store to verify file-backed persistence.
  const { createLocalHistoryStore } = require("../historyStore");
  const reloaded = createLocalHistoryStore(testDataDir);
  assert.equal((await reloaded.list()).length,1);
});
