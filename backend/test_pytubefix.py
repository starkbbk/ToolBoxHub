from pytubefix import YouTube

url = "https://www.youtube.com/watch?v=Lupc_Oddhko"
try:
    yt = YouTube(url, use_po_token=True)
    print("Title:", yt.title)
    streams = yt.streams.filter(type="video")
    for s in streams:
        print(s.resolution, s.url[:20])
except Exception as e:
    print("Failed pytubefix:", e)
