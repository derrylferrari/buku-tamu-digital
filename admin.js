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
const exportPdfBtn = document.getElementById("exportPdfBtn");
const printBtn = document.getElementById("printBtn");
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

const statTotal = document.getElementById("statTotal");
const statToday = document.getElementById("statToday");
const statMonth = document.getElementById("statMonth");
const statTopPurpose = document.getElementById("statTopPurpose");
const statTopPurposeCount = document.getElementById("statTopPurposeCount");

const editModal = document.getElementById("editModal");
const closeEditModalBtn = document.getElementById("closeEditModalBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const editGuestForm = document.getElementById("editGuestForm");
const editMessage = document.getElementById("editMessage");
const saveEditBtn = document.getElementById("saveEditBtn");

const editGuestId = document.getElementById("editGuestId");
const editNamaLengkap = document.getElementById("editNamaLengkap");
const editInstansi = document.getElementById("editInstansi");
const editNoHp = document.getElementById("editNoHp");
const editEmail = document.getElementById("editEmail");
const editTujuan = document.getElementById("editTujuan");
const editKeperluan = document.getElementById("editKeperluan");
const editTanggalKunjungan = document.getElementById("editTanggalKunjungan");

let guestRows = [];
let filteredGuestRows = [];

const ITEMS_PER_PAGE = 50;
let currentPage = 1;
let currentSortField = "tanggal";
let currentSortDirection = "desc";

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

function getSortTimestamp(row) {
  const raw = row.tanggal_kunjungan || row.created_at || "";
  const time = new Date(raw).getTime();
  return isNaN(time) ? 0 : time;
}

function sortData(rows) {
  const cloned = [...rows];

  cloned.sort((a, b) => {
    if (currentSortField === "nama") {
      const aName = (a.nama_lengkap || "").toLowerCase().trim();
      const bName = (b.nama_lengkap || "").toLowerCase().trim();
      const comparison = aName.localeCompare(bName, "id", { sensitivity: "base" });
      return currentSortDirection === "asc" ? comparison : -comparison;
    }

    const aTime = getSortTimestamp(a);
    const bTime = getSortTimestamp(b);
    const comparison = aTime - bTime;
    return currentSortDirection === "asc" ? comparison : -comparison;
  });

  return cloned;
}

function updateSortUI() {
  if (sortNamaIcon) sortNamaIcon.textContent = "↕";
  if (sortTanggalIcon) sortTanggalIcon.textContent = "↕";

  if (currentSortField === "nama") {
    if (sortNamaIcon) {
      sortNamaIcon.textContent = currentSortDirection === "asc" ? "A-Z" : "Z-A";
    }
    if (sortStatus) {
      sortStatus.textContent =
        currentSortDirection === "asc"
          ? "Urutan: Nama A-Z"
          : "Urutan: Nama Z-A";
    }
  }

  if (currentSortField === "tanggal") {
    if (sortTanggalIcon) {
      sortTanggalIcon.textContent = currentSortDirection === "desc" ? "↓" : "↑";
    }
    if (sortStatus) {
      sortStatus.textContent =
        currentSortDirection === "desc"
          ? "Urutan: Tanggal terbaru"
          : "Urutan: Tanggal terlama";
    }
  }
}

function getTotalPages() {
  const total = Math.ceil(filteredGuestRows.length / ITEMS_PER_PAGE);
  return total > 0 ? total : 1;
}

function getCurrentPageRows() {
  const start = (currentPage - 1) * ITEMS_PER_PAGE;
  const end = start + ITEMS_PER_PAGE;
  return filteredGuestRows.slice(start, end);
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

  if (prevPageBtn) prevPageBtn.disabled = currentPage <= 1;
  if (nextPageBtn) nextPageBtn.disabled = currentPage >= totalPages;
}

function updateStats(rows) {
  if (!rows) rows = [];

  const total = rows.length;
  const today = normalizeDate(new Date());
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();

  let todayCount = 0;
  let monthCount = 0;
  const purposeCounter = {};

  rows.forEach((row) => {
    const rowDateString = row.tanggal_kunjungan || row.created_at;
    const rowDate = new Date(rowDateString);
    const rowNormalized = normalizeDate(rowDateString);

    if (rowNormalized === today) {
      todayCount += 1;
    }

    if (!isNaN(rowDate.getTime())) {
      if (rowDate.getMonth() === thisMonth && rowDate.getFullYear() === thisYear) {
        monthCount += 1;
      }
    }

    const purpose = (row.keperluan || "Tidak disebutkan").trim();
    purposeCounter[purpose] = (purposeCounter[purpose] || 0) + 1;
  });

  let topPurpose = "-";
  let topPurposeValue = 0;

  Object.entries(purposeCounter).forEach(([purpose, count]) => {
    if (count > topPurposeValue) {
      topPurpose = purpose;
      topPurposeValue = count;
    }
  });

  if (statTotal) statTotal.textContent = String(total);
  if (statToday) statToday.textContent = String(todayCount);
  if (statMonth) statMonth.textContent = String(monthCount);
  if (statTopPurpose) statTopPurpose.textContent = topPurpose;
  if (statTopPurposeCount) {
    statTopPurposeCount.textContent =
      topPurposeValue > 0 ? `${topPurposeValue} kunjungan` : "Belum ada data";
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

  guestTableBody.innerHTML = rows.map((row, index) => `
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
      <td>
        <div class="action-group">
          <button class="edit-btn" data-action="edit" data-id="${row.id}" type="button">Edit</button>
          <button class="small-btn" data-action="delete" data-id="${row.id}" type="button">Hapus</button>
        </div>
      </td>
    </tr>
  `).join("");
}

function applyFilters(resetPage = true) {
  const keyword = searchInput ? searchInput.value.trim().toLowerCase() : "";
  const tanggal = filterTanggal ? filterTanggal.value : "";
  const keperluan = filterKeperluan ? filterKeperluan.value.trim().toLowerCase() : "";

  let result = guestRows.filter((row) => {
    const nama = (row.nama_lengkap || "").toLowerCase();
    const instansi = (row.instansi || "").toLowerCase();
    const tujuan = (row.tujuan || "").toLowerCase();
    const rowKeperluan = (row.keperluan || "").toLowerCase();
    const rowTanggal = normalizeDate(row.tanggal_kunjungan);

    const matchKeyword =
      !keyword ||
      nama.includes(keyword) ||
      instansi.includes(keyword) ||
      tujuan.includes(keyword);

    const matchTanggal = !tanggal || rowTanggal === tanggal;
    const matchKeperluan = !keperluan || rowKeperluan === keperluan;

    return matchKeyword && matchTanggal && matchKeperluan;
  });

  result = sortData(result);
  filteredGuestRows = result;

  if (resetPage) {
    currentPage = 1;
  }

  updateStats(filteredGuestRows);
  renderTable(getCurrentPageRows());
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
    updateStats([]);

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

function openEditModal(row) {
  if (!row || !editModal) return;

  resetMessage(editMessage);

  editGuestId.value = row.id || "";
  editNamaLengkap.value = row.nama_lengkap || "";
  editInstansi.value = row.instansi || "";
  editNoHp.value = row.no_hp || "";
  editEmail.value = row.email || "";
  editTujuan.value = row.tujuan || "";
  editKeperluan.value = row.keperluan || "";
  editTanggalKunjungan.value = normalizeDate(row.tanggal_kunjungan || row.created_at);

  editModal.classList.add("show");
  editModal.setAttribute("aria-hidden", "false");
}

function closeEditModal() {
  if (!editModal) return;
  editModal.classList.remove("show");
  editModal.setAttribute("aria-hidden", "true");
  if (editGuestForm) editGuestForm.reset();
  resetMessage(editMessage);
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
      currentSortField = "tanggal";
      currentSortDirection = "desc";
      updateStats([]);

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

    currentSortField = "tanggal";
    currentSortDirection = "desc";
    applyFilters(true);
  });
}

if (sortNamaBtn) {
  sortNamaBtn.addEventListener("click", () => {
    if (currentSortField === "nama") {
      currentSortDirection = currentSortDirection === "asc" ? "desc" : "asc";
    } else {
      currentSortField = "nama";
      currentSortDirection = "asc";
    }

    applyFilters(true);
  });
}

if (sortTanggalBtn) {
  sortTanggalBtn.addEventListener("click", () => {
    if (currentSortField === "tanggal") {
      currentSortDirection = currentSortDirection === "desc" ? "asc" : "desc";
    } else {
      currentSortField = "tanggal";
      currentSortDirection = "desc";
    }

    applyFilters(true);
  });
}

if (prevPageBtn) {
  prevPageBtn.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage -= 1;
      renderTable(getCurrentPageRows());
      updatePaginationUI();
    }
  });
}

