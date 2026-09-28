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
- Regions: New York, London, Berlin, Tashkent, Bucharest and Tokyo.
- Bar customization, bartender customization and service-English scenario cards.
- Responsive desktop/mobile layout.

## Run

    npm install
    npm run dev

Build:

    npm run build

Production Telegram deployments must validate Telegram.WebApp.initData on the server.

## Next

1. Drag-and-drop bottles and animated pouring.
2. Branching customer dialogue for recommendations, complaints, refunds and replacement.
3. Supplier delivery queue and warehouse capacity.
4. Persistent language progress and spaced repetition.
5. Replace CSS prototype characters with an original sprite/rigged 2D art pipeline.