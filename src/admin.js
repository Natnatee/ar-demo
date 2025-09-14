// ข้อมูลสำหรับเชื่อมต่อ Supabase
const SUPABASE_URL = 'https://msdwbkeszkklbelimvaw.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_r3PnOOMf8ORPxaYZnu2sPg_C81V5KN8'; // เปลี่ยนเป็น API Key ของคุณ
const headers = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
};

// State สำหรับเก็บข้อมูล Assets
let arAssets = [];

// ฟังก์ชันสำหรับดึงข้อมูลจากตาราง AR_ASSETS
async function fetchArAssets() {
    const url = `${SUPABASE_URL}/rest/v1/AR_ASSETS`;
    try {
        const response = await fetch(url, { headers });
        if (!response.ok) throw new Error('Network response was not ok');
        arAssets = await response.json();
        renderAssetsTable();
        populateAssetSelectors();
    } catch (error) {
        console.error("Failed to fetch AR assets:", error);
    }
}

// แสดงผลข้อมูล Assets ในตาราง
function renderAssetsTable() {
    const tableBody = document.querySelector('#ar-assets-table tbody');
    tableBody.innerHTML = '';
    arAssets.forEach(asset => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${asset.name}</td>
            <td>${asset.type}</td>
            <td><a href="${asset.src}" target="_blank">${asset.src.substring(0, 40)}...</a></td>
            <td>
                </td>
        `;
        tableBody.appendChild(row);
    });
}

// สร้าง Dropdown สำหรับเลือก Mind File
function populateAssetSelectors() {
    const mindFileSelect = document.getElementById('mindFile');
    const trackingAssets = arAssets.filter(asset => asset.type !== 'Mind');

    // สร้างตัวเลือกสำหรับ Mind File
    arAssets.filter(asset => asset.type === 'Mind').forEach(asset => {
        const option = document.createElement('option');
        option.value = asset.src;
        option.textContent = asset.name;
        mindFileSelect.appendChild(option);
    });
}

// เพิ่มฟอร์มสำหรับ Image Tracking Target ใหม่
document.getElementById('add-target-btn').addEventListener('click', () => {
    const container = document.getElementById('image-tracking-container');
    const targetCount = container.children.length;
    
    const targetDiv = document.createElement('div');
    targetDiv.className = 'mb-3 p-2 border rounded';
    targetDiv.innerHTML = `
        <h5>Target ${targetCount}</h5>
        <div class="mb-2">
            <label for="asset-select-${targetCount}" class="form-label">Asset</label>
            <select class="form-select asset-select" id="asset-select-${targetCount}" required>
                <option value="">Select an asset</option>
                ${arAssets.filter(asset => asset.type !== 'Mind').map(asset => `<option value="${asset.id}">${asset.name} (${asset.type})</option>`).join('')}
            </select>
        </div>
        <button type="button" class="btn btn-danger btn-sm remove-target-btn">Remove</button>
    `;
    container.appendChild(targetDiv);
});

// ลบฟอร์มสำหรับ Image Tracking Target
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('remove-target-btn')) {
        e.target.closest('div.mb-3').remove();
    }
});

// ส่งข้อมูลฟอร์มไปยัง Supabase
document.getElementById('ar-data-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const mindFileSrc = document.getElementById('mindFile').value;
    const imageTrackingAssets = {};
    const assetSelects = document.querySelectorAll('.asset-select');

    assetSelects.forEach((select, index) => {
        const assetId = select.value;
        const selectedAsset = arAssets.find(asset => asset.id === assetId);

        if (selectedAsset) {
            imageTrackingAssets[`target${index}`] = {
                type: selectedAsset.type,
                src: selectedAsset.src,
                // ข้อมูล default ที่ต้องปรับแต่งเองในภายหลัง
                scale: [1, 1, 1],
                position: [0, 0, 0]
            };
            if (selectedAsset.type === 'Video') {
                imageTrackingAssets[`target${index}`].autoplay = true;
                imageTrackingAssets[`target${index}`].loop = true;
                imageTrackingAssets[`target${index}`].muted = true;
            }
            if (selectedAsset.type === 'Image') {
                 imageTrackingAssets[`target${index}`].opacity = 1;
            }
            if (selectedAsset.type === '3D Model') {
                 imageTrackingAssets[`target${index}`].scale = [0.2, 0.2, 0.2];
            }
        }
    });

    const payload = {
        "image tracking": imageTrackingAssets,
        "mindFile": mindFileSrc
    };

    const url = `${SUPABASE_URL}/rest/v1/ARData`; // เปลี่ยนชื่อตารางเป็น ARData
    const statusDiv = document.getElementById('status-message');

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error('Failed to save AR data.');
        
        statusDiv.innerText = 'AR Data saved successfully!';
        statusDiv.className = 'mt-3 text-success';
        document.getElementById('ar-data-form').reset();
    } catch (error) {
        statusDiv.innerText = 'Error: ' + error.message;
        statusDiv.className = 'mt-3 text-danger';
        console.error("Failed to save AR data:", error);
    }
});

// เริ่มต้นการดึงข้อมูลเมื่อโหลดหน้าเว็บ
document.addEventListener('DOMContentLoaded', fetchArAssets);