// admin2.js

const mindSelect = document.getElementById("mind-file-select");
const targetContainer = document.getElementById("target-fields");
const addTargetBtn = document.getElementById("add-target");
const arDataForm = document.getElementById("ar-data-form");

// รอ arAssets โหลดแล้ว render dropdown
setTimeout(renderMindFiles, 2000);

function renderMindFiles() {
  
  const mindFiles = arAssets.filter((asset) => asset.type === "Mind");
  mindSelect.innerHTML = `<option value="">เลือก Mind File</option>`;
  mindFiles.forEach((file) => {
    const option = document.createElement("option");
    option.value = file.src; // ใช้ src เลย
    option.textContent = file.name;
    mindSelect.appendChild(option);
  });
}

// ตัวนับ target
let targetCount = 0;

addTargetBtn.addEventListener("click", () => {

  // filter สำหรับ dropdown target
  const selectableAssets = arAssets.filter((a) =>
    ["Image", "3D Model", "Video"].includes(a.type)
  );

  const div = document.createElement("div");
  div.classList.add("mb-3", "border", "p-2", "rounded");
  div.dataset.targetId = targetCount;

  // dropdown เลือก asset
  const select = document.createElement("select");
  select.classList.add("form-select", "mb-2");
  select.required = true;

  select.innerHTML = `<option value="">เลือก Target</option>`;
  selectableAssets.forEach((a) => {
    const option = document.createElement("option");
    option.value = a.id;
    option.dataset.type = a.type;
    option.dataset.src = a.src;
    option.textContent = a.name;
    select.appendChild(option);
  });

  // container สำหรับฟิลด์ scale / position / opacity
  const fieldsDiv = document.createElement("div");

  // ฟังก์ชันสร้างฟิลด์ตาม type
  function updateFields() {
    const selectedOption = select.selectedOptions[0];
    const type = selectedOption?.dataset?.type;
    fieldsDiv.innerHTML = ""; // reset

    if (!type) return;

    // scale
    const scaleDiv = document.createElement("div");
    scaleDiv.classList.add("mb-1");
    if (type === "Image") {
      scaleDiv.innerHTML = `
        <label class="form-label">Scale (x,y,z)</label>
        <input type="text" class="form-control scale" placeholder="1,1,1" required>
      `;
    } else {
      scaleDiv.innerHTML = `
        <label class="form-label">Scale (x,y,z)</label>
        <input type="text" class="form-control scale" placeholder="0.2,0.2,0.2" required>
      `;
    }

    // position
    const posDiv = document.createElement("div");
    posDiv.classList.add("mb-1");
    posDiv.innerHTML = `
      <label class="form-label">Position (x,y,z)</label>
      <input type="text" class="form-control position" placeholder="0,0,0" required>
    `;

    // opacity สำหรับ Image เท่านั้น
    let opacityDiv = null;
    if (type === "Image") {
      opacityDiv = document.createElement("div");
      opacityDiv.classList.add("mb-1");
      opacityDiv.innerHTML = `
        <label class="form-label">Opacity</label>
        <input type="number" class="form-control opacity" placeholder="1" step="0.1" min="0" max="1" required>
      `;
    }

    fieldsDiv.appendChild(scaleDiv);
    fieldsDiv.appendChild(posDiv);
    if (opacityDiv) fieldsDiv.appendChild(opacityDiv);
  }

  select.addEventListener("change", updateFields);

  div.appendChild(select);
  div.appendChild(fieldsDiv);
  targetContainer.appendChild(div);

  targetCount++;
});

// Submit form
arDataForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const arData = { "image tracking": {}, mindFile: mindSelect.value };

  const targets = targetContainer.querySelectorAll("div[data-target-id]");
  targets.forEach((div, idx) => {
    const select = div.querySelector("select");
    const option = select.selectedOptions[0];
    if (!option) return;

    const type = option.dataset.type;
    const src = option.dataset.src;

    const scaleStr = div.querySelector(".scale").value;
    const scale = scaleStr.split(",").map(Number);

    const posStr = div.querySelector(".position").value;
    const position = posStr.split(",").map(Number);

    const targetObj = { type, src, scale, position };

    // เพิ่มค่าเฉพาะ Image / Video fields
    if (type === "Image") {
      const opacity = parseFloat(div.querySelector(".opacity").value);
      targetObj.opacity = opacity;
    }
    if (type === "Video") {
      targetObj.autoplay = true;
      targetObj.loop = true;
      targetObj.muted = true;
    }

    arData["image tracking"]["target" + idx] = targetObj;
  });

  console.log("export const ARData =", arData);
});
