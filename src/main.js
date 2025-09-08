import "aframe";
import "mind-ar/dist/mindar-image-aframe.prod.js";

const startBtn = document.getElementById("startBtn");
const scene = document.querySelector("a-scene");

startBtn.addEventListener("click", async () => {
  // iOS ต้องขอ permission กล้องก่อน
  await navigator.mediaDevices.getUserMedia({
    video: { facingMode: "environment" },
  });

  scene.style.display = "block";
  document.querySelector("a-scene").components["mindar-image"].start();
  startBtn.style.display = "none";
});
