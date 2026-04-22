import requests

url = "https://p.oceansaver.in/ajax/download.php?button=1&start=1&end=1&isAudioOnly=0&quality=1080&format=mp4&title=test&v=https://www.youtube.com/watch?v=dQw4w9WgXcQ"
headers = {"User-Agent": "Mozilla/5.0"}
try:
    r = requests.get(url, headers=headers)
    print(r.json())
except Exception as e:
    print(e)
