// เก็บ renderer และสถานะใน global เพื่อป้องกันซ้ำ
window._modelViewer = window._modelViewer || {
  renderer: null,
  initialized: false,
  // id ของ requestAnimationFrame เพื่อยกเลิกได้เมื่อปิดหรือสร้างใหม่
  animationId: null,
};

function initModelViewer(config, canvas_id) {
  // Dispose renderer เดิมหากมี และรีเซ็ตสถานะ
  if (window._modelViewer.initialized) {
    // ยกเลิก animation loop เดิม
    if (window._modelViewer.animationId != null) {
      cancelAnimationFrame(window._modelViewer.animationId);
      window._modelViewer.animationId = null;
    }
    if (window._modelViewer.renderer) {
      window._modelViewer.renderer.dispose();
      window._modelViewer.renderer.forceContextLoss?.();
      window._modelViewer.renderer.domElement = null;
      window._modelViewer.renderer = null;
    }
    window._modelViewer.initialized = false;
  }

  const configs = Array.isArray(config) ? config : [config];

  const canvas = document.getElementById(canvas_id);
  if (!canvas) {
    console.error(`Canvas #${canvas_id} not found`);
    throw new Error(`Canvas not found: ${canvas_id}`);
  }
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x808080);

  const camera = new THREE.PerspectiveCamera(
    75,
    Math.max(1, canvas.clientWidth) / Math.max(1, canvas.clientHeight || 1),
    0.1,
    1000
  );
  camera.position.set(0, 2, 5);

  // ใช้ options ที่ช่วยลดโอกาส context สร้างไม่สำเร็จในรอบถัดไป
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    preserveDrawingBuffer: false,
    powerPreference: "high-performance",
    failIfMajorPerformanceCaveat: false,
  });
  window._modelViewer.renderer = renderer;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  if (canvas.clientWidth === 0 || canvas.clientHeight === 0) {
    canvas.style.width = "100%";
    canvas.style.height = "100vh";
  }
  renderer.setSize(canvas.clientWidth || window.innerWidth, canvas.clientHeight || window.innerHeight, false);

  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.screenSpacePanning = false;
  controls.minDistance = 1;
  controls.maxDistance = 50;
  controls.enablePan = true;
  controls.enableZoom = true;

  // แสง
  const ambientLight = new THREE.AmbientLight(0xfff5cc, 2);
  scene.add(ambientLight);

  const directionalLight1 = new THREE.DirectionalLight(0xffffff, 2);
  directionalLight1.position.set(5, 10, 5);
  directionalLight1.castShadow = true;
  directionalLight1.shadow.mapSize.width = 1024;
  directionalLight1.shadow.mapSize.height = 1024;
  directionalLight1.shadow.camera.near = 0.5;
  directionalLight1.shadow.camera.far = 50;
  scene.add(directionalLight1);

  const directionalLight2 = new THREE.DirectionalLight(0xaaaaaa, 2);
  directionalLight2.position.set(-5, 5, -5);
  scene.add(directionalLight2);

  // === ระนาบอ้างอิง Tracking (โปร่งใส + ขอบเส้น) ===
  const refSize = 2; // ขนาดระนาบอ้างอิง
  const refPlaneGeo = new THREE.PlaneGeometry(refSize, refSize);

  const refEdges = new THREE.EdgesGeometry(refPlaneGeo);
  const refWireMat = new THREE.LineBasicMaterial({ color: 0x00ffff });
  const refWireframe = new THREE.LineSegments(refEdges, refWireMat);
  refWireframe.rotation.x = 0;
  refWireframe.position.y = 0.011;
  scene.add(refWireframe);

  // พื้นหลัก + GridHelper (ยังเก็บไว้)
  const planeGeometry = new THREE.PlaneGeometry(10, 10);
  const planeMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const plane = new THREE.Mesh(planeGeometry, planeMaterial);
  plane.rotation.x = -Math.PI / 2;
  plane.position.y = -1;
  plane.receiveShadow = true;
  scene.add(plane);

  const gridHelper = new THREE.GridHelper(10, 10, 0x000000, 0x444444);
  gridHelper.position.y = -0.99;
  scene.add(gridHelper);

  function degToRad(d) {
    return (d * Math.PI) / 180;
  }

  const needsModelLoader = configs.some(
    (c) => !c || c.type === undefined || c.type === "3D Model"
  );
  let loader = null;
  if (needsModelLoader) {
    const GLTFLoaderClass = THREE.GLTFLoader || (THREE && THREE.GLTFLoader);
    if (typeof GLTFLoaderClass !== "function") {
      showError("GLTFLoader is not available. Check CDN or script loading.");
      throw new Error("GLTFLoader is not available");
    }
    loader = new GLTFLoaderClass();
  }

  function toVec3(v, def) {
    if (!v) return def;
    if (Array.isArray(v))
      return { x: v[0] ?? def.x, y: v[1] ?? def.y, z: v[2] ?? def.z };
    return { x: v.x ?? def.x, y: v.y ?? def.y, z: v.z ?? def.z };
  }

  configs.forEach((cfg, index) => {
    const safe = {
      src: cfg?.src || null,
      type: cfg?.type,
      position: toVec3(cfg?.position, { x: 0, y: 0.05, z: 0 }),
      scale: toVec3(cfg?.scale, { x: 1, y: 1, z: 1 }),
      rotation: toVec3(cfg?.rotation, { x: 0, y: 0, z: 0 }),
    };

    if (!safe.src) {
      console.warn(
        `Model config at index ${index} has no src and will be skipped.`
      );
      return;
    }

    if (safe.type === "Video") {
      const video = document.createElement("video");
      video.src = safe.src;
      video.crossOrigin = "anonymous";
      video.loop = true;
      video.muted = true;
      video.playsInline = true;
      video.autoplay = true;
      video.addEventListener("canplay", () => video.play().catch(() => {}));

      const texture = new THREE.VideoTexture(video);
      const planeGeo = new THREE.PlaneGeometry(safe.scale.x, safe.scale.y);
      const mat = new THREE.MeshBasicMaterial({
        map: texture,
        side: THREE.DoubleSide,
      });
      const videoMesh = new THREE.Mesh(planeGeo, mat);
      videoMesh.position.set(safe.position.x, safe.position.y, safe.position.z);
      videoMesh.rotation.set(
        degToRad(safe.rotation.x),
        degToRad(safe.rotation.y),
        degToRad(safe.rotation.z)
      );
      scene.add(videoMesh);
    } else if (safe.type === "Image") {
      const texLoader = new THREE.TextureLoader();
      texLoader.crossOrigin = "anonymous";
      texLoader.load(
        safe.src,
        (texture) => {
          const planeGeoImg = new THREE.PlaneGeometry(
            safe.scale.x,
            safe.scale.y
          );
          const matImg = new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.DoubleSide,
          });
          const imgMesh = new THREE.Mesh(planeGeoImg, matImg);
          imgMesh.position.set(
            safe.position.x,
            safe.position.y,
            safe.position.z
          );
          imgMesh.rotation.set(
            degToRad(safe.rotation.x),
            degToRad(safe.rotation.y),
            degToRad(safe.rotation.z)
          );
          scene.add(imgMesh);
        },
        undefined,
        (err) => console.error("Error loading image texture:", err)
      );
    } else {
      loader.load(
        safe.src,
        (gltf) => {
          const model = gltf.scene;
          model.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });
          model.scale.set(safe.scale.x, safe.scale.y, safe.scale.z);
          model.position.set(safe.position.x, safe.position.y, safe.position.z);
          model.rotation.set(
            degToRad(safe.rotation.x),
            degToRad(safe.rotation.y),
            degToRad(safe.rotation.z)
          );
          scene.add(model);
        },
        (progress) => {
          if (progress?.total) {
            console.log(
              `Loading model (${index}): ${(
                (progress.loaded / progress.total) *
                100
              ).toFixed(2)}%`
            );
          }
        },
        (error) => {
          console.error("Error loading GLTF model:", error);
          showError(`Failed to load model (${safe.src}): ${error.message}`);
        }
      );
    }
  });

  window.addEventListener("resize", () => {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    camera.aspect = w / Math.max(1, h);
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  });

  function animate() {
    window._modelViewer.animationId = requestAnimationFrame(animate);
    if (!renderer || !renderer.domElement) return;
    controls.update();
    renderer.render(scene, camera);
  }
  animate();

  window._modelViewer.initialized = true;
}
