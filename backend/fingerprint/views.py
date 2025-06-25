from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
import requests

@csrf_exempt
def verify_fingerprint(request):
    if request.method == 'POST':
        print("✅ Received POST /verify-fingerprint/")
        try:
            data = json.loads(request.body)
            print("📦 Payload received:", data)

            fingerprint_base64 = data.get("fingerprint")
            if not fingerprint_base64:
                print("⚠️ No fingerprint provided.")
                return JsonResponse({"error": "No fingerprint provided"}, status=400)

            # ✅ Production-ready payload
            payload = {
                "Person": {
                    "CustomID": "1234",
                    "Fingerprints": [
                        {
                            "Position": "LEFT_THUMB",
                            "Image": fingerprint_base64
                        }
                    ]
                }
            }

            headers = {
                "Content-Type": "application/json",
                "Ocp-Apim-Subscription-Key": "2d32a11ac4204166802326fe014d558a"
            }

            biopass_url = "https://api.biopassid.com/multibiometrics/enroll"

            print("📤 Sending request to BioPass...")
            print("🔐 Payload:", json.dumps(payload, indent=2))

            response = requests.post(biopass_url, headers=headers, json=payload)

            print("✅ BioPass response status:", response.status_code)
            print("📄 Raw response content:\n", response.text)

            try:
                return JsonResponse(response.json(), status=response.status_code)
            except ValueError:
                return JsonResponse({
                    "error": "Invalid JSON returned from BioPass",
                    "raw_response": response.text
                }, status=response.status_code)

        except Exception as e:
            print("❌ Exception occurred:", str(e))
            return JsonResponse({"error": str(e)}, status=500)

    return JsonResponse({"error": "Invalid request method"}, status=405)
