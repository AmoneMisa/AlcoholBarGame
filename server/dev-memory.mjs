import { createApp, handleErrors } from './app.mjs';
import { checkEnglish } from './english.mjs';
import { createGameService } from './gameService.mjs';
import { createMemoryRepository } from './playerRepository.mjs';

// Local development without Postgres: same API and rules, players kept in memory until restart.
// Run with `npm run dev:server:memory` next to `npm run dev`. Dev login is enabled here only.
const port = Number(process.env.PORT || 3000);
const service = createGameService({ repository: createMemoryRepository(), checkEnglish });
const app = createApp({ adminToken: process.env.ADMIN_API_TOKEN, service, botToken: process.env.TELEGRAM_BOT_TOKEN, allowDevLogin: true });
app.use('/api', (_request, response) => response.status(404).json({ ok: false, error: 'Not found' }));
handleErrors(app);
app.listen(port, () => console.log(`BarLingo dev API (in-memory) on :${port}`));
