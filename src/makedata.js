export const ARData = {
  "image tracking": {
    "target0": {
      type: "3D Model",
      src: "./model.gltf",
      scale: [0.2, 0.2, 0.2],
      position: [0, 0, 0]
    },
    "target1": {
      type: "Image Overlay",
      src: "https://res.cloudinary.com/dy4mj1kbt/image/upload/v1741769930/AS0101_pamh6b.jpg",
      scale: [1, 1, 1],
      position: [0, 0, 0.1],
      opacity: 1
    },
    "target2": {
      type: "Video",
      src: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
      scale: [1, 0.75, 1],
      position: [0, 0, 0.1],
      autoplay: true,
      loop: true,
      muted: true
    }
  },
  "mindFile": "/merge3.mind"
};
