# Tip jar

Tips require tapping the jar to collect. No automatic collection occurs, including offline.
The base jar earns 5 coins per hour, up to 12 hours, and holds a collection-cycle budget of 60 coins.
Dialogue-paid guest tips share that budget and can fill it sooner. At the time or coin limit,
accumulation pauses until the owner collects; coins already in the jar never expire.
Theft does not reopen the earning budget. Collection resets the accumulation window and protected balance.
Tutorial mode does not accrue passive tips and uses an isolated practice jar.
Existing saves above the new cap keep all earned coins; new deposits pause until collection.

## Starting capacity

The ten starter cocktails average 12.106125 coins at the starting New York price factor.
An ordinary 10% tip rounds up to 2 coins. Five seats with a mean 62.5-minute arrival cooldown
produce about 57.6 arrivals over 12 hours. At the starting 45% tip chance this gives 51.84 coins,
rounded up to a 60-coin capacity. This conservative fixed baseline does not change with temporary
events, city switching or recipe purchases. `tipCapacity` is the extension point for future upgrades.

## Visiting and theft

An accepted friend must visit the owner's bar before tapping its jar. Each attempt takes up to
5% of the current balance, rounded down to whole coins. Across all thieves,
at least 30% of the coins deposited in this collection cycle remain protected (rounded up).
The owner can collect the protected coins normally.

Each visitor has 10 attempts per calendar day and one attempt per target player per day.
Empty or fully protected jars consume an attempt. Collection, revisiting, reconnecting or
removing/re-adding a friend cannot reset these daily limits. New attempts become available on
the next game-server calendar day, after another visit. Limits and two-player transfers are
checked under ordered row locks in one transaction; amounts are never supplied by the client.

All coin balances, prices and transfers use whole coins. Existing fractional balances round to the nearest coin. Passive tips accrue one whole coin every 12 minutes; sub-coin elapsed time carries forward through the cumulative clock calculation. Theft rounds down, so jars below 20 coins cannot yield a coin at the 5% limit.
