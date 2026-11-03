'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { PDFDocument } = require('pdf-lib');
const app = require('../app');

async function examplePdf(pageCount = 1) {
  const pdf = await PDFDocument.create();
  for (let i = 0; i < pageCount; i++) {
    pdf.addPage([400 + i, 600]);
  }
  return Buffer.from(await pdf.save());
}

async function withServer(callback) {
  const server = await new Promise((resolve) => {
    const instance = app.listen(0, '127.0.0.1', () => resolve(instance));
  });
  try {
    return await callback(`http://127.0.0.1:${server.address().port}`);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
}

function appendPdf(form, name, data) {
  form.append('pdfs', new Blob([data], { type: 'application/pdf' }), name);
}

test('returns a web page', async () => {
  await withServer(async (base) => {
    const response = await fetch(base);
    assert.equal(response.status, 200);
    assert.match(await response.text(), /PDFAlchemy/);
  });
});

test('merges pages in the selected file order', async () => {
  await withServer(async (base) => {
    const data = new FormData();
    appendPdf(data, 'first.pdf', await examplePdf(2));
    appendPdf(data, 'second.pdf', await examplePdf(3));
    const response = await fetch(`${base}/merge-pdfs`, { method: 'POST', body: data });
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type'), /application\/pdf/);
    assert.match(response.headers.get('content-disposition'), /attachment/);
    const merged = await PDFDocument.load(await response.arrayBuffer());
    assert.equal(merged.getPageCount(), 5);
    assert.deepEqual(merged.getPages().map((page) => page.getWidth()), [400, 401, 400, 401, 402]);
  });
});

test('rejects fewer than two PDF files', async () => {
  await withServer(async (base) => {
    const data = new FormData();
    appendPdf(data, 'one.pdf', await examplePdf(1));
    const response = await fetch(`${base}/merge-pdfs`, { method: 'POST', body: data });
    assert.equal(response.status, 400);
  });
});

test('rejects non-PDF file extensions', async () => {
  await withServer(async (base) => {
    const data = new FormData();
    appendPdf(data, 'one.pdf', await examplePdf(1));
    data.append('pdfs', new Blob(['hello'], { type: 'text/plain' }), 'bad.txt');
    const response = await fetch(`${base}/merge-pdfs`, { method: 'POST', body: data });
    assert.equal(response.status, 400);
  });
});

test('rejects corrupt PDFs even with a PDF filename', async () => {
  await withServer(async (base) => {
    const data = new FormData();
    appendPdf(data, 'good.pdf', await examplePdf(1));
    appendPdf(data, 'broken.pdf', Buffer.from('%PDF-this is not a real PDF'));
    const response = await fetch(`${base}/merge-pdfs`, { method: 'POST', body: data });
    assert.equal(response.status, 422);
  });
});

test('limits the number of PDFs to five', async () => {
  await withServer(async (base) => {
    const data = new FormData();
    const pdf = await examplePdf(1);
    for (let i = 0; i < 6; i++) appendPdf(data, `file-${i}.pdf`, pdf);
    const response = await fetch(`${base}/merge-pdfs`, { method: 'POST', body: data });
    assert.equal(response.status, 413);
  });
});
