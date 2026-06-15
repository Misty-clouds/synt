# Infra

Container/runtime layer for the `synt` monorepo. Traefik terminates TLS and
routes by hostname to the two apps:

| Host                          | Service | Container port |
| ----------------------------- | ------- | -------------- |
| `synt.adenijitaoheed.work`    | web     | 3000           |
| `api.adenijitaoheed.work`     | api     | 3001           |

## Layout

```
docker-compose.yml            # traefik + web + api
apps/web/Dockerfile           # Next.js standalone build
apps/api/Dockerfile           # NestJS build
infra/traefik/traefik.yml     # static config (entrypoints, ACME, providers)
infra/traefik/dynamic/        # dynamic config (security headers)
infra/traefik/acme.json       # Let's Encrypt cert store (gitignored, chmod 600)
```

## Prerequisites

1. **DNS** — point both records at the server's public IP:
   ```
   synt.adenijitaoheed.work   A   <SERVER_IP>
   api.adenijitaoheed.work    A   <SERVER_IP>
   ```
2. **Ports 80 and 443** open. Port 80 is required for the Let's Encrypt
   HTTP-01 challenge and redirects to HTTPS.
3. **ACME email** — set in `infra/traefik/traefik.yml` (`certificatesResolvers`).

## Deploy

```bash
# from the repo root
docker compose up -d --build
```

First boot, Traefik requests certificates from Let's Encrypt (give it ~30s).
Follow logs with:

```bash
docker compose logs -f traefik
```

## Notes

- `NEXT_PUBLIC_API_URL` is baked into the web image at build time (Next.js
  inlines `NEXT_PUBLIC_*`). It's set to `https://api.adenijitaoheed.work` via a
  build arg in `docker-compose.yml` — change it there if the API host changes,
  then rebuild.
- Only containers with `traefik.enable=true` are exposed; everything else stays
  on the internal `synt_web` network.
- To test cert issuance without hitting Let's Encrypt rate limits, add their
  staging CA server under `certificatesResolvers.letsencrypt.acme.caServer`.
