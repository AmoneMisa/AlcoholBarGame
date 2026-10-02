# Two-mannequin prototype validation

Status: structural prototype verified; production illustration and exhaustive visual acceptance remain pending.

- Existing woman BODY and rig fingerprint remain unchanged.
- Man has a separate BODY, fingerprint, rig ID, anchors and asset library.
- Eight automated tests pass, including 5,832 combinations (2,916 per rig), cross-rig rejection, save/import round trips, static body identity, color reuse, SVG references and export ownership.
- Exporter writes 26 transparent layers per library, separate animation manifests and nine-combination review sheets.
- Browser: selected man, changed hair to tied/silver, outfit to casual, accessory to brooch; woman retained cascade/evening/moon. Switching back restored man's selections.
- Browser: Save look followed by reload restored the active man and his selected assets. Woman's independent look also remained intact.
- Browser: paused animation and checked preview bounds across Face/Hair tabs. Found and corrected a controls-height-dependent resize. After the fix, both tabs measured the same 600 × 695 CSS-pixel SVG viewport at the tested desktop size; document position agreed within rounding error.
- Browser: tested woman and man at a 390 × 844 viewport. Document width was 375 pixels (scrollbar accounted for), with no horizontal overflow. Restored desktop viewport afterward.
- Screenshots: `man-desktop.png`, `man-mobile.png`, `woman-mobile.png`.

These are spot checks of the structural renderer, not a claim of premium illustration quality or pixel-perfect visual acceptance of every combination. The separately generated painted references are flattened, native 971 × 1619 RGBA images, not aligned modular production assets. No production lock or bulk generation was performed.
