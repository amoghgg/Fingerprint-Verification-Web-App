import requests
import json

url = "https://hml-api.biopassid.com/multibiometrics/enroll"

payload = json.dumps({
    "Person": {
        "CustomID": "test123",
        "Fingerprint": [
            {"Fingerprint-1": "R0lGODlhAQABAIAAAAUEBAgAAAAAACwAAAAAAQABAAACAkQBADs="}
        ]
    }
})

headers = {
    "Content-Type": "application/json",
    "Ocp-Apim-Subscription-Key": "LCZ4-JHYN-8PXS-P5FI"
}

response = requests.post(url, headers=headers, data=payload)

print("Status Code:", response.status_code)
print("Response Body:", response.text)
