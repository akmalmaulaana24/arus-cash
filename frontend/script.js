 
const STORAGE_TX = 'aruscash_tx_v1';
const STORAGE_CAT = 'aruscash_cat_v1';

// ---------- Data helpers ----------
const load = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
};
const save = (key, val) => localStorage.setItem(key, JSON.stringify(val));

// Seed kategori default kalau belum ada
const defaultCategories = [
  { id: 'c1', name: 'Makanan',      type: 'expense', icon: '🍔' },
  { id: 'c2', name: 'Transportasi', type: 'expense', icon: '🚗' },
  { id: 'c3', name: 'Belanja',      type: 'expense', icon: '🛍️' },
  { id: 'c4', name: 'Tagihan',      type: 'expense', icon: '🧾' },
  { id: 'c5', name: 'Gaji',         type: 'income',  icon: '💼' },
  { id: 'c6', name: 'Bonus',        type: 'income',  icon: '🎁' },
];

let transactions = load(STORAGE_TX, []);
let categories   = load(STORAGE_CAT, null);
if (!categories) { categories = defaultCategories; save(STORAGE_CAT, categories); }

const uid = () => Math.random().toString(36).slice(2, 10);
const fmtRp = n => 'Rp' + (n || 0).toLocaleString('id-ID');
const fmtDate = iso => {
  const d = new Date(iso);
  return d.toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' });
};

// ---------- Navigation ----------
document.querySelectorAll('nav button, [data-go]').forEach(btn => {
  btn.addEventListener('click', () => {
    const target = btn.dataset.page || btn.dataset.go;
    if (!target) return;
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(target)?.classList.add('active');
    document.querySelectorAll('nav button').forEach(b => b.classList.remove('active'));
    const navBtn = document.querySelector(`nav button[data-page="${target}"]`);
    if (navBtn) navBtn.classList.add('active');

    const titles = { overview:'Dashboard Arus Cash', transactions:'Semua Transaksi', categories:'Kategori' };
    document.getElementById('pageTitle').textContent = titles[target] || 'Arus Cash';

    if (target === 'transactions') renderTransactions();
    if (target === 'categories')   renderCategories();
  });
});

// ---------- Modal handling ----------
const modal = document.getElementById('modal');
const catModal = document.getElementById('categoryModal');

const openModal  = () => { populateCategorySelect(); setDefaultDate(); modal.classList.add('open'); };
const closeModal = () => { modal.classList.remove('open'); document.getElementById('transactionForm').reset(); document.getElementById('expenseRadio').checked = true; };
document.getElementById('openModal').addEventListener('click', openModal);
document.getElementById('closeModal').addEventListener('click', closeModal);
modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });

document.getElementById('addCategory').addEventListener('click', () => catModal.classList.add('open'));
document.getElementById('closeCategoryModal').addEventListener('click', () => catModal.classList.remove('open'));
catModal.addEventListener('click', e => { if (e.target === catModal) catModal.classList.remove('open'); });

function setDefaultDate() {
  const d = document.querySelector('#transactionForm input[name="date"]');
  if (d && !d.value) d.value = new Date().toISOString().slice(0,10);
}

function populateCategorySelect() {
  const sel = document.getElementById('categorySelect');
  const type = document.querySelector('input[name="type"]:checked').value;
  sel.innerHTML = '';
  const list = categories.filter(c => c.type === type);
  if (list.length === 0) {
    sel.innerHTML = '<option value="">(belum ada kategori)</option>';
    return;
  }
  list.forEach(c => {
    const o = document.createElement('option');
    o.value = c.id; o.textContent = `${c.icon}  ${c.name}`;
    sel.appendChild(o);
  });
}
document.querySelectorAll('input[name="type"]').forEach(r =>
  r.addEventListener('change', populateCategorySelect)
);

// ---------- Submit transaksi ----------
document.getElementById('transactionForm').addEventListener('submit', e => {
  e.preventDefault();
  const f = e.target;
  const tx = {
    id: uid(),
    type: f.type.value,
    title: f.title.value.trim(),
    category_id: f.category_id.value,
    amount: Number(f.amount.value),
    date: f.date.value,
  };
  if (!tx.title || !tx.category_id || !tx.amount || !tx.date) {
    toast('Lengkapi semua data transaksi');
    return;
  }
  transactions.unshift(tx);
  save(STORAGE_TX, transactions);
  toast('✓ Transaksi berhasil disimpan');
  closeModal();
  renderAll();
});