if (nextPageBtn) {
  nextPageBtn.addEventListener("click", () => {
    const totalPages = getTotalPages();
    if (currentPage < totalPages) {
      currentPage += 1;
      renderTable(getCurrentPageRows());
      updatePaginationUI();
    }
  });
}

if (guestTableBody) {
  guestTableBody.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-action]");
    if (!button) return;

    const action = button.dataset.action;
    const id = button.dataset.id;
    const row = guestRows.find((item) => String(item.id) === String(id));

    if (action === "edit") {
      openEditModal(row);
      return;
    }

    if (action === "delete") {
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
    }
  });
}

if (closeEditModalBtn) {
  closeEditModalBtn.addEventListener("click", closeEditModal);
}

if (cancelEditBtn) {
  cancelEditBtn.addEventListener("click", closeEditModal);
}

if (editModal) {
  editModal.addEventListener("click", (event) => {
    if (event.target === editModal) {
      closeEditModal();
    }
  });
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && editModal?.classList.contains("show")) {
    closeEditModal();
  }
});

if (editGuestForm) {
  editGuestForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    resetMessage(editMessage);

    const id = editGuestId.value;

    const payload = {
      nama_lengkap: editNamaLengkap.value.trim(),
      instansi: editInstansi.value.trim(),
      no_hp: editNoHp.value.trim(),
      email: editEmail.value.trim(),
      tujuan: editTujuan.value.trim(),
      keperluan: editKeperluan.value,
      tanggal_kunjungan: editTanggalKunjungan.value || null,
    };

    if (!payload.nama_lengkap) {
      showMessage(editMessage, "error", "Nama lengkap wajib diisi.");
      return;
    }

    saveEditBtn.disabled = true;
    saveEditBtn.textContent = "Menyimpan...";

    try {
      const { error } = await supabaseClient
        .from("tamu")
        .update(payload)
        .eq("id", id);

      if (error) {
        console.error("Update error:", error);
        showMessage(editMessage, "error", "Gagal menyimpan perubahan.");
        return;
      }

      showMessage(editMessage, "success", "Perubahan berhasil disimpan.");
      await loadGuests();

      setTimeout(() => {
        closeEditModal();
      }, 600);
    } catch (err) {
      console.error("Unexpected update error:", err);
      showMessage(editMessage, "error", "Terjadi kesalahan saat menyimpan.");
    } finally {
      saveEditBtn.disabled = false;
      saveEditBtn.textContent = "Simpan Perubahan";
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
    updateStats([]);

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

if (exportPdfBtn) {
  exportPdfBtn.addEventListener("click", () => {
    if (!filteredGuestRows.length) {
      alert("Tidak ada data hasil filter untuk diexport ke PDF.");
      return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF("l", "mm", "a4");

    const today = new Date();
    const fileDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    doc.setFontSize(16);
    doc.text("Laporan Data Buku Tamu Digital", 14, 14);

    doc.setFontSize(10);
    doc.text(`Tanggal export: ${fileDate}`, 14, 20);
    doc.text(`Total data: ${filteredGuestRows.length}`, 14, 26);

    const body = filteredGuestRows.map((row, index) => [
      index + 1,
      row.nama_lengkap || "-",
      row.instansi || "-",
      row.no_hp || "-",
      row.email || "-",
      row.tujuan || "-",
      row.keperluan || "-",
      formatDate(row.tanggal_kunjungan),
      formatDateTime(row.created_at),
    ]);

    doc.autoTable({
      startY: 32,
      head: [[
        "No",
        "Nama Lengkap",
        "Instansi",
        "No HP",
        "Email",
        "Tujuan / PIC",
        "Keperluan",
        "Tanggal Kunjungan",
        "Dibuat Pada"
      ]],
      body,
      styles: {
        fontSize: 8,
        cellPadding: 2
      },
      headStyles: {
        fillColor: [37, 99, 235]
      }
    });

    doc.save(`data_tamu_filtered_${fileDate}.pdf`);
  });
}

if (printBtn) {
  printBtn.addEventListener("click", () => {
    if (!filteredGuestRows.length) {
      alert("Tidak ada data untuk dicetak.");
      return;
    }

    const printWindow = window.open("", "_blank", "width=1400,height=900");

    if (!printWindow) {
      alert("Popup diblokir browser. Izinkan popup lalu coba lagi.");
      return;
    }

    const rowsHtml = filteredGuestRows.map((row, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${row.nama_lengkap || "-"}</td>
        <td>${row.instansi || "-"}</td>
        <td>${row.no_hp || "-"}</td>
        <td>${row.email || "-"}</td>
        <td>${row.tujuan || "-"}</td>
        <td>${row.keperluan || "-"}</td>
        <td>${formatDate(row.tanggal_kunjungan)}</td>
        <td>${formatDateTime(row.created_at)}</td>
      </tr>
    `).join("");

    const today = new Date();
    const fileDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    printWindow.document.write(`
      <html>
        <head>
          <title>Cetak Data Buku Tamu</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 24px;
              color: #111827;
            }
            h1 {
              margin: 0 0 8px;
              font-size: 22px;
            }
            .meta {
              margin-bottom: 18px;
              color: #4b5563;
              font-size: 14px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 12px;
            }
            th, td {
              border: 1px solid #d1d5db;
              padding: 8px;
              text-align: left;
              vertical-align: top;
            }
            th {
              background: #eff6ff;
            }
          </style>
        </head>
        <body>
          <h1>Laporan Data Buku Tamu Digital</h1>
          <div class="meta">
            Tanggal cetak: ${fileDate}<br>
            Total data: ${filteredGuestRows.length}
          </div>
          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>Nama Lengkap</th>
                <th>Instansi</th>
                <th>No HP</th>
                <th>Email</th>
                <th>Tujuan / PIC</th>
                <th>Keperluan</th>
                <th>Tanggal Kunjungan</th>
                <th>Dibuat Pada</th>
              </tr>
            </thead>
            <tbody>${rowsHtml}</tbody>
          </table>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  });
}

updateStats([]);
updateSortUI();
updatePaginationUI();
checkSession();
