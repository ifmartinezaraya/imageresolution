const express = require("express");
const multer = require("multer");
const sharp = require("sharp");
const path = require("path");

const app = express();
// Puerto configurable via variable de entorno (necesario para desplegar en Render/Railway/etc.)
const port = process.env.PORT || 1337;

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
      const [webpBuffer, avifBuffer] = await Promise.all([
        sharp(originalImage)
          .resize({ width: size.width, height: size.height, fit })
          .webp({ quality: 80 })
          .toBuffer(),
        sharp(originalImage)
          .resize({ width: size.width, height: size.height, fit })
          .avif({ quality: 50 })
          .toBuffer(),
      ]);

      results.push({
        label: size.label,
        width: size.width,
        height: size.height,
        webp: {
          dataUri: `data:image/webp;base64,${webpBuffer.toString("base64")}`,
          sizeKB: +(webpBuffer.length / 1024).toFixed(2),
        },
        avif: {
          dataUri: `data:image/avif;base64,${avifBuffer.toString("base64")}`,
          sizeKB: +(avifBuffer.length / 1024).toFixed(2),
        },
      });
    }

    res.json({ original, fit, results });
  } catch (err) {
    console.error("Error procesando la imagen:", err);
    res.status(500).json({ error: "No se pudo procesar la imagen." });
  }
});

app.listen(port, () => {
  console.log(`Server started on http://localhost:${port}`);
});
