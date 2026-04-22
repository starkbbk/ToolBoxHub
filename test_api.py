import requests

url = "http://localhost:8000/api/yt-downloader/extract"
data = {"url": "https://www.youtube.com/watch?v=Lupc_Oddhko"}
r = requests.post(url, json=data)
print(r.json())
