import { generateQRCode } from './qr-generator.js';

const STORAGE_KEY = 'my-website-buttons-v1';
const grid = document.getElementById('grid');
const addBtn = document.getElementById('add-btn');
const modal = document.getElementById('modal');
const form = document.getElementById('button-form');
const cancel = document.getElementById('cancel');
const search = document.getElementById('search');
const exportBtn = document.getElementById('export');
const importBtn = document.getElementById('import');
const importFile = document.getElementById('import-file');
const qrModal = document.getElementById('qr-modal');
const qrContainer = document.getElementById('qr-container');
const closeQr = document.getElementById('close-qr');
const toggleTheme = document.getElementById('toggle-theme');
const sizeSelect = document.getElementById('size-select');
const previewToggle = document.getElementById('preview-toggle');

let state = { items: [] };
let undoStack = [];
let redoStack = [];

function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,6)}

function saveState(pushUndo=true){
  if(pushUndo) undoStack.push(JSON.stringify(state));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

const debouncedSave = debounce(()=>saveState(true), 500);

function loadState(){
  const raw = localStorage.getItem(STORAGE_KEY);
  if(raw){ state = JSON.parse(raw); }
  render();
}

function render(){
  grid.innerHTML = '';
  const filter = (search.value||'').toLowerCase();
  state.items.forEach(item=>{
    if(filter && !(item.title||'').toLowerCase().includes(filter) && !(item.tags||'').toLowerCase().includes(filter)) return;
    const el = document.createElement('div');
    el.className = 'grid__item';
    el.setAttribute('draggable','true');
    el.dataset.id = item.id;
    el.style.background = item.bgType==='color'? item.color : item.bgType==='gradient'? item.gradient : `url(${item.bgImage}) center/cover`;
    el.style.opacity = item.opacity ?? 1;
    
    const mode = item.mode === 'qr' ? '🔗 QR' : '🌐 URL';
    el.innerHTML = `
      <div style="width:100%">
        <div class="title">${escapeHtml(item.title||'Untitled')}</div>
        <div class="muted">${mode}</div>
      </div>
      <div class="actions">
        <button class="btn open" title="Open link">Open</button>
        <button class="btn edit" title="Edit button">Edit</button>
        <button class="btn delete" title="Delete button">Delete</button>
      </div>
    `;

    // events
    el.querySelector('.open').addEventListener('click', (e)=>{
      e.stopPropagation();
      if(item.mode==='qr') { openQR(item); } else { window.open(item.url,'_blank'); }
    });
    
    el.querySelector('.edit').addEventListener('click', (e)=>{
      e.stopPropagation();
      editItem(item);
    });
    
    el.querySelector('.delete').addEventListener('click', (e)=>{
      e.stopPropagation();
      if(confirm('Delete this button?')) { state.items = state.items.filter(i=>i.id!==item.id); debouncedSave(); render(); }
    });

    // drag
    el.addEventListener('dragstart', e=>{ el.classList.add('dragging'); e.dataTransfer.setData('text/plain', item.id); });
    el.addEventListener('dragend', e=>{ el.classList.remove('dragging'); });

    grid.appendChild(el);
  });
  document.getElementById('stat-total').textContent = state.items.length;
  document.getElementById('stat-qr').textContent = state.items.filter(i=>i.mode==='qr').length;
  document.getElementById('stat-urls').textContent = state.items.filter(i=>i.mode==='url').length;
}

// handle reordering
grid.addEventListener('dragover', e=>{
  e.preventDefault();
  const after = getDragAfterElement(grid, e.clientY);
  const dragging = document.querySelector('.dragging');
  if(!dragging) return;
  if(after==null) grid.appendChild(dragging); else grid.insertBefore(dragging, after);
});
grid.addEventListener('drop', e=>{
  const id = e.dataTransfer.getData('text/plain');
  const children = Array.from(grid.children).map(c=>c.dataset.id);
  state.items = children.map(cid=>state.items.find(x=>x.id===cid)).filter(Boolean);
  debouncedSave(); render();
});

function getDragAfterElement(container, y){
  const draggableElements = [...container.querySelectorAll('.grid__item:not(.dragging)')];
  return draggableElements.reduce((closest, child)=>{
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height/2;
    if(offset<0 && offset>closest.offset) return {offset, element:child}; else return closest;
  }, {offset:-Infinity}).element;
}

// UI actions
addBtn.addEventListener('click', ()=>openForm());
cancel.addEventListener('click', ()=>closeForm());
form.addEventListener('submit', e=>{
  e.preventDefault();
  const data = new FormData(form);
  const itemId = form.dataset.editId;
  const item = {
    id: itemId || uid(),
    title: data.get('title'),
    url: data.get('url'),
    mode: data.get('mode')||'url',
    icon: data.get('icon')||'',
    bgType: data.get('bgType')||'color',
    color: data.get('color')||'#1f73e8',
    gradient: data.get('gradient'),
    bgImage: data.get('bgImage'),
    opacity: parseFloat(data.get('opacity')||1),
    tags: data.get('tags')||''
  };
  
  if(itemId){
    const idx = state.items.findIndex(i=>i.id===itemId);
    if(idx>=0) state.items[idx] = item;
  } else {
    state.items.unshift(item);
  }
  debouncedSave(); closeForm(); render();
});

function openForm(item=null){ 
  if(item){
    document.getElementById('form-title').textContent = 'Edit Button';
    form.dataset.editId = item.id;
    form.elements.title.value = item.title || '';
    form.elements.url.value = item.url || '';
    form.elements.mode.value = item.mode || 'url';
    form.elements.icon.value = item.icon || '';
    form.elements.bgType.value = item.bgType || 'color';
    form.elements.color.value = item.color || '#1f73e8';
    form.elements.gradient.value = item.gradient || '';
    form.elements.bgImage.value = item.bgImage || '';
    form.elements.opacity.value = item.opacity || 1;
    form.elements.tags.value = item.tags || '';
  } else {
    document.getElementById('form-title').textContent = 'Create New Button';
    form.dataset.editId = '';
    form.reset();
  }
  modal.hidden = false; modal.style.display='flex'; 
}

function editItem(item){ openForm(item); }

function closeForm(){ modal.hidden = true; modal.style.display='none'; form.dataset.editId = ''; }

function openQR(item){ qrModal.hidden = false; qrContainer.innerHTML=''; generateQRCode(qrContainer, item.url||item.title, {size:240}); }
closeQr.addEventListener('click', ()=>{ qrModal.hidden=true; qrContainer.innerHTML=''; });

exportBtn.addEventListener('click', ()=>{
  const blob = new Blob([JSON.stringify(state, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download='buttons.json'; a.click(); URL.revokeObjectURL(url);
});
importBtn.addEventListener('click', ()=>importFile.click());
importFile.addEventListener('change', e=>{
  const f = e.target.files[0]; if(!f) return; const reader = new FileReader(); reader.onload = ()=>{ try{ state = JSON.parse(reader.result); saveState(true); render(); }catch(err){ alert('Invalid JSON'); } }; reader.readAsText(f);
});

search.addEventListener('input', ()=>render());

toggleTheme.addEventListener('click', ()=>{
  document.documentElement.classList.toggle('light');
});

sizeSelect.addEventListener('change', ()=>{
  grid.classList.toggle('grid--small', sizeSelect.value==='small');
  grid.classList.toggle('grid--large', sizeSelect.value==='large');
});

previewToggle.addEventListener('change', ()=>{
  document.querySelectorAll('.grid__item').forEach(i=> i.classList.toggle('preview', previewToggle.checked));
});

// keyboard shortcuts
window.addEventListener('keydown', e=>{
  if((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==='s'){ e.preventDefault(); saveState(); alert('Saved'); }
  if((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==='z'){ e.preventDefault(); undo(); }
  if((e.ctrlKey||e.metaKey) && (e.key.toLowerCase()==='y')){ e.preventDefault(); redo(); }
});

function undo(){ if(!undoStack.length) return; redoStack.push(JSON.stringify(state)); state = JSON.parse(undoStack.pop()); saveState(false); render(); }
function redo(){ if(!redoStack.length) return; undoStack.push(JSON.stringify(state)); state = JSON.parse(redoStack.pop()); saveState(false); render(); }

// utilities
function debounce(fn, ms=200){ let t; return (...args)=>{ clearTimeout(t); t=setTimeout(()=>fn.apply(this,args), ms); }; }
function escapeHtml(s=''){ return String(s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]); }

// shareable link
function encodeStateToHash(){ const data = btoa(unescape(encodeURIComponent(JSON.stringify(state)))); location.hash = data; }
function loadFromHash(){ if(location.hash.length<2) return; try{ const raw = decodeURIComponent(escape(atob(location.hash.slice(1)))); state = JSON.parse(raw); saveState(true); render(); }catch(e){} }

// service worker registration (PWA)
if('serviceWorker' in navigator){ navigator.serviceWorker.register('service-worker.js').catch(()=>{}); }

// init
loadFromHash(); loadState();
