import asyncio
import os

YTDLP_BIN = "/Users/starkbbk/Downloads/Projects/ToolboxHub/backend/yt-dlp_bin"
FFMPEG = "/opt/homebrew/bin/ffmpeg"

async def test():
    fmt = "137+bestaudio[ext=m4a]/best"
    out = "/tmp/test_dl_%(title).30s.%(ext)s"
    url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    
    cmd = [YTDLP_BIN, '-f', fmt, '-o', out, '--ffmpeg-location', FFMPEG, '--merge-output-format', 'mp4', '--no-warnings', url]
    
    proc = await asyncio.create_subprocess_exec(
        *cmd,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.STDOUT
    )
    
    output = []
    async for line in proc.stdout:
        text = line.decode('utf-8', errors='ignore').strip()
        if text:
            output.append(text)
    
    await proc.wait()
    print("Return code:", proc.returncode)
    print("Last 5 lines:")
    for l in output[-5:]:
        print(" ", l)

asyncio.run(test())
