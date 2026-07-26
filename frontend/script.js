const API = "/api";
let transactions = [],
  categories = [];
const $ = (s) => document.querySelector(s),
  fmt = (n) =>
    "Rp" +
    new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(n || 0),
  date = (v) =>
    new Date(v + "T00:00:00").toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
  today = new Date().toISOString().slice(0, 10);
async function api(path, opt) {
  const r = await fetch(API + path, opt);
  if (!r.ok) throw Error((await r.json()).error || "Terjadi kesalahan");
  return r.json();
}
function toast(s) {
  const t = $("#toast");
  t.textContent = s;
  t.classList.add("show-toast");
  setTimeout(() => t.classList.remove("show-toast"), 2600);
}
function txRow(t, table = false) {
  let amount = `${t.type === "income" ? "+" : "−"} ${fmt(t.amount)}`;
  if (table)
    return `<div class="table-row"><div class="table-title"><span class="tx-icon">${t.icon || "🏷️"}</span><div><b>${t.title}</b><small>${t.category || "Tanpa kategori"}</small></div></div><span class="badge ${t.type}">${t.type === "income" ? "Pemasukan" : "Pengeluaran"}</span><span>${date(t.date)}</span><strong class="amount ${t.type}">${amount}</strong><button class="delete" onclick="removeTx(${t.id})">×</button></div>`;
  return `<div class="transaction-row"><span class="tx-icon">${t.icon || "🏷️"}</span><div class="tx-info"><b>${t.title}</b><small>${t.category || "Tanpa kategori"} · ${date(t.date)}</small></div><strong class="amount ${t.type}">${amount}</strong></div>`;
}
function render() {
  let inc = transactions
      .filter((x) => x.type === "income")
      .reduce((a, x) => a + +x.amount, 0),
    exp = transactions
      .filter((x) => x.type === "expense")
      .reduce((a, x) => a + +x.amount, 0);
  $("#balance").textContent = fmt(inc - exp);
  $("#income").textContent = fmt(inc);
  $("#expense").textContent = fmt(exp);
  $("#balanceNote").textContent = transactions.length
    ? `${transactions.length} transaksi tercatat`
    : "Siap mencatat keuanganmu";
  $("#incomeNote").textContent = inc
    ? `${fmt(inc)} total pemasukan`
    : "Belum ada data";
  $("#expenseNote").textContent = exp
    ? `${fmt(exp)} total pengeluaran`
    : "Belum ada data";
  $("#recentTransactions").innerHTML =
    transactions
      .slice(0, 5)
      .map((x) => txRow(x))
      .join("") ||
    '<div class="empty">Belum ada transaksi. Tambahkan transaksi pertama Anda.</div>';
  renderTable();
  renderCategories();
  renderChart();
  let expenses = {};
  transactions
    .filter((x) => x.type === "expense")
    .forEach(
      (x) =>
        (expenses[x.category || "Tanpa kategori"] =
          (expenses[x.category || "Tanpa kategori"] || 0) + +x.amount),
    );
  let top = Object.entries(expenses)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5),
    max = top[0]?.[1] || 1;
  $("#topCategories").innerHTML =
    top
      .map(
        ([n, v]) =>
          `<div class="category-item"><span class="cat-icon">${categories.find((c) => c.name === n)?.icon || "🏷️"}</span><div class="cat-info"><b>${n}</b><small>${fmt(v)}</small><div class="progress"><i style="width:${(v / max) * 100}%"></i></div></div><strong>${Math.round((v / exp) * 100) || 0}%</strong></div>`,
      )
      .join("") || '<div class="empty">Belum ada pengeluaran.</div>';
}
function renderTable() {
  let q = $("#search").value.toLowerCase(),
    type = $("#typeFilter").value,
    items = transactions.filter(
      (t) =>
        (!type || t.type === type) &&
        `${t.title} ${t.category || ""}`.toLowerCase().includes(q),
    );
  $("#transactionTable").innerHTML =
    `<div class="table-head"><span>Transaksi</span><span>Tipe</span><span>Tanggal</span><span>Jumlah</span><span></span></div>` +
    (items.map((t) => txRow(t, true)).join("") ||
      '<div class="empty">Transaksi tidak ditemukan.</div>');
}
function renderCategories() {
  $("#categoriesList").innerHTML = categories
    .map(
      (c) =>
        `<div class="category-card"><span class="cat-icon">${c.icon}</span><div><b>${c.name}</b><small>${c.type === "income" ? "Pemasukan" : "Pengeluaran"}</small></div><button class="delete" onclick="removeCat(${c.id})">×</button></div>`,
    )
    .join("");
}
function renderChart() {
  let days = Array(7)
      .fill(0)
      .map(() => ({ i: 0, e: 0 })),
    now = new Date();
  transactions.forEach((t) => {
    let d = new Date(t.date + "T00:00:00"),
      diff = Math.floor((now - d) / 86400000);
    if (diff >= 0 && diff < 7)
      days[6 - diff][t.type === "income" ? "i" : "e"] += +t.amount;
  });
  let max = Math.max(...days.flatMap((x) => [x.i, x.e]), 1);
  $("#chartBars").innerHTML = days
    .map(
      (x) =>
        `<div class="daybar"><i class="bar income" style="height:${Math.max((x.i / max) * 100, x.i ? 3 : 0)}%"></i><i class="bar expense" style="height:${Math.max((x.e / max) * 100, x.e ? 3 : 0)}%"></i></div>`,
    )
    .join("");
}
async function load() {
  try {
    [transactions, categories] = await Promise.all([
      api("/transactions"),
      api("/categories"),
    ]);
    let options = categories
      .map(
        (c) =>
          `<option value="${c.id}" data-type="${c.type}">${c.icon} ${c.name}</option>`,
      )
      .join("");
    $("#categorySelect").innerHTML = options;
    render();
  } catch (e) {
    toast("Server belum tersambung. Jalankan backend.");
  }
}
window.removeTx = async (id) => {
  if (confirm("Hapus transaksi ini?")) {
    await api("/transactions/" + id, { method: "DELETE" });
    toast("Transaksi dihapus");
    load();
  }
};
window.removeCat = async (id) => {
  if (confirm("Hapus kategori ini?")) {
    await api("/categories/" + id, { method: "DELETE" });
    toast("Kategori dihapus");
    load();
  }
};
function show(id) {
  $(id).classList.add("show");
}
function hide(id) {
  $(id).classList.remove("show");
}
$("#openModal").onclick = () => show("#modal");
$("#closeModal").onclick = () => hide("#modal");
$("#addCategory").onclick = () => show("#categoryModal");
$("#closeCategoryModal").onclick = () => hide("#categoryModal");
document.querySelectorAll(".modal").forEach(
  (m) =>
    (m.onclick = (e) => {
      if (e.target === m) hide("#" + m.id);
    }),
);
document
  .querySelectorAll("nav button")
  .forEach((b) => (b.onclick = () => go(b.dataset.page)));
