from django.http import JsonResponse
from django..decorators.csrf import csrf_exempt
import json, requests

@csrf_exempt
def verify_fingerprint(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            fingerprint = data.get("fingerprint")
            name = data.get("name", "anonymous")
            mode = data.get("mode", "enroll")

            if not fingerprint:
                return JsonResponse({"error": "No fingerprint provided"}, status=400)

            payload = {
                "Person": {
                    "CustomID": name,
                    "Fingers": [
                        {
                            "Finger-1": fingerprint
                        }
                    ]
                }
            }

            headers = {
                "Content-Type": "application/json",
                "Ocp-Apim-Subscription-Key": "2d32a11ac4204166802326fe014d558a"
            }

            url = "https://api.biopassid.com/multibiometrics/verify" if mode == "verify" else "https://api.biopassid.com/multibiometrics/enroll"
            response = requests.post(url, headers=headers, json=payload)

            try:
                return JsonResponse(response.json(), status=response.status_code)
            except:
                return JsonResponse({
                    "error": "Failed to parse response from BioPass",
                    "raw_response": response.text
                }, status=response.status_code)

        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
    return JsonResponse({"error": "Invalid request method"}, status=405)