// ---------- Submit kategori ----------
document.getElementById('categoryForm').addEventListener('submit', e => {
  e.preventDefault();
  const f = e.target;
  const cat = {
    id: uid(),
    name: f.name.value.trim(),
    type: f.type.value,
    icon: f.icon.value.trim() || '🏷️',
  };
  if (!cat.name) { toast('Nama kategori wajib diisi'); return; }
  categories.push(cat);
  save(STORAGE_CAT, categories);
  toast('✓ Kategori berhasil ditambah');
  f.reset(); f.icon.value = '🏷️';
  catModal.classList.remove('open');
  renderCategories();
});

// ---------- Rendering ----------
function getCategory(id) { return categories.find(c => c.id === id) || { name:'Tanpa kategori', icon:'📌' }; }

function renderSummary() {
  const now = new Date();
  const monthTx = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const inc = monthTx.filter(t => t.type === 'income').reduce((s,t) => s + t.amount, 0);
  const exp = monthTx.filter(t => t.type === 'expense').reduce((s,t) => s + t.amount, 0);
  const bal = transactions.reduce((s,t) => s + (t.type === 'income' ? t.amount : -t.amount), 0);

  document.getElementById('balance').textContent = fmtRp(bal);
  document.getElementById('income').textContent  = fmtRp(inc);
  document.getElementById('expense').textContent = fmtRp(exp);
  document.getElementById('balanceNote').textContent = bal >= 0 ? 'Saldo Anda sehat 👍' : 'Saldo Anda minus, perhatikan pengeluaran';
  document.getElementById('incomeNote').textContent  = inc ? `${monthTx.filter(t=>t.type==='income').length} transaksi` : 'Belum ada data';
  document.getElementById('expenseNote').textContent = exp ? `${monthTx.filter(t=>t.type==='expense').length} transaksi` : 'Belum ada data';
}

function renderChart() {
  // 7 hari terakhir
  const days = [];
  const labels = ['Min','Sen','Sel','Rab','Kam','Jum','Sab'];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0,0,0,0);
    days.push(d);
  }
  const agg = days.map(d => {
    const iso = d.toISOString().slice(0,10);
    const day = transactions.filter(t => t.date === iso);
    return {
      label: labels[d.getDay()],
      inc: day.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0),
      exp: day.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0),
    };
  });
  const max = Math.max(1, ...agg.flatMap(d => [d.inc, d.exp]));

  // Y labels
  const fmt = v => v >= 1_000_000 ? (v/1_000_000).toFixed(v%1_000_000?1:0)+'jt' : v >= 1000 ? Math.round(v/1000)+'rb' : String(v);
  document.getElementById('y4').textContent = fmt(max);
  document.getElementById('y3').textContent = fmt(max*0.75);
  document.getElementById('y2').textContent = fmt(max*0.5);
  document.getElementById('y1').textContent = fmt(max*0.25);

  const bars = document.getElementById('chartBars');
  const xAxis = document.getElementById('xAxis');
  bars.innerHTML = '';
  xAxis.innerHTML = '';
  agg.forEach(d => {
    const g = document.createElement('div');
    g.className = 'bar-group';
    g.innerHTML = `
      <div class="bar inc" style="height:${(d.inc/max)*100}%;" title="Pemasukan ${fmtRp(d.inc)}"></div>
      <div class="bar exp" style="height:${(d.exp/max)*100}%;" title="Pengeluaran ${fmtRp(d.exp)}"></div>
    `;
    bars.appendChild(g);
    const s = document.createElement('span'); s.textContent = d.label; xAxis.appendChild(s);
  });
}

