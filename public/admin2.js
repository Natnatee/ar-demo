const mindSelect = document.getElementById("mind-file-select");
const targetContainer = document.getElementById("target-fields");
const addTargetBtn = document.getElementById("add-target");
const arDataForm = document.getElementById("ar-data-form");

let targetCount = 0;

setTimeout(() => {
  renderMindFiles();
  loadARData();
}, 2000);

// ---------- Utility ----------
const selectableAssets = () =>
  arAssets.filter((a) => ["Image", "3D Model", "Video"].includes(a.type));
const createEl = (tag, cls = [], html = "") => {
  const el = document.createElement(tag);
  if (cls.length) el.classList.add(...cls);
  if (html) el.innerHTML = html;
  return el;
};

// ---------- Mind Files ----------
function renderMindFiles() {
  mindSelect.innerHTML = `<option value="">เลือก Mind File</option>`;
  arAssets
    .filter((a) => a.type === "Mind")
    .forEach((f) => {
      mindSelect.appendChild(new Option(f.name, f.src));
    });
}

// ---------- Load ARData ----------
async function loadARData() {
  const url =
    "https://msdwbkeszkklbelimvaw.supabase.co/rest/v1/ARData?id=eq.4dce27a0-486c-4d87-a0b7-7c6b66dd210e";
  try {
    const headers = SUPABASE_ANON_KEY
      ? {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        }
      : {};
    const resp = await fetch(url, { headers });
    if (!resp.ok) throw new Error(`Fetch failed ${resp.status}`);
    const [data] = await resp.json();
    if (!data) return;

    // MindFile option
    if (data.mindFile) {
      const opt = [...mindSelect.options].find(
        (o) => o.value === data.mindFile
      );
      if (opt) opt.selected = true;
      else
        mindSelect.appendChild(
          new Option("Saved Mind File", data.mindFile, false, true)
        );
    }

    // Targets
    targetContainer.innerHTML = "";
    targetCount = 0;
    const keys = Object.keys(data["image tracking"] || {}).sort(
      (a, b) => (+a.replace(/\D/g, "") || 0) - (+b.replace(/\D/g, "") || 0)
    );
    keys.forEach((k) => createTarget(data["image tracking"][k]));
  } catch (e) {
    console.error("loadARData error", e);
  }
}

