# Promo codes

Set `ADMIN_API_TOKEN` on the API server. The admin endpoint is disabled without it. Keep this secret on the server; never include it in client configuration.

`POST /api/admin/promocodes`, header `Authorization: Bearer <ADMIN_API_TOKEN>`:

```json
{
  "code": "WELCOME2026",
  "expiresAt": "2026-12-31T23:59:59Z",
  "rewards": [
    {"kind": "coins", "amount": 500},
    {"kind": "crystals", "amount": 30},
    {"kind": "box", "id": "gold", "amount": 1},
    {"kind": "style", "id": "bartender:reference-streetwear:noa"}
  ]
}
```

Rewards: `coins`, `crystals`, `parts`, `skinShards`, `stylePieces` with `amount`; `box`, `consumable`, `itemShards` with a catalog `id` and `amount`; `style`, `background`, `companion` with a catalog `id`. Expiration is an ISO date or Unix milliseconds. Codes cannot be overwritten; create a new code to change rewards or validity.

Players redeem in Character → Settings, or authenticated `POST /api/promocodes/redeem` with `{"code":"WELCOME2026"}`. Each code can be redeemed once per account before expiration. PostgreSQL migration `007_promocodes.sql` stores codes and redemptions; migration runs at server startup. The in-memory development API stores them until restart.
