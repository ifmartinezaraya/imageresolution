# Image Resizer

Aplicación web en Node.js para subir una imagen, redimensionarla a **tamaños personalizables** y exportarla en formatos modernos y optimizados (`WebP` y `AVIF`), con **vista previa** y **descarga individual**.

## Características

- Interfaz web moderna con **arrastrar y soltar** (drag & drop).
- **Tamaños personalizables**: añade, edita o elimina las dimensiones de salida.
- Presets rápidos (16:9, 1:1, 9:16, etc.) y modos de ajuste (`cover`, `inside`, `contain`, `fill`).
- Exporta cada tamaño en **WebP y AVIF** mostrando el peso en KB.
- **Botones de descarga** para cada imagen generada.

## Requisitos

- [Node.js](https://nodejs.org/) 18 o superior.

## Instalación

```bash
git clone https://github.com/ifmartinezaraya/imageresolution.git
cd imageresolution
npm install
```

## Ejecución

```bash
npm start
```

Luego abre `http://localhost:1337` en tu navegador.

> El puerto se puede configurar con la variable de entorno `PORT` (útil para desplegar en Render, Railway, etc.):
>
> ```bash
> PORT=8080 npm start
> ```

## Uso

1. Arrastra una imagen a la zona de subida (o haz clic para elegirla).
2. Ajusta los **tamaños de salida** y el modo de ajuste que prefieras.
3. Pulsa **"Redimensionar imagen"**.
4. Descarga cada resultado en WebP o AVIF con su peso indicado.

## API

`POST /upload` (multipart/form-data)

| Campo   | Tipo   | Descripción                                                        |
| ------- | ------ | ------------------------------------------------------------------ |
| `image` | file   | La imagen a procesar (requerido).                                  |
| `sizes` | string | JSON: `[{ "label": "HD", "width": 1280, "height": 720 }]` (opc.).  |
| `fit`   | string | `cover` \| `inside` \| `contain` \| `fill` \| `outside` (opc.).    |

Respuesta: JSON con `original`, `fit` y `results[]` (cada uno con `webp` y `avif` en data URI + tamaño en KB).

## Despliegue

El proyecto está listo para desplegarse en cualquier proveedor de Node.js. Escucha en el puerto indicado por la variable de entorno `PORT`.

### Render (recomendado, plan gratuito)

Incluye un `render.yaml` (Blueprint), así que el despliegue es automático:

1. Entra en [dashboard.render.com](https://dashboard.render.com/) e inicia sesión con GitHub.
2. Pulsa **New +** → **Blueprint**.
3. Selecciona este repositorio (`ifmartinezaraya/imageresolution`).
4. Render leerá `render.yaml` y creará el servicio web. Pulsa **Apply**.
5. En unos minutos tendrás una URL pública (p. ej. `https://imageresolution.onrender.com`).

### Railway

1. Entra en [railway.app](https://railway.app/) e inicia sesión con GitHub.
2. **New Project** → **Deploy from GitHub repo** → selecciona el repositorio.
3. Railway detecta Node.js automáticamente y usa `npm start`. Genera un dominio en **Settings → Networking → Generate Domain**.

## Contribuir

Los pull requests son bienvenidos. Consulta [CONTRIBUTING.md](CONTRIBUTING.md).

## Licencia

[MIT](LICENSE)
