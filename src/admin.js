// ข้อมูลสำหรับเชื่อมต่อ Supabase
const SUPABASE_URL = "https://msdwbkeszkklbelimvaw.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_r3PnOOMf8ORPxaYZnu2sPg_C81V5KN8";
const headers = {
  "Content-Type": "application/json",
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
};
// State สำหรับเก็บข้อมูล Assets
let arAssets = [];

// ดึงข้อมูลจากตาราง AR_ASSETS
async function fetchArAssets() {
  const url = `${SUPABASE_URL}/rest/v1/AR_ASSETS`;
  try {
    const response = await fetch(url, { headers });
    if (!response.ok) throw new Error("ไม่สามารถดึงข้อมูลได้");
    arAssets = await response.json();
    renderAssetsTable();
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการดึงข้อมูล AR Assets:", error);
    showStatus("เกิดข้อผิดพลาดในการดึงข้อมูล: " + error.message, "text-danger");
  }
}

// แสดงผลข้อมูล Assets ในตาราง
function renderAssetsTable() {
  const tableBody = document.querySelector("#ar-assets-table tbody");
  tableBody.innerHTML = "";
  arAssets.forEach((asset) => {
    const row = document.createElement("tr");
    row.innerHTML = `
            <td>${asset.name}</td>
            <td>${asset.type}</td>
            <td><a href="${asset.src}" target="_blank">${asset.src.substring(
      0,
      30
    )}...</a></td>
            <td>
                <button class="btn btn-sm btn-warning edit-btn" data-id="${
                  asset.id
                }" data-name="${asset.name}">แก้ไขชื่อ</button>
                <button class="btn btn-sm btn-danger delete-btn" data-id="${
                  asset.id
                }">ลบ</button>
            </td>
        `;
    tableBody.appendChild(row);
  });
}

// แสดงข้อความสถานะ
function showStatus(message, className) {
  const statusDiv = document.getElementById("status-message");
  statusDiv.innerText = message;
  statusDiv.className = `mt-3 ${className}`;
}

// จัดการการลากและวางไฟล์
const fileInput = document.getElementById("asset-file");
const dropArea = document.getElementById("file-drop-area");
const fileNameDisplay = document.getElementById("file-name");

dropArea.addEventListener("click", () => fileInput.click());
dropArea.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropArea.classList.add("dragover");
});
dropArea.addEventListener("dragleave", () => {
  dropArea.classList.remove("dragover");
});
dropArea.addEventListener("drop", (e) => {
  e.preventDefault();
  dropArea.classList.remove("dragover");
  const files = e.dataTransfer.files;
  if (files.length) {
    fileInput.files = files;
    fileNameDisplay.textContent = `ไฟล์: ${files[0].name}`;
  }
});
fileInput.addEventListener("change", () => {
  if (fileInput.files.length) {
    fileNameDisplay.textContent = `ไฟล์: ${fileInput.files[0].name}`;
  } else {
    fileNameDisplay.textContent = "";
  }
});

// รีเซ็ตฟอร์ม
document.getElementById("reset-form").addEventListener("click", () => {
  document.getElementById("asset-form").reset();
  document.getElementById("asset-id").value = "";
  fileInput.value = "";
  fileNameDisplay.textContent = "";
  showStatus("", "");
});

// ตรวจสอบนามสกุลไฟล์และกำหนดประเภท
function getAssetType(fileName) {
  const extension = fileName.split(".").pop().toLowerCase();
  switch (extension) {
    case "mp4":
      return "Video";
    case "jpg":
    case "jpeg":
    case "png":
      return "Image";
    case "mind":
      return "Mind";
    case "gltf":
      return "3D Model";
    default:
      throw new Error(
        "นามสกุลไฟล์ไม่รองรับ (รองรับเฉพาะ .mp4, .jpg, .jpeg, .png, .mind, .gltf)"
      );
  }
}

// ส่งข้อมูลฟอร์ม (Create/Update)
document.getElementById("asset-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = document.getElementById("asset-id").value;
  const name = document.getElementById("asset-name").value;
  const file = fileInput.files[0];
  const payload = { name };

  try {
    if (id) {
      // Update: เฉพาะชื่อ
      const url = `${SUPABASE_URL}/rest/v1/AR_ASSETS?id=eq.${id}`;
      const response = await fetch(url, {
        method: "PATCH",
        headers,
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("ไม่สามารถอัปเดตข้อมูลได้");
      showStatus("อัปเดตชื่อสำเร็จ!", "text-success");
    } else {
      // Create: ต้องมีไฟล์
      if (!file) throw new Error("กรุณาอัปโหลดไฟล์");
      const type = getAssetType(file.name);

      // 1) อัปโหลดไฟล์ไป Supabase Storage
      const uploadUrl = `${SUPABASE_URL}/storage/v1/object/assets/${file.name}`;
      const uploadRes = await fetch(uploadUrl, {
        method: "POST",
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: file,
      });
      if (!uploadRes.ok) throw new Error("อัปโหลดไฟล์ไป Storage ไม่สำเร็จ");

      // 2) URL ของไฟล์ใน Storage
      const src = `${SUPABASE_URL}/storage/v1/object/assets/${file.name}`;

      // 3) บันทึกลงตาราง AR_ASSETS
      payload.type = type;
      payload.src = src;

      const url = `${SUPABASE_URL}/rest/v1/AR_ASSETS`;
      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("ไม่สามารถบันทึกข้อมูลได้");
      showStatus("บันทึกข้อมูลสำเร็จ!", "text-success");
    }

    document.getElementById("asset-form").reset();
    document.getElementById("asset-id").value = "";
    fileInput.value = "";
    fileNameDisplay.textContent = "";
    await fetchArAssets();
  } catch (error) {
    showStatus("เกิดข้อผิดพลาด: " + error.message, "text-danger");
    console.error("เกิดข้อผิดพลาด:", error);
  }
});

// จัดการปุ่มแก้ไขและลบ
document.addEventListener("click", async (e) => {
  if (e.target.classList.contains("edit-btn")) {
    const id = e.target.dataset.id;
    const name = e.target.dataset.name;
    document.getElementById("asset-id").value = id;
    document.getElementById("asset-name").value = name;
    fileInput.value = "";
    fileNameDisplay.textContent = "";
    showStatus("พร้อมแก้ไขชื่อ", "text-info");
  } else if (e.target.classList.contains("delete-btn")) {
    if (confirm("ยืนยันการลบ Asset นี้?")) {
      const id = e.target.dataset.id;
      const url = `${SUPABASE_URL}/rest/v1/AR_ASSETS?id=eq.${id}`;
      try {
        const response = await fetch(url, { method: "DELETE", headers });
        if (!response.ok) throw new Error("ไม่สามารถลบข้อมูลได้");
        showStatus("ลบข้อมูลสำเร็จ!", "text-success");
        await fetchArAssets();
      } catch (error) {
        showStatus("เกิดข้อผิดพลาด: " + error.message, "text-danger");
        console.error("เกิดข้อผิดพลาดในการลบ:", error);
      }
    }
  }
});

// เริ่มต้นการดึงข้อมูลเมื่อโหลดหน้าเว็บ
document.addEventListener("DOMContentLoaded", fetchArAssets);