// ---------- Targets / Models ----------
function createTarget(models = []) {
  const div = createEl("div", ["mb-3", "border", "p-2", "rounded"]);
  div.dataset.targetId = targetCount;

  const headerDiv = createEl("div", [
    "d-flex",
    "justify-content-between",
    "align-items-center",
    "mb-2",
  ]);
  headerDiv.append(
    createEl("label", ["form-label", "mb-0"], `Target ${targetCount + 1}`),
    createEl("button", ["btn", "btn-sm", "btn-danger"], "ลบ Target")
  );
  headerDiv.querySelector("button").onclick = () => {
    // Dispose renderer when deleting target
    if (window._modelViewer?.renderer) {
      window._modelViewer.renderer.dispose();
      window._modelViewer.renderer.forceContextLoss?.();
      window._modelViewer.renderer.domElement = null;
      window._modelViewer.renderer = null;
      window._modelViewer.initialized = false;
    }
    div.remove();
  };

  const modelsContainer = createEl("div", ["models-container", "mb-2"]);

  // Create preview button
  const previewBtn = createEl(
    "button",
    ["btn", "btn-sm", "btn-primary", "mb-2"],
    "Preview"
  );
  previewBtn.type = "button";

  // Create modal
  const modalId = `modal_${targetCount}`;
  const canvasId = `canvas_${targetCount}`;
  const modal = createEl("div", ["modal", "fade"], "");
  modal.id = modalId;
  modal.style.display = "none";
  modal.innerHTML = `
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Preview Target ${targetCount + 1}</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body" style="overflow: hidden; max-width: 100%;">
          <div style="width: 100%; height: 400px; position: relative;">
            <canvas id="${canvasId}" style="max-width: 100%; max-height: 100%; width: 100%; height: 100%; object-fit: contain;"></canvas>
          </div>
        </div>
      </div>
    </div>
  `;

  // Add modal event handling
  previewBtn.onclick = () => {
    modal.style.display = "block";
    modal.classList.add("show");

    // สร้าง models จากฟอร์มใหม่ทุกครั้ง
    const models = [];
    div.querySelectorAll(".models-container>div").forEach((m) => {
      const opt = m.querySelector("select")?.selectedOptions[0];
      if (!opt) return;

      const type = opt.dataset.type,
        src = opt.dataset.src;
      const s =
        +m.querySelector(".scale").value || (type === "3D Model" ? 0.1 : 1);
      const scale = [s, s, s];
      const position = ["x", "y", "z"].map(
        (a) => +m.querySelector(`.position-${a}`).value || 0
      );
      const rotation = ["x", "y", "z"].map(
        (a) => +m.querySelector(`.rotation-${a}`).value || 0
      );

      const model = { type, src, scale, position, rotation };
      if (type === "Image")
        model.opacity = +m.querySelector(".opacity").value || 1;
      if (type === "Video")
        Object.assign(model, { autoplay: true, loop: true, muted: true });

      models.push(model);
    });

    // สร้าง canvas ใหม่ทุกครั้งเพื่อหลีกเลี่ยง WebGL context เก่าค้าง
    const oldCanvas = modal.querySelector(`#${canvasId}`);
    if (oldCanvas) {
      const fresh = document.createElement("canvas");
      fresh.id = canvasId;
      fresh.style.maxWidth = "100%";
      fresh.style.maxHeight = "100%";
      fresh.style.width = "100%";
      fresh.style.height = "100%";
      fresh.style.objectFit = "contain";
      oldCanvas.replaceWith(fresh);
    }

    setTimeout(() => {
      try {
        initModelViewer(models, canvasId);
      } catch (e) {
        console.error("Failed to initialize model viewer:", e);
        alert("เกิดข้อผิดพลาดในการโหลดตัวอย่าง");
        modal.style.display = "none";
        modal.classList.remove("show");
      }
    }, 100);
  };

  // ปุ่มปิด modal: รวม logic ให้ทำความสะอาด context และยกเลิก animation
  modal.querySelector(".btn-close").onclick = () => {
    // ยกเลิก animation frame ถ้ายังรันอยู่
    if (window._modelViewer?.animationId != null) {
      cancelAnimationFrame(window._modelViewer.animationId);
      window._modelViewer.animationId = null;
    }
    // Dispose renderer
    if (window._modelViewer?.renderer) {
      try {
        window._modelViewer.renderer.dispose();
        window._modelViewer.renderer.forceContextLoss?.();
      } catch (_) {}
      window._modelViewer.renderer.domElement = null;
      window._modelViewer.renderer = null;
    }
    window._modelViewer.initialized = false;

    // รีเซ็ต canvas (ล้างภาพค้าง)
    const c = modal.querySelector("canvas");
    if (c) {
      const ctx2d = c.getContext("2d");
      ctx2d?.clearRect(0, 0, c.width, c.height);
    }

    // ปิด modal
    modal.style.display = "none";
    modal.classList.remove("show");
  };

  const addModelBtn = createEl(
    "button",
    ["btn", "btn-sm", "btn-secondary", "mb-2"],
    "เพิ่ม Model"
  );
  addModelBtn.type = "button";
  addModelBtn.onclick = () => createModelField(div);

  div.append(headerDiv, previewBtn, modelsContainer, addModelBtn, modal);
  targetContainer.appendChild(div);

  (models.length ? models : [null]).forEach((m) => createModelField(div, m));
  targetCount++;
}

// เพิ่มปุ่มลบ Model
function createModelField(targetDiv, modelData = null) {
  const modelDiv = createEl("div", [
    "mb-2",
    "border",
    "p-2",
    "rounded",
    "position-relative",
  ]);

  const removeBtn = createEl(
    "button",
    ["btn", "btn-sm", "btn-outline-danger", "mb-2"],
    "ลบ Model"
  );
  removeBtn.type = "button";
  removeBtn.onclick = () => modelDiv.remove();

  const select = createEl("select", ["form-select", "mb-2"]);
  select.required = true;
  select.innerHTML = `<option value="">เลือก Model</option>`;
  selectableAssets().forEach((a) => {
    const opt = new Option(a.name, a.id);
    opt.dataset.type = a.type;
    opt.dataset.src = a.src;
    select.appendChild(opt);
  });

  const fieldsDiv = createEl("div");
  select.onchange = () => updateFields(select, fieldsDiv, modelData);

  modelDiv.append(removeBtn, select, fieldsDiv);
  targetDiv.querySelector(".models-container").appendChild(modelDiv);

  if (modelData) {
    [...select.options]
      .find((o) => o.dataset.src === modelData.src)
      ?.setAttribute("selected", "true");
    updateFields(select, fieldsDiv, modelData);
  }
}

