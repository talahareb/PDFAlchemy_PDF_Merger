'use strict';

const input = document.getElementById('file-input');
const dropZone = document.getElementById('drop-zone');
const filePanel = document.getElementById('file-panel');
const fileList = document.getElementById('file-list');
const fileCount = document.getElementById('file-count');
const mergeButton = document.getElementById('merge-button');
const clearButton = document.getElementById('clear-button');
const statusEl = document.getElementById('status');
const MAX_FILES = 5;
const MAX_SIZE = 10 * 1024 * 1024;
let selectedFiles = [];
let busy = false;

function setStatus(message, kind = '') {
  statusEl.textContent = message;
  statusEl.className = `status ${kind}`;
}

function checkFiles(files) {
  if (files.length < 2 || files.length > MAX_FILES) return 'Choose between 2 and 5 PDF files.';
  if (files.some((file) => !file.name.toLowerCase().endsWith('.pdf'))) return 'Only PDF files are supported.';
  if (files.some((file) => file.size > MAX_SIZE)) return 'Each PDF must be 10 MB or smaller.';
  return null;
}

function renderFiles() {
  fileList.replaceChildren();
  filePanel.hidden = selectedFiles.length === 0;
  clearButton.hidden = selectedFiles.length === 0;
  fileCount.textContent = `${selectedFiles.length} file${selectedFiles.length === 1 ? '' : 's'}`;

  selectedFiles.forEach((file, index) => {
    const row = document.createElement('li');
    row.className = 'file-row';
    const badge = document.createElement('span');
    badge.className = 'file-index';
    badge.textContent = `${index + 1}`;
    const info = document.createElement('div');
    info.className = 'file-info';
    const name = document.createElement('div');
    name.className = 'file-name';
    name.textContent = file.name;
    const size = document.createElement('div');
    size.className = 'file-size';
    size.textContent = `${(file.size / 1024 / 1024).toFixed(2)} MB`;
    info.append(name, size);

    const controls = document.createElement('div');
    controls.className = 'file-controls';
    for (const [symbol, label, delta] of [['↑', 'Move up', -1], ['↓', 'Move down', 1]]) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = symbol;
      button.title = `${label}: ${file.name}`;
      button.setAttribute('aria-label', `${label}: ${file.name}`);
      button.disabled = busy || index + delta < 0 || index + delta >= selectedFiles.length;
      button.addEventListener('click', () => {
        const nextIndex = index + delta;
        [selectedFiles[index], selectedFiles[nextIndex]] = [selectedFiles[nextIndex], selectedFiles[index]];
        renderFiles();
      });
      controls.append(button);
    }
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.textContent = '×';
    remove.title = `Remove ${file.name}`;
    remove.setAttribute('aria-label', `Remove ${file.name}`);
    remove.disabled = busy;
    remove.addEventListener('click', () => {
      selectedFiles.splice(index, 1);
      renderFiles();
    });
    controls.append(remove);
    row.append(badge, info, controls);
    fileList.append(row);
  });

  const error = selectedFiles.length > 0 ? checkFiles(selectedFiles) : null;
  mergeButton.disabled = busy || Boolean(error) || selectedFiles.length === 0;
  if (!busy) setStatus(error || (selectedFiles.length ? 'Ready to merge.' : ''));
}

function useFiles(files) {
  if (busy) return;
  selectedFiles = Array.from(files);
  renderFiles();
}

input.addEventListener('change', () => useFiles(input.files));
clearButton.addEventListener('click', () => {
  selectedFiles = [];
  input.value = '';
  renderFiles();
});

for (const eventName of ['dragenter', 'dragover']) {
  dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropZone.classList.add('dragging');
  });
}
for (const eventName of ['dragleave', 'drop']) {
  dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropZone.classList.remove('dragging');
  });
}
dropZone.addEventListener('drop', (event) => useFiles(event.dataTransfer.files));

mergeButton.addEventListener('click', async () => {
  const error = checkFiles(selectedFiles);
  if (error || busy) return setStatus(error || 'Please try again.', 'error');

  busy = true;
  input.disabled = true;
  clearButton.disabled = true;
  renderFiles();
  setStatus('Combining your PDFs…');

  let resultMessage = '';
  let resultKind = '';
  try {
    const body = new FormData();
    for (const file of selectedFiles) body.append('pdfs', file, file.name);
    const response = await fetch('/merge-pdfs', { method: 'POST', body });
    if (!response.ok) {
      const details = await response.json().catch(() => ({}));
      throw new Error(details.error || 'Could not merge these files.');
    }

    const pdf = await response.blob();
    const url = URL.createObjectURL(pdf);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'PDFAlchemy-Merged.pdf';
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    resultMessage = 'Done! Your merged PDF has been downloaded.';
    resultKind = 'success';
  } catch (mergeError) {
    resultMessage = mergeError.message || 'Something went wrong.';
    resultKind = 'error';
  } finally {
    busy = false;
    input.disabled = false;
    clearButton.disabled = false;
    renderFiles();
    setStatus(resultMessage, resultKind);
  }
});
