const SUPABASE_URL = "https://cghnjsdhaoayunaspsyi.supabase.co";
const SUPABASE_KEY = "sb_publishable_7rY6D_gGfGUVBreIZfQ_Xw_xGpb3757";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const guestForm = document.getElementById("guestForm");
const submitBtn = document.getElementById("submitBtn");
const formMessage = document.getElementById("formMessage");
const tanggalInput = document.getElementById("tanggal_kunjungan");

const today = new Date().toISOString().split("T")[0];
tanggalInput.value = today;
tanggalInput.min = today;

function showMessage(type, text) {
  formMessage.className = `form-message ${type}`;
  formMessage.textContent = text;
}

function resetMessage() {
  formMessage.className = "form-message";
  formMessage.textContent = "";
}

guestForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  resetMessage();

  const formData = new FormData(guestForm);

  const payload = {
    nama_lengkap: formData.get("nama_lengkap")?.trim(),
    instansi: formData.get("instansi")?.trim(),
    no_hp: formData.get("no_hp")?.trim(),
    email: formData.get("email")?.trim() || null,
    tujuan: formData.get("tujuan")?.trim(),
    keperluan: formData.get("keperluan"),
    tanggal_kunjungan: formData.get("tanggal_kunjungan"),
  };

  if (
    !payload.nama_lengkap ||
    !payload.instansi ||
    !payload.no_hp ||
    !payload.tujuan ||
    !payload.keperluan ||
    !payload.tanggal_kunjungan
  ) {
    showMessage("error", "Semua field wajib harus diisi.");
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = "Menyimpan...";

  try {
    const { error } = await supabaseClient
      .from("tamu")
      .insert([payload]);

    if (error) {
      throw error;
    }

    guestForm.reset();
    tanggalInput.value = today;
    showMessage("success", "Data kunjungan berhasil disimpan. Terima kasih.");
  } catch (error) {
    console.error("Gagal menyimpan data:", error);
    showMessage(
      "error",
      "Data gagal disimpan. Silakan coba kembali beberapa saat lagi."
    );
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Kirim Data Kunjungan";
  }
});