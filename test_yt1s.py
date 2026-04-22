import requests
import json

def test_yt1s():
    url = "https://yt1s.com/api/ajaxSearch/index"
    data = {
        "q": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        "vt": "home"
    }
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Content-Type": "application/x-www-form-urlencoded"
    }
    try:
        r = requests.post(url, data=data, headers=headers)
        print("YT1S Status:", r.status_code)
        print("Response:", r.text[:200])
    except Exception as e:
        print("Error:", e)

test_yt1s()