function updateFields(select, fieldsDiv, modelData) {
  const type = select.selectedOptions[0]?.dataset?.type;
  fieldsDiv.innerHTML = "";
  if (!type) return;

  const addInput = (label, cls, vals, step = 0.1) =>
    `<label class="form-label">${label}</label><div class="d-flex gap-2">
      ${vals
        .map(
          (v, i) =>
            `<input type="number" class="form-control ${cls[i]}" value="${v}" step="${step}" required>`
        )
        .join("")}
    </div>`;

  const scaleDefault = type === "3D Model" ? 0.1 : 1;
  fieldsDiv.innerHTML += `
    <label class="form-label">Scale</label>
    <input type="number" class="form-control scale" value="${scaleDefault}" step="0.1" min="0" required>
    ${addInput(
      "Position (x,y,z)",
      ["position-x", "position-y", "position-z"],
      [0, 0, 0]
    )}
    ${addInput(
      "Rotation (x,y,z)",
      ["rotation-x", "rotation-y", "rotation-z"],
      [0, 0, 0],
      1
    )}
    ${
      type === "Image"
        ? `<label class="form-label">Opacity</label>
      <input type="number" class="form-control opacity" value="1" step="0.1" min="0" max="1" required>`
        : ""
    }
  `;

  if (modelData) {
    if (modelData.scale)
      fieldsDiv.querySelector(".scale").value = modelData.scale[0];
    if (modelData.position)
      ["x", "y", "z"].forEach(
        (a, i) =>
          (fieldsDiv.querySelector(`.position-${a}`).value =
            modelData.position[i])
      );
    if (modelData.rotation)
      ["x", "y", "z"].forEach(
        (a, i) =>
          (fieldsDiv.querySelector(`.rotation-${a}`).value =
            modelData.rotation[i])
      );
    if (type === "Image" && modelData.opacity !== undefined)
      fieldsDiv.querySelector(".opacity").value = modelData.opacity;
  }
}

// ---------- Add Target ----------
addTargetBtn.onclick = () => createTarget();

// ---------- Submit ----------
arDataForm.onsubmit = async (e) => {
  e.preventDefault();
  const arData = {
    id: "4dce27a0-486c-4d87-a0b7-7c6b66dd210e",
    mindFile: mindSelect.value || "",
    "image tracking": {},
  };

  targetContainer.querySelectorAll("[data-target-id]").forEach((div, idx) => {
    const models = [];
    div.querySelectorAll(".models-container>div").forEach((m) => {
      const opt = m.querySelector("select")?.selectedOptions[0];
      if (!opt) return;
      const type = opt.dataset.type,
        src = opt.dataset.src;
      const s =
        +m.querySelector(".scale").value || (type === "3D Model" ? 0.1 : 1);
      const scale = [s, s, s];
      const position = ["x", "y", "z"].map(
        (a) => +m.querySelector(`.position-${a}`).value || 0
      );
      const rotation = ["x", "y", "z"].map(
        (a) => +m.querySelector(`.rotation-${a}`).value || 0
      );
      const model = { type, src, scale, position, rotation };
      if (type === "Image")
        model.opacity = +m.querySelector(".opacity").value || 1;
      if (type === "Video")
        Object.assign(model, { autoplay: true, loop: true, muted: true });
      models.push(model);
    });
    arData["image tracking"][`target${idx}`] = models;
  });

  try {
    const resp = await fetch(
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
    if (!resp.ok) throw new Error("ไม่สามารถอัปเดต ARData ได้");
    alert("อัปเดต ARData สำเร็จ!");
  } catch (err) {
    console.error("เกิดข้อผิดพลาด:", err);
    alert("เกิดข้อผิดพลาดในการอัปเดต ARData");
  }
};
