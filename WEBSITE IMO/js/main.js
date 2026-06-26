import { generateQRCode } from './qr-generator.js';

// ========================================
// STATE
// ========================================
const STORAGE_KEY = 'my-website-buttons-v1';
const grid = document.getElementById('grid');
const addBtn = document.getElementById('add-btn');
const modal = document.getElementById('modal');
const form = document.getElementById('button-form');
const cancelBtn = document.getElementById('cancel-btn');
const search = document.getElementById('search');
const exportBtn = document.getElementById('export-btn');
const importBtn = document.getElementById('import-btn');
const importFile = document.getElementById('import-file');
const qrModal = document.getElementById('qr-modal');
const qrContainer = document.getElementById('qr-container');
const closeQr = document.getElementById('close-qr');
const sizeSelect = document.getElementById('size-select');
const undoBtn = document.getElementById('undo-btn');
const redoBtn = document.getElementById('redo-btn');

let state = { items: [] };
let undoStack = [];
let redoStack = [];

// ========================================
// UTILITY FUNCTIONS
// ========================================
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function debounce(fn, ms = 200) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), ms);
  };
}

function escapeHtml(s = '') {
  return String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[c]);
}

function showToast(message, isSuccess = true) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.style.borderColor = isSuccess ? '#00ffc8' : '#ef4444';
  toast.classList.add('show');
  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// ========================================
// STATE MANAGEMENT
// ========================================
function saveState(pushUndo = true) {
  if (pushUndo) undoStack.push(JSON.stringify(state));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  updateStats();
}

const debouncedSave = debounce(() => saveState(true), 500);

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      state = JSON.parse(raw);
    } catch (e) {
      state = { items: [] };
    }
  }
  render();
  updateStats();
}

function updateStats() {
  document.getElementById('stat-total').textContent = state.items.length;
  document.getElementById('stat-urls').textContent = state.items.filter(i => i.mode === 'url').length;
  document.getElementById('stat-qr').textContent = state.items.filter(i => i.mode === 'qr').length;
}

// ========================================
// RENDER
// ========================================
function render() {
  const filter = (search.value || '').toLowerCase();
  const filtered = state.items.filter(item => {
    if (!filter) return true;
    return (item.title || '').toLowerCase().includes(filter) ||
      (item.tags || '').toLowerCase().includes(filter);
  });

  grid.innerHTML = '';

  if (filtered.length === 0) {
    document.getElementById('empty-state').classList.remove('hidden');
  } else {
    document.getElementById('empty-state').classList.add('hidden');
  }

  filtered.forEach(item => {
    const el = document.createElement('div');
    el.className = 'grid__item';
    el.setAttribute('draggable', 'true');
    el.dataset.id = item.id;

    // Background
    if (item.bgType === 'color' && item.color) {
      el.style.background = item.color;
    } else if (item.bgType === 'gradient' && item.gradient) {
      el.style.background = item.gradient;
    } else if (item.bgType === 'image' && item.bgImage) {
      el.style.background = `url(${item.bgImage}) center/cover`;
    } else {
      el.style.background = '#1a1f2e';
    }
    el.style.opacity = item.opacity ?? 1;

    const mode = item.mode === 'qr' ? '🔗 QR' : '🌐 URL';
    const icon = item.icon || (item.mode === 'qr' ? '🔲' : '🔗');

    el.innerHTML = `
      <div style="width:100%; display:flex; align-items:center; gap:8px;">
        <span style="font-size:20px;">${icon}</span>
        <div>
          <div class="title">${escapeHtml(item.title || 'Untitled')}</div>
          <div class="muted">${mode}</div>
        </div>
      </div>
      <div class="actions">
        <button class="btn open" data-id="${item.id}">Open</button>
        <button class="btn edit" data-id="${item.id}">Edit</button>
        <button class="btn delete" data-id="${item.id}">Delete</button>
      </div>
    `;

    // Events
    el.querySelector('.open').addEventListener('click', (e) => {
      e.stopPropagation();
      if (item.mode === 'qr') {
        openQR(item);
      } else {
        if (item.url) window.open(item.url, '_blank');
        else showToast('No URL set', false);
      }
    });

    el.querySelector('.edit').addEventListener('click', (e) => {
      e.stopPropagation();
      openForm(item);
    });

    el.querySelector('.delete').addEventListener('click', (e) => {
      e.stopPropagation();
      if (confirm(`Delete "${item.title}"?`)) {
        state.items = state.items.filter(i => i.id !== item.id);
        debouncedSave();
        render();
        showToast(`Deleted "${item.title}"`, true);
      }
    });

    // Drag
    el.addEventListener('dragstart', e => {
      el.classList.add('dragging');
      e.dataTransfer.setData('text/plain', item.id);
    });
    el.addEventListener('dragend', e => {
      el.classList.remove('dragging');
    });

    grid.appendChild(el);
  });
}

