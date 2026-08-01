# Jiografia na Mazingira — Darasa la Tano

Accessible Digital Textbook (ADT) in Swahili (`sw-TZ`).

Live site: <https://kinggamma.github.io/jiografia-std-5-adt/index.html>

## Updating audio

GitHub Pages uses the compressed MP3 files. Original WAV files remain local and are ignored by Git.

After replacing a WAV file, regenerate its matching MP3 while keeping the same basename:

```bash
ffmpeg -i content/i18n/sw-TZ/audio/example.wav \
  -codec:a libmp3lame -b:a 64k \
  content/i18n/sw-TZ/audio/example.mp3
```

Then commit and push the changed MP3 file.
