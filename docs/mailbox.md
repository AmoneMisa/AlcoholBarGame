# Mailbox

Mail opens from the header's second row. The badge counts unread messages and pending incoming gifts/rewards.
All, System and Players filter a compact list of titles, senders and status. Opening a letter shows its body, expiry and illustrated attachment cards. Reward attachments stay visible after collection; reading never claims items. UI text is English;
dates display Moscow time (MSK).

| Mail | Lifetime | At expiry |
| --- | --- | --- |
| Visits and thefts | 7 days | Removed from mail |
| Gifts | 14 days | Unaccepted item returns; purchased gifts refund the purchase price |
| Promo and event rewards | 180 days | Unclaimed rewards expire |

Login never accepts gifts. Accept and Decline lock both players in ID order and consume the stored gift once.
Declining returns the item or its price; both players see the decision. Expired gifts return through a server
sweep every minute and before session/mailbox/gift decisions, even when the recipient never returns. The sender
gets a new return notice; original gift letters expire on the original deadline. Reading mail does not accept
a gift or extend its deadline.

Unread incoming thefts produce a login modal listing thieves, exact amounts and the total lost. Dismissal
acknowledges only those letters; history stays until seven-day expiry. Thieves see the exact result immediately
and in outgoing history. Supplying another player's letter IDs cannot acknowledge their mail.

Promo redemption reserves the code once and sends its configured rewards to mail. Login rewards, season-pass
claims, daily-wheel results, weekly-ranking rewards, quests and achievement rewards also send packages.
Completion counters and paid costs apply immediately; rewards require Claim rewards in Mail. The 180-day period
starts at package creation independently of the promo/event end date. Expiry does not reset claim/redemption
counters. Server-known resources are added to current balances, never by restoring an old snapshot. XP, level
boxes and weekly score become available when collected. Offline practice retains its local simulation;
social mail and gift/reward decision endpoints require an account connection.
