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
const filterKeperluan = document.getElementById("filterKeperluan");

const sortNamaBtn = document.getElementById("sortNamaBtn");
const sortTanggalBtn = document.getElementById("sortTanggalBtn");
const sortNamaIcon = document.getElementById("sortNamaIcon");
const sortTanggalIcon = document.getElementById("sortTanggalIcon");
const sortStatus = document.getElementById("sortStatus");

const prevPageBtn = document.getElementById("prevPageBtn");
const nextPageBtn = document.getElementById("nextPageBtn");
const pageIndicator = document.getElementById("pageIndicator");
const paginationInfo = document.getElementById("paginationInfo");

let guestRows = [];
let filteredGuestRows = [];

const ITEMS_PER_PAGE = 50;
let currentPage = 1;
let currentSort = {
  field: "tanggal",
  direction: "desc",
};

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
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("id-ID");
}

function formatDateTime(dateString) {
  if (!dateString) return "-";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "-";
  return date.toLocaleString("id-ID");
}

function normalizeDate(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function compareStrings(a, b) {
  return a.localeCompare(b, "id", { sensitivity: "base" });
}

function sortRows(rows) {
  const sorted = [...rows];

  sorted.sort((a, b) => {
    if (currentSort.field === "nama") {
      const namaA = (a.nama_lengkap || "").trim();
      const namaB = (b.nama_lengkap || "").trim();
      const result = compareStrings(namaA, namaB);
      return currentSort.direction === "asc" ? result : -result;
    }

    const tanggalA = new Date(a.tanggal_kunjungan || a.created_at || 0).getTime();
    const tanggalB = new Date(b.tanggal_kunjungan || b.created_at || 0).getTime();
    const result = tanggalA - tanggalB;
    return currentSort.direction === "asc" ? result : -result;
  });

  return sorted;
}

function updateSortUI() {
  if (sortNamaIcon) sortNamaIcon.textContent = "↕";
  if (sortTanggalIcon) sortTanggalIcon.textContent = "↕";

  if (currentSort.field === "nama") {
    if (sortNamaIcon) {
      sortNamaIcon.textContent = currentSort.direction === "asc" ? "A-Z" : "Z-A";
    }
    if (sortStatus) {
      sortStatus.textContent =
        currentSort.direction === "asc"
          ? "Urutan: Nama A-Z"
          : "Urutan: Nama Z-A";
    }
  }

  if (currentSort.field === "tanggal") {
    if (sortTanggalIcon) {
      sortTanggalIcon.textContent = currentSort.direction === "desc" ? "↓" : "↑";
    }
    if (sortStatus) {
      sortStatus.textContent =
        currentSort.direction === "desc"
          ? "Urutan: Tanggal terbaru"
          : "Urutan: Tanggal terlama";
    }
  }
}

function getTotalPages() {
  return Math.max(1, Math.ceil(filteredGuestRows.length / ITEMS_PER_PAGE));
}

function getPaginatedRows() {
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  return filteredGuestRows.slice(startIndex, endIndex);
}

function updatePaginationUI() {
  const totalItems = filteredGuestRows.length;
  const totalPages = getTotalPages();

  if (currentPage > totalPages) {
    currentPage = totalPages;
  }

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endItem = totalItems === 0 ? 0 : Math.min(currentPage * ITEMS_PER_PAGE, totalItems);

  if (paginationInfo) {
    paginationInfo.textContent = `Menampilkan ${startItem} - ${endItem} dari ${totalItems} data`;
  }

  if (pageIndicator) {
    pageIndicator.textContent = `Halaman ${currentPage} / ${totalPages}`;
  }

  if (prevPageBtn) {
    prevPageBtn.disabled = currentPage <= 1;
  }

  if (nextPageBtn) {
    nextPageBtn.disabled = currentPage >= totalPages;
  }
}

function renderTable(rows) {
  if (!guestTableBody) return;

  if (!rows.length) {
    guestTableBody.innerHTML = `
      <tr>
        <td colspan="10" class="empty-state">Tidak ada data yang sesuai filter.</td>
      </tr>
    `;
    return;
  }

  const startNumber = (currentPage - 1) * ITEMS_PER_PAGE;

  guestTableBody.innerHTML = rows
    .map((row, index) => `
      <tr>
        <td>${startNumber + index + 1}</td>
        <td>${row.nama_lengkap ?? "-"}</td>
        <td>${row.instansi ?? "-"}</td>
        <td>${row.no_hp ?? "-"}</td>
        <td>${row.email ?? "-"}</td>
        <td>${row.tujuan ?? "-"}</td>
        <td>${row.keperluan ?? "-"}</td>
        <td>${formatDate(row.tanggal_kunjungan)}</td>
        <td>${formatDateTime(row.created_at)}</td>
        <td><button class="small-btn" data-id="${row.id}" type="button">Hapus</button></td>
      </tr>
    `)
    .join("");
}

function applyFilters(resetPage = true) {
  const keyword = searchInput ? searchInput.value.trim().toLowerCase() : "";
  const tanggal = filterTanggal ? filterTanggal.value : "";
  const keperluan = filterKeperluan ? filterKeperluan.value.trim().toLowerCase() : "";

  let result = guestRows.filter((row) => {
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
    const matchKeperluan = !keperluan || keperluanRow === keperluan;

    return matchKeyword && matchTanggal && matchKeperluan;
  });

  result = sortRows(result);
  filteredGuestRows = result;

  if (resetPage) {
    currentPage = 1;
  }

  const paginatedRows = getPaginatedRows();
  renderTable(paginatedRows);
  updatePaginationUI();
  updateSortUI();
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
    console.error("Load tamu error:", error);
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
  currentPage = 1;
  applyFilters(true);
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
    currentPage = 1;

    if (guestTableBody) {
      guestTableBody.innerHTML = `
        <tr>
          <td colspan="10" class="empty-state">Silakan login untuk melihat data.</td>
        </tr>
      `;
    }

    updatePaginationUI();
    updateSortUI();
  }
}

