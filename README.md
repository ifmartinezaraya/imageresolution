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
git clone https://github.com/warmachine028/imageresizer.git
cd imageresizer
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

## Contribuir

Los pull requests son bienvenidos. Consulta [CONTRIBUTING.md](CONTRIBUTING.md).

## Licencia

[MIT](LICENSE)
