async function initAR() {
  const url = 'https://msdwbkeszkklbelimvaw.supabase.co/rest/v1/ARData?id=eq.4dce27a0-486c-4d87-a0b7-7c6b66dd210e';
  const apiKey = 'sb_publishable_r3PnOOMf8ORPxaYZnu2sPg_C81V5KN8';

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'apikey': apiKey,
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    const arData = data[0];

    if (!arData || !arData['image tracking'] || !arData.mindFile) {
      throw new Error("Invalid data structure from Supabase.");
    }

    const targets = arData['image tracking'];
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

    document.body.appendChild(scene);

    let index = 0;
    for (const key in targets) {
      const t = targets[key];
      if (key === 'mindFile') continue;

      if (t.type === "Video") {
        const video = document.createElement("video");
        video.id = `video-${index}`;
        video.src = t.src;
        video.autoplay = t.autoplay ?? false;
        video.loop = t.loop ?? false;
        video.muted = t.muted ?? true;
        video.playsInline = true;
        assets.appendChild(video);
      }

      const entity = document.createElement("a-entity");
      entity.setAttribute("mindar-image-target", `targetIndex: ${index}`);

      if (t.type === "3D Model") {
        const model = document.createElement("a-gltf-model");
        model.setAttribute("src", t.src);
        model.setAttribute("scale", t.scale.join(" "));
        model.setAttribute("position", t.position.join(" "));
        model.setAttribute("rotation", t.rotation ? t.rotation.join(" ") : "0 0 0"); // เพิ่ม rotation
        entity.appendChild(model);
      }

      if (t.type === "Image") {
        const img = document.createElement("a-image");
        img.setAttribute("src", t.src);
        img.setAttribute("scale", t.scale.join(" "));
        img.setAttribute("position", t.position.join(" "));
        if (t.opacity !== undefined) img.setAttribute("opacity", t.opacity);
        img.setAttribute("rotation", t.rotation ? t.rotation.join(" ") : "0 0 0"); // เพิ่ม rotation
        entity.appendChild(img);
      }

      if (t.type === "Video") {
        const videoEl = document.createElement("a-video");
        videoEl.setAttribute("src", `#video-${index}`);
        videoEl.setAttribute("scale", t.scale.join(" "));
        videoEl.setAttribute("position", t.position.join(" "));
        videoEl.setAttribute("rotation", t.rotation ? t.rotation.join(" ") : "0 0 0"); // เพิ่ม rotation
        entity.appendChild(videoEl);
      }

      scene.appendChild(entity);
      index++;
    }

    scene.addEventListener("arReady", () => {
      Object.keys(targets).forEach((_, i) => {
        const t = targets[`target${i}`];
        if (t.type === "Video") document.getElementById(`video-${i}`).play();
      });
      document.getElementById("status").innerText = "AR พร้อมใช้งาน!";
    });

  } catch (error) {
    console.error("Failed to fetch AR data:", error);
  }
}

initAR();