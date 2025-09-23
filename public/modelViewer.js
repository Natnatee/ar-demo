function showError(message) {
  const errorDiv = document.getElementById("error-message");
  errorDiv.textContent = message;
  errorDiv.style.display = "block";
}

export function initModelViewer(config) {
  // เริ่มต้น Three.js
  const canvas = document.getElementById("model-canvas");
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x808080);

  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 2, 5);

  const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
  });
  if (canvas.clientWidth === 0 || canvas.clientHeight === 0) {
    canvas.style.width = "100%";
    canvas.style.height = "100vh";
  }
  renderer.setSize(window.innerWidth, window.innerHeight);

  // เพิ่ม OrbitControls
  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.screenSpacePanning = false;
  controls.minDistance = 1;
  controls.maxDistance = 50;
  controls.enablePan = true;
  controls.enableZoom = true;

  // เพิ่มแสง
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
  directionalLight.position.set(0, 1, 1);
  scene.add(directionalLight);

  // เพิ่ม GridHelper
  const gridHelper = new THREE.GridHelper(10, 10, 0x000000, 0x444444);
  gridHelper.position.y = -1;
  scene.add(gridHelper);

  // ตรวจสอบ GLTFLoader
  if (typeof THREE.GLTFLoader !== "function") {
    showError("GLTFLoader is not available. Check CDN or script loading.");
    throw new Error("GLTFLoader is not available");
  }

  // โหลดโมเดล GLTF
  const loader = new THREE.GLTFLoader();
  loader.load(
    config.src,
    (gltf) => {
      const model = gltf.scene;
      scene.add(model);

      // ปรับขนาด ตำแหน่ง และการหมุน
      model.scale.set(config.scale.x, config.scale.y, config.scale.z);
      model.position.set(
        config.position.x,
        config.position.y,
        config.position.z
      );
      model.rotation.set(
        config.rotation.x,
        config.rotation.y,
        config.rotation.z
      );
      console.log("Model loaded successfully");
    },
    (progress) => {
      console.log(
        `Loading model: ${((progress.loaded / progress.total) * 100).toFixed(
          2
        )}%`
      );
    },
    (error) => {
      console.error("Error loading GLTF model:", error);
      showError("Failed to load model: " + error.message);
    }
  );

  // จัดการการปรับขนาดหน้าต่าง
  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // การเรนเดอร์
  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }
  animate();
}
