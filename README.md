# BarLingo

Telegram Mini App prototype: a bar-management game for learning practical English from absolute beginner / pre-A1 level.

## Current vertical slice

- Vue 3 + TypeScript + Vite + Pinia.
- Telegram Mini App bootstrap and haptic feedback.
- Region selection: London, Bucharest, Tashkent, New York.
- Generated customers with calm, impatient, sad, VIP, wealthy and friendly moods.
- Cocktail recipes and order modifiers such as extra lime, less sugar and no ice.
- Inventory consumption and supplier market with fictional region/day price coefficients.
- Basic A0 vocabulary cards.
- Bar decor and bartender outfit settings.
- Procedural 2D character/bottle models built from DOM/CSS, so there are no copied game assets.
- Basic animations: customer arrival, speech bubble, bartender idle loop and shaker animation on serving.
- Reduced-motion fallback.

## Important visual status

The current visuals are intentionally prototype-grade. They are code-generated 2D models, not final sprite sheets, skeletal animation, 3D models or commissioned art. Production art can replace these components without changing the game domain layer.

## Run

    npm install
    npm run dev

Build:

    npm run build

For production, serve over HTTPS and validate Telegram.WebApp.initData server-side before trusting Telegram identity data.

## Next slice

1. Manual tap/drag drink builder instead of automatic recipe fulfillment.
2. Customer patience timer and language-choice consequences.
3. Payment, refund, replacement and delivery scenarios.
4. Supplier contracts, delayed delivery and stock forecasting.
5. Spaced repetition / weak-word queue.
6. Backend persistence and server-authoritative economy.
7. Replace prototype CSS models with a consistent original art pipeline.