if (loginForm) {
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    resetMessage(loginMessage);

    const email = document.getElementById("adminEmail")?.value.trim() || "";
    const password = document.getElementById("adminPassword")?.value || "";

    if (!email || !password) {
      showMessage(loginMessage, "error", "Email dan password wajib diisi.");
      return;
    }

    loginBtn.disabled = true;
    loginBtn.textContent = "Masuk...";

    try {
      const { error } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Login error:", error);
        showMessage(loginMessage, "error", "Login gagal. Periksa email dan password.");
        return;
      }

      loginForm.reset();
      await checkSession();
    } catch (err) {
      console.error("Unexpected login error:", err);
      showMessage(loginMessage, "error", "Terjadi kesalahan saat login.");
    } finally {
      loginBtn.disabled = false;
      loginBtn.textContent = "Login";
    }
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    resetMessage(adminMessage);

    try {
      const { error } = await supabaseClient.auth.signOut();

      if (error) {
        console.error("Logout error:", error);
        showMessage(adminMessage, "error", "Logout gagal. Silakan coba lagi.");
        return;
      }

      if (searchInput) searchInput.value = "";
      if (filterTanggal) filterTanggal.value = "";
      if (filterKeperluan) filterKeperluan.value = "";

      guestRows = [];
      filteredGuestRows = [];
      currentPage = 1;

      if (adminCard) adminCard.style.display = "none";
      if (loginCard) loginCard.style.display = "block";
      if (adminEmailLabel) adminEmailLabel.textContent = "";

      updatePaginationUI();
      updateSortUI();

      showMessage(loginMessage, "success", "Logout berhasil.");
    } catch (err) {
      console.error("Unexpected logout error:", err);
      showMessage(adminMessage, "error", "Terjadi kesalahan saat logout.");
    }
  });
}

if (refreshBtn) {
  refreshBtn.addEventListener("click", async () => {
    await loadGuests();
  });
}

if (searchInput) {
  searchInput.addEventListener("input", () => applyFilters(true));
}

if (filterTanggal) {
  filterTanggal.addEventListener("change", () => applyFilters(true));
}

if (filterKeperluan) {
  filterKeperluan.addEventListener("change", () => applyFilters(true));
}

if (resetFilterBtn) {
  resetFilterBtn.addEventListener("click", () => {
    if (searchInput) searchInput.value = "";
    if (filterTanggal) filterTanggal.value = "";
    if (filterKeperluan) filterKeperluan.value = "";

    currentSort = {
      field: "tanggal",
      direction: "desc",
    };

    applyFilters(true);
  });
}

if (sortNamaBtn) {
  sortNamaBtn.addEventListener("click", () => {
    if (currentSort.field === "nama") {
      currentSort.direction = currentSort.direction === "asc" ? "desc" : "asc";
    } else {
      currentSort.field = "nama";
      currentSort.direction = "asc";
    }

    applyFilters(true);
  });
}

if (sortTanggalBtn) {
  sortTanggalBtn.addEventListener("click", () => {
    if (currentSort.field === "tanggal") {
      currentSort.direction = currentSort.direction === "desc" ? "asc" : "desc";
    } else {
      currentSort.field = "tanggal";
      currentSort.direction = "desc";
    }

    applyFilters(true);
  });
}

if (prevPageBtn) {
  prevPageBtn.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage -= 1;
      renderTable(getPaginatedRows());
      updatePaginationUI();
    }
  });
}

if (nextPageBtn) {
  nextPageBtn.addEventListener("click", () => {
    const totalPages = getTotalPages();
    if (currentPage < totalPages) {
      currentPage += 1;
      renderTable(getPaginatedRows());
      updatePaginationUI();
    }
  });
}

if (guestTableBody) {
  guestTableBody.addEventListener("click", async (event) => {
    const button = event.target.closest(".small-btn");
    if (!button) return;

    const id = button.dataset.id;
    const confirmed = window.confirm("Yakin ingin menghapus data ini?");
    if (!confirmed) return;

    try {
      const { error } = await supabaseClient
        .from("tamu")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Delete error:", error);
        showMessage(adminMessage, "error", "Gagal menghapus data.");
        return;
      }

      showMessage(adminMessage, "success", "Data berhasil dihapus.");
      await loadGuests();
    } catch (err) {
      console.error("Unexpected delete error:", err);
      showMessage(adminMessage, "error", "Terjadi kesalahan saat menghapus data.");
    }
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
    currentPage = 1;

    if (guestTableBody) {
      guestTableBody.innerHTML = `
        <tr>
          <td colspan="10" class="empty-state">Silakan login untuk melihat data.</td>
        </tr>
      `;
    }

    updatePaginationUI();
    updateSortUI();
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

    worksheet["!cols"] = [
      { wch: 5 },
      { wch: 28 },
      { wch: 22 },
      { wch: 16 },
      { wch: 28 },
      { wch: 26 },
      { wch: 28 },
      { wch: 18 },
      { wch: 22 }
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data Tamu");

    const today = new Date();
    const fileDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    XLSX.writeFile(workbook, `data_tamu_filtered_${fileDate}.xlsx`);
  });
}

updateSortUI();
updatePaginationUI();
checkSession();