document
  .querySelectorAll("[data-go]")
  .forEach((b) => (b.onclick = () => go(b.dataset.go)));
function go(p) {
  document
    .querySelectorAll(".page,nav button")
    .forEach((x) => x.classList.remove("active"));
  $("#" + p).classList.add("active");
  document
    .querySelector(`nav button[data-page="${p}"]`)
    .classList.add("active");
  $("#pageTitle").textContent = {
    overview: "Ringkasan Keuangan",
    transactions: "Transaksi",
    categories: "Kategori",
  }[p];
}
$("#transactionForm").onsubmit = async (e) => {
  e.preventDefault();
  let d = Object.fromEntries(new FormData(e.target));
  try {
    await api("/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(d),
    });
    hide("#modal");
    e.target.reset();
    $("#transactionForm [name=date]").value = today;
    toast("Transaksi berhasil disimpan");
    load();
  } catch (x) {
    toast(x.message);
  }
};
$("#categoryForm").onsubmit = async (e) => {
  e.preventDefault();
  let d = Object.fromEntries(new FormData(e.target));
  try {
    await api("/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(d),
    });
    hide("#categoryModal");
    e.target.reset();
    toast("Kategori berhasil ditambahkan");
    load();
  } catch (x) {
    toast(x.message);
  }
};
$("#typeFilter").onchange = renderTable;
$("#search").oninput = renderTable;
$("#transactionForm [name=date]").value = today;
load();
