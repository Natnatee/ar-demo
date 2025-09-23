async function initAR() {
  const url =
    "https://msdwbkeszkklbelimvaw.supabase.co/rest/v1/ARData?id=eq.4dce27a0-486c-4d87-a0b7-7c6b66dd210e";
  const apiKey = "sb_publishable_r3PnOOMf8ORPxaYZnu2sPg_C81V5KN8";

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        apikey: apiKey,
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

    const data = await response.json();
    const arData = data[0];
    if (!arData || !arData["image tracking"] || !arData.mindFile)
      throw new Error("Invalid data structure from Supabase.");

    const targets = arData["image tracking"];
    const mindFile = arData.mindFile;

    const scene = document.createElement("a-scene");
    scene.setAttribute(
      "mindar-image",
      `imageTargetSrc: ${mindFile}; autoStart: true; maxTrack: 3;`
    );
    scene.setAttribute("vr-mode-ui", "enabled: false");
    scene.setAttribute("device-orientation-permission-ui", "enabled: true");

    const camera = document.createElement("a-camera");
    camera.setAttribute("position", "0 0 0");
    camera.setAttribute("look-controls", "enabled: false");
    scene.appendChild(camera);

    const assets = document.createElement("a-assets");
    scene.appendChild(assets);
    // --- Add lights similar to modelViewer ---
    // Ambient light
    const ambientLight = document.createElement("a-entity");
    ambientLight.setAttribute(
      "light",
      "type: ambient; color: #fff5cc; intensity: 2"
    );
    scene.appendChild(ambientLight);

    // Directional light 1 (main)
    const dirLight1 = document.createElement("a-entity");
    dirLight1.setAttribute(
      "light",
      "type: directional; color: #ffffff; intensity: 2; castShadow: true"
    );
    dirLight1.setAttribute("position", "5 10 5");
    // Shadow tuning (A-Frame/light adapters may ignore unsupported props)
    dirLight1.setAttribute(
      "shadow",
      "mapSizeWidth: 1024; mapSizeHeight: 1024; cameraNear: 0.5; cameraFar: 50"
    );
    scene.appendChild(dirLight1);

    // Directional light 2 (fill)
    const dirLight2 = document.createElement("a-entity");
    dirLight2.setAttribute(
      "light",
      "type: directional; color: #aaaaaa; intensity: 2"
    );
    dirLight2.setAttribute("position", "-5 5 -5");
    scene.appendChild(dirLight2);

    document.body.appendChild(scene);

    let targetIndex = 0;

    for (const key in targets) {
      if (!targets[key] || !Array.isArray(targets[key])) continue;

      const models = targets[key];

      // สร้าง entity ของ target
      const entity = document.createElement("a-entity");
      entity.setAttribute("mindar-image-target", `targetIndex: ${targetIndex}`);

      models.forEach((t, modelIdx) => {
        // Video
        if (t.type === "Video") {
          const video = document.createElement("video");
          video.id = `video-${targetIndex}-${modelIdx}`;
          video.src = t.src;
          video.autoplay = t.autoplay ?? false;
          video.loop = t.loop ?? false;
          video.muted = t.muted ?? true;
          video.playsInline = true;
          assets.appendChild(video);

          const videoEl = document.createElement("a-video");
          videoEl.setAttribute("src", `#video-${targetIndex}-${modelIdx}`);
          videoEl.setAttribute("scale", t.scale.join(" "));
          videoEl.setAttribute("position", t.position.join(" "));
          videoEl.setAttribute(
            "rotation",
            t.rotation ? t.rotation.join(" ") : "0 0 0"
          );
          entity.appendChild(videoEl);
        }

        // 3D Model
        if (t.type === "3D Model") {
          const model = document.createElement("a-gltf-model");
          model.setAttribute("src", t.src);
          model.setAttribute("scale", t.scale.join(" "));
          model.setAttribute("position", t.position.join(" "));
          model.setAttribute(
            "rotation",
            t.rotation ? t.rotation.join(" ") : "0 0 0"
          );
          entity.appendChild(model);
        }

        // Image
        if (t.type === "Image") {
          const img = document.createElement("a-image");
          img.setAttribute("src", t.src);
          img.setAttribute("scale", t.scale.join(" "));
          img.setAttribute("position", t.position.join(" "));
          img.setAttribute(
            "rotation",
            t.rotation ? t.rotation.join(" ") : "0 0 0"
          );
          if (t.opacity !== undefined) img.setAttribute("opacity", t.opacity);
          entity.appendChild(img);
        }
      });

      scene.appendChild(entity);
      targetIndex++;
    }

    scene.addEventListener("arReady", () => {
      Object.keys(targets).forEach((key, tIdx) => {
        targets[key].forEach((t, mIdx) => {
          if (t.type === "Video")
            document.getElementById(`video-${tIdx}-${mIdx}`).play();
        });
      });
      document.getElementById("status").innerText = "AR พร้อมใช้งาน!";
    });
  } catch (error) {
    console.error("Failed to fetch AR data:", error);
  }
}

initAR();
