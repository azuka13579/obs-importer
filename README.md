# OBS Scene Importer

Aplikasi web (React + Vite) untuk membuat banyak scene di OBS sekaligus lewat **obs-websocket v5**.
Seret file video/gambar/audio atau daftar scene (`.txt`, `.csv`, `.json`), atur urutan, transisi, dan audio, lalu klik **Buat scene di OBS**.

## Menjalankan secara lokal

```bash
npm install
npm run dev
```

Buka http://localhost:5173. Di OBS aktifkan **Tools → WebSocket Server Settings → Enable WebSocket server**.

## Docker

Build dan jalankan sendiri:

```bash
docker build -t obs-importer .
docker run -d -p 8080:80 --name obs-importer obs-importer
```

Atau pakai image yang dibuat GitHub Actions:

```bash
docker run -d -p 8080:80 ghcr.io/azuka13579/obs-importer:latest
```

Lalu buka http://localhost:8080.

## Build image otomatis (GitHub Actions)

Workflow [`.github/workflows/docker-publish.yml`](.github/workflows/docker-publish.yml) membangun image `linux/amd64` dan `linux/arm64` lalu push ke GitHub Container Registry:

| Pemicu | Tag image |
| --- | --- |
| push ke `master` | `latest`, `master`, `sha-xxxxxxx` |
| push tag `v1.2.3` | `1.2.3`, `1.2` |
| pull request | hanya build, tidak push |

Setelah image pertama terbit, buka **GitHub → Packages → obs-importer → Package settings** untuk menjadikannya public jika ingin di-pull tanpa login.

## Catatan koneksi

- Halaman harus dibuka lewat **http** (bukan https) agar browser mengizinkan koneksi `ws://` ke OBS. Jika disajikan lewat https, pakai `wss://` atau reverse proxy.
- Koneksi dibuat dari browser pengguna, jadi alamat `ws://127.0.0.1:4455` berarti OBS di komputer yang membuka halaman, bukan di server Docker.