// ========================================
// DRAG & DROP REORDER
// ========================================
grid.addEventListener('dragover', e => {
  e.preventDefault();
  const after = getDragAfterElement(grid, e.clientY);
  const dragging = document.querySelector('.dragging');
  if (!dragging) return;
  if (after == null) grid.appendChild(dragging);
  else grid.insertBefore(dragging, after);
});

grid.addEventListener('drop', e => {
  e.preventDefault();
  // Get items in current visual order
  const visualIds = [];
  grid.querySelectorAll('.grid__item').forEach(el => visualIds.push(el.dataset.id));

  state.items = visualIds.map(id => state.items.find(i => i.id === id)).filter(Boolean);
  debouncedSave();
  render();
});

function getDragAfterElement(container, y) {
  const draggableElements = [...container.querySelectorAll('.grid__item:not(.dragging)')];
  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) {
      return { offset, element: child };
    } else {
      return closest;
    }
  }, { offset: -Infinity }).element;
}

// ========================================
// FORM
// ========================================
function openForm(item = null) {
  if (item) {
    document.getElementById('form-title').textContent = '✏️ Edit Button';
    document.getElementById('edit-id').value = item.id;
    form.elements.title.value = item.title || '';
    form.elements.url.value = item.url || '';
    form.elements.mode.value = item.mode || 'url';
    form.elements.icon.value = item.icon || '';
    form.elements.bgType.value = item.bgType || 'color';
    form.elements.color.value = item.color || '#1a1f2e';
    form.elements.gradient.value = item.gradient || '';
    form.elements.bgImage.value = item.bgImage || '';
    form.elements.opacity.value = item.opacity ?? 1;
    form.elements.tags.value = item.tags || '';
  } else {
    document.getElementById('form-title').textContent = '➕ Create New Button';
    document.getElementById('edit-id').value = '';
    form.reset();
    form.elements.color.value = '#1a1f2e';
    form.elements.opacity.value = 1;
    form.elements.mode.value = 'url';
    form.elements.bgType.value = 'color';
  }
  modal.classList.add('active');
}

function closeForm() {
  modal.classList.remove('active');
}

addBtn.addEventListener('click', () => openForm());
cancelBtn.addEventListener('click', closeForm);

form.addEventListener('submit', e => {
  e.preventDefault();
  const data = new FormData(form);
  const editId = document.getElementById('edit-id').value;

  const item = {
    id: editId || uid(),
    title: data.get('title') || 'Untitled',
    url: data.get('url') || '',
    mode: data.get('mode') || 'url',
    icon: data.get('icon') || '',
    bgType: data.get('bgType') || 'color',
    color: data.get('color') || '#1a1f2e',
    gradient: data.get('gradient') || '',
    bgImage: data.get('bgImage') || '',
    opacity: parseFloat(data.get('opacity') || 1),
    tags: data.get('tags') || ''
  };

  if (editId) {
    const idx = state.items.findIndex(i => i.id === editId);
    if (idx >= 0) state.items[idx] = item;
    showToast(`Updated "${item.title}"`, true);
  } else {
    state.items.unshift(item);
    showToast(`Created "${item.title}"`, true);
  }

  debouncedSave();
  closeForm();
  render();
});

// ========================================
// QR
// ========================================
function openQR(item) {
  qrModal.classList.add('active');
  qrContainer.innerHTML = '';
  const text = item.url || item.title || 'QR Code';
  try {
    generateQRCode(qrContainer, text, { size: 240 });
  } catch (e) {
    qrContainer.innerHTML = `<p class="text-red-400">Error generating QR: ${e.message}</p>`;
  }
}

