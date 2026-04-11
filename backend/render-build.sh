#!/usr/bin/env bash
# exit on error
set -o errexit

# Install FFmpeg
# Render's Python environment is Ubuntu-based.
# We can use this to install binary dependencies.
echo "Installing FFmpeg..."
mkdir -p ffmpeg
curl -L https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz | tar xJ -C ffmpeg --strip-components 1
export PATH=$PATH:$(pwd)/ffmpeg

# Install Python dependencies
pip install -r requirements.txt

echo "Build complete."
