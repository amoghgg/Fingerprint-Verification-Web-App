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

let model, autoCaptured = false, cooldown = false;

async function setupCamera() {
  const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
  video.srcObject = stream;
  return new Promise(resolve => {
    video.onloadedmetadata = () => resolve(video);
  });
}

function drawThumbMask() {
  const maskCanvas = document.getElementById("mask-canvas");
  maskCanvas.width = video.videoWidth;
  maskCanvas.height = video.videoHeight;

  const mctx = maskCanvas.getContext("2d");
  mctx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);

  mctx.fillStyle = "rgba(0, 0, 0, 0.5)";
  mctx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);

  const x = maskCanvas.width * 0.33;
  const y = maskCanvas.height * 0.18;
  const w = maskCanvas.width * 0.34;
  const h = maskCanvas.height * 0.62;

  mctx.clearRect(x, y, w, h);
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

function resetCaptureState() {
  autoCaptured = false;
  cooldown = false;
  preview.style.display = "none";
  sendBtn.style.display = "none";
  retakeBtn.style.display = "none";
  downloadBtn.style.display = "none";
  instruction.textContent = "📍 Align your thumb with the guide";
}

function triggerAutoCapture() {
  if (cooldown || autoCaptured) return;

  console.log("📸 Auto-capture triggered");
  autoCaptured = true;
  cooldown = true;

  setTimeout(() => {
    captureFromVideo();
    instruction.textContent = "✅ Thumb captured.";

    setTimeout(() => {
      autoCaptured = false;
      cooldown = false;
      instruction.textContent = "📍 Ready for next thumb";
    }, 3000);
  }, 300);
}

function isFingerInRegion(fingerPoints, region) {
  return fingerPoints.some(([x, y]) =>
    x >= region.xMin && x <= region.xMax &&
    y >= region.yMin && y <= region.yMax
  );
}

async function detectThumb() {
  const predictions = await model.estimateHands(video);

  if (predictions.length === 1) {
    const annotations = predictions[0].annotations;
    const thumb = annotations.thumb;

    if (thumb && thumb.length >= 4) {
      const [base, , , tip] = thumb;
      const [x1, y1] = tip;
      const [x2, y2] = base;
      const distance = Math.hypot(x2 - x1, y2 - y1);

      const overlayRegion = {
        xMin: video.videoWidth * 0.33,
        xMax: video.videoWidth * 0.67,
        yMin: video.videoHeight * 0.18,
        yMax: video.videoHeight * 0.80
      };

      const thumbInside =
        x1 >= overlayRegion.xMin && x1 <= overlayRegion.xMax &&
        y1 >= overlayRegion.yMin && y1 <= overlayRegion.yMax &&
        x2 >= overlayRegion.xMin && x2 <= overlayRegion.xMax &&
        y2 >= overlayRegion.yMin && y2 <= overlayRegion.yMax;

      const otherFingers = ['indexFinger', 'middleFinger', 'ringFinger', 'pinky'];
      const anyOtherFingerInRegion = otherFingers.some(f =>
        isFingerInRegion(annotations[f], overlayRegion)
      );

      if (thumbInside && distance > 80 && !anyOtherFingerInRegion) {
        instruction.textContent = "👍 Thumb aligned, capturing...";
        triggerAutoCapture();
      } else {
        instruction.textContent = "📍 Only thumb should be inside the guide";
      }
    } else {
      instruction.textContent = "🖐 Show your thumb with base clearly";
    }
  } else {
    instruction.textContent = "👋 Place one hand with thumb in the guide";
  }

  requestAnimationFrame(detectThumb);
}

(async () => {
  await setupCamera();
  drawThumbMask();
  model = await handpose.load();
  console.log("🤖 Handpose model loaded");
  detectThumb();
})();

sendBtn.addEventListener("click", () => {
  const base64String = preview.src.split(",")[1];
  fetch("http://127.0.0.1:8000/verify-fingerprint/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fingerprint: base64String })
  })
    .then(res => res.json())
    .then(data => {
      console.log("📨 Response from backend:", data);
      document.getElementById("response").textContent = JSON.stringify(data, null, 2);
      resetCaptureState();
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
  instruction.textContent = "📍 Place your thumb in the guide";
  autoCaptured = false;
  cooldown = false;
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
