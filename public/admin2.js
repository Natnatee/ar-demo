// admin2.js
const mindSelect = document.getElementById("mind-file-select");
const targetContainer = document.getElementById("target-fields");
const addTargetBtn = document.getElementById("add-target");
const arDataForm = document.getElementById("ar-data-form");

setTimeout(renderMindFiles, 2000);

function renderMindFiles() {
  const mindFiles = arAssets.filter((asset) => asset.type === "Mind");
  mindSelect.innerHTML = `<option value="">เลือก Mind File</option>`;
  mindFiles.forEach((file) => {
    const option = document.createElement("option");
    option.value = file.src;
    option.textContent = file.name;
    mindSelect.appendChild(option);
  });
}

let targetCount = 0;

// --- ฟังก์ชันสร้าง model fields ---
function createModelField(selectableAssets, targetDiv) {
  const modelDiv = document.createElement("div");
  modelDiv.classList.add("mb-2", "border", "p-2", "rounded");

  const select = document.createElement("select");
  select.classList.add("form-select", "mb-2");
  select.required = true;
  select.innerHTML = `<option value="">เลือก Model</option>`;
  selectableAssets.forEach((a) => {
    const option = document.createElement("option");
    option.value = a.id;
    option.dataset.type = a.type;
    option.dataset.src = a.src;
    option.textContent = a.name;
    select.appendChild(option);
  });

  const fieldsDiv = document.createElement("div");

  function updateFields() {
    const selectedOption = select.selectedOptions[0];
    const type = selectedOption?.dataset?.type;
    fieldsDiv.innerHTML = "";
    if (!type) return;

    // Scale
    const scaleDiv = document.createElement("div");
    scaleDiv.classList.add("mb-1");
    let defaultScale = type === "3D Model" ? 0.1 : 1;
    scaleDiv.innerHTML = `
      <label class="form-label">Scale</label>
      <input type="number" class="form-control scale" value="${defaultScale}" step="0.1" min="0" required>
    `;

    // Position
    const posDiv = document.createElement("div");
    posDiv.classList.add("mb-1");
    posDiv.innerHTML = `
      <label class="form-label">Position (x,y,z)</label>
      <div class="d-flex gap-2">
        <input type="number" class="form-control position-x" value="0" step="0.1" required>
        <input type="number" class="form-control position-y" value="0" step="0.1" required>
        <input type="number" class="form-control position-z" value="0" step="0.1" required>
      </div>
    `;

    // Rotation
    const rotDiv = document.createElement("div");
    rotDiv.classList.add("mb-1");
    rotDiv.innerHTML = `
      <label class="form-label">Rotation (x,y,z)</label>
      <div class="d-flex gap-2">
        <input type="number" class="form-control rotation-x" value="0" step="1" required>
        <input type="number" class="form-control rotation-y" value="0" step="1" required>
        <input type="number" class="form-control rotation-z" value="0" step="1" required>
      </div>
    `;

    // Opacity สำหรับ Image
    let opacityDiv = null;
    if (type === "Image") {
      opacityDiv = document.createElement("div");
      opacityDiv.classList.add("mb-1");
      opacityDiv.innerHTML = `
        <label class="form-label">Opacity</label>
        <input type="number" class="form-control opacity" value="1" step="0.1" min="0" max="1" required>
      `;
    }

    fieldsDiv.appendChild(scaleDiv);
    fieldsDiv.appendChild(posDiv);
    fieldsDiv.appendChild(rotDiv);
    if (opacityDiv) fieldsDiv.appendChild(opacityDiv);
  }

  select.addEventListener("change", updateFields);

  modelDiv.appendChild(select);
  modelDiv.appendChild(fieldsDiv);
  targetDiv.querySelector(".models-container").appendChild(modelDiv);
}

// --- เพิ่ม Target ---
addTargetBtn.addEventListener("click", () => {
  const selectableAssets = arAssets.filter((a) =>
    ["Image", "3D Model", "Video"].includes(a.type)
  );

  const div = document.createElement("div");
  div.classList.add("mb-3", "border", "p-2", "rounded");
  div.dataset.targetId = targetCount;

  const targetLabel = document.createElement("label");
  targetLabel.classList.add("form-label");
  targetLabel.textContent = `Target ${targetCount + 1}`;

  const modelsContainer = document.createElement("div");
  modelsContainer.classList.add("models-container", "mb-2");

  // ปุ่มเพิ่ม Model
  const addModelBtn = document.createElement("button");
  addModelBtn.type = "button";
  addModelBtn.classList.add("btn", "btn-sm", "btn-secondary", "mb-2");
  addModelBtn.textContent = "เพิ่ม Model";
  addModelBtn.addEventListener("click", () => {
    createModelField(selectableAssets, div);
  });

  div.appendChild(targetLabel);
  div.appendChild(modelsContainer);
  div.appendChild(addModelBtn);
  targetContainer.appendChild(div);

  // สร้าง model แรกอัตโนมัติ
  createModelField(selectableAssets, div);

  targetCount++;
});

// --- Submit AR Data ---
arDataForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const arData = {
    id: "4dce27a0-486c-4d87-a0b7-7c6b66dd210e",
    "image tracking": {},
    mindFile: mindSelect.value || "",
  };

  const targets = targetContainer.querySelectorAll("div[data-target-id]");
  targets.forEach((div, idx) => {
    const models = [];
    div.querySelectorAll(".models-container > div").forEach((modelDiv) => {
      const select = modelDiv.querySelector("select");
      const option = select?.selectedOptions[0];
      if (!option) return;

      const type = option.dataset.type;
      const src = option.dataset.src;

      const scaleInput = modelDiv.querySelector(".scale");
      const scale = scaleInput
        ? [
            Number(scaleInput.value),
            Number(scaleInput.value),
            Number(scaleInput.value),
          ]
        : type === "3D Model"
        ? [0.1, 0.1, 0.1]
        : [1, 1, 1];

      const posX = modelDiv.querySelector(".position-x")?.value || 0;
      const posY = modelDiv.querySelector(".position-y")?.value || 0;
      const posZ = modelDiv.querySelector(".position-z")?.value || 0;
      const position = [Number(posX), Number(posY), Number(posZ)];

      const rotX = modelDiv.querySelector(".rotation-x")?.value || 0;
      const rotY = modelDiv.querySelector(".rotation-y")?.value || 0;
      const rotZ = modelDiv.querySelector(".rotation-z")?.value || 0;
      const rotation = [Number(rotX), Number(rotY), Number(rotZ)];

      const modelObj = { type, src, scale, position, rotation };

      if (type === "Image") {
        const opacity = modelDiv.querySelector(".opacity")?.value || 1;
        modelObj.opacity = Number(opacity);
      }

      if (type === "Video") {
        modelObj.autoplay = true;
        modelObj.loop = true;
        modelObj.muted = true;
      }

      models.push(modelObj);
    });

    arData["image tracking"]["target" + idx] = models;
  });

  try {
    const response = await fetch(
      "https://msdwbkeszkklbelimvaw.supabase.co/rest/v1/ARData?id=eq.4dce27a0-486c-4d87-a0b7-7c6b66dd210e",
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify([arData]),
      }
    );

    if (!response.ok) throw new Error("ไม่สามารถอัปเดต ARData ได้");
    alert("อัปเดต ARData สำเร็จ!");
  } catch (error) {
    console.error("เกิดข้อผิดพลาด:", error);
    alert("เกิดข้อผิดพลาดในการอัปเดต ARData");
  }
});
