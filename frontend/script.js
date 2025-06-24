// script.js

const video = document.getElementById("camera");
const canvas = document.getElementById("canvas");
const preview = document.getElementById("preview");
const sendBtn = document.getElementById("send-btn");
const retakeBtn = document.getElementById("retake-btn");
const downloadBtn = document.getElementById("download-btn");
const instruction = document.getElementById("instruction");
const nameInput = document.getElementById("fingerprint-name");
const saveLocalBtn = document.getElementById("save-local-btn");
const ctx = canvas.getContext("2d");

const flash = document.createElement("div");
flash.style.position = "fixed";
flash.style.top = 0;
flash.style.left = 0;
flash.style.width = "100%";
flash.style.height = "100%";
flash.style.backgroundColor = "white";
flash.style.opacity = 0;
flash.style.pointerEvents = "none";
flash.style.transition = "opacity 0.3s ease";
document.body.appendChild(flash);

function triggerFlash() {
  flash.style.opacity = 0.8;
  setTimeout(() => {
    flash.style.opacity = 0;
  }, 150);
}

let model, autoCaptured = false;

async function setupCamera() {
  const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
  video.srcObject = stream;
  return new Promise(resolve => {
    video.onloadedmetadata = () => resolve(video);
  });
}

function captureFromVideo() {
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  preview.src = canvas.toDataURL("image/png");
  preview.style.display = "block";
  sendBtn.style.display = "inline-block";
  retakeBtn.style.display = "inline-block";
  downloadBtn.style.display = "inline-block";
  triggerFlash();
}

async function detectThumb() {
  const predictions = await model.estimateHands(video);
  if (predictions.length > 0) {
    const thumbTip = predictions[0].annotations.thumb[3];
    const [thumbX, thumbY, z] = thumbTip;

    const guideBox = document.getElementById("guide-box");
    const box = guideBox.getBoundingClientRect();
    const centerX = box.left + box.width / 2;
    const centerY = box.top + box.height / 2;

    const boxLeft = centerX - 70;
    const boxRight = centerX + 70;
    const boxTop = centerY - 70;
    const boxBottom = centerY + 70;

    const inCenter = thumbX >= boxLeft && thumbX <= boxRight && thumbY >= boxTop && thumbY <= boxBottom;
    const idealSize = z < 60;

    instruction.textContent = inCenter && idealSize
      ? "✅ Capturing thumb..."
      : idealSize
        ? "📍 Move thumb to center of box"
        : "🤏 Move thumb closer to camera";

    if (inCenter && idealSize && !autoCaptured) {
      autoCaptured = true;
      setTimeout(() => {
        captureFromVideo();
        instruction.textContent = "✅ Captured. You may now send or save.";
      }, 500);
    }
  } else {
    instruction.textContent = "🖐 Show your hand with thumb visible";
  }

  requestAnimationFrame(detectThumb);
}

(async () => {
  await setupCamera();
  model = await handpose.load();
  console.log("Handpose model loaded");
  detectThumb();
})();

sendBtn.addEventListener("click", () => {
  const base64String = preview.src.split(",")[1];

  fetch("http://127.0.0.1:8000/verify-fingerprint/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ fingerprint: base64String })
  })
    .then(res => res.json())
    .then(data => {
      console.log("📨 Response from backend:", data);
      document.getElementById("response").textContent = JSON.stringify(data, null, 2);
    })
    .catch(err => {
      console.error("❌ Error sending fingerprint:", err);
      alert("Failed to send fingerprint to server.");
    });
});

retakeBtn.addEventListener("click", () => {
  preview.style.display = "none";
  sendBtn.style.display = "none";
  retakeBtn.style.display = "none";
  downloadBtn.style.display = "none";
  instruction.textContent = "📍 Place your thumb in the center box";
  autoCaptured = false;
});

downloadBtn.addEventListener("click", () => {
  const link = document.createElement("a");
  link.href = preview.src;
  link.download = `captured_thumb_${Date.now()}.png`;
  link.click();
});

document.getElementById("capture-btn").addEventListener("click", () => {
  if (!autoCaptured) {
    captureFromVideo();
    instruction.textContent = "✅ Captured (via Button). You may now send or save.";
    autoCaptured = true;
  }
});

document.addEventListener("keydown", e => {
  if (e.code === "Space" && !autoCaptured) {
    e.preventDefault();
    captureFromVideo();
    instruction.textContent = "✅ Captured (via Space). You may now send or save.";
    autoCaptured = true;
  }
});

saveLocalBtn.addEventListener("click", () => {
  const name = nameInput.value.trim();
  if (!name) {
    alert("Please enter a name to save the fingerprint.");
    return;
  }
  const dataURL = preview.src;
  localStorage.setItem(`fingerprint_${name}`, dataURL);
  alert(`Fingerprint for '${name}' saved locally.`);
});
