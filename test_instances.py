import requests

instances = [
    "https://cobalt-api.meowing.de",
    "https://cobalt-backend.canine.tools",
    "https://capi.3kh0.net",
    "https://downloadapi.stuff.solutions",
    "https://cobalt-api.kwiatekmiki.com"
]

payload10 = {
    "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "vQuality": "720",
    "vCodec": "h264"
}

headers = {
    "Accept": "application/json",
    "Content-Type": "application/json",
    "User-Agent": "Mozilla/5.0"
}

for instance in instances:
    print(f"Testing {instance}...")
    try:
        r = requests.post(instance + "/", json=payload10, headers=headers, timeout=5)
        print(f"  v10 endpoint: {r.status_code}")
        if r.status_code == 200:
            print("  v10 RESPONSE: ", r.json())
        else:
            print("  v10 ERROR: ", r.text[:100])
    except Exception as e:
        print(f"  v10 exception: {e}")

