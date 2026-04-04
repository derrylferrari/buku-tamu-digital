const SUPABASE_URL = "https://cghnjsdhaoayunaspsyi.supabase.co";
const SUPABASE_KEY = "sb_publishable_7rY6D_gGfGUVBreIZfQ_Xw_xGpb3757";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ELEMENT
const loginCard = document.getElementById("loginCard");
const adminCard = document.getElementById("adminCard");
const loginForm = document.getElementById("loginForm");
const loginBtn = document.getElementById("loginBtn");
const loginMessage = document.getElementById("loginMessage");
const adminMessage = document.getElementById("adminMessage");
const adminEmailLabel = document.getElementById("adminEmailLabel");
const guestTableBody = document.getElementById("guestTableBody");
const logoutBtn = document.getElementById("logoutBtn");
const refreshBtn = document.getElementById("refreshBtn");
const searchInput = document.getElementById("searchInput");

// TAMBAHAN BARU
const exportBtn = document.getElementById("exportBtn");
const filterBtn = document.getElementById("filterBtn");
const filterTanggal = document.getElementById("filterTanggal");
const filterInstansi = document.getElementById("filterInstansi");
const statsContainer = document.getElementById("stats");

let guestRows = [];

// ================= UTIL =================
function showMessage(el, type, text) {
  el.className = `form-message ${type}`;
  el.textContent = text;
}

function resetMessage(el) {
  el.className = "form-message";
  el.textContent = "";
}

function formatDate(dateString) {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("id-ID");
}

function formatDateTime(dateString) {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleString("id-ID");
}

// ================= TABLE =================
function renderTable(rows) {
  if (!rows.length) {
    guestTableBody.innerHTML = `
      <tr><td colspan="10">Belum ada data.</td></tr>
    `;
    return;
  }

  guestTableBody.innerHTML = rows.map((row, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${row.nama_lengkap ?? "-"}</td>
      <td>${row.instansi ?? "-"}</td>
      <td>${row.no_hp ?? "-"}</td>
      <td>${row.email ?? "-"}</td>
      <td>${row.tujuan ?? "-"}</td>
      <td>${row.keperluan ?? "-"}</td>
      <td>${formatDate(row.tanggal_kunjungan)}</td>
      <td>${formatDateTime(row.created_at)}</td>
      <td><button class="small-btn" data-id="${row.id}">Hapus</button></td>
    </tr>
  `).join("");
}

// ================= SEARCH =================
function applySearch() {
  const keyword = searchInput.value.toLowerCase();

  const filtered = guestRows.filter((row) =>
    (row.nama_lengkap || "").toLowerCase().includes(keyword) ||
    (row.instansi || "").toLowerCase().includes(keyword) ||
    (row.tujuan || "").toLowerCase().includes(keyword)
  );

  renderTable(filtered);
}

// ================= LOAD DATA =================
async function loadGuests() {
  guestTableBody.innerHTML = `<tr><td colspan="10">Memuat...</td></tr>`;

  const { data, error } = await supabaseClient
    .from("tamu")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    showMessage(adminMessage, "error", "Gagal memuat data");
    return;
  }

  guestRows = data || [];
  applySearch();
  loadStats();
}

// ================= FILTER =================
filterBtn.addEventListener("click", async () => {
  let query = supabaseClient.from("tamu").select("*");

  if (filterTanggal.value) {
    query = query.eq("tanggal_kunjungan", filterTanggal.value);
  }

  if (filterInstansi.value) {
    query = query.ilike("instansi", `%${filterInstansi.value}%`);
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) {
    showMessage(adminMessage, "error", "Filter gagal");
    return;
  }

  guestRows = data || [];
  renderTable(guestRows);
});

// ================= EXPORT EXCEL =================
exportBtn.addEventListener("click", async () => {
  const { data, error } = await supabaseClient
    .from("tamu")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    alert("Gagal export");
    return;
  }

  let csv = "No,Nama,Instansi,No HP,Email,Tujuan,Keperluan,Tanggal\n";

  data.forEach((d, i) => {
    csv += `${i+1},"${d.nama_lengkap}","${d.instansi}","${d.no_hp}","${d.email}","${d.tujuan}","${d.keperluan}","${d.tanggal_kunjungan}"\n`;
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "data_tamu.csv";
  a.click();
});

// ================= STATS =================
function loadStats() {
  const total = guestRows.length;

  const today = new Date().toISOString().split("T")[0];
  const todayCount = guestRows.filter(d => d.tanggal_kunjungan === today).length;

  const instansiMap = {};
  guestRows.forEach(d => {
    instansiMap[d.instansi] = (instansiMap[d.instansi] || 0) + 1;
  });

  const top = Object.entries(instansiMap)
    .sort((a,b) => b[1] - a[1])
    .slice(0,3);

  statsContainer.innerHTML = `
    <div class="stat-item">Total: ${total}</div>
    <div class="stat-item">Hari Ini: ${todayCount}</div>
    <div class="stat-item">
      Top Instansi:<br>
      ${top.map(i => `${i[0]} (${i[1]})`).join("<br>")}
    </div>
  `;
}

// ================= DELETE =================
guestTableBody.addEventListener("click", async (e) => {
  const btn = e.target.closest(".small-btn");
  if (!btn) return;

  if (!confirm("Hapus data ini?")) return;

  const id = btn.dataset.id;

  const { error } = await supabaseClient
    .from("tamu")
    .delete()
    .eq("id", id);

  if (error) {
    showMessage(adminMessage, "error", "Gagal hapus");
    return;
  }

  showMessage(adminMessage, "success", "Berhasil dihapus");
  loadGuests();
});

// ================= AUTH =================
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = adminEmail.value;
  const password = adminPassword.value;

  const { error } = await supabaseClient.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    showMessage(loginMessage, "error", "Login gagal");
    return;
  }

  checkSession();
});

logoutBtn.addEventListener("click", async () => {
  await supabaseClient.auth.signOut();
  location.reload();
});

async function checkSession() {
  const { data } = await supabaseClient.auth.getSession();
  const session = data.session;

  if (session) {
    loginCard.style.display = "none";
    adminCard.style.display = "block";
    adminEmailLabel.textContent = session.user.email;
    loadGuests();
  } else {
    loginCard.style.display = "block";
    adminCard.style.display = "none";
  }
}

searchInput.addEventListener("input", applySearch);
refreshBtn.addEventListener("click", loadGuests);

checkSession();
