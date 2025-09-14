import { ARData } from "./makedata.js";

function fetchARData() {
  return new Promise((resolve) => {
    setTimeout(() => resolve(ARData), 500);
  });
}

async function initAR() {
  const data = await fetchARData();
  const targets = data["image tracking"];
  const mindFile = data.mindFile;

  // สร้าง <a-scene> dynamic
  const scene = document.createElement("a-scene");
  scene.setAttribute(
    "mindar-image",
    `imageTargetSrc: ${mindFile}; autoStart: true; maxTrack: 3;`
  );
  scene.setAttribute("vr-mode-ui", "enabled: false");
  scene.setAttribute("device-orientation-permission-ui", "enabled: true");

  // สร้าง <a-camera>
  const camera = document.createElement("a-camera");
  camera.setAttribute("position", "0 0 0");
  camera.setAttribute("look-controls", "enabled: false");
  scene.appendChild(camera);

  // สร้าง <a-assets>
  const assets = document.createElement("a-assets");
  scene.appendChild(assets);

  // append scene ลง body
  document.body.appendChild(scene);

  // สร้าง target entities
  let index = 0;
  for (const key in targets) {
    const t = targets[key];

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
      entity.appendChild(model);
    }

    if (t.type === "Image Overlay") {
      const img = document.createElement("a-image");
      img.setAttribute("src", t.src);
      img.setAttribute("scale", t.scale.join(" "));
      img.setAttribute("position", t.position.join(" "));
      if (t.opacity !== undefined) img.setAttribute("opacity", t.opacity);
      entity.appendChild(img);
    }

    if (t.type === "Video") {
      const videoEl = document.createElement("a-video");
      videoEl.setAttribute("src", `#video-${index}`);
      videoEl.setAttribute("scale", t.scale.join(" "));
      videoEl.setAttribute("position", t.position.join(" "));
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
}

initAR();
