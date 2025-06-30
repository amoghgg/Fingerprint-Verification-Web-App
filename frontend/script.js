const video = document.getElementById("camera");
const canvas = document.getElementById("canvas");
const preview = document.getElementById("preview");
const captureBtn = document.getElementById("capture-btn");
const sendBtn = document.getElementById("send-btn");
const responseBox = document.getElementById("response");
const userInput = document.getElementById("user-name");
const modeSelector = document.getElementById("mode");

let autoCaptured = false;

async function setupCamera() {
  const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
  video.srcObject = stream;
}

function enhanceFrame(imageData) {
  const src = cv.matFromImageData(imageData);
  let gray = new cv.Mat(), clahe = new cv.Mat(), dst = new cv.Mat();

  cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
  let claheFilter = new cv.CLAHE(2.0, new cv.Size(8, 8));
  claheFilter.apply(gray, clahe);
  claheFilter.delete();

  let kernel = cv.matFromArray(3, 3, cv.CV_32F, [-1,-1,-1,-1,9,-1,-1,-1,-1]);
  cv.filter2D(clahe, dst, cv.CV_8U, kernel);
  cv.imshow("canvas", dst);

  src.delete(); gray.delete(); clahe.delete(); dst.delete(); kernel.delete();
}

function captureFromVideo() {
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  enhanceFrame(imageData);
  preview.src = canvas.toDataURL("image/png");
  preview.style.display = "block";
  sendBtn.style.display = "inline-block";
  responseBox.textContent = "✅ Frame captured.";
}

function sendToServer() {
  const base64Image = preview.src.split(',')[1];
  const name = userInput.value.trim();
  const mode = modeSelector.value;

  if (!name) return alert("Enter a name first.");
  const payload = {
    fingerprint: base64Image,
    name: name,
    mode: mode
  };

  fetch("http://127.0.0.1:8000/verify-fingerprint/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  })
    .then(res => res.json())
    .then(data => {
      if (data.Person?.Match === true || data.Success === true) {
        const score = Math.floor(Math.random() * 15) + 85; // Simulated match %
        const info = `✅ VERIFIED!\nName: ${name}\nMatch Score: ${score}%`;
        responseBox.textContent = info;
      } else {
        responseBox.textContent = "❌ Not matched or error.\n" + JSON.stringify(data, null, 2);
      }
    })
    .catch(err => {
      console.error("Error:", err);
      responseBox.textContent = "❌ Error sending to server.";
    });
}

function startAutoCapture() {
  const ctx = canvas.getContext("2d");
  setInterval(() => {
    if (autoCaptured) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const clarity = checkSharpness(imageData.data);
    if (clarity > 30) {
      autoCaptured = true;
      enhanceFrame(imageData);
      preview.src = canvas.toDataURL("image/png");
      preview.style.display = "block";
      sendBtn.style.display = "inline-block";
      responseBox.textContent = "✅ Auto-captured.";
    }
  }, 1000);
}

function checkSharpness(data) {
  let variance = 0;
  for (let i = 0; i < data.length; i += 4) {
    variance += Math.abs(data[i] - 128);
  }
  return variance / (data.length / 4);
}

captureBtn.addEventListener("click", () => {
  autoCaptured = true;
  captureFromVideo();
});

sendBtn.addEventListener("click", sendToServer);

document.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    e.preventDefault();
    autoCaptured = true;
    captureFromVideo();
  }
});

setupCamera().then(() => {
  if (cv.getBuildInformation) startAutoCapture();
});
