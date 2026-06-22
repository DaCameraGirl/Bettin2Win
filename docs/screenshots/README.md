# Bettin2Win screenshots

Portfolio images for the root README.

| File | What it shows |
|---|---|
| `dashboard.png` | Main odds board (demo basketball tab) |
| `provider-status.png` | Provider status control-room grid |
| `market-movement.png` | Market movement sidebar |
| `beginner-guide.png` | Expanded beginner guide |

## Regenerate

```bash
corepack pnpm exec playwright install chromium   # first time only
pnpm screenshots
```

Defaults to the live GitHub Pages site. Pass a local URL to capture from dev:

```bash
pnpm screenshots http://localhost:5173/
```