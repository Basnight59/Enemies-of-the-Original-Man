# video/

Self-hosted video for the Media section (`#video` card in `index.html`).

- `book-trailer.mp4`: 30-second vertical (1080×1920) H.264/AAC book trailer, about 15 MB.
  It is an unmodified copy of `Enemies-of-the-Original-Man-Book-Trailer-Voiceover.mp4`.

- `book-trailer-poster.jpg`: the cover frame at 6 seconds, shown before playback:

      ffmpeg -ss 6 -i video/book-trailer.mp4 -frames:v 1 -vf "scale=540:-1" -q:v 4 video/book-trailer-poster.jpg

Adding a longer video: GitHub rejects files over 100 MB, so keep each file under about 50 MB.

    ffmpeg -i source.mov -c:v libx264 -crf 26 -preset slow -vf "scale=-2:720" -c:a aac -b:a 96k -movflags +faststart video/name.mp4

If a file is still too large, raise `-crf` to 28–30, or host it on Vimeo or YouTube (unlisted) and embed that instead.
`.player-video` in `styles.css` is sized for vertical video, so a widescreen video needs its own aspect ratio.
