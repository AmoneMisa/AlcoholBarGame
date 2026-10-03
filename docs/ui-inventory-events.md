# Inventory and event screens

The game UI is English only.

- Resource and reward icons use full-color WebP art consistently in the HUD, exchange, crystal boutique, login rewards, Battle Pass, quests, chests and reward summaries. Prestige has its own medal; supplies have their own crate. Costume/background prizes show the actual item. Random fragment rewards do not promise a specific costume before the server selects it.
- Full-color means painted item art, not a flat vector or emoji exported to WebP. Battle Pass resources, treasure chests and boosters use the versioned painted asset set. SVG is allowed only for button icons; reward previews and other player-facing artwork use raster assets.
- The guest silhouette, fragment puzzle, screenshot icon and wheel disc are WebP assets. The wheel rotates as one layer with HTML reward labels. Item and silhouette entrances respect reduced motion; navigation retains its compact WebP line icons.

- Storage > Workshop > Inventory opens a dense square icon grid. All shows owned items and fragments together. Type filters include chests, consumables, styles, backgrounds and Circle friends/fragments. Quantities appear at the top left. Names appear on hover or keyboard focus; tap opens item details. Zero-count consumables are hidden. Inspect an item to use it; Recipe Scroll asks for a known recipe.
- Each costume and background has its own fragments; background IDs use a separate background: key and crafting never grants a linked item. Legacy shared pools migrate once. Duplicate items produce fragments of the same item.
- Fragment icons are puzzle pieces, with the exact item thumbnail in the bottom-right corner. Chest details show an image grid derived from drop tables instead of a written contents list.
- Fragment previews show crafting progress only in the action button: `Craft (1 / 50)` while incomplete, disabled until the item's own fragment cost is reached, then active `Craft`. No duplicate required-count description or warning. Already owned items keep their ownership explanation.
- Chests open only after inspecting their item in Inventory. Choice chest rewards appear in an illustrated popup, including when the last chest is consumed. The Chests shop only sells boxes.
- Workshop has equipment, chests, signature cocktails and weekly ranking pages. No resource summary, Regulars tab or separate style draw screen. NPC friends are managed in Circle.
- Events opens a menu with Daily login, Daily wheel, Battle Pass and Quests & rewards. Only the selected screen is mounted. Ready rewards and free wheel spins form the availability count; owning crystals does not create available skin spins.
- The wheel waits for the authoritative result, spins to its segment, then reveals the prize. Reduced motion and Skip animation reveal immediately. It cannot be closed while waiting or spinning. Online event rewards remain delivered through Mail.
- Battle Pass preview shows the season's female outfit, male outfit and gift background together. It has no appearance editor controls. Models fit inside the scene on desktop and mobile.
- Conversation help places Show me on its own row. Available elements are scrolled into view and highlighted. Missing elements receive an inline explanation, without closing help.
- Character information shows an avatar, individual profile/version panels and a spaced Change appearance action; no extra enclosing frame.

- Battle Pass rewards open in their own compact modal; View rewards reopens it from the season overview. Free is on the left, Premium on the right, levels in the centre. All reward images have a 44px slot. Paired tiles share their height; extra rewards wrap only when needed. The scrollable track has no horizontal overflow.
- The reward track and tiles use painted WebP materials: `pass-track-surface-v1.webp`, `pass-free-surface-v1.webp`, `pass-premium-surface-v1.webp`. The same tile art styles level markers. CSS supplies layout, sizing, focus and availability states; visible material surfaces should use understated raster artwork consistent with the lounge and pass textures.
- Pass textures were generated with the built-in imagegen tool, then resized/encoded as WebP. Prompts: quiet midnight velvet track with faint gold/walnut side edges; deep sapphire enamel tile with thin silver-blue bevel; dark honey velvet tile with thin antique gold bevel. All have low contrast, empty centres, no words or reward pictures. Source PNGs are recorded in `scripts/painted-pass-surfaces.json`.
