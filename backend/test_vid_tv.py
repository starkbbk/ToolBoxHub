import yt_dlp
URL = "https://www.youtube.com/watch?v=Lupc_Oddhko"
ydl_opts = {'quiet': True, 'extract_flat': False, 'skip_download': True, 'extractor_args': {'youtube': {'player_client': ['tv']}}}
with yt_dlp.YoutubeDL(ydl_opts) as ydl:
    info = ydl.extract_info(URL, download=False)
    formats = info.get("formats", [])
    high_res = [f for f in formats if (f.get("height") or 0) >= 720]
    print(f"Total formats: {len(formats)}")
    print(f"High res formats: {len(high_res)}")
