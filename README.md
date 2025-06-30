# 🔐 Fingerprint Verification Web App

This web application simulates a complete fingerprint **enrollment and verification** system using the **device camera** (front or back). It supports **real-time thumb detection**, automatic image enhancement using **OpenCV.js**, and integration with the **BioPass ID API** for production-level fingerprint authentication.

---

## 🚀 Features

- 📷 Live camera feed with real-time preview
- 🤏 Automatic thumb detection using TensorFlow.js Handpose
- 🖐️ Manual capture via button or spacebar
- 🧠 Image enhancement (CLAHE + sharpening) via OpenCV.js
- 📲 Front-camera compatibility for mobile devices (tested on iPhone 13)
- 🔐 Seamless integration with BioPass production API
- 🧪 Enroll and Verify modes with real-time feedback
- 🧾 JSON payloads constructed dynamically with unique CustomID
- 📊 Verification results with matching outcome and efficiency scores
- 📦 Local testing support without external hardware (no MFS110)

---

## 🧪 Workflow

1. **User shows thumb in camera** (front/back)
2. App detects thumb and auto-captures OR user captures manually
3. Image is enhanced in-browser using OpenCV
4. Base64 image is sent to Django backend with user name and mode
5. Backend hits BioPass API to either enroll or verify
6. API response is displayed with match results and confidence

---

## ⚙️ Tech Stack

**Frontend**  
- HTML + JavaScript  
- TensorFlow.js  
- OpenCV.js  

**Backend**  
- Django (Python)  
- REST API via `requests`  
- Local dev server (127.0.0.1:8000)

**External Service**  
- [BioPassID Production API](https://docs.biopassid.com)

---

## 📁 Folder Structure

Fingerprint-Verification-Web-App/
│
├── frontend/
│ ├── index.html # UI with camera, form, buttons
│ ├── script.js # Logic for capture, detection, and API calls
│ ├── thumb-demo.png # Instructional thumb image
│
├── backend/
│ ├── amoghfp/
│ │ └── amoghfpapp/
│ │ └── views.py # Django view for /verify-fingerprint/
│ └── manage.py
│
├── payload.json # For curl or Postman testing


---

## 🧾 API Payload Example

```json
{
  "Person": {
    "CustomID": "amogh_20250630_1742",
    "Fingers": [
      {
        "Finger-1": "<base64-string>"
      }
    ]
  }
}
## Response Sample
{
  "Person": {
    "CustomID": "amogh_20250630_1742",
    "Match": true,
    "MatchDetails": {
      "NonMatchedFingers": ["Finger-2", "Finger-3", ...],
      "FaceMatched": false
    }
  },
  "Success": true
}
📸 Image Capture Tips
Use proper lighting with no glare

Place thumb clearly in front of camera

Avoid blur: hold steady for 1–2 seconds

Use a macro lens attachment (₹300) for best clarity

🔐 Notes
Fingerprint matching accuracy depends heavily on image quality

External fingerprint scanners like MFS110 are not used

All fingerprint minutiae are extracted via the BioPassID API from the captured photo

Real-time matching may succeed even for noisy inputs – enhancement in progress

👨‍💻 Author
Amogh Bajpai
Product Development Intern @ Innovatiview
GitHub: @amoghgg
LinkedIn: linkedin.com/in/amogh-bajpai

