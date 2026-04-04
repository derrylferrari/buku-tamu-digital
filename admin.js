const SUPABASE_URL = "https://cghnjsdhaoayunaspsyi.supabase.co";
const SUPABASE_KEY = "sb_publishable_7rY6D_gGfGUVBreIZfQ_Xw_xGpb3757";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

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
const resetFilterBtn = document.getElementById("resetFilterBtn");

let guestRows = [];

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

function renderTable(rows) {
  if (!rows.length) {
    guestTableBody.innerHTML = `
      <tr>
        <td colspan="10" class="empty-state">Belum ada data tamu.</td>
      </tr>
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

function applySearch() {
  const keyword = searchInput.value.trim().toLowerCase();

  const filtered = guestRows.filter((row) => {
    return (
      (row.nama_lengkap || "").toLowerCase().includes(keyword) ||
      (row.instansi || "").toLowerCase().includes(keyword) ||
      (row.tujuan || "").toLowerCase().includes(keyword)
    );
  });

  renderTable(filtered);
}

async function loadGuests() {
  resetMessage(adminMessage);
  guestTableBody.innerHTML = `
    <tr>
      <td colspan="10" class="empty-state">Memuat data...</td>
    </tr>
  `;

  const { data, error } = await supabaseClient
    .from("tamu")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    showMessage(adminMessage, "error", "Gagal memuat data tamu.");
    guestTableBody.innerHTML = `
      <tr>
        <td colspan="10" class="empty-state">Data gagal dimuat.</td>
      </tr>
    `;
    return;
  }

  guestRows = data || [];
  applySearch();
}

async function checkSession() {
  const { data, error } = await supabaseClient.auth.getSession();

  if (error) {
    console.error("Gagal cek session:", error);
  }

  const session = data?.session;

  if (session) {
    loginCard.style.display = "none";
    adminCard.style.display = "block";
    adminEmailLabel.textContent = session.user.email || "";
    await loadGuests();
  } else {
    loginCard.style.display = "block";
    adminCard.style.display = "none";
    adminEmailLabel.textContent = "";
    guestRows = [];
    guestTableBody.innerHTML = `
      <tr>
        <td colspan="10" class="empty-state">Silakan login untuk melihat data.</td>
      </tr>
    `;
  }
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  resetMessage(loginMessage);

  const email = document.getElementById("adminEmail").value.trim();
  const password = document.getElementById("adminPassword").value;

  loginBtn.disabled = true;
  loginBtn.textContent = "Masuk...";

  const { error } = await supabaseClient.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error(error);
    showMessage(loginMessage, "error", "Login gagal. Periksa email dan password.");
    loginBtn.disabled = false;
    loginBtn.textContent = "Login";
    return;
  }

  loginBtn.disabled = false;
  loginBtn.textContent = "Login";
  loginForm.reset();
  await checkSession();
});

logoutBtn.addEventListener("click", async () => {
  resetMessage(adminMessage);
  guestRows = [];
  guestTableBody.innerHTML = `
    <tr>
      <td colspan="10" class="empty-state">Anda telah logout.</td>
    </tr>
  `;

  const { error } = await supabaseClient.auth.signOut();

  if (error) {
    console.error("Logout gagal:", error);
    showMessage(adminMessage, "error", "Logout gagal. Silakan coba lagi.");
    return;
  }

  adminCard.style.display = "none";
  loginCard.style.display = "block";
  adminEmailLabel.textContent = "";
  searchInput.value = "";

  showMessage(loginMessage, "success", "Logout berhasil.");
});

refreshBtn.addEventListener("click", async () => {
  await loadGuests();
});

searchInput.addEventListener("input", applySearch);

guestTableBody.addEventListener("click", async (event) => {
  const button = event.target.closest(".small-btn");
  if (!button) return;

  const id = button.dataset.id;
  const confirmed = window.confirm("Yakin ingin menghapus data ini?");
  if (!confirmed) return;

  const { error } = await supabaseClient
    .from("tamu")
    .delete()
    .eq("id", id);

  if (error) {
    console.error(error);
    showMessage(adminMessage, "error", "Gagal menghapus data.");
    return;
  }

  showMessage(adminMessage, "success", "Data berhasil dihapus.");
  await loadGuests();
});

supabaseClient.auth.onAuthStateChange((event) => {
  console.log("AUTH EVENT:", event);

  if (event === "SIGNED_OUT") {
    loginCard.style.display = "block";
    adminCard.style.display = "none";
    adminEmailLabel.textContent = "";
    guestRows = [];
    guestTableBody.innerHTML = `
      <tr>
        <td colspan="10" class="empty-state">Silakan login untuk melihat data.</td>
      </tr>
    `;
    showMessage(loginMessage, "success", "Logout berhasil.");
    return;
  }

  if (event === "SIGNED_IN") {
    checkSession();
  }
});

checkSession();

const exportBtn = document.getElementById("exportBtn");

exportBtn.addEventListener("click", () => {
  if (!guestRows.length) {
    alert("Tidak ada data untuk diexport.");
    return;
  }

  const dataExport = guestRows.map((row, index) => ({
    No: index + 1,
    "Nama Lengkap": row.nama_lengkap,
    Instansi: row.instansi,
    "No HP": row.no_hp,
    Email: row.email,
    "Tujuan / PIC": row.tujuan,
    Keperluan: row.keperluan,
    Tanggal: formatDate(row.tanggal_kunjungan),
    "Dibuat": formatDateTime(row.created_at),
  }));

  const worksheet = XLSX.utils.json_to_sheet(dataExport);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Data Tamu");

  XLSX.writeFile(workbook, "data_tamu.xlsx");
});

resetFilterBtn.addEventListener("click", () => {
  searchInput.value = "";
  filterTanggal.value = "";
  filterInstansi.value = "";
  filterTujuan.value = "";
  filterKeperluan.value = "";

  applySearch();
});
