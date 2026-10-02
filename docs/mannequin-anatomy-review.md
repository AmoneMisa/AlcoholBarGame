# Mannequin anatomy review

The original `atelier-adult-01` and `atelier-adult-man-01` rigs remain available only as legacy modular prototypes. Their narrow, rigid silhouettes were rejected as the basis for production art. Do not call those bodies approved production mannequins.

The studio now opens with separate female and male **anatomy candidates** from `public/assets/Character/MannequinCandidates`. Each is one transparent, featureless body image on a 600 × 1000 logical canvas (1200 × 2000 pixel export). Neither contains face parts, hair, lingerie, or clothing. The source images and normalization recipe are preserved beside the exports. The candidates are deliberately **not locked** and do not yet define the replacement rig's anchor contract.

Current review concern: the female candidate still has a stylized waist-to-hip ratio. A local pixel-warp attempt introduced visible torso seams and was discarded. It is not part of the current export. Refine the art source itself before committing anchors or fitting clothing.

Earlier generated dressed bodies and separately generated outfits were rejected. One outfit covered the male face and left gaps at the arms and shoes even though its canvas dimensions matched. Mere matching dimensions do not establish asset compatibility. The linear remapping study also preserved the old anatomical defects, so it was removed from the production path.

Before either new mannequin is locked: check adult proportions in full-body and dialogue crops; mark facial, clothing, hand, foot, and pivot anchors on the exact export; create a separate face layer and one fitted outfit for each mannequin; validate compositing, transparent edges, masks, blink, and idle across independent swaps. Fit assets to the fixed body, never the body to an asset. Do not bulk-generate variants until these checks pass.
