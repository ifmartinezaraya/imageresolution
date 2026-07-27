const express = require("express");
const multer = require("multer");
const sharp = require("sharp");
const path = require("path");

const app = express();
// Puerto configurable via variable de entorno (necesario para desplegar en Render/Railway/etc.)
const port = process.env.PORT || 1337;

// Ajustes de memoria: importante para instancias pequeñas (p. ej. plan gratuito de Render, 512 MB).
// Desactivamos la caché de libvips y limitamos la concurrencia para evitar quedarnos sin RAM.
sharp.cache(false);
sharp.concurrency(1);

// Multer: guardamos el archivo en memoria y limitamos el tamaño a 25 MB
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
});

// Presets de tamaños por defecto (se usan si el cliente no envía tamaños propios)
const DEFAULT_SIZES = [
  { label: "Ultra Wide 32:9", width: 2560, height: 720 },
  { label: "HD 16:9", width: 1280, height: 720 },
  { label: "Retrato 3:4", width: 1098, height: 1464 },
  { label: "Miniatura", width: 600, height: 338 },
  { label: "Cuadrado 1:1", width: 1080, height: 1080 },
  { label: "Story 9:16", width: 1080, height: 1920 },
];

const VALID_FITS = ["inside", "cover", "contain", "fill", "outside"];

// Formatos de salida soportados. Cada uno define su mimetype, extensión y cómo lo genera sharp.
const FORMATS = {
  webp: { mime: "image/webp", ext: "webp", apply: (img) => img.webp({ quality: 80 }) },
  avif: { mime: "image/avif", ext: "avif", apply: (img) => img.avif({ quality: 50, effort: 2 }) },
  png: { mime: "image/png", ext: "png", apply: (img) => img.png({ compressionLevel: 9 }) },
  jpeg: { mime: "image/jpeg", ext: "jpg", apply: (img) => img.jpeg({ quality: 85, mozjpeg: true }) },
};
const DEFAULT_FORMATS = ["webp", "avif", "png", "jpeg"];

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Endpoint principal: redimensiona la imagen a los tamaños indicados
// y devuelve JSON con las versiones WebP y AVIF (data URIs) + su peso.
app.post("/upload", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No se recibió ninguna imagen." });
    }

    const originalImage = req.file.buffer;

    // El cliente puede enviar tamaños personalizados como JSON en el campo "sizes".
    let sizes = DEFAULT_SIZES;
    if (req.body.sizes) {
      try {
        const parsed = JSON.parse(req.body.sizes);
        if (Array.isArray(parsed) && parsed.length > 0) {
          sizes = parsed
            .map((s) => ({
              label: String(s.label || `${s.width}x${s.height}`),
              width: parseInt(s.width, 10),
              height: parseInt(s.height, 10),
            }))
            .filter(
              (s) =>
                Number.isFinite(s.width) &&
                Number.isFinite(s.height) &&
                s.width > 0 &&
                s.height > 0 &&
                s.width <= 10000 &&
                s.height <= 10000
            );
        }
      } catch (e) {
        return res.status(400).json({ error: "El campo 'sizes' no es un JSON válido." });
      }
    }

    if (sizes.length === 0) {
      return res.status(400).json({ error: "No se indicó ningún tamaño válido." });
    }

    // Modo de ajuste (fit). Por defecto "cover" para llenar el marco exacto.
    const fit = VALID_FITS.includes(req.body.fit) ? req.body.fit : "cover";

    // Formatos de salida. El cliente puede enviar un JSON como ["webp","png"].
    let formats = DEFAULT_FORMATS;
    if (req.body.formats) {
      try {
        const parsed = JSON.parse(req.body.formats);
        if (Array.isArray(parsed)) {
          const filtered = parsed.filter((f) => FORMATS[f]);
          if (filtered.length > 0) formats = filtered;
        }
      } catch (e) {
        return res.status(400).json({ error: "El campo 'formats' no es un JSON válido." });
      }
    }

    // Metadatos de la imagen original
    const meta = await sharp(originalImage).metadata();
    const original = {
      width: meta.width,
      height: meta.height,
      format: meta.format,
      sizeKB: +(originalImage.length / 1024).toFixed(2),
    };

    const results = [];
    for (const size of sizes) {
      const outputs = [];
      // Procesamos cada formato de forma secuencial para mantener bajo el uso de memoria.
      for (const fmt of formats) {
        const def = FORMATS[fmt];
        try {
          const pipeline = sharp(originalImage).resize({
            width: size.width,
            height: size.height,
            fit,
          });
          const buffer = await def.apply(pipeline).toBuffer();
          outputs.push({
            format: fmt,
            ext: def.ext,
            dataUri: `data:${def.mime};base64,${buffer.toString("base64")}`,
            sizeKB: +(buffer.length / 1024).toFixed(2),
          });
        } catch (fmtErr) {
          // Si un formato no está disponible (p. ej. AVIF), lo omitimos sin romper todo.
          console.warn(`Formato ${fmt} no disponible para ${size.label}:`, fmtErr.message);
        }
      }

      results.push({
        label: size.label,
        width: size.width,
        height: size.height,
        outputs,
      });
    }

    res.json({ original, fit, formats, results });
  } catch (err) {
    console.error("Error procesando la imagen:", err);
    res.status(500).json({
      error: "No se pudo procesar la imagen.",
      detail: err && err.message ? err.message : String(err),
    });
  }
});

app.listen(port, () => {
  console.log(`Server started on http://localhost:${port}`);
});
