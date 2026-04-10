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
const exportBtn = document.getElementById("exportBtn");

const filterTanggal = document.getElementById("filterTanggal");
const filterInstansi = document.getElementById("filterInstansi");
const filterTujuan = document.getElementById("filterTujuan");
const filterKeperluan = document.getElementById("filterKeperluan");

let guestRows = [];
let filteredGuestRows = [];

function showMessage(el, type, text) {
  if (!el) return;
  el.className = `form-message ${type}`;
  el.textContent = text;
}

function resetMessage(el) {
  if (!el) return;
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

function normalizeDate(dateString) {
  if (!dateString) return "";
  const d = new Date(dateString);

  if (isNaN(d.getTime())) return "";

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function renderTable(rows) {
  if (!guestTableBody) return;

  if (!rows.length) {
    guestTableBody.innerHTML = `
      <tr>
        <td colspan="10" class="empty-state">Belum ada data tamu.</td>
      </tr>
    `;
    return;
  }

  guestTableBody.innerHTML = rows
    .map(
      (row, index) => `
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
  `
    )
    .join("");
}

function applySearch() {
  const keyword = searchInput ? searchInput.value.trim().toLowerCase() : "";
  const tanggal = filterTanggal ? filterTanggal.value : "";
  const instansi = filterInstansi ? filterInstansi.value.trim().toLowerCase() : "";
  const tujuan = filterTujuan ? filterTujuan.value.trim().toLowerCase() : "";
  const keperluan = filterKeperluan ? filterKeperluan.value.trim().toLowerCase() : "";

  filteredGuestRows = guestRows.filter((row) => {
    const namaRow = (row.nama_lengkap || "").toLowerCase();
    const instansiRow = (row.instansi || "").toLowerCase();
    const tujuanRow = (row.tujuan || "").toLowerCase();
    const keperluanRow = (row.keperluan || "").toLowerCase();
    const tanggalRow = normalizeDate(row.tanggal_kunjungan);

    const matchKeyword =
      !keyword ||
      namaRow.includes(keyword) ||
      instansiRow.includes(keyword) ||
      tujuanRow.includes(keyword);

    const matchTanggal = !tanggal || tanggalRow === tanggal;
    const matchInstansi = !instansi || instansiRow.includes(instansi);
    const matchTujuan = !tujuan || tujuanRow.includes(tujuan);
    const matchKeperluan =
      !keperluan ||
      keperluan === "semua keperluan" ||
      keperluan === "semua" ||
      keperluanRow === keperluan;

    return (
      matchKeyword &&
      matchTanggal &&
      matchInstansi &&
      matchTujuan &&
      matchKeperluan
    );
  });

  renderTable(filteredGuestRows);
}

async function loadGuests() {
  resetMessage(adminMessage);

  if (guestTableBody) {
    guestTableBody.innerHTML = `
      <tr>
        <td colspan="10" class="empty-state">Memuat data...</td>
      </tr>
    `;
  }

  const { data, error } = await supabaseClient
    .from("tamu")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    showMessage(adminMessage, "error", "Gagal memuat data tamu.");

    if (guestTableBody) {
      guestTableBody.innerHTML = `
        <tr>
          <td colspan="10" class="empty-state">Data gagal dimuat.</td>
        </tr>
      `;
    }
    return;
  }

  guestRows = data || [];
  filteredGuestRows = [...guestRows];
  applySearch();
}

async function checkSession() {
  const { data, error } = await supabaseClient.auth.getSession();

  if (error) {
    console.error("Gagal cek session:", error);
  }

  const session = data?.session;

  if (session) {
    if (loginCard) loginCard.style.display = "none";
    if (adminCard) adminCard.style.display = "block";
    if (adminEmailLabel) adminEmailLabel.textContent = session.user.email || "";
    await loadGuests();
  } else {
    if (loginCard) loginCard.style.display = "block";
    if (adminCard) adminCard.style.display = "none";
    if (adminEmailLabel) adminEmailLabel.textContent = "";

    guestRows = [];
    filteredGuestRows = [];

    if (guestTableBody) {
      guestTableBody.innerHTML = `
        <tr>
          <td colspan="10" class="empty-state">Silakan login untuk melihat data.</td>
        </tr>
      `;
    }
  }
}

if (loginForm) {
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    resetMessage(loginMessage);

    const email = document.getElementById("adminEmail")?.value.trim() || "";
    const password = document.getElementById("adminPassword")?.value || "";

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
}

if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    resetMessage(adminMessage);

    guestRows = [];
    filteredGuestRows = [];

    if (guestTableBody) {
      guestTableBody.innerHTML = `
        <tr>
          <td colspan="10" class="empty-state">Anda telah logout.</td>
        </tr>
      `;
    }

    const { error } = await supabaseClient.auth.signOut();

    if (error) {
      console.error("Logout gagal:", error);
      showMessage(adminMessage, "error", "Logout gagal. Silakan coba lagi.");
      return;
    }

    if (adminCard) adminCard.style.display = "none";
    if (loginCard) loginCard.style.display = "block";
    if (adminEmailLabel) adminEmailLabel.textContent = "";
    if (searchInput) searchInput.value = "";
    if (filterTanggal) filterTanggal.value = "";
    if (filterInstansi) filterInstansi.value = "";
    if (filterTujuan) filterTujuan.value = "";
    if (filterKeperluan) filterKeperluan.value = "";

    showMessage(loginMessage, "success", "Logout berhasil.");
  });
}