closeQr.addEventListener('click', () => {
  qrModal.classList.remove('active');
  qrContainer.innerHTML = '';
});

// Close modals on backdrop click
document.querySelectorAll('.modal').forEach(m => {
  m.addEventListener('click', e => {
    if (e.target === m) {
      m.classList.remove('active');
      if (m.id === 'qr-modal') qrContainer.innerHTML = '';
    }
  });
});

// ========================================
// EXPORT / IMPORT
// ========================================
exportBtn.addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `buttons-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Exported successfully ✅', true);
});

importBtn.addEventListener('click', () => importFile.click());
importFile.addEventListener('change', e => {
  const f = e.target.files[0];
  if (!f) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (data.items) {
        state = data;
        saveState(true);
        render();
        showToast(`Imported ${state.items.length} buttons ✅`, true);
      } else {
        showToast('Invalid format: missing "items" array', false);
      }
    } catch (err) {
      showToast('Invalid JSON file', false);
    }
  };
  reader.readAsText(f);
  importFile.value = '';
});

// ========================================
// SEARCH
// ========================================
search.addEventListener('input', () => render());

// ========================================
// SIZE
// ========================================
sizeSelect.addEventListener('change', () => {
  grid.classList.toggle('grid--small', sizeSelect.value === 'small');
  grid.classList.toggle('grid--large', sizeSelect.value === 'large');
});

// ========================================
// UNDO / REDO
// ========================================
undoBtn.addEventListener('click', undo);
redoBtn.addEventListener('click', redo);

function undo() {
  if (undoStack.length === 0) {
    showToast('Nothing to undo', false);
    return;
  }
  redoStack.push(JSON.stringify(state));
  state = JSON.parse(undoStack.pop());
  saveState(false);
  render();
  showToast('↩ Undo', true);
}

function redo() {
  if (redoStack.length === 0) {
    showToast('Nothing to redo', false);
    return;
  }
  undoStack.push(JSON.stringify(state));
  state = JSON.parse(redoStack.pop());
  saveState(false);
  render();
  showToast('↪ Redo', true);
}

// ========================================
// KEYBOARD SHORTCUTS
// ========================================
window.addEventListener('keydown', e => {
  // Ctrl+S = Save
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
    e.preventDefault();
    saveState(true);
    showToast('✅ Saved', true);
  }
  // Ctrl+Z = Undo
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
    e.preventDefault();
    undo();
  }
  // Ctrl+Y = Redo
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
    e.preventDefault();
    redo();
  }
  // Escape = Close modals
  if (e.key === 'Escape') {
    if (modal.classList.contains('active')) closeForm();
    if (qrModal.classList.contains('active')) {
      qrModal.classList.remove('active');
      qrContainer.innerHTML = '';
    }
  }
});

// ========================================
// SHAREABLE LINK (URL Hash)
// ========================================
function encodeStateToHash() {
  try {
    const data = btoa(unescape(encodeURIComponent(JSON.stringify(state))));
    location.hash = data;
  } catch (e) {
    console.warn('Failed to encode state to hash', e);
  }
}

function loadFromHash() {
  if (location.hash.length < 2) return;
  try {
    const raw = decodeURIComponent(escape(atob(location.hash.slice(1))));
    const data = JSON.parse(raw);
    if (data.items) {
      state = data;
      saveState(true);
      render();
      showToast(`Loaded ${state.items.length} buttons from share link`, true);
    }
  } catch (e) {
    console.warn('Failed to load from hash', e);
  }
}

// ========================================
// PWA SERVICE WORKER
// ========================================
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js').catch(() => {});
}

// ========================================
// INIT
// ========================================
// Check for shareable link first
if (location.hash.length > 1) {
  loadFromHash();
} else {
  loadState();
}

// Auto-save on page unload
window.addEventListener('beforeunload', () => {
  saveState(false);
});

console.log('🚀 Script Hub initialized');
console.log(`📊 ${state.items.length} buttons loaded`);
console.log('💡 Press Ctrl+S to save, Ctrl+Z to undo, Ctrl+Y to redo');
