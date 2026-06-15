# synt

A [Turborepo](https://turbo.build/repo) monorepo with a Next.js frontend and a NestJS backend.

## Structure

```
apps/
  web/   → Next.js 15 (App Router, TypeScript) — http://localhost:3000
  api/   → NestJS 11 (TypeScript)              → http://localhost:3001
packages/
  typescript-config/ → shared tsconfig presets (@synt/typescript-config)
```

## Getting started

```bash
pnpm install        # install all workspaces
pnpm dev            # run web + api together (turbo)
```

Then open http://localhost:3000 — the page fetches a greeting from the NestJS API.

## Useful commands

| Command        | Description                                  |
| -------------- | -------------------------------------------- |
| `pnpm dev`     | Run all apps in dev/watch mode               |
| `pnpm build`   | Build every app                              |
| `pnpm lint`    | Lint every workspace                         |
| `pnpm test`    | Run tests                                    |
| `pnpm format`  | Format with Prettier                         |

Run a single app:

```bash
pnpm --filter web dev
pnpm --filter api dev
```
