function showError(message) {
  const errorDiv = document.getElementById("error-message");
  errorDiv.textContent = message;
  errorDiv.style.display = "block";
}

export function initModelViewer(config) {
  // Allow passing a single config or an array of configs
  const configs = Array.isArray(config) ? config : [config];

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
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
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
  // AmbientLight สำหรับแสงรอบทิศทางที่สว่างมากขึ้น
  const ambientLight = new THREE.AmbientLight(0xfff5cc, 2); // เพิ่มความเข้มจาก 0.8 เป็น 1.2
  scene.add(ambientLight);

  // DirectionalLight เสริม (แสงจากด้านบน, ความเข้มเพิ่มขึ้นเล็กน้อย)
  const directionalLight1 = new THREE.DirectionalLight(0xffffff, 2); // เพิ่มจาก 0.3 เป็น 0.5
  directionalLight1.position.set(5, 10, 5);
  directionalLight1.castShadow = true;
  directionalLight1.shadow.mapSize.width = 1024;
  directionalLight1.shadow.mapSize.height = 1024;
  directionalLight1.shadow.camera.near = 0.5;
  directionalLight1.shadow.camera.far = 50;
  scene.add(directionalLight1);

  // DirectionalLight เสริม (แสงจากด้านข้าง, ความเข้มเพิ่มขึ้นเล็กน้อย)
  const directionalLight2 = new THREE.DirectionalLight(0xaaaaaa, 2); // เพิ่มจาก 0.15 เป็น 0.25
  directionalLight2.position.set(-5, 5, -5);
  scene.add(directionalLight2);

  // เพิ่มพื้นสีขาว
  const planeGeometry = new THREE.PlaneGeometry(10, 10);
  const planeMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const plane = new THREE.Mesh(planeGeometry, planeMaterial);
  plane.rotation.x = -Math.PI / 2;
  plane.position.y = 0;
  plane.receiveShadow = true;
  scene.add(plane);

  // เพิ่ม GridHelper
  const gridHelper = new THREE.GridHelper(10, 10, 0x000000, 0x444444);
  gridHelper.position.y = 0.01; // วาง grid เหนือพื้นเล็กน้อยเพื่อป้องกัน z-fighting
  scene.add(gridHelper);

  // ตรวจสอบ GLTFLoader
  // helper: degrees -> radians (used for both models and video planes)
  function degToRad(d) {
    return (d * Math.PI) / 180;
  }

  // Only require GLTFLoader if we have any 3D model entries
  const needsModelLoader = configs.some(
    (c) => !c || c.type === undefined || c.type === "3D Model"
  );
  let GLTFLoaderClass = null;
  let loader = null;
  if (needsModelLoader) {
    GLTFLoaderClass = THREE.GLTFLoader || (THREE && THREE.GLTFLoader);
    if (typeof GLTFLoaderClass !== "function") {
      showError("GLTFLoader is not available. Check CDN or script loading.");
      throw new Error("GLTFLoader is not available");
    }
    // โหลดโมเดล GLTF
    loader = new GLTFLoaderClass();
  }

  configs.forEach((cfg, index) => {
    // provide safe defaults
    // Support both object form { x,y,z } and array form [x,y,z]
    function toVec3(v, def) {
      if (!v) return def;
      if (Array.isArray(v))
        return { x: v[0] ?? def.x, y: v[1] ?? def.y, z: v[2] ?? def.z };
      return { x: v.x ?? def.x, y: v.y ?? def.y, z: v.z ?? def.z };
    }

    const safe = {
      src: cfg && cfg.src ? cfg.src : null,
      type: cfg && cfg.type ? cfg.type : undefined,
      position: toVec3((cfg && cfg.position) || null, { x: 0, y: 0, z: 0 }),
      scale: toVec3((cfg && cfg.scale) || null, { x: 1, y: 1, z: 1 }),
      // rotation accepted in degrees (from A-Frame style). We'll convert to radians later.
      rotation: toVec3((cfg && cfg.rotation) || null, { x: 0, y: 0, z: 0 }),
    };

    if (!safe.src) {
      console.warn(
        `Model config at index ${index} has no src and will be skipped.`
      );
      return;
    }
    // Handle different types
    if (safe.type === "Video") {
      // Create video element
      const video = document.createElement("video");
      video.src = safe.src;
      video.crossOrigin = "anonymous";
      video.loop = true;
      video.muted = true; // allow autoplay in many browsers
      video.playsInline = true;
      video.autoplay = true;

      // Try to play (browsers may require user gesture unless muted)
      const tryPlay = () => {
        const p = video.play();
        if (p && p.catch)
          p.catch((e) => console.warn("Video play prevented:", e));
      };
      video.addEventListener("canplay", tryPlay);
      // attempt immediate play as well
      tryPlay();

      const texture = new THREE.VideoTexture(video);
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.format = THREE.RGBFormat;

      // Create a plane for the video. Use scale.x as width, scale.y as height
      const width = safe.scale.x || 1;
      const height = safe.scale.y || 1;
      const planeGeo = new THREE.PlaneGeometry(width, height);
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
      // videos usually don't cast shadows
      videoMesh.castShadow = false;
      videoMesh.receiveShadow = false;
      scene.add(videoMesh);
      console.log(`Video added to scene from ${safe.src}`);
    } else if (safe.type === "Image") {
      // Load image as texture and display on a plane
      const texLoader = new THREE.TextureLoader();
      texLoader.crossOrigin = "anonymous";
      texLoader.load(
        safe.src,
        (texture) => {
          // If user provided scale.x and scale.y use them as plane size
          const width = safe.scale.x || 1;
          const height = safe.scale.y || 1;
          // Alternatively, fit to image aspect if scale.y is default 1 and texture has size
          if (
            (safe.scale.y === 1 || safe.scale.y === undefined) &&
            texture.image &&
            texture.image.width &&
            texture.image.height
          ) {
            const aspect = texture.image.width / texture.image.height;
            // keep width as provided, adjust height to maintain aspect
            // if width is 0 fallback to 1
            const w = width || 1;
            const h = w / aspect;
            texture.needsUpdate = true;
            const planeGeoImg = new THREE.PlaneGeometry(w, h);
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
            imgMesh.castShadow = false;
            imgMesh.receiveShadow = false;
            scene.add(imgMesh);
            console.log(
              `Image added to scene from ${safe.src} (auto-fit by aspect)`
            );
          } else {
            const planeGeo = new THREE.PlaneGeometry(width, height);
            const mat = new THREE.MeshBasicMaterial({
              map: texture,
              side: THREE.DoubleSide,
            });
            const imgMesh = new THREE.Mesh(planeGeo, mat);
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
            imgMesh.castShadow = false;
            imgMesh.receiveShadow = false;
            scene.add(imgMesh);
            console.log(`Image added to scene from ${safe.src}`);
          }
        },
        undefined,
        (err) => {
          console.error("Error loading image texture:", err);
        }
      );
    } else {
      // Default: treat as 3D model
      if (!loader) {
        console.error("No GLTF loader available to load 3D model:", safe.src);
        showError("GLTFLoader is not available to load 3D models.");
        return;
      }

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
          scene.add(model);

          // ปรับขนาด ตำแหน่ง และการหมุน
          model.scale.set(safe.scale.x, safe.scale.y, safe.scale.z);
          model.position.set(safe.position.x, safe.position.y, safe.position.z);
          model.rotation.set(
            degToRad(safe.rotation.x),
            degToRad(safe.rotation.y),
            degToRad(safe.rotation.z)
          );
          console.log(`Model loaded successfully from ${safe.src}`);
        },
        (progress) => {
          if (progress && progress.total)
            console.log(
              `Loading model (${index}): ${(
                (progress.loaded / progress.total) *
                100
              ).toFixed(2)}%`
            );
        },
        (error) => {
          console.error("Error loading GLTF model:", error);
          showError(`Failed to load model (${safe.src}): ${error.message}`);
        }
      );
    }
  });

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
