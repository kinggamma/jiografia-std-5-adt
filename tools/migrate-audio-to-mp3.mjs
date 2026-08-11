import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const locale = path.join(root, "content", "i18n", "sw-TZ")
const textsPath = path.join(locale, "texts.json")
const audiosPath = path.join(locale, "audios.json")
const manifestPath = path.join(root, "regen", "manifest.json")

const read = (file) => JSON.parse(fs.readFileSync(file, "utf8"))
const write = (file, value) => fs.writeFileSync(file, JSON.stringify(value, null, 2) + "\n")

const texts = read(textsPath)
const audios = read(audiosPath)
for (const [id, file] of Object.entries(audios)) {
  if (!String(texts[id] ?? "").trim()) {
    delete audios[id]
    continue
  }
  audios[id] = file.replace(/\.wav$/i, ".mp3")
}
write(audiosPath, audios)

const manifest = read(manifestPath)
for (const language of Object.values(manifest.languages || {})) {
  if (language.defaults) language.defaults.format = "mp3"
  for (const settings of Object.values(language.entrySettings || {})) settings.format = "mp3"
  for (const settings of Object.values(language.entryConfigBaselines || {})) settings.format = "mp3"
}
write(manifestPath, manifest)

console.log(`Updated ${Object.keys(audios).length} audio mappings and manifest settings to MP3.`)