if (refreshBtn) {
  refreshBtn.addEventListener("click", async () => {
    await loadGuests();
  });
}

if (searchInput) {
  searchInput.addEventListener("input", applySearch);
}

if (filterTanggal) {
  filterTanggal.addEventListener("change", applySearch);
}

if (filterInstansi) {
  filterInstansi.addEventListener("input", applySearch);
}

if (filterTujuan) {
  filterTujuan.addEventListener("input", applySearch);
}

if (filterKeperluan) {
  filterKeperluan.addEventListener("change", applySearch);
}

if (resetFilterBtn) {
  resetFilterBtn.addEventListener("click", () => {
    if (searchInput) searchInput.value = "";
    if (filterTanggal) filterTanggal.value = "";
    if (filterInstansi) filterInstansi.value = "";
    if (filterTujuan) filterTujuan.value = "";
    if (filterKeperluan) filterKeperluan.value = "";

    applySearch();
  });
}

if (guestTableBody) {
  guestTableBody.addEventListener("click", async (event) => {
    const button = event.target.closest(".small-btn");
    if (!button) return;

    const id = button.dataset.id;
    const confirmed = window.confirm("Yakin ingin menghapus data ini?");
    if (!confirmed) return;

    const { error } = await supabaseClient.from("tamu").delete().eq("id", id);

    if (error) {
      console.error(error);
      showMessage(adminMessage, "error", "Gagal menghapus data.");
      return;
    }

    showMessage(adminMessage, "success", "Data berhasil dihapus.");
    await loadGuests();
  });
}

supabaseClient.auth.onAuthStateChange((event) => {
  console.log("AUTH EVENT:", event);

  if (event === "SIGNED_OUT") {
    if (loginCard) loginCard.style.display = "block";
    if (adminCard) adminCard.style.display = "none";
    if (adminEmailLabel) adminEmailLabel.textContent = "";

    guestRows = [];
    filteredGuestRows = [];

    if (guestTableBody) {
      guestTableBody.innerHTML = `
        <tr>
          <td colspan="10" class="empty-state">Silakan login untuk melihat data.</td>
        </tr>
      `;
    }

    showMessage(loginMessage, "success", "Logout berhasil.");
    return;
  }

  if (event === "SIGNED_IN") {
    checkSession();
  }
});

if (exportBtn) {
  exportBtn.addEventListener("click", () => {
    if (!filteredGuestRows.length) {
      alert("Tidak ada data hasil filter untuk diexport.");
      return;
    }

    const dataExport = filteredGuestRows.map((row, index) => ({
      No: index + 1,
      "Nama Lengkap": row.nama_lengkap || "-",
      Instansi: row.instansi || "-",
      "No HP": row.no_hp || "-",
      Email: row.email || "-",
      "Tujuan / PIC": row.tujuan || "-",
      Keperluan: row.keperluan || "-",
      "Tanggal Kunjungan": formatDate(row.tanggal_kunjungan),
      "Dibuat Pada": formatDateTime(row.created_at),
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data Tamu");

    const today = new Date();
    const fileDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    XLSX.writeFile(workbook, `data_tamu_filtered_${fileDate}.xlsx`);
  });
}

checkSession();
