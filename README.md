# BarLingo

Telegram Mini App bar-management game for practical English from absolute beginner / pre-A1 level.

## Current prototype

- Vue 3 + TypeScript + Vite + Pinia.
- Management-dashboard layout inspired by classic browser/social bar games, with original code-generated visuals.
- Five simultaneous generated customers with mood and patience.
- Manual cocktail building with measured ingredient steps, shake, clear and serve.
- Wrong-drink consequences, tips, inventory consumption and customer replacement.
- Nine recipes: Mojito, Daiquiri, Margarita, Piña Colada, Cosmopolitan, Old Fashioned, Martini, Whiskey Sour and Long Island.
- Spirits, mixers, fruits, herbs and garnish inventory.
- Suppliers, regional market prices and quick restock.
- Pairing knowledge base v2: 106 beverage profiles, alcoholic and non-alcoholic recommendations, 340 beverage-food pairings, 64 beverage-beverage pairings, 10 context pairings and 24 cigar pairings.
- Interactive Pairing Advisor for food, drink-to-drink, context/mood and cigar recommendations.
- Mood-safe recommendation rule: sadness, anger, stress and loneliness never boost alcohol scoring; a non-alcoholic option is surfaced alongside recommendations.
- Regions: New York, London, Berlin, Tashkent, Bucharest and Tokyo.
- Bar customization, bartender customization and service-English scenario cards.
- Responsive desktop/mobile layout.

## Run

    pnpm install
    pnpm dev

Build:

    pnpm build

## Telegram bot

1. Create the bot in `@BotFather` and configure its **Main Mini App** with the public HTTPS URL of this deployment.
2. Copy `.env.example` to `.env` and paste the full BotFather token into `TELEGRAM_BOT_TOKEN`.
3. Start the Compose stack. No bot ID, username, webhook secret, or app URL environment variable is needed.

The app verifies every `Telegram.WebApp.initData` signature on the server. At startup it verifies the token with Telegram, installs `/start`, `/game` and `/help`, removes an old webhook, and receives commands by long polling. The launch button uses Telegram's Main Mini App deep link, derived from the bot username returned by Telegram.

## Next

1. Drag-and-drop bottles and animated pouring.
2. Branching customer dialogue for recommendations, complaints, refunds and replacement.
3. Supplier delivery queue and warehouse capacity.
4. Persistent language progress and spaced repetition.
5. Replace CSS prototype characters with an original sprite/rigged 2D art pipeline.

## Production deploy notes

- CI (`.github/workflows/docker-master.yml`) copies `deploy/compose.prod.yaml` to the server and recreates only the `app` container.
- The app publishes `127.0.0.1:3000` (set `APP_PORT` in the server `.env` to change it). A web server on the host (nginx, `proxy_pass http://127.0.0.1:3000`) terminates HTTPS. Without that port mapping the site answers **502**.
- Caddy in the compose file is optional (`docker compose --profile caddy up -d`) and only for a server whose ports 80 and 443 are free.
- The deploy checks `/api/health` inside the container and on the host port, so a missing mapping fails the workflow.
- `compose.yaml` in the repository root is for building and running locally; do not run it next to the CI stack on the server.

## Administration and support

See [administration setup and behavior](docs/administration.md) for staff roles and the owner Telegram ID, promo management, player moderation, tickets and 14-day event retention.