function renderTopCategories() {
  const now = new Date();
  const monthExp = transactions.filter(t => {
    const d = new Date(t.date);
    return t.type === 'expense' && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const byCat = {};
  monthExp.forEach(t => { byCat[t.category_id] = (byCat[t.category_id]||0) + t.amount; });
  const sorted = Object.entries(byCat).sort((a,b)=>b[1]-a[1]).slice(0,5);
  const el = document.getElementById('topCategories');
  if (sorted.length === 0) { el.innerHTML = '<div class="empty">Belum ada pengeluaran.</div>'; return; }
  const top = sorted[0][1];
  el.innerHTML = sorted.map(([cid, amt]) => {
    const c = getCategory(cid);
    const pct = (amt/top)*100;
    return `
      <div class="cat-row">
        <div class="cat-ico">${c.icon}</div>
        <div class="info">
          <b>${c.name}</b>
          <div class="bar-bg"><div class="bar-fill" style="width:${pct}%"></div></div>
        </div>
        <div class="amt">${fmtRp(amt)}</div>
      </div>`;
  }).join('');
}

function txRowHtml(t) {
  const c = getCategory(t.category_id);
  const cls = t.type === 'income' ? 'inc' : 'exp';
  const sign = t.type === 'income' ? '+' : '-';
  return `
    <div class="tx-row">
      <div class="tx-ico">${c.icon}</div>
      <div class="tx-info">
        <b>${escapeHtml(t.title)}</b>
        <small>${c.name} • ${fmtDate(t.date)}</small>
      </div>
      <div class="tx-amt ${cls}">${sign}${fmtRp(t.amount)}</div>
      <button class="tx-del" data-del="${t.id}" title="Hapus">🗑</button>
    </div>`;
}

function renderRecent() {
  const el = document.getElementById('recentTransactions');
  if (transactions.length === 0) { el.innerHTML = '<div class="empty">Belum ada transaksi. Klik "＋ Tambah Transaksi" untuk memulai.</div>'; return; }
  el.innerHTML = transactions.slice(0,5).map(txRowHtml).join('');
  el.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', () => deleteTx(b.dataset.del)));
}

function renderTransactions() {
  const type = document.getElementById('typeFilter').value;
  const q = document.getElementById('search').value.toLowerCase().trim();
  let list = transactions.slice();
  if (type) list = list.filter(t => t.type === type);
  if (q) list = list.filter(t => t.title.toLowerCase().includes(q) || getCategory(t.category_id).name.toLowerCase().includes(q));
  const el = document.getElementById('transactionTable');
  if (list.length === 0) { el.innerHTML = '<div class="empty">Tidak ada transaksi.</div>'; return; }
  el.innerHTML = list.map(txRowHtml).join('');
  el.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', () => deleteTx(b.dataset.del)));
}
document.getElementById('typeFilter').addEventListener('change', renderTransactions);
document.getElementById('search').addEventListener('input', renderTransactions);

function renderCategories() {
  const el = document.getElementById('categoriesList');
  if (categories.length === 0) { el.innerHTML = '<div class="empty">Belum ada kategori.</div>'; return; }
  el.innerHTML = categories.map(c => `
    <div class="cat-card">
      <div class="ico">${c.icon}</div>
      <div class="meta">
        <b>${escapeHtml(c.name)}</b>
        <small>${c.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}</small>
      </div>
      <button class="del" data-delcat="${c.id}" title="Hapus">🗑</button>
    </div>
  `).join('');
  el.querySelectorAll('[data-delcat]').forEach(b => b.addEventListener('click', () => deleteCat(b.dataset.delcat)));
}

// ---------- CRUD ops ----------
function deleteTx(id) {
  if (!confirm('Hapus transaksi ini?')) return;
  transactions = transactions.filter(t => t.id !== id);
  save(STORAGE_TX, transactions);
  renderAll();
  toast('Transaksi dihapus');
}
function deleteCat(id) {
  const used = transactions.some(t => t.category_id === id);
  if (used) { toast('Kategori masih dipakai transaksi'); return; }
  if (!confirm('Hapus kategori ini?')) return;
  categories = categories.filter(c => c.id !== id);
  save(STORAGE_CAT, categories);
  renderCategories();
  toast('Kategori dihapus');
}

// ---------- Utils ----------
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}
let toastTimer;
function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
}

function renderAll() {
  renderSummary();
  renderChart();
  renderTopCategories();
  renderRecent();
  if (document.getElementById('transactions').classList.contains('active')) renderTransactions();
  if (document.getElementById('categories').classList.contains('active'))   renderCategories();
}

// Date di header
(function(){
  const d = new Date();
  const opts = { weekday:'long', day:'2-digit', month:'long', year:'numeric' };
  document.getElementById('dateTitle').textContent = d.toLocaleDateString('id-ID', opts).toUpperCase();
})();

renderAll();
