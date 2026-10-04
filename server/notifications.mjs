const EVENTS = ['dailyLesson','dailyReward','friendVisit','reward','customer','friendRequest','loot','leaderboard'];
export function notificationPrefs(input = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) input={};
  return Object.fromEntries(EVENTS.map(key => [key, input[key] !== false]));
}

// Inspect persisted state only: a notification must never award items or advance the simulation.
export function pendingNotifications(state, prefs, sent, now, since, requests = []) {
  const notices = [];
  const add = (type, key, text) => {
    if (prefs[type] && sent[type] !== key && !(Number(key) > 0 && Number(sent[type]) >= Number(key))) notices.push({type,key,text});
  };
  const date = new Date(now).toISOString().slice(0,10);
  // One combined reminder during daytime, only for players active in the last week.
  if (new Date(now).getUTCHours() >= 9) {
    if (state.dailyGiftClaimedKey !== date) add('dailyReward',date,'Your daily login reward is ready.');
    if (state.dailyLessonKey !== date || (state.dailyLessonCompletedIds ?? []).length < 3) add('dailyLesson',date,'Today’s English quests are waiting for you.');
  }
  const mailTypes = {visit:'friendVisit',theft:'friendVisit',gift:'reward',reward:'reward'};
  for (const type of ['friendVisit','reward']) {
    const mail = (state.mailbox ?? []).filter(item => item.at >= since && !item.readAt && (!item.expiresAt || item.expiresAt > now)
      && (item.direction !== 'outgoing') && (item.kind !== 'gift' && item.kind !== 'reward' || item.status === 'pending')
      && mailTypes[item.kind] === type)
      .sort((a,b) => b.at-a.at)[0];
    if (mail) add(type,String(mail.at),type === 'friendVisit' ? 'There is a new report about your bar in Post Box.' : 'You have rewards or gifts waiting in Post Box.');
  }
  const request = requests.filter(item => item.at >= since).sort((a,b)=>b.at-a.at)[0];
  if (request) add('friendRequest',String(request.at),'You have a new friend request.');
  const expired = Object.entries(state.loot?.boosts ?? {}).filter(([,until])=>until >= since && until <= now).sort((a,b)=>b[1]-a[1])[0];
  if (expired) add('loot',String(expired[1]),'A booster has ended. Open Workshop to use another one.');
  return notices;
}

export function createTelegramNotifications({pool, bot, now = Date.now, logger = console}) {
  async function preferences(identity, body = {}) {
    if (identity.kind !== 'telegram') return {ok:true,enabled:false,prefs:notificationPrefs()};
    const {rows:[player]} = await pool.query('SELECT id FROM players WHERE auth_key=$1 AND NOT blocked',[identity.key]);
    if (!player) return {ok:false,error:'Open the game first.'};
    if (typeof body.enabled === 'boolean' || body.prefs) {
      const prefs = notificationPrefs(body.prefs);
      await pool.query(`INSERT INTO telegram_notifications(player_id,enabled,prefs) VALUES($1,$2,$3::jsonb)
        ON CONFLICT(player_id) DO UPDATE SET enabled=COALESCE($4,telegram_notifications.enabled),prefs=EXCLUDED.prefs,
        enabled_at=CASE WHEN $4=true AND NOT telegram_notifications.enabled THEN now() ELSE telegram_notifications.enabled_at END`,
        [player.id,body.enabled === true,JSON.stringify(prefs),typeof body.enabled === 'boolean' ? body.enabled : null]);
    }
    await pool.query('UPDATE players SET last_seen_at=now() WHERE id=$1',[player.id]);
    const {rows:[row]} = await pool.query('SELECT enabled,prefs FROM telegram_notifications WHERE player_id=$1',[player.id]);
    return {ok:true,enabled:row?.enabled ?? false,...(row ? {prefs:notificationPrefs(row.prefs)} : {})};
  }
  async function allow(telegramId) {
    await pool.query(`INSERT INTO telegram_notifications(player_id,enabled) SELECT id,true FROM players WHERE telegram_id=$1
      ON CONFLICT(player_id) DO UPDATE SET enabled=true,enabled_at=CASE WHEN telegram_notifications.enabled THEN telegram_notifications.enabled_at ELSE now() END`,[telegramId]);
  }
  let running = false;
  async function tick() {
    if (running || !bot.status().connected) return;
    running = true;
    try {
      // Row locks serialize multiple server replicas. Oldest checked rows rotate through bounded batches.
      for (let count=0;count<30;count++) {
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          const {rows:[row]} = await client.query(`SELECT n.*,p.telegram_id,s.state FROM telegram_notifications n
            JOIN players p ON p.id=n.player_id JOIN player_states s ON s.player_id=p.id
            WHERE n.enabled AND NOT p.blocked AND p.last_seen_at < now()-interval '5 minutes'
              AND p.last_seen_at > now()-interval '7 days' AND n.checked_at < now()-interval '1 minute'
            ORDER BY n.checked_at LIMIT 1 FOR UPDATE OF n SKIP LOCKED`);
          if (!row) { await client.query('COMMIT'); break; }
          const {rows:requests} = await client.query(`SELECT player_id::text||':'||extract(epoch from created_at)::text AS key,
            extract(epoch from created_at)*1000 AS at FROM friendships WHERE friend_id=$1 AND status='pending'`,[row.player_id]);
          const {rows:gifts} = await client.query(`SELECT id,extract(epoch from created_at)*1000 AS at FROM gifts WHERE to_id=$1 AND claimed_at IS NULL`,[row.player_id]);
          const storedMail=row.state.mailbox ?? [];
          row.state.mailbox=[...storedMail,...gifts.filter(gift=>!storedMail.some(item=>item.id===`gift-in:${gift.id}`))
            .map(gift=>({id:`gift-in:${gift.id}`,at:Number(gift.at),kind:'gift',status:'pending',expiresAt:Number(gift.at)+14*86400_000}))];
          const notices = pendingNotifications(row.state,notificationPrefs(row.prefs),row.sent,now(),new Date(row.enabled_at).getTime(),requests);
          const week=Math.floor(now()/(7*86400_000))-1;
          if (row.prefs.leaderboard !== false && row.state.loot?.leaderboardClaimed < week && row.sent.leaderboard !== `week-${week}`) {
            const {rows:[score]}=await client.query('SELECT score FROM weekly_scores WHERE player_id=$1 AND week=$2',[row.player_id,week]);
            if (score?.score >= 300) notices.push({type:'leaderboard',key:`week-${week}`,text:'Your weekly leaderboard reward is ready in Workshop.'});
          }
          let enabled = true;
          if (notices.length) {
            try {
              const link = bot.status().username ? `https://t.me/${bot.status().username}?startapp` : null;
              await bot.call('sendMessage',{chat_id:row.telegram_id,text:[...new Set(notices.map(item=>item.text))].join('\n'),
                ...(link ? {reply_markup:{inline_keyboard:[[{text:'Open BarLingo',url:link}]]}} : {})},AbortSignal.timeout(10_000));
              for (const item of notices) row.sent[item.type]=item.key;
            } catch(error) {
              if (error.status === 403) enabled = false;
              logger.error?.('Game notification failed:',error.message);
            }
          }
          await client.query('UPDATE telegram_notifications SET sent=$2::jsonb,enabled=$3,checked_at=now() WHERE player_id=$1',[row.player_id,JSON.stringify(row.sent),enabled]);
          await client.query('COMMIT');
        } catch(error) { await client.query('ROLLBACK'); throw error; }
        finally { client.release(); }
      }
    } finally { running=false; }
  }
  return {preferences,allow,tick};
}
