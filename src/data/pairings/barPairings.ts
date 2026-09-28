// Whisker Bar knowledge base v2.
// Canonical beverage recommendation data for alcoholic + non-alcoholic drinks.
// Mood is dialogue context only: negative mood never boosts alcohol recommendation scores.

export type PairingBand = 'excellent' | 'good' | 'situational' | 'weak' | 'challenging';

export const BAR_PAIRINGS = {
  "metadata": {
    "name": "Whisker Bar Pairing Knowledge Base",
    "version": "2.0.0",
    "scope": "Game-oriented beverage recommendation knowledge: alcoholic and non-alcoholic drinks, food pairing, drink pairing, customer context, mood-safe dialogue, and cigar/tobacco pairing.",
    "important_note": "Pairing scores describe flavor/context compatibility, not medical safety. Negative mood must never increase alcohol recommendation scores. The game should offer non-alcoholic choices and must not frame alcohol as treatment for sadness, anger, stress, anxiety or loneliness.",
    "design_note": "Use scores as recommendation priors, then modify by customer taste, budget, occasion, region, inventory and explicit restrictions.",
    "sources_basis": [
      "WSET food-and-wine pairing principles",
      "Wine Folly pairing principles and cheese/wine examples",
      "Brewers Association beer-and-food pairing framework",
      "Japan Sake and Shochu Makers Association sake pairing guidance"
    ]
  },
  "principles": [
    {
      "id": "match_intensity",
      "title": "Match intensity",
      "rule": "Delicate food generally works with lighter drinks; rich or strongly flavored food generally needs a more intense drink."
    },
    {
      "id": "acid_cuts_richness",
      "title": "Acidity cuts richness",
      "rule": "High-acid wine, cider, beer or cocktails can refresh the palate alongside fatty, creamy or fried food."
    },
    {
      "id": "sweetness_rule",
      "title": "Drink should not be drier than a sweet dessert",
      "rule": "For desserts, choose a drink at least as sweet as the food; otherwise the drink can taste thin or sour."
    },
    {
      "id": "tannin_and_fat",
      "title": "Tannin and fat",
      "rule": "Tannic red wines often work well with fatty or protein-rich foods such as steak and aged cheese."
    },
    {
      "id": "spice_and_alcohol",
      "title": "Be careful with heat",
      "rule": "High alcohol and high tannin can amplify chili heat; aromatic, lower-alcohol or slightly sweet drinks are often easier with spicy food."
    },
    {
      "id": "salt_and_bubbles",
      "title": "Salt likes acidity and bubbles",
      "rule": "Sparkling wine, crisp beer and acidic drinks are reliable with salty or fried food."
    },
    {
      "id": "umami",
      "title": "Umami needs care",
      "rule": "Umami-heavy foods can make tannic wine seem more bitter; sake, sparkling wine, lighter reds and crisp whites are often safer choices."
    },
    {
      "id": "sauce_over_protein",
      "title": "Pair to the sauce",
      "rule": "The dominant sauce, spice or preparation can matter more than the base protein."
    },
    {
      "id": "regional_pairing",
      "title": "Regional pairing",
      "rule": "Traditional drinks and foods from the same region are often useful starting points, but they are not absolute rules."
    }
  ],
  "score_bands": [
    {
      "min": 90,
      "max": 100,
      "label": "excellent",
      "ui": "green"
    },
    {
      "min": 80,
      "max": 89,
      "label": "good",
      "ui": "light_green"
    },
    {
      "min": 65,
      "max": 79,
      "label": "situational",
      "ui": "yellow"
    },
    {
      "min": 45,
      "max": 64,
      "label": "weak",
      "ui": "orange"
    },
    {
      "min": 0,
      "max": 44,
      "label": "challenging",
      "ui": "red"
    }
  ],
  "alcohol_profiles": [
    {
      "id": "cabernet_sauvignon",
      "name": "Cabernet Sauvignon",
      "family": "wine",
      "style": "red"
    },
    {
      "id": "merlot",
      "name": "Merlot",
      "family": "wine",
      "style": "red"
    },
    {
      "id": "pinot_noir",
      "name": "Pinot Noir",
      "family": "wine",
      "style": "red"
    },
    {
      "id": "syrah_shiraz",
      "name": "Syrah / Shiraz",
      "family": "wine",
      "style": "red"
    },
    {
      "id": "malbec",
      "name": "Malbec",
      "family": "wine",
      "style": "red"
    },
    {
      "id": "sangiovese_chianti",
      "name": "Sangiovese / Chianti",
      "family": "wine",
      "style": "red"
    },
    {
      "id": "tempranillo_rioja",
      "name": "Tempranillo / Rioja",
      "family": "wine",
      "style": "red"
    },
    {
      "id": "zinfandel",
      "name": "Zinfandel",
      "family": "wine",
      "style": "red"
    },
    {
      "id": "gamay_beaujolais",
      "name": "Gamay / Beaujolais",
      "family": "wine",
      "style": "red"
    },
    {
      "id": "sauvignon_blanc",
      "name": "Sauvignon Blanc",
      "family": "wine",
      "style": "white"
    },
    {
      "id": "chardonnay_unoaked",
      "name": "Chardonnay (unoaked)",
      "family": "wine",
      "style": "white"
    },
    {
      "id": "chardonnay_oaked",
      "name": "Chardonnay (oaked)",
      "family": "wine",
      "style": "white"
    },
    {
      "id": "riesling_dry",
      "name": "Riesling (dry)",
      "family": "wine",
      "style": "white"
    },
    {
      "id": "riesling_off_dry",
      "name": "Riesling (off-dry)",
      "family": "wine",
      "style": "white"
    },
    {
      "id": "pinot_grigio",
      "name": "Pinot Grigio / Pinot Gris",
      "family": "wine",
      "style": "white"
    },
    {
      "id": "chenin_blanc",
      "name": "Chenin Blanc",
      "family": "wine",
      "style": "white"
    },
    {
      "id": "gewurztraminer",
      "name": "Gewürztraminer",
      "family": "wine",
      "style": "white"
    },
    {
      "id": "albarino",
      "name": "Albariño",
      "family": "wine",
      "style": "white"
    },
    {
      "id": "rose_dry",
      "name": "Dry Rosé",
      "family": "wine",
      "style": "rosé"
    },
    {
      "id": "champagne_brut",
      "name": "Brut Champagne / Sparkling Wine",
      "family": "wine",
      "style": "sparkling"
    },
    {
      "id": "prosecco",
      "name": "Prosecco",
      "family": "wine",
      "style": "sparkling"
    },
    {
      "id": "moscato",
      "name": "Moscato",
      "family": "wine",
      "style": "sweet"
    },
    {
      "id": "sauternes",
      "name": "Sauternes / Botrytized Dessert Wine",
      "family": "wine",
      "style": "sweet"
    },
    {
      "id": "port_ruby",
      "name": "Ruby Port",
      "family": "fortified_wine",
      "style": "sweet"
    },
    {
      "id": "port_tawny",
      "name": "Tawny Port",
      "family": "fortified_wine",
      "style": "sweet"
    },
    {
      "id": "sherry_fino",
      "name": "Fino / Manzanilla Sherry",
      "family": "fortified_wine",
      "style": "dry"
    },
    {
      "id": "sherry_amontillado",
      "name": "Amontillado Sherry",
      "family": "fortified_wine",
      "style": "dry"
    },
    {
      "id": "sherry_oloroso",
      "name": "Oloroso Sherry",
      "family": "fortified_wine",
      "style": "dry"
    },
    {
      "id": "madeira",
      "name": "Madeira",
      "family": "fortified_wine",
      "style": "fortified"
    },
    {
      "id": "dry_vermouth",
      "name": "Dry Vermouth",
      "family": "fortified_wine",
      "style": "aperitif"
    },
    {
      "id": "sweet_vermouth",
      "name": "Sweet Vermouth",
      "family": "fortified_wine",
      "style": "aperitif"
    },
    {
      "id": "pilsner",
      "name": "Pilsner / Crisp Lager",
      "family": "beer",
      "style": "lager"
    },
    {
      "id": "wheat_beer",
      "name": "Wheat Beer / Hefeweizen",
      "family": "beer",
      "style": "wheat"
    },
    {
      "id": "pale_ale",
      "name": "Pale Ale",
      "family": "beer",
      "style": "ale"
    },
    {
      "id": "ipa",
      "name": "IPA",
      "family": "beer",
      "style": "ale"
    },
    {
      "id": "amber_ale",
      "name": "Amber / Brown Ale",
      "family": "beer",
      "style": "ale"
    },
    {
      "id": "stout_porter",
      "name": "Stout / Porter",
      "family": "beer",
      "style": "dark"
    },
    {
      "id": "saison",
      "name": "Saison",
      "family": "beer",
      "style": "farmhouse"
    },
    {
      "id": "sour_beer",
      "name": "Sour Beer / Lambic",
      "family": "beer",
      "style": "sour"
    },
    {
      "id": "belgian_dubbel",
      "name": "Belgian Dubbel",
      "family": "beer",
      "style": "belgian"
    },
    {
      "id": "belgian_tripel",
      "name": "Belgian Tripel",
      "family": "beer",
      "style": "belgian"
    },
    {
      "id": "dry_cider",
      "name": "Dry Cider",
      "family": "cider",
      "style": "dry"
    },
    {
      "id": "sweet_cider",
      "name": "Sweet Cider",
      "family": "cider",
      "style": "sweet"
    },
    {
      "id": "mead",
      "name": "Mead",
      "family": "mead",
      "style": "honey"
    },
    {
      "id": "vodka",
      "name": "Vodka",
      "family": "spirit",
      "style": "neutral"
    },
    {
      "id": "gin",
      "name": "Gin",
      "family": "spirit",
      "style": "botanical"
    },
    {
      "id": "bourbon",
      "name": "Bourbon",
      "family": "spirit",
      "style": "whiskey"
    },
    {
      "id": "rye_whiskey",
      "name": "Rye Whiskey",
      "family": "spirit",
      "style": "whiskey"
    },
    {
      "id": "irish_whiskey",
      "name": "Irish Whiskey",
      "family": "spirit",
      "style": "whiskey"
    },
    {
      "id": "scotch_unpeated",
      "name": "Scotch Whisky (unpeated)",
      "family": "spirit",
      "style": "whisky"
    },
    {
      "id": "scotch_peated",
      "name": "Scotch Whisky (peated)",
      "family": "spirit",
      "style": "whisky"
    },
    {
      "id": "cognac",
      "name": "Cognac",
      "family": "spirit",
      "style": "brandy"
    },
    {
      "id": "brandy",
      "name": "Brandy",
      "family": "spirit",
      "style": "brandy"
    },
    {
      "id": "white_rum",
      "name": "White Rum",
      "family": "spirit",
      "style": "rum"
    },
    {
      "id": "aged_rum",
      "name": "Aged / Dark Rum",
      "family": "spirit",
      "style": "rum"
    },
    {
      "id": "tequila_blanco",
      "name": "Tequila Blanco",
      "family": "spirit",
      "style": "agave"
    },
    {
      "id": "tequila_reposado",
      "name": "Tequila Reposado",
      "family": "spirit",
      "style": "agave"
    },
    {
      "id": "tequila_anejo",
      "name": "Tequila Añejo",
      "family": "spirit",
      "style": "agave"
    },
    {
      "id": "mezcal",
      "name": "Mezcal",
      "family": "spirit",
      "style": "agave"
    },
    {
      "id": "sake_junmai",
      "name": "Junmai Sake",
      "family": "sake",
      "style": "junmai"
    },
    {
      "id": "sake_ginjo",
      "name": "Ginjo / Daiginjo Sake",
      "family": "sake",
      "style": "ginjo"
    },
    {
      "id": "sake_nigori",
      "name": "Nigori Sake",
      "family": "sake",
      "style": "nigori"
    },
    {
      "id": "shochu",
      "name": "Shochu",
      "family": "spirit",
      "style": "shochu"
    },
    {
      "id": "soju",
      "name": "Soju",
      "family": "spirit",
      "style": "soju"
    },
    {
      "id": "campari",
      "name": "Campari-style Bitter Aperitif",
      "family": "liqueur",
      "style": "bitter"
    },
    {
      "id": "aperol",
      "name": "Aperol-style Aperitif",
      "family": "liqueur",
      "style": "bitter"
    },
    {
      "id": "orange_liqueur",
      "name": "Orange Liqueur / Triple Sec",
      "family": "liqueur",
      "style": "citrus"
    },
    {
      "id": "coffee_liqueur",
      "name": "Coffee Liqueur",
      "family": "liqueur",
      "style": "coffee"
    },
    {
      "id": "amaretto",
      "name": "Amaretto",
      "family": "liqueur",
      "style": "nutty"
    },
    {
      "id": "elderflower_liqueur",
      "name": "Elderflower Liqueur",
      "family": "liqueur",
      "style": "floral"
    },
    {
      "id": "herbal_liqueur",
      "name": "Herbal Liqueur / Amaro",
      "family": "liqueur",
      "style": "herbal"
    },
    {
      "id": "creme_de_cacao",
      "name": "Crème de Cacao",
      "family": "liqueur",
      "style": "chocolate"
    }
  ],
  "alcohol_alcohol_pairings": [
    {
      "a": "gin",
      "b": "dry_vermouth",
      "score": 98,
      "relationship": "classic cocktail",
      "why": "Botanical gin and herbal dry vermouth form a dry, aromatic structure.",
      "examples": [
        "Dry Martini"
      ],
      "tags": [
        "dry",
        "herbal"
      ]
    },
    {
      "a": "gin",
      "b": "campari",
      "score": 97,
      "relationship": "classic cocktail",
      "why": "Juniper and citrus botanicals stand up to bitter orange-herbal notes.",
      "examples": [
        "Negroni"
      ],
      "tags": [
        "bitter",
        "botanical"
      ]
    },
    {
      "a": "gin",
      "b": "sweet_vermouth",
      "score": 92,
      "relationship": "classic cocktail",
      "why": "Botanicals are rounded by sweet, spiced vermouth.",
      "examples": [
        "Negroni"
      ],
      "tags": [
        "herbal",
        "sweet-bitter"
      ]
    },
    {
      "a": "gin",
      "b": "elderflower_liqueur",
      "score": 93,
      "relationship": "complement",
      "why": "Floral elderflower amplifies aromatic gin without hiding it.",
      "examples": [
        "Elderflower Gin Sour",
        "French-style spritz"
      ],
      "tags": [
        "floral",
        "fresh"
      ]
    },
    {
      "a": "gin",
      "b": "orange_liqueur",
      "score": 88,
      "relationship": "complement",
      "why": "Citrus liqueur reinforces citrus-forward gin botanicals.",
      "examples": [
        "White Lady"
      ],
      "tags": [
        "citrus"
      ]
    },
    {
      "a": "gin",
      "b": "aperol",
      "score": 87,
      "relationship": "contrast",
      "why": "Bitter-sweet orange adds fruit and softer bitterness to gin.",
      "examples": [
        "Gin Aperol Sour"
      ],
      "tags": [
        "citrus",
        "bitter"
      ]
    },
    {
      "a": "gin",
      "b": "champagne_brut",
      "score": 91,
      "relationship": "classic cocktail",
      "why": "Dry bubbles lift gin botanicals and add acidity.",
      "examples": [
        "French 75"
      ],
      "tags": [
        "sparkling",
        "citrus"
      ]
    },
    {
      "a": "gin",
      "b": "sherry_fino",
      "score": 82,
      "relationship": "savory complement",
      "why": "Dry saline sherry adds nutty, savory complexity.",
      "examples": [
        "Bamboo-style gin variation"
      ],
      "tags": [
        "dry",
        "savory"
      ]
    },
    {
      "a": "vodka",
      "b": "dry_vermouth",
      "score": 92,
      "relationship": "classic cocktail",
      "why": "Neutral vodka lets herbal dry vermouth define the aroma.",
      "examples": [
        "Vodka Martini"
      ],
      "tags": [
        "dry"
      ]
    },
    {
      "a": "vodka",
      "b": "coffee_liqueur",
      "score": 96,
      "relationship": "classic cocktail",
      "why": "Neutral spirit carries roasted coffee and sweetness cleanly.",
      "examples": [
        "Black Russian",
        "White Russian"
      ],
      "tags": [
        "coffee",
        "sweet"
      ]
    },
    {
      "a": "vodka",
      "b": "orange_liqueur",
      "score": 88,
      "relationship": "complement",
      "why": "Clean vodka gives citrus liqueur a simple, bright base.",
      "examples": [
        "Cosmopolitan-family drinks"
      ],
      "tags": [
        "citrus"
      ]
    },
    {
      "a": "vodka",
      "b": "elderflower_liqueur",
      "score": 85,
      "relationship": "complement",
      "why": "Neutral base highlights floral sweetness.",
      "examples": [
        "Elderflower Vodka Collins"
      ],
      "tags": [
        "floral"
      ]
    },
    {
      "a": "vodka",
      "b": "aperol",
      "score": 80,
      "relationship": "contrast",
      "why": "Neutral vodka supports bittersweet citrus without extra botanicals.",
      "examples": [
        "Vodka Spritz"
      ],
      "tags": [
        "bitter",
        "citrus"
      ]
    },
    {
      "a": "rye_whiskey",
      "b": "sweet_vermouth",
      "score": 98,
      "relationship": "classic cocktail",
      "why": "Spicy rye balances rich, herbal sweetness.",
      "examples": [
        "Manhattan"
      ],
      "tags": [
        "spiced",
        "herbal"
      ]
    },
    {
      "a": "bourbon",
      "b": "sweet_vermouth",
      "score": 96,
      "relationship": "classic cocktail",
      "why": "Caramel and vanilla notes integrate with spiced vermouth.",
      "examples": [
        "Bourbon Manhattan"
      ],
      "tags": [
        "oak",
        "sweet-spice"
      ]
    },
    {
      "a": "rye_whiskey",
      "b": "herbal_liqueur",
      "score": 88,
      "relationship": "complement",
      "why": "Peppery rye works with bitter herbal depth.",
      "examples": [
        "Black Manhattan-style drinks"
      ],
      "tags": [
        "bitter",
        "spice"
      ]
    },
    {
      "a": "bourbon",
      "b": "orange_liqueur",
      "score": 85,
      "relationship": "complement",
      "why": "Orange brightens bourbon's vanilla, caramel and oak.",
      "examples": [
        "Bourbon Sidecar variations"
      ],
      "tags": [
        "oak",
        "citrus"
      ]
    },
    {
      "a": "bourbon",
      "b": "amaretto",
      "score": 90,
      "relationship": "classic pairing",
      "why": "Almond sweetness rounds vanilla and oak.",
      "examples": [
        "Godfather-style bourbon variation"
      ],
      "tags": [
        "nutty",
        "sweet"
      ]
    },
    {
      "a": "scotch_unpeated",
      "b": "amaretto",
      "score": 94,
      "relationship": "classic cocktail",
      "why": "Malt and gentle smoke/oak pair with almond sweetness.",
      "examples": [
        "Godfather"
      ],
      "tags": [
        "nutty",
        "malt"
      ]
    },
    {
      "a": "scotch_peated",
      "b": "sweet_vermouth",
      "score": 80,
      "relationship": "contrast",
      "why": "Sweet herbs can soften smoky peat while keeping intensity.",
      "examples": [
        "Rob Roy variations"
      ],
      "tags": [
        "smoky",
        "herbal"
      ]
    },
    {
      "a": "scotch_unpeated",
      "b": "sweet_vermouth",
      "score": 93,
      "relationship": "classic cocktail",
      "why": "Malt, oak and herbal sweetness balance naturally.",
      "examples": [
        "Rob Roy"
      ],
      "tags": [
        "malt",
        "herbal"
      ]
    },
    {
      "a": "irish_whiskey",
      "b": "coffee_liqueur",
      "score": 88,
      "relationship": "complement",
      "why": "Soft grain and vanilla notes echo roasted coffee.",
      "examples": [
        "Irish coffee-inspired cocktails"
      ],
      "tags": [
        "coffee",
        "smooth"
      ]
    },
    {
      "a": "bourbon",
      "b": "coffee_liqueur",
      "score": 89,
      "relationship": "complement",
      "why": "Caramel and char notes reinforce coffee roast.",
      "examples": [
        "Bourbon Coffee Cocktail"
      ],
      "tags": [
        "coffee",
        "oak"
      ]
    },
    {
      "a": "cognac",
      "b": "orange_liqueur",
      "score": 98,
      "relationship": "classic cocktail",
      "why": "Orange lifts grape, oak and dried-fruit notes.",
      "examples": [
        "Sidecar"
      ],
      "tags": [
        "citrus",
        "oak"
      ]
    },
    {
      "a": "brandy",
      "b": "creme_de_cacao",
      "score": 95,
      "relationship": "classic cocktail",
      "why": "Fruit-and-oak brandy complements cocoa richness.",
      "examples": [
        "Brandy Alexander"
      ],
      "tags": [
        "chocolate",
        "dessert"
      ]
    },
    {
      "a": "cognac",
      "b": "champagne_brut",
      "score": 90,
      "relationship": "classic cocktail",
      "why": "Bubbles and acidity brighten rich cognac.",
      "examples": [
        "Champagne Cocktail variations"
      ],
      "tags": [
        "sparkling",
        "luxury"
      ]
    },
    {
      "a": "cognac",
      "b": "amaretto",
      "score": 86,
      "relationship": "complement",
      "why": "Almond sweetness matches dried fruit and oak.",
      "examples": [
        "French Connection-style drinks"
      ],
      "tags": [
        "nutty",
        "oak"
      ]
    },
    {
      "a": "brandy",
      "b": "sweet_vermouth",
      "score": 87,
      "relationship": "classic cocktail",
      "why": "Fruit-led brandy and herbal sweetness form a rounded aperitif profile.",
      "examples": [
        "Metropolitan-style drinks"
      ],
      "tags": [
        "herbal",
        "fruit"
      ]
    },
    {
      "a": "white_rum",
      "b": "orange_liqueur",
      "score": 93,
      "relationship": "classic cocktail",
      "why": "Citrus supports clean cane sweetness.",
      "examples": [
        "Mai Tai family",
        "Rum Sidecar"
      ],
      "tags": [
        "tropical",
        "citrus"
      ]
    },
    {
      "a": "aged_rum",
      "b": "orange_liqueur",
      "score": 92,
      "relationship": "complement",
      "why": "Orange links rum's dried-fruit, caramel and spice notes.",
      "examples": [
        "Mai Tai family"
      ],
      "tags": [
        "oak",
        "citrus"
      ]
    },
    {
      "a": "aged_rum",
      "b": "coffee_liqueur",
      "score": 91,
      "relationship": "complement",
      "why": "Molasses, caramel and coffee create a deep roasted profile.",
      "examples": [
        "Rum Espresso Martini variations"
      ],
      "tags": [
        "coffee",
        "caramel"
      ]
    },
    {
      "a": "aged_rum",
      "b": "amaretto",
      "score": 87,
      "relationship": "complement",
      "why": "Nutty sweetness fits vanilla and baking-spice notes.",
      "examples": [
        "Rum Old Fashioned variations"
      ],
      "tags": [
        "nutty",
        "spice"
      ]
    },
    {
      "a": "white_rum",
      "b": "campari",
      "score": 82,
      "relationship": "contrast",
      "why": "Clean cane spirit gives bitter aperitif a sharper tropical edge.",
      "examples": [
        "Jungle Bird variations"
      ],
      "tags": [
        "bitter",
        "tropical"
      ]
    },
    {
      "a": "aged_rum",
      "b": "campari",
      "score": 91,
      "relationship": "classic cocktail",
      "why": "Rich rum sweetness balances assertive bitterness.",
      "examples": [
        "Jungle Bird"
      ],
      "tags": [
        "bitter",
        "tropical"
      ]
    },
    {
      "a": "white_rum",
      "b": "champagne_brut",
      "score": 85,
      "relationship": "contrast",
      "why": "Bubbles dry out and lift light rum.",
      "examples": [
        "Airmail variations"
      ],
      "tags": [
        "sparkling",
        "fresh"
      ]
    },
    {
      "a": "tequila_blanco",
      "b": "orange_liqueur",
      "score": 99,
      "relationship": "classic cocktail",
      "why": "Agave, lime-like brightness and orange are a canonical match.",
      "examples": [
        "Margarita"
      ],
      "tags": [
        "agave",
        "citrus"
      ]
    },
    {
      "a": "tequila_reposado",
      "b": "orange_liqueur",
      "score": 96,
      "relationship": "classic cocktail",
      "why": "Oak-softened agave gains brightness from orange.",
      "examples": [
        "Reposado Margarita"
      ],
      "tags": [
        "agave",
        "citrus",
        "oak"
      ]
    },
    {
      "a": "mezcal",
      "b": "orange_liqueur",
      "score": 93,
      "relationship": "classic cocktail",
      "why": "Orange fruit balances smoke and roasted agave.",
      "examples": [
        "Mezcal Margarita"
      ],
      "tags": [
        "smoky",
        "citrus"
      ]
    },
    {
      "a": "mezcal",
      "b": "campari",
      "score": 91,
      "relationship": "contrast",
      "why": "Smoky agave and bitter orange create a powerful bittersweet pairing.",
      "examples": [
        "Mezcal Negroni"
      ],
      "tags": [
        "smoky",
        "bitter"
      ]
    },
    {
      "a": "tequila_blanco",
      "b": "campari",
      "score": 84,
      "relationship": "contrast",
      "why": "Peppery agave cuts through herbal bitterness.",
      "examples": [
        "Tequila Negroni"
      ],
      "tags": [
        "agave",
        "bitter"
      ]
    },
    {
      "a": "tequila_anejo",
      "b": "sweet_vermouth",
      "score": 87,
      "relationship": "complement",
      "why": "Oak-aged agave works with vanilla-spice and herbs.",
      "examples": [
        "Añejo Manhattan"
      ],
      "tags": [
        "oak",
        "herbal"
      ]
    },
    {
      "a": "tequila_reposado",
      "b": "herbal_liqueur",
      "score": 84,
      "relationship": "complement",
      "why": "Roasted agave and herbs create earthy depth.",
      "examples": [
        "Agave-amaro cocktails"
      ],
      "tags": [
        "earthy",
        "herbal"
      ]
    },
    {
      "a": "prosecco",
      "b": "aperol",
      "score": 99,
      "relationship": "classic cocktail",
      "why": "Fresh bubbles, moderate sweetness and bittersweet orange are built for each other.",
      "examples": [
        "Aperol Spritz"
      ],
      "tags": [
        "sparkling",
        "bitter"
      ]
    },
    {
      "a": "champagne_brut",
      "b": "orange_liqueur",
      "score": 92,
      "relationship": "classic cocktail",
      "why": "Dry sparkling wine gains aromatic citrus without losing freshness.",
      "examples": [
        "Mimosa-family / French 75 variations"
      ],
      "tags": [
        "sparkling",
        "citrus"
      ]
    },
    {
      "a": "champagne_brut",
      "b": "campari",
      "score": 80,
      "relationship": "contrast",
      "why": "High acidity and bubbles tame dense bitterness.",
      "examples": [
        "Campari Royale"
      ],
      "tags": [
        "sparkling",
        "bitter"
      ]
    },
    {
      "a": "prosecco",
      "b": "elderflower_liqueur",
      "score": 94,
      "relationship": "classic pairing",
      "why": "Floral sweetness is refreshed by light bubbles.",
      "examples": [
        "Hugo Spritz"
      ],
      "tags": [
        "floral",
        "sparkling"
      ]
    },
    {
      "a": "dry_vermouth",
      "b": "campari",
      "score": 87,
      "relationship": "aperitif pairing",
      "why": "Herbal dryness and bitter citrus form the backbone of low-proof aperitivo drinks.",
      "examples": [
        "Americano-family variations"
      ],
      "tags": [
        "herbal",
        "bitter"
      ]
    },
    {
      "a": "sweet_vermouth",
      "b": "campari",
      "score": 96,
      "relationship": "classic cocktail",
      "why": "Sweet herbs soften and extend the bitter aperitif.",
      "examples": [
        "Americano",
        "Negroni"
      ],
      "tags": [
        "herbal",
        "bitter"
      ]
    },
    {
      "a": "sherry_fino",
      "b": "dry_vermouth",
      "score": 85,
      "relationship": "low-proof pairing",
      "why": "Both are dry, savory and aromatic, producing a crisp aperitif.",
      "examples": [
        "Bamboo"
      ],
      "tags": [
        "dry",
        "savory"
      ]
    },
    {
      "a": "sherry_amontillado",
      "b": "sweet_vermouth",
      "score": 83,
      "relationship": "complement",
      "why": "Nutty oxidative notes work with spiced sweetness.",
      "examples": [
        "Adonis variations"
      ],
      "tags": [
        "nutty",
        "herbal"
      ]
    },
    {
      "a": "sake_junmai",
      "b": "dry_vermouth",
      "score": 80,
      "relationship": "savory complement",
      "why": "Umami-rich sake and herbal vermouth can create a dry, savory aperitif.",
      "examples": [
        "Sake Martini variations"
      ],
      "tags": [
        "umami",
        "herbal"
      ]
    },
    {
      "a": "sake_ginjo",
      "b": "gin",
      "score": 84,
      "relationship": "aromatic complement",
      "why": "Delicate fruit and floral sake can soften juniper and citrus botanicals.",
      "examples": [
        "Sake Martini variations"
      ],
      "tags": [
        "floral",
        "botanical"
      ]
    },
    {
      "a": "sake_nigori",
      "b": "amaretto",
      "score": 72,
      "relationship": "dessert complement",
      "why": "Creamy rice sweetness can work with almond notes in small amounts.",
      "examples": [
        "Dessert cocktail variations"
      ],
      "tags": [
        "creamy",
        "nutty"
      ]
    },
    {
      "a": "pilsner",
      "b": "soju",
      "score": 88,
      "relationship": "traditional mixed serve",
      "why": "Clean lager and neutral-light soju combine without competing aromatics.",
      "examples": [
        "Somaek"
      ],
      "tags": [
        "korean",
        "crisp"
      ]
    },
    {
      "a": "stout_porter",
      "b": "irish_whiskey",
      "score": 88,
      "relationship": "flavor complement",
      "why": "Roast, coffee and grain notes echo whiskey malt and oak.",
      "examples": [
        "Boilermaker-style pairing"
      ],
      "tags": [
        "roast",
        "malt"
      ]
    },
    {
      "a": "pilsner",
      "b": "bourbon",
      "score": 75,
      "relationship": "contrast",
      "why": "Crisp lager refreshes after sweet oak and vanilla.",
      "examples": [
        "Boilermaker-style pairing"
      ],
      "tags": [
        "crisp",
        "oak"
      ]
    },
    {
      "a": "dry_cider",
      "b": "bourbon",
      "score": 84,
      "relationship": "seasonal complement",
      "why": "Apple acidity and fruit suit bourbon vanilla and caramel.",
      "examples": [
        "Stone Fence variations"
      ],
      "tags": [
        "apple",
        "oak"
      ]
    },
    {
      "a": "dry_cider",
      "b": "aged_rum",
      "score": 82,
      "relationship": "complement",
      "why": "Apple and acidity lift dark rum molasses and spice.",
      "examples": [
        "Cider Rum Punch"
      ],
      "tags": [
        "apple",
        "spice"
      ]
    },
    {
      "a": "sweet_cider",
      "b": "brandy",
      "score": 80,
      "relationship": "fruit echo",
      "why": "Fruit brandy and cider share orchard-fruit notes.",
      "examples": [
        "Cider brandy punch"
      ],
      "tags": [
        "apple",
        "fruit"
      ]
    },
    {
      "a": "coffee_liqueur",
      "b": "creme_de_cacao",
      "score": 82,
      "relationship": "dessert complement",
      "why": "Coffee roast and cocoa reinforce one another.",
      "examples": [
        "Dessert cocktails"
      ],
      "tags": [
        "coffee",
        "chocolate"
      ]
    },
    {
      "a": "amaretto",
      "b": "coffee_liqueur",
      "score": 88,
      "relationship": "dessert complement",
      "why": "Almond and coffee create a familiar café-dessert profile.",
      "examples": [
        "Toasted Almond family"
      ],
      "tags": [
        "coffee",
        "nutty"
      ]
    },
    {
      "a": "orange_liqueur",
      "b": "creme_de_cacao",
      "score": 80,
      "relationship": "dessert contrast",
      "why": "Orange zest brightens chocolate sweetness.",
      "examples": [
        "Chocolate-orange cocktails"
      ],
      "tags": [
        "citrus",
        "chocolate"
      ]
    },
    {
      "a": "herbal_liqueur",
      "b": "sweet_vermouth",
      "score": 90,
      "relationship": "aperitif/digestif complement",
      "why": "Layered herbs, roots and spice create depth.",
      "examples": [
        "Amaro Manhattan variations"
      ],
      "tags": [
        "herbal",
        "bitter"
      ]
    },
    {
      "a": "herbal_liqueur",
      "b": "champagne_brut",
      "score": 79,
      "relationship": "contrast",
      "why": "Dry bubbles lighten dense herbal sweetness.",
      "examples": [
        "Amaro spritz"
      ],
      "tags": [
        "sparkling",
        "herbal"
      ]
    }
  ],
  "alcohol_food_pairings": [
    {
      "alcohol": "cabernet_sauvignon",
      "food": "ribeye steak",
      "score": 98,
      "relationship": "classic",
      "why": "High tannin and intensity fit rich, fatty beef."
    },
    {
      "alcohol": "cabernet_sauvignon",
      "food": "grilled beef",
      "score": 96,
      "relationship": "classic",
      "why": "Tannin and dark fruit match char and beef."
    },
    {
      "alcohol": "cabernet_sauvignon",
      "food": "lamb chops",
      "score": 92,
      "relationship": "complement",
      "why": "Structure and herbs suit savory lamb."
    },
    {
      "alcohol": "cabernet_sauvignon",
      "food": "aged cheddar",
      "score": 94,
      "relationship": "classic",
      "why": "Fat and salt soften tannin; intensity is balanced."
    },
    {
      "alcohol": "cabernet_sauvignon",
      "food": "aged gouda",
      "score": 92,
      "relationship": "classic",
      "why": "Nutty aged cheese matches oak and dark fruit."
    },
    {
      "alcohol": "cabernet_sauvignon",
      "food": "mushroom ragout",
      "score": 82,
      "relationship": "earthy complement",
      "why": "Savory mushrooms echo earthy wine notes."
    },
    {
      "alcohol": "cabernet_sauvignon",
      "food": "delicate white fish",
      "score": 30,
      "relationship": "challenging",
      "why": "Tannin and intensity can overwhelm delicate fish."
    },
    {
      "alcohol": "merlot",
      "food": "roast beef",
      "score": 92,
      "relationship": "classic",
      "why": "Round fruit and moderate tannin suit roasted beef."
    },
    {
      "alcohol": "merlot",
      "food": "roast chicken",
      "score": 85,
      "relationship": "complement",
      "why": "Softer tannin works with browned poultry."
    },
    {
      "alcohol": "merlot",
      "food": "mushroom pasta",
      "score": 90,
      "relationship": "earthy complement",
      "why": "Plum and earth notes fit mushrooms."
    },
    {
      "alcohol": "merlot",
      "food": "medium-aged cheese",
      "score": 88,
      "relationship": "classic",
      "why": "Moderate intensity matches semi-hard cheese."
    },
    {
      "alcohol": "merlot",
      "food": "pork tenderloin",
      "score": 84,
      "relationship": "complement",
      "why": "Soft fruit and moderate body suit lean pork."
    },
    {
      "alcohol": "pinot_noir",
      "food": "duck",
      "score": 97,
      "relationship": "classic",
      "why": "Bright acidity and red fruit suit rich duck."
    },
    {
      "alcohol": "pinot_noir",
      "food": "salmon",
      "score": 90,
      "relationship": "classic exception",
      "why": "Light tannin and acidity can work with richer fish."
    },
    {
      "alcohol": "pinot_noir",
      "food": "mushrooms",
      "score": 97,
      "relationship": "earthy complement",
      "why": "Earthy aromas strongly echo mushrooms."
    },
    {
      "alcohol": "pinot_noir",
      "food": "brie",
      "score": 88,
      "relationship": "classic",
      "why": "Low tannin and bright fruit fit soft cheese."
    },
    {
      "alcohol": "pinot_noir",
      "food": "roast chicken",
      "score": 92,
      "relationship": "classic",
      "why": "Elegant body and acidity suit poultry."
    },
    {
      "alcohol": "pinot_noir",
      "food": "tuna",
      "score": 84,
      "relationship": "complement",
      "why": "Meaty fish can handle a light red."
    },
    {
      "alcohol": "syrah_shiraz",
      "food": "grilled lamb",
      "score": 97,
      "relationship": "classic",
      "why": "Pepper, smoke and dark fruit match lamb and char."
    },
    {
      "alcohol": "syrah_shiraz",
      "food": "barbecue ribs",
      "score": 94,
      "relationship": "complement",
      "why": "Bold fruit and spice stand up to smoky-sweet sauce."
    },
    {
      "alcohol": "syrah_shiraz",
      "food": "smoked cheese",
      "score": 90,
      "relationship": "flavor echo",
      "why": "Smoky notes align."
    },
    {
      "alcohol": "syrah_shiraz",
      "food": "pepper steak",
      "score": 96,
      "relationship": "flavor echo",
      "why": "Peppery wine matches black-pepper seasoning."
    },
    {
      "alcohol": "syrah_shiraz",
      "food": "game meat",
      "score": 92,
      "relationship": "classic",
      "why": "Intensity fits venison and other game."
    },
    {
      "alcohol": "malbec",
      "food": "grilled steak",
      "score": 97,
      "relationship": "classic",
      "why": "Dark fruit, moderate-high tannin and smoke fit beef."
    },
    {
      "alcohol": "malbec",
      "food": "beef empanadas",
      "score": 94,
      "relationship": "regional",
      "why": "Savory beef and pastry suit ripe fruit and structure."
    },
    {
      "alcohol": "malbec",
      "food": "blue cheese",
      "score": 82,
      "relationship": "contrast",
      "why": "Fruit can offset salt and pungency."
    },
    {
      "alcohol": "malbec",
      "food": "grilled mushrooms",
      "score": 86,
      "relationship": "earthy complement",
      "why": "Dark savory flavors align."
    },
    {
      "alcohol": "sangiovese_chianti",
      "food": "tomato pasta",
      "score": 99,
      "relationship": "regional/classic",
      "why": "High acidity is excellent with tomato sauce."
    },
    {
      "alcohol": "sangiovese_chianti",
      "food": "pizza margherita",
      "score": 97,
      "relationship": "regional/classic",
      "why": "Acidity and savory herbs match tomato and cheese."
    },
    {
      "alcohol": "sangiovese_chianti",
      "food": "lasagna",
      "score": 95,
      "relationship": "classic",
      "why": "Acidity cuts cheese and matches tomato."
    },
    {
      "alcohol": "sangiovese_chianti",
      "food": "charcuterie",
      "score": 90,
      "relationship": "regional",
      "why": "Acidity refreshes salty cured meat."
    },
    {
      "alcohol": "sangiovese_chianti",
      "food": "parmigiano-reggiano",
      "score": 91,
      "relationship": "regional",
      "why": "Salt, umami and firm texture work with acidity."
    },
    {
      "alcohol": "tempranillo_rioja",
      "food": "roast lamb",
      "score": 98,
      "relationship": "regional/classic",
      "why": "Savory red fruit, oak and lamb are a traditional match."
    },
    {
      "alcohol": "tempranillo_rioja",
      "food": "jamón / cured ham",
      "score": 95,
      "relationship": "regional",
      "why": "Salt and fat complement acidity and oak."
    },
    {
      "alcohol": "tempranillo_rioja",
      "food": "manchego",
      "score": 96,
      "relationship": "regional/classic",
      "why": "Nutty sheep cheese matches oak-aged red wine."
    },
    {
      "alcohol": "tempranillo_rioja",
      "food": "grilled pork",
      "score": 90,
      "relationship": "complement",
      "why": "Savory oak and red fruit suit browned pork."
    },
    {
      "alcohol": "zinfandel",
      "food": "barbecue pork",
      "score": 96,
      "relationship": "classic",
      "why": "Ripe fruit and spice suit sweet-smoky barbecue."
    },
    {
      "alcohol": "zinfandel",
      "food": "burger",
      "score": 90,
      "relationship": "classic",
      "why": "Bold fruit stands up to beef and toppings."
    },
    {
      "alcohol": "zinfandel",
      "food": "spicy sausage",
      "score": 88,
      "relationship": "complement",
      "why": "Fruit and spice fit robust sausage; avoid very hot chili."
    },
    {
      "alcohol": "zinfandel",
      "food": "aged cheddar",
      "score": 87,
      "relationship": "classic",
      "why": "Intensity and fruit balance aged cheese."
    },
    {
      "alcohol": "gamay_beaujolais",
      "food": "charcuterie",
      "score": 95,
      "relationship": "classic",
      "why": "Low tannin and juicy acidity refresh salty meats."
    },
    {
      "alcohol": "gamay_beaujolais",
      "food": "roast chicken",
      "score": 91,
      "relationship": "classic",
      "why": "Light body and fruit suit poultry."
    },
    {
      "alcohol": "gamay_beaujolais",
      "food": "soft cheese",
      "score": 86,
      "relationship": "complement",
      "why": "Low tannin works with creamy cheese."
    },
    {
      "alcohol": "gamay_beaujolais",
      "food": "grilled vegetables",
      "score": 90,
      "relationship": "complement",
      "why": "Fresh fruit and acidity fit vegetables."
    },
    {
      "alcohol": "sauvignon_blanc",
      "food": "goat cheese",
      "score": 99,
      "relationship": "classic/regional",
      "why": "High acidity and herbal notes suit tangy goat cheese."
    },
    {
      "alcohol": "sauvignon_blanc",
      "food": "oysters",
      "score": 96,
      "relationship": "classic",
      "why": "Crisp acidity and minerality fit briny shellfish."
    },
    {
      "alcohol": "sauvignon_blanc",
      "food": "green salad",
      "score": 94,
      "relationship": "complement",
      "why": "Herbal citrus profile matches fresh greens."
    },
    {
      "alcohol": "sauvignon_blanc",
      "food": "asparagus",
      "score": 91,
      "relationship": "classic",
      "why": "Herbaceous character handles a difficult vegetable."
    },
    {
      "alcohol": "sauvignon_blanc",
      "food": "grilled fish",
      "score": 92,
      "relationship": "classic",
      "why": "Acidity and freshness suit light fish."
    },
    {
      "alcohol": "sauvignon_blanc",
      "food": "herb chicken",
      "score": 88,
      "relationship": "flavor echo",
      "why": "Herbal aromas match fresh herbs."
    },
    {
      "alcohol": "chardonnay_unoaked",
      "food": "white fish",
      "score": 94,
      "relationship": "classic",
      "why": "Fresh acidity and moderate body suit delicate fish."
    },
    {
      "alcohol": "chardonnay_unoaked",
      "food": "shellfish",
      "score": 92,
      "relationship": "classic",
      "why": "Citrus/apple notes complement sweet shellfish."
    },
    {
      "alcohol": "chardonnay_unoaked",
      "food": "chicken salad",
      "score": 88,
      "relationship": "complement",
      "why": "Freshness fits light poultry dishes."
    },
    {
      "alcohol": "chardonnay_unoaked",
      "food": "fresh cheese",
      "score": 86,
      "relationship": "complement",
      "why": "Moderate acidity works with mild creamy cheese."
    },
    {
      "alcohol": "chardonnay_oaked",
      "food": "lobster with butter",
      "score": 98,
      "relationship": "classic",
      "why": "Rich body and oak complement butter and sweet lobster."
    },
    {
      "alcohol": "chardonnay_oaked",
      "food": "roast chicken",
      "score": 94,
      "relationship": "classic",
      "why": "Body and savory oak fit browned poultry."
    },
    {
      "alcohol": "chardonnay_oaked",
      "food": "creamy pasta",
      "score": 96,
      "relationship": "congruent",
      "why": "Creamy texture and oak mirror rich sauce."
    },
    {
      "alcohol": "chardonnay_oaked",
      "food": "salmon",
      "score": 91,
      "relationship": "classic",
      "why": "Body can handle rich fish."
    },
    {
      "alcohol": "chardonnay_oaked",
      "food": "comté / gruyère",
      "score": 90,
      "relationship": "classic",
      "why": "Nutty cheese and oak integrate well."
    },
    {
      "alcohol": "riesling_dry",
      "food": "sushi",
      "score": 96,
      "relationship": "classic",
      "why": "Acidity and low tannin suit rice, fish and soy."
    },
    {
      "alcohol": "riesling_dry",
      "food": "pork",
      "score": 92,
      "relationship": "classic",
      "why": "Apple-citrus acidity suits slightly sweet pork."
    },
    {
      "alcohol": "riesling_dry",
      "food": "spicy noodles",
      "score": 86,
      "relationship": "contrast",
      "why": "Aromatic fruit helps, though off-dry Riesling is safer for high heat."
    },
    {
      "alcohol": "riesling_dry",
      "food": "smoked fish",
      "score": 90,
      "relationship": "contrast",
      "why": "Acidity refreshes smoke and oil."
    },
    {
      "alcohol": "riesling_off_dry",
      "food": "thai curry",
      "score": 98,
      "relationship": "classic",
      "why": "Slight sweetness and aromatics soften chili heat."
    },
    {
      "alcohol": "riesling_off_dry",
      "food": "spicy asian food",
      "score": 97,
      "relationship": "classic",
      "why": "Lower perceived dryness balances heat."
    },
    {
      "alcohol": "riesling_off_dry",
      "food": "pork belly",
      "score": 94,
      "relationship": "contrast",
      "why": "Acidity and sweetness cut rich fat."
    },
    {
      "alcohol": "riesling_off_dry",
      "food": "blue cheese",
      "score": 88,
      "relationship": "contrast",
      "why": "Sweetness balances salt and pungency."
    },
    {
      "alcohol": "riesling_off_dry",
      "food": "fruit-based dishes",
      "score": 92,
      "relationship": "congruent",
      "why": "Fruit aromas echo the dish."
    },
    {
      "alcohol": "pinot_grigio",
      "food": "light seafood",
      "score": 95,
      "relationship": "classic",
      "why": "Crisp, light style does not overpower delicate seafood."
    },
    {
      "alcohol": "pinot_grigio",
      "food": "salad",
      "score": 92,
      "relationship": "classic",
      "why": "Fresh acidity fits raw vegetables."
    },
    {
      "alcohol": "pinot_grigio",
      "food": "antipasti",
      "score": 90,
      "relationship": "regional",
      "why": "Light salty starters suit a crisp white."
    },
    {
      "alcohol": "pinot_grigio",
      "food": "fresh mozzarella",
      "score": 88,
      "relationship": "complement",
      "why": "Mild cheese matches delicate wine."
    },
    {
      "alcohol": "chenin_blanc",
      "food": "pork",
      "score": 91,
      "relationship": "classic",
      "why": "Acidity and apple/quince notes suit pork."
    },
    {
      "alcohol": "chenin_blanc",
      "food": "goat cheese",
      "score": 92,
      "relationship": "classic",
      "why": "Acidity matches tangy cheese."
    },
    {
      "alcohol": "chenin_blanc",
      "food": "roast chicken",
      "score": 89,
      "relationship": "complement",
      "why": "Body and acidity fit poultry."
    },
    {
      "alcohol": "chenin_blanc",
      "food": "mild curry",
      "score": 88,
      "relationship": "aromatic complement",
      "why": "Fruit and acidity fit gentle spice."
    },
    {
      "alcohol": "gewurztraminer",
      "food": "thai food",
      "score": 96,
      "relationship": "classic",
      "why": "Aromatic fruit and slight sweetness suit fragrant spice."
    },
    {
      "alcohol": "gewurztraminer",
      "food": "indian curry",
      "score": 94,
      "relationship": "classic",
      "why": "Floral spice profile complements aromatic curries."
    },
    {
      "alcohol": "gewurztraminer",
      "food": "munster cheese",
      "score": 92,
      "relationship": "regional/classic",
      "why": "Aromatic intensity handles pungent cheese."
    },
    {
      "alcohol": "gewurztraminer",
      "food": "duck with fruit sauce",
      "score": 90,
      "relationship": "congruent",
      "why": "Lychee/rose-like aromas suit sweet-savory sauce."
    },
    {
      "alcohol": "albarino",
      "food": "oysters",
      "score": 98,
      "relationship": "regional/classic",
      "why": "High acidity and saline character suit oysters."
    },
    {
      "alcohol": "albarino",
      "food": "shrimp",
      "score": 95,
      "relationship": "classic",
      "why": "Citrus freshness complements sweet shellfish."
    },
    {
      "alcohol": "albarino",
      "food": "grilled octopus",
      "score": 93,
      "relationship": "regional",
      "why": "Minerality and acidity suit charred seafood."
    },
    {
      "alcohol": "albarino",
      "food": "fish tacos",
      "score": 91,
      "relationship": "contrast",
      "why": "Acidity works with lime and fried/grilled fish."
    },
    {
      "alcohol": "rose_dry",
      "food": "charcuterie",
      "score": 94,
      "relationship": "classic",
      "why": "Freshness handles salt and fat."
    },
    {
      "alcohol": "rose_dry",
      "food": "grilled vegetables",
      "score": 92,
      "relationship": "classic",
      "why": "Red-fruit freshness suits char and vegetables."
    },
    {
      "alcohol": "rose_dry",
      "food": "salmon",
      "score": 90,
      "relationship": "classic",
      "why": "Enough body for richer fish without heavy tannin."
    },
    {
      "alcohol": "rose_dry",
      "food": "mediterranean salads",
      "score": 93,
      "relationship": "regional",
      "why": "Acidity and fruit fit herbs, olives and tomatoes."
    },
    {
      "alcohol": "champagne_brut",
      "food": "oysters",
      "score": 99,
      "relationship": "classic",
      "why": "Acidity and bubbles suit briny shellfish."
    },
    {
      "alcohol": "champagne_brut",
      "food": "fried chicken",
      "score": 98,
      "relationship": "contrast",
      "why": "Bubbles and acidity cut fried richness."
    },
    {
      "alcohol": "champagne_brut",
      "food": "french fries",
      "score": 96,
      "relationship": "contrast",
      "why": "Salt and fat are refreshed by bubbles."
    },
    {
      "alcohol": "champagne_brut",
      "food": "brie / camembert",
      "score": 94,
      "relationship": "classic",
      "why": "Acidity cleanses creamy soft cheese."
    },
    {
      "alcohol": "champagne_brut",
      "food": "sushi",
      "score": 94,
      "relationship": "classic",
      "why": "Low tannin, bubbles and acidity suit fish and rice."
    },
    {
      "alcohol": "champagne_brut",
      "food": "caviar",
      "score": 98,
      "relationship": "classic",
      "why": "Salt, fat and delicate texture pair with dry bubbles."
    },
    {
      "alcohol": "prosecco",
      "food": "prosciutto",
      "score": 94,
      "relationship": "classic",
      "why": "Fruit and bubbles balance salt."
    },
    {
      "alcohol": "prosecco",
      "food": "light appetizers",
      "score": 92,
      "relationship": "classic",
      "why": "Low-to-moderate intensity fits starters."
    },
    {
      "alcohol": "prosecco",
      "food": "fruit",
      "score": 90,
      "relationship": "congruent",
      "why": "Fresh pear/apple notes echo fruit."
    },
    {
      "alcohol": "prosecco",
      "food": "salty snacks",
      "score": 91,
      "relationship": "contrast",
      "why": "Bubbles refresh the palate."
    },
    {
      "alcohol": "moscato",
      "food": "fruit tart",
      "score": 96,
      "relationship": "classic",
      "why": "Aromatic sweetness matches fruit desserts."
    },
    {
      "alcohol": "moscato",
      "food": "light cake",
      "score": 90,
      "relationship": "classic",
      "why": "Sweetness and low intensity suit delicate desserts."
    },
    {
      "alcohol": "moscato",
      "food": "spicy food",
      "score": 91,
      "relationship": "contrast",
      "why": "Low alcohol and sweetness can soften heat."
    },
    {
      "alcohol": "moscato",
      "food": "fresh berries",
      "score": 94,
      "relationship": "congruent",
      "why": "Fruit-forward aromas align."
    },
    {
      "alcohol": "sauternes",
      "food": "foie gras",
      "score": 99,
      "relationship": "classic",
      "why": "Sweetness and acidity balance extreme richness."
    },
    {
      "alcohol": "sauternes",
      "food": "roquefort",
      "score": 99,
      "relationship": "classic",
      "why": "Sweetness contrasts salt and blue-cheese intensity."
    },
    {
      "alcohol": "sauternes",
      "food": "fruit dessert",
      "score": 95,
      "relationship": "classic",
      "why": "Sweet wine matches dessert sweetness."
    },
    {
      "alcohol": "sauternes",
      "food": "creme brulee",
      "score": 93,
      "relationship": "congruent",
      "why": "Honeyed richness suits caramel custard."
    },
    {
      "alcohol": "port_ruby",
      "food": "stilton / blue cheese",
      "score": 99,
      "relationship": "classic",
      "why": "Sweet dark fruit balances salt and pungency."
    },
    {
      "alcohol": "port_ruby",
      "food": "dark chocolate dessert",
      "score": 94,
      "relationship": "classic",
      "why": "Dense fruit and sweetness can match intense chocolate."
    },
    {
      "alcohol": "port_ruby",
      "food": "berry dessert",
      "score": 95,
      "relationship": "congruent",
      "why": "Dark berry flavors echo the dessert."
    },
    {
      "alcohol": "port_tawny",
      "food": "walnut tart",
      "score": 98,
      "relationship": "congruent",
      "why": "Nutty oxidative notes mirror walnuts."
    },
    {
      "alcohol": "port_tawny",
      "food": "caramel dessert",
      "score": 96,
      "relationship": "congruent",
      "why": "Toffee and dried-fruit notes fit caramel."
    },
    {
      "alcohol": "port_tawny",
      "food": "aged cheese",
      "score": 92,
      "relationship": "classic",
      "why": "Sweetness contrasts salt and nuttiness."
    },
    {
      "alcohol": "port_tawny",
      "food": "milk chocolate",
      "score": 90,
      "relationship": "congruent",
      "why": "Softer chocolate fits mellow tawny character."
    },
    {
      "alcohol": "sherry_fino",
      "food": "olives",
      "score": 99,
      "relationship": "regional/classic",
      "why": "Saline, dry style matches briny olives."
    },
    {
      "alcohol": "sherry_fino",
      "food": "almonds",
      "score": 97,
      "relationship": "regional/classic",
      "why": "Nutty savory notes align."
    },
    {
      "alcohol": "sherry_fino",
      "food": "jamón",
      "score": 98,
      "relationship": "regional/classic",
      "why": "Dry saline wine refreshes cured ham."
    },
    {
      "alcohol": "sherry_fino",
      "food": "fried fish",
      "score": 94,
      "relationship": "regional",
      "why": "Freshness cuts oil."
    },
    {
      "alcohol": "sherry_fino",
      "food": "sushi",
      "score": 90,
      "relationship": "savory complement",
      "why": "Salinity and low fruit can fit umami and seafood."
    },
    {
      "alcohol": "sherry_amontillado",
      "food": "mushrooms",
      "score": 96,
      "relationship": "congruent",
      "why": "Nutty oxidative notes echo earthy umami."
    },
    {
      "alcohol": "sherry_amontillado",
      "food": "roast chicken",
      "score": 93,
      "relationship": "classic",
      "why": "Savory depth fits browned poultry."
    },
    {
      "alcohol": "sherry_amontillado",
      "food": "hard cheese",
      "score": 92,
      "relationship": "classic",
      "why": "Nutty wine works with aged cheese."
    },
    {
      "alcohol": "sherry_amontillado",
      "food": "jamón",
      "score": 95,
      "relationship": "regional",
      "why": "Salt and savory oxidation align."
    },
    {
      "alcohol": "sherry_oloroso",
      "food": "braised beef",
      "score": 94,
      "relationship": "classic",
      "why": "Powerful nutty body suits rich meat."
    },
    {
      "alcohol": "sherry_oloroso",
      "food": "aged cheese",
      "score": 96,
      "relationship": "classic",
      "why": "Intensity and nuttiness match."
    },
    {
      "alcohol": "sherry_oloroso",
      "food": "nuts",
      "score": 98,
      "relationship": "congruent",
      "why": "Walnut-like oxidative flavors echo nuts."
    },
    {
      "alcohol": "madeira",
      "food": "mushroom dishes",
      "score": 91,
      "relationship": "congruent",
      "why": "Oxidative savory notes suit mushrooms."
    },
    {
      "alcohol": "madeira",
      "food": "roast meat",
      "score": 90,
      "relationship": "classic",
      "why": "Acidity keeps rich meat lively."
    },
    {
      "alcohol": "madeira",
      "food": "caramelized nuts",
      "score": 95,
      "relationship": "congruent",
      "why": "Toffee-nut flavors align."
    },
    {
      "alcohol": "madeira",
      "food": "hard cheese",
      "score": 92,
      "relationship": "classic",
      "why": "Acidity and oxidative complexity suit aged cheese."
    },
    {
      "alcohol": "pilsner",
      "food": "fried chicken",
      "score": 97,
      "relationship": "contrast",
      "why": "Crisp carbonation and bitterness cut fried fat."
    },
    {
      "alcohol": "pilsner",
      "food": "pizza",
      "score": 93,
      "relationship": "classic",
      "why": "Crisp malt and bitterness refresh cheese and crust."
    },
    {
      "alcohol": "pilsner",
      "food": "sausages",
      "score": 94,
      "relationship": "classic",
      "why": "Carbonation and malt fit savory sausage."
    },
    {
      "alcohol": "pilsner",
      "food": "salty snacks",
      "score": 96,
      "relationship": "classic",
      "why": "Clean bitterness and bubbles refresh salt."
    },
    {
      "alcohol": "pilsner",
      "food": "sushi",
      "score": 88,
      "relationship": "complement",
      "why": "Light body does not overpower fish."
    },
    {
      "alcohol": "wheat_beer",
      "food": "salad",
      "score": 90,
      "relationship": "complement",
      "why": "Light body and citrus/spice fit fresh vegetables."
    },
    {
      "alcohol": "wheat_beer",
      "food": "seafood",
      "score": 91,
      "relationship": "classic",
      "why": "Citrus-like notes suit shellfish and fish."
    },
    {
      "alcohol": "wheat_beer",
      "food": "goat cheese",
      "score": 88,
      "relationship": "complement",
      "why": "Fresh acidity and yeast character fit tangy cheese."
    },
    {
      "alcohol": "wheat_beer",
      "food": "banana bread",
      "score": 84,
      "relationship": "flavor echo",
      "why": "Hefeweizen banana/clove notes can mirror baking flavors."
    },
    {
      "alcohol": "pale_ale",
      "food": "burger",
      "score": 93,
      "relationship": "classic",
      "why": "Malt and hops stand up to beef and toppings."
    },
    {
      "alcohol": "pale_ale",
      "food": "grilled chicken",
      "score": 90,
      "relationship": "classic",
      "why": "Caramel malt and hop bitterness fit char."
    },
    {
      "alcohol": "pale_ale",
      "food": "cheddar",
      "score": 92,
      "relationship": "classic",
      "why": "Hop bitterness and malt work with sharp cheese."
    },
    {
      "alcohol": "pale_ale",
      "food": "roasted vegetables",
      "score": 88,
      "relationship": "complement",
      "why": "Toast and hops suit caramelized vegetables."
    },
    {
      "alcohol": "ipa",
      "food": "spicy tacos",
      "score": 91,
      "relationship": "contrast/complement",
      "why": "Hop citrus can fit tacos, though bitterness may amplify extreme chili."
    },
    {
      "alcohol": "ipa",
      "food": "blue cheese",
      "score": 90,
      "relationship": "contrast",
      "why": "Bold hops match intense cheese."
    },
    {
      "alcohol": "ipa",
      "food": "burger",
      "score": 94,
      "relationship": "classic",
      "why": "Bitterness cuts fat and intensity matches beef."
    },
    {
      "alcohol": "ipa",
      "food": "fried food",
      "score": 92,
      "relationship": "contrast",
      "why": "Carbonation and bitterness refresh oil."
    },
    {
      "alcohol": "ipa",
      "food": "carrot cake",
      "score": 80,
      "relationship": "aromatic complement",
      "why": "Citrus/pine hops can play against spice and sweetness."
    },
    {
      "alcohol": "amber_ale",
      "food": "roast pork",
      "score": 92,
      "relationship": "classic",
      "why": "Caramel malt suits browned pork."
    },
    {
      "alcohol": "amber_ale",
      "food": "grilled sausage",
      "score": 94,
      "relationship": "classic",
      "why": "Toasty malt complements savory char."
    },
    {
      "alcohol": "amber_ale",
      "food": "medium cheddar",
      "score": 90,
      "relationship": "classic",
      "why": "Malt sweetness balances salt."
    },
    {
      "alcohol": "amber_ale",
      "food": "roasted root vegetables",
      "score": 89,
      "relationship": "congruent",
      "why": "Caramelized flavors echo malt."
    },
    {
      "alcohol": "stout_porter",
      "food": "oysters",
      "score": 95,
      "relationship": "classic",
      "why": "Roast and briny minerality are a traditional contrast."
    },
    {
      "alcohol": "stout_porter",
      "food": "beef stew",
      "score": 96,
      "relationship": "classic",
      "why": "Roast and body suit deep savory flavors."
    },
    {
      "alcohol": "stout_porter",
      "food": "chocolate cake",
      "score": 98,
      "relationship": "congruent",
      "why": "Coffee/cocoa malt echoes chocolate."
    },
    {
      "alcohol": "stout_porter",
      "food": "blue cheese",
      "score": 91,
      "relationship": "contrast",
      "why": "Roast sweetness and body handle pungent cheese."
    },
    {
      "alcohol": "stout_porter",
      "food": "barbecue",
      "score": 92,
      "relationship": "flavor echo",
      "why": "Smoke and roast fit charred meat."
    },
    {
      "alcohol": "saison",
      "food": "mussels",
      "score": 97,
      "relationship": "classic",
      "why": "Dryness, pepper and carbonation suit shellfish."
    },
    {
      "alcohol": "saison",
      "food": "goat cheese",
      "score": 93,
      "relationship": "classic",
      "why": "Earthy spice matches tangy cheese."
    },
    {
      "alcohol": "saison",
      "food": "herb chicken",
      "score": 92,
      "relationship": "flavor echo",
      "why": "Peppery/herbal yeast notes suit herbs."
    },
    {
      "alcohol": "saison",
      "food": "salad",
      "score": 90,
      "relationship": "complement",
      "why": "Dry refreshing profile fits vegetables."
    },
    {
      "alcohol": "sour_beer",
      "food": "goat cheese",
      "score": 95,
      "relationship": "contrast",
      "why": "Acidity matches tang and refreshes fat."
    },
    {
      "alcohol": "sour_beer",
      "food": "fruit dessert",
      "score": 92,
      "relationship": "congruent",
      "why": "Fruit acidity echoes berries and stone fruit."
    },
    {
      "alcohol": "sour_beer",
      "food": "rich pork",
      "score": 90,
      "relationship": "contrast",
      "why": "Acidity cuts fat."
    },
    {
      "alcohol": "sour_beer",
      "food": "fried food",
      "score": 90,
      "relationship": "contrast",
      "why": "Tartness refreshes oil."
    },
    {
      "alcohol": "belgian_dubbel",
      "food": "braised beef",
      "score": 94,
      "relationship": "classic",
      "why": "Dark fruit and malt suit caramelized meat."
    },
    {
      "alcohol": "belgian_dubbel",
      "food": "duck",
      "score": 91,
      "relationship": "complement",
      "why": "Rich fruit works with fatty poultry."
    },
    {
      "alcohol": "belgian_dubbel",
      "food": "aged gouda",
      "score": 94,
      "relationship": "classic",
      "why": "Caramel malt fits nutty aged cheese."
    },
    {
      "alcohol": "belgian_tripel",
      "food": "mussels",
      "score": 92,
      "relationship": "classic",
      "why": "High carbonation and spice suit shellfish."
    },
    {
      "alcohol": "belgian_tripel",
      "food": "washed-rind cheese",
      "score": 91,
      "relationship": "intensity match",
      "why": "Strong aromas and carbonation handle pungent cheese."
    },
    {
      "alcohol": "belgian_tripel",
      "food": "roast chicken",
      "score": 90,
      "relationship": "classic",
      "why": "Spice and body fit browned poultry."
    },
    {
      "alcohol": "dry_cider",
      "food": "pork chops",
      "score": 97,
      "relationship": "classic",
      "why": "Apple acidity naturally suits pork."
    },
    {
      "alcohol": "dry_cider",
      "food": "cheddar",
      "score": 95,
      "relationship": "classic",
      "why": "Acidity and fruit balance sharp cheese."
    },
    {
      "alcohol": "dry_cider",
      "food": "roast chicken",
      "score": 90,
      "relationship": "classic",
      "why": "Fresh apple works with poultry."
    },
    {
      "alcohol": "dry_cider",
      "food": "crepes / savory pastry",
      "score": 88,
      "relationship": "regional-style",
      "why": "Acidity balances butter and pastry."
    },
    {
      "alcohol": "sweet_cider",
      "food": "apple pie",
      "score": 96,
      "relationship": "congruent",
      "why": "Apple-on-apple pairing; sweetness must match dessert."
    },
    {
      "alcohol": "sweet_cider",
      "food": "blue cheese",
      "score": 89,
      "relationship": "contrast",
      "why": "Sweetness balances salt."
    },
    {
      "alcohol": "sweet_cider",
      "food": "spicy pork",
      "score": 88,
      "relationship": "contrast",
      "why": "Sweetness softens spice and acidity cuts fat."
    },
    {
      "alcohol": "mead",
      "food": "roast pork",
      "score": 90,
      "relationship": "classic",
      "why": "Honeyed notes suit pork's sweetness."
    },
    {
      "alcohol": "mead",
      "food": "blue cheese",
      "score": 88,
      "relationship": "contrast",
      "why": "Honey sweetness balances pungency."
    },
    {
      "alcohol": "mead",
      "food": "nuts",
      "score": 91,
      "relationship": "congruent",
      "why": "Honey and nuts form a natural flavor family."
    },
    {
      "alcohol": "mead",
      "food": "spiced desserts",
      "score": 92,
      "relationship": "congruent",
      "why": "Honey fits baking spices."
    },
    {
      "alcohol": "vodka",
      "food": "caviar",
      "score": 96,
      "relationship": "classic",
      "why": "Clean chilled spirit does not obscure delicate salt and fat."
    },
    {
      "alcohol": "vodka",
      "food": "smoked fish",
      "score": 92,
      "relationship": "classic",
      "why": "Neutral spirit refreshes oily smoky fish."
    },
    {
      "alcohol": "vodka",
      "food": "pickles",
      "score": 94,
      "relationship": "regional/classic",
      "why": "Sharp acidity and salt pair with a clean spirit."
    },
    {
      "alcohol": "vodka",
      "food": "blini",
      "score": 88,
      "relationship": "regional",
      "why": "Neutrality works with sour cream and savory toppings."
    },
    {
      "alcohol": "gin",
      "food": "oysters",
      "score": 92,
      "relationship": "classic",
      "why": "Juniper and citrus botanicals complement briny shellfish."
    },
    {
      "alcohol": "gin",
      "food": "smoked salmon",
      "score": 90,
      "relationship": "complement",
      "why": "Botanicals and citrus lift rich smoked fish."
    },
    {
      "alcohol": "gin",
      "food": "goat cheese",
      "score": 85,
      "relationship": "aromatic complement",
      "why": "Herbal notes suit tangy cheese."
    },
    {
      "alcohol": "gin",
      "food": "cucumber salad",
      "score": 92,
      "relationship": "flavor echo",
      "why": "Fresh botanicals align with cucumber and herbs."
    },
    {
      "alcohol": "bourbon",
      "food": "barbecue ribs",
      "score": 96,
      "relationship": "classic",
      "why": "Vanilla, caramel and char echo barbecue."
    },
    {
      "alcohol": "bourbon",
      "food": "pecan pie",
      "score": 97,
      "relationship": "congruent",
      "why": "Caramel, vanilla and nut flavors align."
    },
    {
      "alcohol": "bourbon",
      "food": "dark chocolate",
      "score": 92,
      "relationship": "classic",
      "why": "Oak, caramel and cocoa form a rich pairing."
    },
    {
      "alcohol": "bourbon",
      "food": "smoked meat",
      "score": 94,
      "relationship": "flavor echo",
      "why": "Barrel char complements smoke."
    },
    {
      "alcohol": "bourbon",
      "food": "aged cheddar",
      "score": 90,
      "relationship": "classic",
      "why": "Salt and fat balance oak and sweetness."
    },
    {
      "alcohol": "rye_whiskey",
      "food": "pastrami",
      "score": 95,
      "relationship": "classic",
      "why": "Peppery rye mirrors spice and cuts fat."
    },
    {
      "alcohol": "rye_whiskey",
      "food": "smoked sausage",
      "score": 92,
      "relationship": "classic",
      "why": "Spice and grain fit savory smoke."
    },
    {
      "alcohol": "rye_whiskey",
      "food": "aged cheese",
      "score": 90,
      "relationship": "classic",
      "why": "Bold spice handles mature cheese."
    },
    {
      "alcohol": "rye_whiskey",
      "food": "dark chocolate",
      "score": 86,
      "relationship": "contrast",
      "why": "Dry spice prevents the pairing becoming too sweet."
    },
    {
      "alcohol": "irish_whiskey",
      "food": "smoked salmon",
      "score": 88,
      "relationship": "classic",
      "why": "Soft malt and light fruit fit smoke."
    },
    {
      "alcohol": "irish_whiskey",
      "food": "apple tart",
      "score": 91,
      "relationship": "congruent",
      "why": "Fruit and vanilla suit apple pastry."
    },
    {
      "alcohol": "irish_whiskey",
      "food": "milk chocolate",
      "score": 90,
      "relationship": "congruent",
      "why": "Smooth whiskey works with creamy chocolate."
    },
    {
      "alcohol": "irish_whiskey",
      "food": "mild cheddar",
      "score": 87,
      "relationship": "classic",
      "why": "Gentler intensity matches medium cheese."
    },
    {
      "alcohol": "scotch_unpeated",
      "food": "aged cheddar",
      "score": 94,
      "relationship": "classic",
      "why": "Malt, oak and salt-rich cheese align."
    },
    {
      "alcohol": "scotch_unpeated",
      "food": "roast beef",
      "score": 90,
      "relationship": "classic",
      "why": "Malt and oak suit browned meat."
    },
    {
      "alcohol": "scotch_unpeated",
      "food": "nuts",
      "score": 91,
      "relationship": "congruent",
      "why": "Nutty malt/oak notes echo roasted nuts."
    },
    {
      "alcohol": "scotch_unpeated",
      "food": "dark chocolate",
      "score": 89,
      "relationship": "classic",
      "why": "Cocoa and oak complement one another."
    },
    {
      "alcohol": "scotch_peated",
      "food": "smoked salmon",
      "score": 98,
      "relationship": "flavor echo",
      "why": "Smoke-on-smoke pairing with oily fish."
    },
    {
      "alcohol": "scotch_peated",
      "food": "blue cheese",
      "score": 93,
      "relationship": "intensity match",
      "why": "Strong peat can stand up to pungent cheese."
    },
    {
      "alcohol": "scotch_peated",
      "food": "barbecue",
      "score": 94,
      "relationship": "flavor echo",
      "why": "Smoke and char align."
    },
    {
      "alcohol": "scotch_peated",
      "food": "oysters",
      "score": 90,
      "relationship": "coastal contrast",
      "why": "Saline shellfish can complement maritime peat."
    },
    {
      "alcohol": "cognac",
      "food": "foie gras",
      "score": 93,
      "relationship": "classic",
      "why": "Rich fruit and oak fit luxurious fatty texture."
    },
    {
      "alcohol": "cognac",
      "food": "aged cheese",
      "score": 94,
      "relationship": "classic",
      "why": "Dried fruit and oak suit mature cheese."
    },
    {
      "alcohol": "cognac",
      "food": "dark chocolate",
      "score": 96,
      "relationship": "classic",
      "why": "Cocoa, fruit and oak form a deep pairing."
    },
    {
      "alcohol": "cognac",
      "food": "duck",
      "score": 91,
      "relationship": "classic",
      "why": "Fruit and richness complement duck."
    },
    {
      "alcohol": "brandy",
      "food": "fruit tart",
      "score": 91,
      "relationship": "congruent",
      "why": "Fruit spirit echoes baked fruit."
    },
    {
      "alcohol": "brandy",
      "food": "hard cheese",
      "score": 89,
      "relationship": "classic",
      "why": "Oak and fruit pair with nutty cheese."
    },
    {
      "alcohol": "brandy",
      "food": "roast pork",
      "score": 88,
      "relationship": "complement",
      "why": "Fruit notes suit pork."
    },
    {
      "alcohol": "brandy",
      "food": "nuts",
      "score": 90,
      "relationship": "congruent",
      "why": "Oak-aged brandy works with roasted nuts."
    },
    {
      "alcohol": "white_rum",
      "food": "ceviche",
      "score": 96,
      "relationship": "classic",
      "why": "Clean cane and citrus-friendly profile suit lime and raw fish."
    },
    {
      "alcohol": "white_rum",
      "food": "grilled shrimp",
      "score": 92,
      "relationship": "classic",
      "why": "Light sweetness complements shellfish."
    },
    {
      "alcohol": "white_rum",
      "food": "tropical fruit",
      "score": 94,
      "relationship": "congruent",
      "why": "Cane and fruit flavors align."
    },
    {
      "alcohol": "white_rum",
      "food": "coconut dessert",
      "score": 90,
      "relationship": "congruent",
      "why": "Tropical flavors reinforce each other."
    },
    {
      "alcohol": "aged_rum",
      "food": "jerk pork",
      "score": 96,
      "relationship": "classic",
      "why": "Molasses and spice suit caramelized, spicy meat."
    },
    {
      "alcohol": "aged_rum",
      "food": "banana dessert",
      "score": 96,
      "relationship": "congruent",
      "why": "Caramel and tropical fruit align."
    },
    {
      "alcohol": "aged_rum",
      "food": "dark chocolate",
      "score": 94,
      "relationship": "classic",
      "why": "Molasses, oak and cocoa integrate."
    },
    {
      "alcohol": "aged_rum",
      "food": "grilled pineapple",
      "score": 97,
      "relationship": "congruent",
      "why": "Caramelized tropical fruit mirrors rum."
    },
    {
      "alcohol": "aged_rum",
      "food": "aged cheese",
      "score": 88,
      "relationship": "classic",
      "why": "Richness and spice fit mature cheese."
    },
    {
      "alcohol": "tequila_blanco",
      "food": "ceviche",
      "score": 99,
      "relationship": "classic",
      "why": "Agave and citrus character fit lime, chili and seafood."
    },
    {
      "alcohol": "tequila_blanco",
      "food": "fish tacos",
      "score": 98,
      "relationship": "classic",
      "why": "Peppery agave and citrus suit tacos."
    },
    {
      "alcohol": "tequila_blanco",
      "food": "guacamole",
      "score": 95,
      "relationship": "classic",
      "why": "Fresh agave, lime and herbs match avocado."
    },
    {
      "alcohol": "tequila_blanco",
      "food": "grilled shrimp",
      "score": 94,
      "relationship": "classic",
      "why": "Clean agave lifts sweet shellfish."
    },
    {
      "alcohol": "tequila_reposado",
      "food": "carnitas",
      "score": 97,
      "relationship": "classic",
      "why": "Oak-softened agave suits rich pork."
    },
    {
      "alcohol": "tequila_reposado",
      "food": "grilled chicken tacos",
      "score": 94,
      "relationship": "classic",
      "why": "Roasted agave fits char."
    },
    {
      "alcohol": "tequila_reposado",
      "food": "aged cheese",
      "score": 87,
      "relationship": "complement",
      "why": "Oak and savory cheese can work well."
    },
    {
      "alcohol": "tequila_reposado",
      "food": "roasted corn",
      "score": 92,
      "relationship": "flavor echo",
      "why": "Roasted sweetness suits reposado."
    },
    {
      "alcohol": "tequila_anejo",
      "food": "grilled steak",
      "score": 93,
      "relationship": "classic",
      "why": "Oak-aged agave has enough body for beef."
    },
    {
      "alcohol": "tequila_anejo",
      "food": "dark chocolate",
      "score": 94,
      "relationship": "classic",
      "why": "Vanilla, oak and cocoa align."
    },
    {
      "alcohol": "tequila_anejo",
      "food": "mole sauce",
      "score": 95,
      "relationship": "regional/classic",
      "why": "Agave, spice and cocoa notes complement mole."
    },
    {
      "alcohol": "tequila_anejo",
      "food": "aged cheese",
      "score": 91,
      "relationship": "classic",
      "why": "Intensity and oak match mature cheese."
    },
    {
      "alcohol": "mezcal",
      "food": "grilled octopus",
      "score": 97,
      "relationship": "classic",
      "why": "Smoke and char align with seafood."
    },
    {
      "alcohol": "mezcal",
      "food": "mole",
      "score": 98,
      "relationship": "classic",
      "why": "Smoke, chile and cocoa-like complexity fit mezcal."
    },
    {
      "alcohol": "mezcal",
      "food": "barbecue",
      "score": 95,
      "relationship": "flavor echo",
      "why": "Smoke-on-char pairing."
    },
    {
      "alcohol": "mezcal",
      "food": "roasted vegetables",
      "score": 94,
      "relationship": "flavor echo",
      "why": "Earthy roast matches mezcal."
    },
    {
      "alcohol": "sake_junmai",
      "food": "sushi",
      "score": 98,
      "relationship": "classic",
      "why": "Umami and moderate body complement rice and fish."
    },
    {
      "alcohol": "sake_junmai",
      "food": "mushrooms",
      "score": 96,
      "relationship": "umami complement",
      "why": "Sake reinforces savory umami."
    },
    {
      "alcohol": "sake_junmai",
      "food": "grilled chicken",
      "score": 92,
      "relationship": "classic",
      "why": "Rice umami and gentle acidity fit savory chicken."
    },
    {
      "alcohol": "sake_junmai",
      "food": "hard cheese",
      "score": 88,
      "relationship": "umami complement",
      "why": "Sake can pair surprisingly well with aged cheese."
    },
    {
      "alcohol": "sake_ginjo",
      "food": "sashimi",
      "score": 99,
      "relationship": "classic",
      "why": "Delicate fruit and clean texture preserve subtle fish."
    },
    {
      "alcohol": "sake_ginjo",
      "food": "light seafood",
      "score": 97,
      "relationship": "classic",
      "why": "Aromatic freshness suits seafood."
    },
    {
      "alcohol": "sake_ginjo",
      "food": "salad",
      "score": 90,
      "relationship": "complement",
      "why": "Clean aromatics fit fresh vegetables."
    },
    {
      "alcohol": "sake_ginjo",
      "food": "fresh cheese",
      "score": 86,
      "relationship": "complement",
      "why": "Delicate profile matches mild cheese."
    },
    {
      "alcohol": "sake_nigori",
      "food": "spicy food",
      "score": 92,
      "relationship": "contrast",
      "why": "Creamy sweetness can soften chili."
    },
    {
      "alcohol": "sake_nigori",
      "food": "fruit dessert",
      "score": 90,
      "relationship": "congruent",
      "why": "Sweet rice and fruit work together."
    },
    {
      "alcohol": "sake_nigori",
      "food": "coconut dessert",
      "score": 91,
      "relationship": "congruent",
      "why": "Creamy texture and tropical sweetness align."
    },
    {
      "alcohol": "shochu",
      "food": "yakitori",
      "score": 95,
      "relationship": "classic",
      "why": "Clean grain/sweet-potato character fits grilled skewers."
    },
    {
      "alcohol": "shochu",
      "food": "sashimi",
      "score": 90,
      "relationship": "classic",
      "why": "Light styles can accompany delicate fish."
    },
    {
      "alcohol": "shochu",
      "food": "grilled vegetables",
      "score": 89,
      "relationship": "complement",
      "why": "Earthy notes suit char."
    },
    {
      "alcohol": "shochu",
      "food": "pickles",
      "score": 88,
      "relationship": "contrast",
      "why": "Clean spirit works with sharp salty flavors."
    },
    {
      "alcohol": "soju",
      "food": "korean barbecue",
      "score": 99,
      "relationship": "classic",
      "why": "Clean, lightly sweet spirit cuts fatty grilled meat."
    },
    {
      "alcohol": "soju",
      "food": "fried chicken",
      "score": 96,
      "relationship": "classic",
      "why": "Refreshing neutral spirit suits crispy rich food."
    },
    {
      "alcohol": "soju",
      "food": "spicy korean dishes",
      "score": 90,
      "relationship": "classic",
      "why": "Clean profile handles bold seasoning."
    },
    {
      "alcohol": "soju",
      "food": "grilled pork belly",
      "score": 98,
      "relationship": "classic",
      "why": "Spirit refreshes between fatty bites."
    },
    {
      "alcohol": "campari",
      "food": "olives",
      "score": 90,
      "relationship": "aperitivo",
      "why": "Salt and bitterness work as a pre-dinner pairing."
    },
    {
      "alcohol": "campari",
      "food": "charcuterie",
      "score": 88,
      "relationship": "aperitivo",
      "why": "Bitter citrus refreshes fatty cured meat."
    },
    {
      "alcohol": "campari",
      "food": "orange-based appetizers",
      "score": 86,
      "relationship": "flavor echo",
      "why": "Orange notes align."
    },
    {
      "alcohol": "campari",
      "food": "rich cheese",
      "score": 82,
      "relationship": "contrast",
      "why": "Bitterness can cut fat."
    },
    {
      "alcohol": "aperol",
      "food": "prosciutto",
      "score": 92,
      "relationship": "aperitivo",
      "why": "Gentler bittersweet orange suits salty ham."
    },
    {
      "alcohol": "aperol",
      "food": "light antipasti",
      "score": 93,
      "relationship": "aperitivo",
      "why": "Low intensity matches starters."
    },
    {
      "alcohol": "aperol",
      "food": "olives",
      "score": 88,
      "relationship": "aperitivo",
      "why": "Salt balances sweetness and bitterness."
    },
    {
      "alcohol": "orange_liqueur",
      "food": "dark chocolate",
      "score": 95,
      "relationship": "classic",
      "why": "Orange and chocolate are a strong flavor match."
    },
    {
      "alcohol": "orange_liqueur",
      "food": "crepes",
      "score": 92,
      "relationship": "classic",
      "why": "Citrus sweetness suits buttery pastry."
    },
    {
      "alcohol": "orange_liqueur",
      "food": "fruit tart",
      "score": 90,
      "relationship": "congruent",
      "why": "Citrus amplifies fruit."
    },
    {
      "alcohol": "orange_liqueur",
      "food": "duck à l'orange",
      "score": 88,
      "relationship": "flavor echo",
      "why": "Orange component directly matches."
    },
    {
      "alcohol": "coffee_liqueur",
      "food": "tiramisu",
      "score": 98,
      "relationship": "congruent",
      "why": "Coffee-on-coffee pairing."
    },
    {
      "alcohol": "coffee_liqueur",
      "food": "chocolate cake",
      "score": 95,
      "relationship": "classic",
      "why": "Coffee deepens cocoa flavor."
    },
    {
      "alcohol": "coffee_liqueur",
      "food": "vanilla ice cream",
      "score": 94,
      "relationship": "contrast/congruent",
      "why": "Roast and sweetness complement cream and vanilla."
    },
    {
      "alcohol": "amaretto",
      "food": "almond cake",
      "score": 99,
      "relationship": "congruent",
      "why": "Almond flavors directly match."
    },
    {
      "alcohol": "amaretto",
      "food": "tiramisu",
      "score": 92,
      "relationship": "congruent",
      "why": "Nutty sweetness suits coffee and cream."
    },
    {
      "alcohol": "amaretto",
      "food": "stone-fruit dessert",
      "score": 91,
      "relationship": "congruent",
      "why": "Almond aroma naturally fits peach/apricot/cherry."
    },
    {
      "alcohol": "elderflower_liqueur",
      "food": "fresh berries",
      "score": 94,
      "relationship": "congruent",
      "why": "Floral sweetness lifts berry aromas."
    },
    {
      "alcohol": "elderflower_liqueur",
      "food": "goat cheese crostini",
      "score": 87,
      "relationship": "contrast",
      "why": "Floral sweetness balances tang."
    },
    {
      "alcohol": "elderflower_liqueur",
      "food": "light fruit dessert",
      "score": 92,
      "relationship": "congruent",
      "why": "Delicate floral profile suits fruit."
    },
    {
      "alcohol": "herbal_liqueur",
      "food": "dark chocolate",
      "score": 90,
      "relationship": "classic",
      "why": "Bitter herbs and cocoa create digestif depth."
    },
    {
      "alcohol": "herbal_liqueur",
      "food": "aged cheese",
      "score": 89,
      "relationship": "classic",
      "why": "Herbal bitterness contrasts fat and salt."
    },
    {
      "alcohol": "herbal_liqueur",
      "food": "roasted nuts",
      "score": 88,
      "relationship": "congruent",
      "why": "Roasted and herbal bitterness align."
    },
    {
      "alcohol": "creme_de_cacao",
      "food": "chocolate dessert",
      "score": 99,
      "relationship": "congruent",
      "why": "Direct cocoa match."
    },
    {
      "alcohol": "creme_de_cacao",
      "food": "vanilla ice cream",
      "score": 94,
      "relationship": "classic",
      "why": "Chocolate and vanilla complement one another."
    },
    {
      "alcohol": "creme_de_cacao",
      "food": "berries",
      "score": 88,
      "relationship": "contrast",
      "why": "Berry acidity brightens chocolate sweetness."
    },
    {
      "alcohol": "cabernet_sauvignon",
      "food": "gouda",
      "score": 90,
      "relationship": "classic",
      "why": "Established style-level pairing based on intensity, acidity/sweetness, salt and fat."
    },
    {
      "alcohol": "pinot_noir",
      "food": "gruyère",
      "score": 92,
      "relationship": "classic",
      "why": "Established style-level pairing based on intensity, acidity/sweetness, salt and fat."
    },
    {
      "alcohol": "champagne_brut",
      "food": "brie",
      "score": 94,
      "relationship": "classic",
      "why": "Established style-level pairing based on intensity, acidity/sweetness, salt and fat."
    },
    {
      "alcohol": "champagne_brut",
      "food": "camembert",
      "score": 93,
      "relationship": "classic",
      "why": "Established style-level pairing based on intensity, acidity/sweetness, salt and fat."
    },
    {
      "alcohol": "port_ruby",
      "food": "stilton",
      "score": 99,
      "relationship": "classic",
      "why": "Established style-level pairing based on intensity, acidity/sweetness, salt and fat."
    }
  ],
  "food_taxonomy": {
    "cheese": [
      "fresh cheese",
      "goat cheese",
      "brie",
      "camembert",
      "gruyère",
      "comté",
      "cheddar",
      "gouda",
      "manchego",
      "parmigiano-reggiano",
      "blue cheese",
      "stilton",
      "roquefort",
      "washed-rind cheese"
    ],
    "meat": [
      "beef",
      "steak",
      "lamb",
      "pork",
      "duck",
      "chicken",
      "game",
      "charcuterie",
      "sausages",
      "barbecue"
    ],
    "seafood": [
      "oysters",
      "shellfish",
      "shrimp",
      "lobster",
      "white fish",
      "salmon",
      "tuna",
      "sushi",
      "sashimi",
      "octopus",
      "ceviche"
    ],
    "vegetables": [
      "green salad",
      "asparagus",
      "mushrooms",
      "grilled vegetables",
      "roasted vegetables",
      "tomato dishes"
    ],
    "dessert": [
      "dark chocolate",
      "milk chocolate",
      "fruit tart",
      "apple pie",
      "caramel dessert",
      "creme brulee",
      "tiramisu",
      "ice cream",
      "nut desserts"
    ],
    "snacks": [
      "olives",
      "nuts",
      "salty snacks",
      "french fries",
      "fried food",
      "pickles"
    ],
    "spicy": [
      "thai curry",
      "indian curry",
      "spicy noodles",
      "spicy tacos",
      "korean spicy dishes"
    ],
    "starch": [
      "pizza",
      "pasta",
      "risotto",
      "bread",
      "rice dishes"
    ]
  },
  "a0_dialogue_prompts": [
    {
      "slot": "recipient",
      "a0": [
        "Is it for you?",
        "Is it a gift?",
        "Who is it for?"
      ]
    },
    {
      "slot": "occasion",
      "a0": [
        "Is it for a party?",
        "Is it for dinner?",
        "Is it for a birthday?"
      ]
    },
    {
      "slot": "food",
      "a0": [
        "What food will you have?",
        "Meat, fish, or cheese?",
        "Is the food spicy?"
      ]
    },
    {
      "slot": "taste",
      "a0": [
        "Sweet or dry?",
        "Do you like fruit?",
        "Do you like bitter drinks?"
      ]
    },
    {
      "slot": "strength",
      "a0": [
        "Strong or light?",
        "Do you want a strong drink?"
      ]
    },
    {
      "slot": "budget",
      "a0": [
        "What is your budget?",
        "About $20? $50? More?"
      ]
    },
    {
      "slot": "knowledge",
      "a0": [
        "Do you know what they like?",
        "Do you know the drink?"
      ]
    },
    {
      "slot": "alcohol_choice",
      "a0": [
        "With alcohol or without alcohol?",
        "Do you want alcohol?",
        "Alcohol-free is OK?"
      ]
    },
    {
      "slot": "mood_support",
      "a0": [
        "I'm sorry to hear that.",
        "Do you want to talk?",
        "Would you like something calm and simple?"
      ]
    },
    {
      "slot": "activity",
      "a0": [
        "What are you doing tonight?",
        "Is it for dinner?",
        "Do you want a drink with a cigar?"
      ]
    },
    {
      "slot": "cigar",
      "a0": [
        "Is the cigar mild or strong?",
        "Coffee, cocoa, smoke, or spice?",
        "Do you want something smooth?"
      ]
    },
    {
      "slot": "non_alcoholic",
      "a0": [
        "I can make a mocktail.",
        "Would you like tea, coffee, soda, or a mocktail?",
        "Would you like a 0.0 drink?"
      ]
    }
  ],
  "beverage_profiles": [
    {
      "id": "cabernet_sauvignon",
      "name": "Cabernet Sauvignon",
      "family": "wine",
      "style": "red",
      "abv_class": "alcoholic"
    },
    {
      "id": "merlot",
      "name": "Merlot",
      "family": "wine",
      "style": "red",
      "abv_class": "alcoholic"
    },
    {
      "id": "pinot_noir",
      "name": "Pinot Noir",
      "family": "wine",
      "style": "red",
      "abv_class": "alcoholic"
    },
    {
      "id": "syrah_shiraz",
      "name": "Syrah / Shiraz",
      "family": "wine",
      "style": "red",
      "abv_class": "alcoholic"
    },
    {
      "id": "malbec",
      "name": "Malbec",
      "family": "wine",
      "style": "red",
      "abv_class": "alcoholic"
    },
    {
      "id": "sangiovese_chianti",
      "name": "Sangiovese / Chianti",
      "family": "wine",
      "style": "red",
      "abv_class": "alcoholic"
    },
    {
      "id": "tempranillo_rioja",
      "name": "Tempranillo / Rioja",
      "family": "wine",
      "style": "red",
      "abv_class": "alcoholic"
    },
    {
      "id": "zinfandel",
      "name": "Zinfandel",
      "family": "wine",
      "style": "red",
      "abv_class": "alcoholic"
    },
    {
      "id": "gamay_beaujolais",
      "name": "Gamay / Beaujolais",
      "family": "wine",
      "style": "red",
      "abv_class": "alcoholic"
    },
    {
      "id": "sauvignon_blanc",
      "name": "Sauvignon Blanc",
      "family": "wine",
      "style": "white",
      "abv_class": "alcoholic"
    },
    {
      "id": "chardonnay_unoaked",
      "name": "Chardonnay (unoaked)",
      "family": "wine",
      "style": "white",
      "abv_class": "alcoholic"
    },
    {
      "id": "chardonnay_oaked",
      "name": "Chardonnay (oaked)",
      "family": "wine",
      "style": "white",
      "abv_class": "alcoholic"
    },
    {
      "id": "riesling_dry",
      "name": "Riesling (dry)",
      "family": "wine",
      "style": "white",
      "abv_class": "alcoholic"
    },
    {
      "id": "riesling_off_dry",
      "name": "Riesling (off-dry)",
      "family": "wine",
      "style": "white",
      "abv_class": "alcoholic"
    },
    {
      "id": "pinot_grigio",
      "name": "Pinot Grigio / Pinot Gris",
      "family": "wine",
      "style": "white",
      "abv_class": "alcoholic"
    },
    {
      "id": "chenin_blanc",
      "name": "Chenin Blanc",
      "family": "wine",
      "style": "white",
      "abv_class": "alcoholic"
    },
    {
      "id": "gewurztraminer",
      "name": "Gewürztraminer",
      "family": "wine",
      "style": "white",
      "abv_class": "alcoholic"
    },
    {
      "id": "albarino",
      "name": "Albariño",
      "family": "wine",
      "style": "white",
      "abv_class": "alcoholic"
    },
    {
      "id": "rose_dry",
      "name": "Dry Rosé",
      "family": "wine",
      "style": "rosé",
      "abv_class": "alcoholic"
    },
    {
      "id": "champagne_brut",
      "name": "Brut Champagne / Sparkling Wine",
      "family": "wine",
      "style": "sparkling",
      "abv_class": "alcoholic"
    },
    {
      "id": "prosecco",
      "name": "Prosecco",
      "family": "wine",
      "style": "sparkling",
      "abv_class": "alcoholic"
    },
    {
      "id": "moscato",
      "name": "Moscato",
      "family": "wine",
      "style": "sweet",
      "abv_class": "alcoholic"
    },
    {
      "id": "sauternes",
      "name": "Sauternes / Botrytized Dessert Wine",
      "family": "wine",
      "style": "sweet",
      "abv_class": "alcoholic"
    },
    {
      "id": "port_ruby",
      "name": "Ruby Port",
      "family": "fortified_wine",
      "style": "sweet",
      "abv_class": "alcoholic"
    },
    {
      "id": "port_tawny",
      "name": "Tawny Port",
      "family": "fortified_wine",
      "style": "sweet",
      "abv_class": "alcoholic"
    },
    {
      "id": "sherry_fino",
      "name": "Fino / Manzanilla Sherry",
      "family": "fortified_wine",
      "style": "dry",
      "abv_class": "alcoholic"
    },
    {
      "id": "sherry_amontillado",
      "name": "Amontillado Sherry",
      "family": "fortified_wine",
      "style": "dry",
      "abv_class": "alcoholic"
    },
    {
      "id": "sherry_oloroso",
      "name": "Oloroso Sherry",
      "family": "fortified_wine",
      "style": "dry",
      "abv_class": "alcoholic"
    },
    {
      "id": "madeira",
      "name": "Madeira",
      "family": "fortified_wine",
      "style": "fortified",
      "abv_class": "alcoholic"
    },
    {
      "id": "dry_vermouth",
      "name": "Dry Vermouth",
      "family": "fortified_wine",
      "style": "aperitif",
      "abv_class": "alcoholic"
    },
    {
      "id": "sweet_vermouth",
      "name": "Sweet Vermouth",
      "family": "fortified_wine",
      "style": "aperitif",
      "abv_class": "alcoholic"
    },
    {
      "id": "pilsner",
      "name": "Pilsner / Crisp Lager",
      "family": "beer",
      "style": "lager",
      "abv_class": "alcoholic"
    },
    {
      "id": "wheat_beer",
      "name": "Wheat Beer / Hefeweizen",
      "family": "beer",
      "style": "wheat",
      "abv_class": "alcoholic"
    },
    {
      "id": "pale_ale",
      "name": "Pale Ale",
      "family": "beer",
      "style": "ale",
      "abv_class": "alcoholic"
    },
    {
      "id": "ipa",
      "name": "IPA",
      "family": "beer",
      "style": "ale",
      "abv_class": "alcoholic"
    },
    {
      "id": "amber_ale",
      "name": "Amber / Brown Ale",
      "family": "beer",
      "style": "ale",
      "abv_class": "alcoholic"
    },
    {
      "id": "stout_porter",
      "name": "Stout / Porter",
      "family": "beer",
      "style": "dark",
      "abv_class": "alcoholic"
    },
    {
      "id": "saison",
      "name": "Saison",
      "family": "beer",
      "style": "farmhouse",
      "abv_class": "alcoholic"
    },
    {
      "id": "sour_beer",
      "name": "Sour Beer / Lambic",
      "family": "beer",
      "style": "sour",
      "abv_class": "alcoholic"
    },
    {
      "id": "belgian_dubbel",
      "name": "Belgian Dubbel",
      "family": "beer",
      "style": "belgian",
      "abv_class": "alcoholic"
    },
    {
      "id": "belgian_tripel",
      "name": "Belgian Tripel",
      "family": "beer",
      "style": "belgian",
      "abv_class": "alcoholic"
    },
    {
      "id": "dry_cider",
      "name": "Dry Cider",
      "family": "cider",
      "style": "dry",
      "abv_class": "alcoholic"
    },
    {
      "id": "sweet_cider",
      "name": "Sweet Cider",
      "family": "cider",
      "style": "sweet",
      "abv_class": "alcoholic"
    },
    {
      "id": "mead",
      "name": "Mead",
      "family": "mead",
      "style": "honey",
      "abv_class": "alcoholic"
    },
    {
      "id": "vodka",
      "name": "Vodka",
      "family": "spirit",
      "style": "neutral",
      "abv_class": "alcoholic"
    },
    {
      "id": "gin",
      "name": "Gin",
      "family": "spirit",
      "style": "botanical",
      "abv_class": "alcoholic"
    },
    {
      "id": "bourbon",
      "name": "Bourbon",
      "family": "spirit",
      "style": "whiskey",
      "abv_class": "alcoholic"
    },
    {
      "id": "rye_whiskey",
      "name": "Rye Whiskey",
      "family": "spirit",
      "style": "whiskey",
      "abv_class": "alcoholic"
    },
    {
      "id": "irish_whiskey",
      "name": "Irish Whiskey",
      "family": "spirit",
      "style": "whiskey",
      "abv_class": "alcoholic"
    },
    {
      "id": "scotch_unpeated",
      "name": "Scotch Whisky (unpeated)",
      "family": "spirit",
      "style": "whisky",
      "abv_class": "alcoholic"
    },
    {
      "id": "scotch_peated",
      "name": "Scotch Whisky (peated)",
      "family": "spirit",
      "style": "whisky",
      "abv_class": "alcoholic"
    },
    {
      "id": "cognac",
      "name": "Cognac",
      "family": "spirit",
      "style": "brandy",
      "abv_class": "alcoholic"
    },
    {
      "id": "brandy",
      "name": "Brandy",
      "family": "spirit",
      "style": "brandy",
      "abv_class": "alcoholic"
    },
    {
      "id": "white_rum",
      "name": "White Rum",
      "family": "spirit",
      "style": "rum",
      "abv_class": "alcoholic"
    },
    {
      "id": "aged_rum",
      "name": "Aged / Dark Rum",
      "family": "spirit",
      "style": "rum",
      "abv_class": "alcoholic"
    },
    {
      "id": "tequila_blanco",
      "name": "Tequila Blanco",
      "family": "spirit",
      "style": "agave",
      "abv_class": "alcoholic"
    },
    {
      "id": "tequila_reposado",
      "name": "Tequila Reposado",
      "family": "spirit",
      "style": "agave",
      "abv_class": "alcoholic"
    },
    {
      "id": "tequila_anejo",
      "name": "Tequila Añejo",
      "family": "spirit",
      "style": "agave",
      "abv_class": "alcoholic"
    },
    {
      "id": "mezcal",
      "name": "Mezcal",
      "family": "spirit",
      "style": "agave",
      "abv_class": "alcoholic"
    },
    {
      "id": "sake_junmai",
      "name": "Junmai Sake",
      "family": "sake",
      "style": "junmai",
      "abv_class": "alcoholic"
    },
    {
      "id": "sake_ginjo",
      "name": "Ginjo / Daiginjo Sake",
      "family": "sake",
      "style": "ginjo",
      "abv_class": "alcoholic"
    },
    {
      "id": "sake_nigori",
      "name": "Nigori Sake",
      "family": "sake",
      "style": "nigori",
      "abv_class": "alcoholic"
    },
    {
      "id": "shochu",
      "name": "Shochu",
      "family": "spirit",
      "style": "shochu",
      "abv_class": "alcoholic"
    },
    {
      "id": "soju",
      "name": "Soju",
      "family": "spirit",
      "style": "soju",
      "abv_class": "alcoholic"
    },
    {
      "id": "campari",
      "name": "Campari-style Bitter Aperitif",
      "family": "liqueur",
      "style": "bitter",
      "abv_class": "alcoholic"
    },
    {
      "id": "aperol",
      "name": "Aperol-style Aperitif",
      "family": "liqueur",
      "style": "bitter",
      "abv_class": "alcoholic"
    },
    {
      "id": "orange_liqueur",
      "name": "Orange Liqueur / Triple Sec",
      "family": "liqueur",
      "style": "citrus",
      "abv_class": "alcoholic"
    },
    {
      "id": "coffee_liqueur",
      "name": "Coffee Liqueur",
      "family": "liqueur",
      "style": "coffee",
      "abv_class": "alcoholic"
    },
    {
      "id": "amaretto",
      "name": "Amaretto",
      "family": "liqueur",
      "style": "nutty",
      "abv_class": "alcoholic"
    },
    {
      "id": "elderflower_liqueur",
      "name": "Elderflower Liqueur",
      "family": "liqueur",
      "style": "floral",
      "abv_class": "alcoholic"
    },
    {
      "id": "herbal_liqueur",
      "name": "Herbal Liqueur / Amaro",
      "family": "liqueur",
      "style": "herbal",
      "abv_class": "alcoholic"
    },
    {
      "id": "creme_de_cacao",
      "name": "Crème de Cacao",
      "family": "liqueur",
      "style": "chocolate",
      "abv_class": "alcoholic"
    },
    {
      "id": "sparkling_water",
      "name": "Sparkling Water",
      "family": "non_alcoholic",
      "style": "crisp",
      "abv": 0,
      "abv_class": "non_alcoholic"
    },
    {
      "id": "still_water",
      "name": "Still Water",
      "family": "non_alcoholic",
      "style": "neutral",
      "abv": 0,
      "abv_class": "non_alcoholic"
    },
    {
      "id": "sprite_style_soda",
      "name": "Lemon-Lime Soda",
      "family": "soft_drink",
      "style": "sweet_citrus",
      "abv": 0,
      "abv_class": "non_alcoholic"
    },
    {
      "id": "cola",
      "name": "Cola",
      "family": "soft_drink",
      "style": "sweet_spiced",
      "abv": 0,
      "abv_class": "non_alcoholic"
    },
    {
      "id": "tonic_water",
      "name": "Tonic Water",
      "family": "soft_drink",
      "style": "bitter_citrus",
      "abv": 0,
      "abv_class": "non_alcoholic"
    },
    {
      "id": "ginger_ale",
      "name": "Ginger Ale",
      "family": "soft_drink",
      "style": "sweet_ginger",
      "abv": 0,
      "abv_class": "non_alcoholic"
    },
    {
      "id": "ginger_beer_na",
      "name": "Non-Alcoholic Ginger Beer",
      "family": "soft_drink",
      "style": "spicy_ginger",
      "abv": 0,
      "abv_class": "non_alcoholic"
    },
    {
      "id": "lemonade",
      "name": "Lemonade",
      "family": "soft_drink",
      "style": "sweet_sour",
      "abv": 0,
      "abv_class": "non_alcoholic"
    },
    {
      "id": "orange_juice",
      "name": "Orange Juice",
      "family": "juice",
      "style": "sweet_citrus",
      "abv": 0,
      "abv_class": "non_alcoholic"
    },
    {
      "id": "apple_juice",
      "name": "Apple Juice",
      "family": "juice",
      "style": "sweet_fruity",
      "abv": 0,
      "abv_class": "non_alcoholic"
    },
    {
      "id": "grape_juice",
      "name": "Grape Juice",
      "family": "juice",
      "style": "sweet_fruity",
      "abv": 0,
      "abv_class": "non_alcoholic"
    },
    {
      "id": "cranberry_juice",
      "name": "Cranberry Juice",
      "family": "juice",
      "style": "tart_fruity",
      "abv": 0,
      "abv_class": "non_alcoholic"
    },
    {
      "id": "pineapple_juice",
      "name": "Pineapple Juice",
      "family": "juice",
      "style": "tropical",
      "abv": 0,
      "abv_class": "non_alcoholic"
    },
    {
      "id": "tomato_juice",
      "name": "Tomato Juice",
      "family": "juice",
      "style": "savory",
      "abv": 0,
      "abv_class": "non_alcoholic"
    },
    {
      "id": "cold_brew",
      "name": "Cold Brew Coffee",
      "family": "coffee",
      "style": "roasted",
      "abv": 0,
      "abv_class": "non_alcoholic"
    },
    {
      "id": "espresso",
      "name": "Espresso",
      "family": "coffee",
      "style": "roasted_intense",
      "abv": 0,
      "abv_class": "non_alcoholic"
    },
    {
      "id": "black_tea",
      "name": "Black Tea",
      "family": "tea",
      "style": "tannic",
      "abv": 0,
      "abv_class": "non_alcoholic"
    },
    {
      "id": "green_tea",
      "name": "Green Tea",
      "family": "tea",
      "style": "fresh_grassy",
      "abv": 0,
      "abv_class": "non_alcoholic"
    },
    {
      "id": "earl_grey",
      "name": "Earl Grey Tea",
      "family": "tea",
      "style": "bergamot",
      "abv": 0,
      "abv_class": "non_alcoholic"
    },
    {
      "id": "mint_tea",
      "name": "Mint Tea",
      "family": "tea",
      "style": "herbal_fresh",
      "abv": 0,
      "abv_class": "non_alcoholic"
    },
    {
      "id": "chamomile_tea",
      "name": "Chamomile Tea",
      "family": "tea",
      "style": "floral_soft",
      "abv": 0,
      "abv_class": "non_alcoholic"
    },
    {
      "id": "kombucha",
      "name": "Kombucha",
      "family": "fermented_na",
      "style": "tart",
      "abv": 0,
      "abv_class": "non_alcoholic"
    },
    {
      "id": "na_lager",
      "name": "Non-Alcoholic Lager",
      "family": "beer_na",
      "style": "crisp",
      "abv": 0,
      "abv_class": "non_alcoholic"
    },
    {
      "id": "na_wheat_beer",
      "name": "Non-Alcoholic Wheat Beer",
      "family": "beer_na",
      "style": "wheat",
      "abv": 0,
      "abv_class": "non_alcoholic"
    },
    {
      "id": "na_sparkling_wine",
      "name": "Non-Alcoholic Sparkling Wine",
      "family": "wine_na",
      "style": "sparkling",
      "abv": 0,
      "abv_class": "non_alcoholic"
    },
    {
      "id": "na_white_wine",
      "name": "Non-Alcoholic White Wine",
      "family": "wine_na",
      "style": "white",
      "abv": 0,
      "abv_class": "non_alcoholic"
    },
    {
      "id": "na_red_wine",
      "name": "Non-Alcoholic Red Wine",
      "family": "wine_na",
      "style": "red",
      "abv": 0,
      "abv_class": "non_alcoholic"
    },
    {
      "id": "virgin_mojito",
      "name": "Virgin Mojito",
      "family": "mocktail",
      "style": "mint_citrus",
      "abv": 0,
      "abv_class": "non_alcoholic"
    },
    {
      "id": "virgin_colada",
      "name": "Virgin Piña Colada",
      "family": "mocktail",
      "style": "creamy_tropical",
      "abv": 0,
      "abv_class": "non_alcoholic"
    },
    {
      "id": "shirley_temple",
      "name": "Shirley Temple",
      "family": "mocktail",
      "style": "sweet_fruity",
      "abv": 0,
      "abv_class": "non_alcoholic"
    },
    {
      "id": "citrus_spritz_na",
      "name": "Citrus Spritz 0.0",
      "family": "mocktail",
      "style": "bitter_citrus_sparkling",
      "abv": 0,
      "abv_class": "non_alcoholic"
    },
    {
      "id": "berry_spritz_na",
      "name": "Berry Spritz 0.0",
      "family": "mocktail",
      "style": "berry_sparkling",
      "abv": 0,
      "abv_class": "non_alcoholic"
    },
    {
      "id": "spiced_apple_fizz",
      "name": "Spiced Apple Fizz 0.0",
      "family": "mocktail",
      "style": "apple_spice",
      "abv": 0,
      "abv_class": "non_alcoholic"
    },
    {
      "id": "coffee_tonic",
      "name": "Coffee Tonic",
      "family": "mocktail",
      "style": "roasted_bitter_sparkling",
      "abv": 0,
      "abv_class": "non_alcoholic"
    }
  ],
  "beverage_beverage_pairings": [
    {
      "a": "gin",
      "b": "dry_vermouth",
      "score": 98,
      "relationship": "classic cocktail",
      "why": "Botanical gin and herbal dry vermouth form a dry, aromatic structure.",
      "examples": [
        "Dry Martini"
      ],
      "tags": [
        "dry",
        "herbal"
      ],
      "pairing_kind": "alcohol_alcohol"
    },
    {
      "a": "gin",
      "b": "campari",
      "score": 97,
      "relationship": "classic cocktail",
      "why": "Juniper and citrus botanicals stand up to bitter orange-herbal notes.",
      "examples": [
        "Negroni"
      ],
      "tags": [
        "bitter",
        "botanical"
      ],
      "pairing_kind": "alcohol_alcohol"
    },
    {
      "a": "gin",
      "b": "sweet_vermouth",
      "score": 92,
      "relationship": "classic cocktail",
      "why": "Botanicals are rounded by sweet, spiced vermouth.",
      "examples": [
        "Negroni"
      ],
      "tags": [
        "herbal",
        "sweet-bitter"
      ],
      "pairing_kind": "alcohol_alcohol"
    },
    {
      "a": "gin",
      "b": "elderflower_liqueur",
      "score": 93,
      "relationship": "complement",
      "why": "Floral elderflower amplifies aromatic gin without hiding it.",
      "examples": [
        "Elderflower Gin Sour",
        "French-style spritz"
      ],
      "tags": [
        "floral",
        "fresh"
      ],
      "pairing_kind": "alcohol_alcohol"
    },
    {
      "a": "gin",
      "b": "orange_liqueur",
      "score": 88,
      "relationship": "complement",
      "why": "Citrus liqueur reinforces citrus-forward gin botanicals.",
      "examples": [
        "White Lady"
      ],
      "tags": [
        "citrus"
      ],
      "pairing_kind": "alcohol_alcohol"
    },
    {
      "a": "gin",
      "b": "aperol",
      "score": 87,
      "relationship": "contrast",
      "why": "Bitter-sweet orange adds fruit and softer bitterness to gin.",
      "examples": [
        "Gin Aperol Sour"
      ],
      "tags": [
        "citrus",
        "bitter"
      ],
      "pairing_kind": "alcohol_alcohol"
    },
    {
      "a": "gin",
      "b": "champagne_brut",
      "score": 91,
      "relationship": "classic cocktail",
      "why": "Dry bubbles lift gin botanicals and add acidity.",
      "examples": [
        "French 75"
      ],
      "tags": [
        "sparkling",
        "citrus"
      ],
      "pairing_kind": "alcohol_alcohol"
    },
    {
      "a": "gin",
      "b": "sherry_fino",
      "score": 82,
      "relationship": "savory complement",
      "why": "Dry saline sherry adds nutty, savory complexity.",
      "examples": [
        "Bamboo-style gin variation"
      ],
      "tags": [
        "dry",
        "savory"
      ],
      "pairing_kind": "alcohol_alcohol"
    },
    {
      "a": "vodka",
      "b": "dry_vermouth",
      "score": 92,
      "relationship": "classic cocktail",
      "why": "Neutral vodka lets herbal dry vermouth define the aroma.",
      "examples": [
        "Vodka Martini"
      ],
      "tags": [
        "dry"
      ],
      "pairing_kind": "alcohol_alcohol"
    },
    {
      "a": "vodka",
      "b": "coffee_liqueur",
      "score": 96,
      "relationship": "classic cocktail",
      "why": "Neutral spirit carries roasted coffee and sweetness cleanly.",
      "examples": [
        "Black Russian",
        "White Russian"
      ],
      "tags": [
        "coffee",
        "sweet"
      ],
      "pairing_kind": "alcohol_alcohol"
    },
    {
      "a": "vodka",
      "b": "orange_liqueur",
      "score": 88,
      "relationship": "complement",
      "why": "Clean vodka gives citrus liqueur a simple, bright base.",
      "examples": [
        "Cosmopolitan-family drinks"
      ],
      "tags": [
        "citrus"
      ],
      "pairing_kind": "alcohol_alcohol"
    },
    {
      "a": "vodka",
      "b": "elderflower_liqueur",
      "score": 85,
      "relationship": "complement",
      "why": "Neutral base highlights floral sweetness.",
      "examples": [
        "Elderflower Vodka Collins"
      ],
      "tags": [
        "floral"
      ],
      "pairing_kind": "alcohol_alcohol"
    },
    {
      "a": "vodka",
      "b": "aperol",
      "score": 80,
      "relationship": "contrast",
      "why": "Neutral vodka supports bittersweet citrus without extra botanicals.",
      "examples": [
        "Vodka Spritz"
      ],
      "tags": [
        "bitter",
        "citrus"
      ],
      "pairing_kind": "alcohol_alcohol"
    },
    {
      "a": "rye_whiskey",
      "b": "sweet_vermouth",
      "score": 98,
      "relationship": "classic cocktail",
      "why": "Spicy rye balances rich, herbal sweetness.",
      "examples": [
        "Manhattan"
      ],
      "tags": [
        "spiced",
        "herbal"
      ],
      "pairing_kind": "alcohol_alcohol"
    },
    {
      "a": "bourbon",
      "b": "sweet_vermouth",
      "score": 96,
      "relationship": "classic cocktail",
      "why": "Caramel and vanilla notes integrate with spiced vermouth.",
      "examples": [
        "Bourbon Manhattan"
      ],
      "tags": [
        "oak",
        "sweet-spice"
      ],
      "pairing_kind": "alcohol_alcohol"
    },
    {
      "a": "rye_whiskey",
      "b": "herbal_liqueur",
      "score": 88,
      "relationship": "complement",
      "why": "Peppery rye works with bitter herbal depth.",
      "examples": [
        "Black Manhattan-style drinks"
      ],
      "tags": [
        "bitter",
        "spice"
      ],
      "pairing_kind": "alcohol_alcohol"
    },
    {
      "a": "bourbon",
      "b": "orange_liqueur",
      "score": 85,
      "relationship": "complement",
      "why": "Orange brightens bourbon's vanilla, caramel and oak.",
      "examples": [
        "Bourbon Sidecar variations"
      ],
      "tags": [
        "oak",
        "citrus"
      ],
      "pairing_kind": "alcohol_alcohol"
    },
    {
      "a": "bourbon",
      "b": "amaretto",
      "score": 90,
      "relationship": "classic pairing",
      "why": "Almond sweetness rounds vanilla and oak.",
      "examples": [
        "Godfather-style bourbon variation"
      ],
      "tags": [
        "nutty",
        "sweet"
      ],
      "pairing_kind": "alcohol_alcohol"
    },
    {
      "a": "scotch_unpeated",
      "b": "amaretto",
      "score": 94,
      "relationship": "classic cocktail",
      "why": "Malt and gentle smoke/oak pair with almond sweetness.",
      "examples": [
        "Godfather"
      ],
      "tags": [
        "nutty",
        "malt"
      ],
      "pairing_kind": "alcohol_alcohol"
    },
    {
      "a": "scotch_peated",
      "b": "sweet_vermouth",
      "score": 80,
      "relationship": "contrast",
      "why": "Sweet herbs can soften smoky peat while keeping intensity.",
      "examples": [
        "Rob Roy variations"
      ],
      "tags": [
        "smoky",
        "herbal"
      ],
      "pairing_kind": "alcohol_alcohol"
    },
    {
      "a": "scotch_unpeated",
      "b": "sweet_vermouth",
      "score": 93,
      "relationship": "classic cocktail",
      "why": "Malt, oak and herbal sweetness balance naturally.",
      "examples": [
        "Rob Roy"
      ],
      "tags": [
        "malt",
        "herbal"
      ],
      "pairing_kind": "alcohol_alcohol"
    },
    {
      "a": "irish_whiskey",
      "b": "coffee_liqueur",
      "score": 88,
      "relationship": "complement",
      "why": "Soft grain and vanilla notes echo roasted coffee.",
      "examples": [
        "Irish coffee-inspired cocktails"
      ],
      "tags": [
        "coffee",
        "smooth"
      ],
      "pairing_kind": "alcohol_alcohol"
    },
    {
      "a": "bourbon",
      "b": "coffee_liqueur",
      "score": 89,
      "relationship": "complement",
      "why": "Caramel and char notes reinforce coffee roast.",
      "examples": [
        "Bourbon Coffee Cocktail"
      ],
      "tags": [
        "coffee",
        "oak"
      ],
      "pairing_kind": "alcohol_alcohol"
    },
    {
      "a": "cognac",
      "b": "orange_liqueur",
      "score": 98,
      "relationship": "classic cocktail",
      "why": "Orange lifts grape, oak and dried-fruit notes.",
      "examples": [
        "Sidecar"
      ],
      "tags": [
        "citrus",
        "oak"
      ],
      "pairing_kind": "alcohol_alcohol"
    },
    {
      "a": "brandy",
      "b": "creme_de_cacao",
      "score": 95,
      "relationship": "classic cocktail",
      "why": "Fruit-and-oak brandy complements cocoa richness.",
      "examples": [
        "Brandy Alexander"
      ],
      "tags": [
        "chocolate",
        "dessert"
      ],
      "pairing_kind": "alcohol_alcohol"
    },
    {
      "a": "cognac",
      "b": "champagne_brut",
      "score": 90,
      "relationship": "classic cocktail",
      "why": "Bubbles and acidity brighten rich cognac.",
      "examples": [
        "Champagne Cocktail variations"
      ],
      "tags": [
        "sparkling",
        "luxury"
      ],
      "pairing_kind": "alcohol_alcohol"
    },
    {
      "a": "cognac",
      "b": "amaretto",
      "score": 86,
      "relationship": "complement",
      "why": "Almond sweetness matches dried fruit and oak.",
      "examples": [
        "French Connection-style drinks"
      ],
      "tags": [
        "nutty",
        "oak"
      ],
      "pairing_kind": "alcohol_alcohol"
    },
    {
      "a": "brandy",
      "b": "sweet_vermouth",
      "score": 87,
      "relationship": "classic cocktail",
      "why": "Fruit-led brandy and herbal sweetness form a rounded aperitif profile.",
      "examples": [
        "Metropolitan-style drinks"
      ],
      "tags": [
        "herbal",
        "fruit"
      ],
      "pairing_kind": "alcohol_alcohol"
    },
    {
      "a": "white_rum",
      "b": "orange_liqueur",
      "score": 93,
      "relationship": "classic cocktail",
      "why": "Citrus supports clean cane sweetness.",
      "examples": [
        "Mai Tai family",
        "Rum Sidecar"
      ],
      "tags": [
        "tropical",
        "citrus"
      ],
      "pairing_kind": "alcohol_alcohol"
    },
    {
      "a": "aged_rum",
      "b": "orange_liqueur",
      "score": 92,
      "relationship": "complement",
      "why": "Orange links rum's dried-fruit, caramel and spice notes.",
      "examples": [
        "Mai Tai family"
      ],
      "tags": [
        "oak",
        "citrus"
      ],
      "pairing_kind": "alcohol_alcohol"
    },
    {
      "a": "aged_rum",
      "b": "coffee_liqueur",
      "score": 91,
      "relationship": "complement",
      "why": "Molasses, caramel and coffee create a deep roasted profile.",
      "examples": [
        "Rum Espresso Martini variations"
      ],
      "tags": [
        "coffee",
        "caramel"
      ],
      "pairing_kind": "alcohol_alcohol"
    },
    {
      "a": "aged_rum",
      "b": "amaretto",
      "score": 87,
      "relationship": "complement",
      "why": "Nutty sweetness fits vanilla and baking-spice notes.",
      "examples": [
        "Rum Old Fashioned variations"
      ],
      "tags": [
        "nutty",
        "spice"
      ],
      "pairing_kind": "alcohol_alcohol"
    },
    {
      "a": "white_rum",
      "b": "campari",
      "score": 82,
      "relationship": "contrast",
      "why": "Clean cane spirit gives bitter aperitif a sharper tropical edge.",
      "examples": [
        "Jungle Bird variations"
      ],
      "tags": [
        "bitter",
        "tropical"
      ],
      "pairing_kind": "alcohol_alcohol"
    },
    {
      "a": "aged_rum",
      "b": "campari",
      "score": 91,
      "relationship": "classic cocktail",
      "why": "Rich rum sweetness balances assertive bitterness.",
      "examples": [
        "Jungle Bird"
      ],
      "tags": [
        "bitter",
        "tropical"
      ],
      "pairing_kind": "alcohol_alcohol"
    },
    {
      "a": "white_rum",
      "b": "champagne_brut",
      "score": 85,
      "relationship": "contrast",
      "why": "Bubbles dry out and lift light rum.",
      "examples": [
        "Airmail variations"
      ],
      "tags": [
        "sparkling",
        "fresh"
      ],
      "pairing_kind": "alcohol_alcohol"
    },
    {
      "a": "tequila_blanco",
      "b": "orange_liqueur",
      "score": 99,
      "relationship": "classic cocktail",
      "why": "Agave, lime-like brightness and orange are a canonical match.",
      "examples": [
        "Margarita"
      ],
      "tags": [
        "agave",
        "citrus"
      ],
      "pairing_kind": "alcohol_alcohol"
    },
    {
      "a": "tequila_reposado",
      "b": "orange_liqueur",
      "score": 96,
      "relationship": "classic cocktail",
      "why": "Oak-softened agave gains brightness from orange.",
      "examples": [
        "Reposado Margarita"
      ],
      "tags": [
        "agave",
        "citrus",
        "oak"
      ],
      "pairing_kind": "alcohol_alcohol"
    },
    {
      "a": "mezcal",
      "b": "orange_liqueur",
      "score": 93,
      "relationship": "classic cocktail",
      "why": "Orange fruit balances smoke and roasted agave.",
      "examples": [
        "Mezcal Margarita"
      ],
      "tags": [
        "smoky",
        "citrus"
      ],
      "pairing_kind": "alcohol_alcohol"
    },
    {
      "a": "mezcal",
      "b": "campari",
      "score": 91,
      "relationship": "contrast",
      "why": "Smoky agave and bitter orange create a powerful bittersweet pairing.",
      "examples": [
        "Mezcal Negroni"
      ],
      "tags": [
        "smoky",
        "bitter"
      ],
      "pairing_kind": "alcohol_alcohol"
    },
    {
      "a": "tequila_blanco",
      "b": "campari",
      "score": 84,
      "relationship": "contrast",
      "why": "Peppery agave cuts through herbal bitterness.",
      "examples": [
        "Tequila Negroni"
      ],
      "tags": [
        "agave",
        "bitter"
      ],
      "pairing_kind": "alcohol_alcohol"
    },
    {
      "a": "tequila_anejo",
      "b": "sweet_vermouth",
      "score": 87,
      "relationship": "complement",
      "why": "Oak-aged agave works with vanilla-spice and herbs.",
      "examples": [
        "Añejo Manhattan"
      ],
      "tags": [
        "oak",
        "herbal"
      ],
      "pairing_kind": "alcohol_alcohol"
    },
    {
      "a": "tequila_reposado",
      "b": "herbal_liqueur",
      "score": 84,
      "relationship": "complement",
      "why": "Roasted agave and herbs create earthy depth.",
      "examples": [
        "Agave-amaro cocktails"
      ],
      "tags": [
        "earthy",
        "herbal"
      ],
      "pairing_kind": "alcohol_alcohol"
    },
    {
      "a": "prosecco",
      "b": "aperol",
      "score": 99,
      "relationship": "classic cocktail",
      "why": "Fresh bubbles, moderate sweetness and bittersweet orange are built for each other.",
      "examples": [
        "Aperol Spritz"
      ],
      "tags": [
        "sparkling",
        "bitter"
      ],
      "pairing_kind": "alcohol_alcohol"
    },
    {
      "a": "champagne_brut",
      "b": "orange_liqueur",
      "score": 92,
      "relationship": "classic cocktail",
      "why": "Dry sparkling wine gains aromatic citrus without losing freshness.",
      "examples": [
        "Mimosa-family / French 75 variations"
      ],
      "tags": [
        "sparkling",
        "citrus"
      ],
      "pairing_kind": "alcohol_alcohol"
    },
    {
      "a": "champagne_brut",
      "b": "campari",
      "score": 80,
      "relationship": "contrast",
      "why": "High acidity and bubbles tame dense bitterness.",
      "examples": [
        "Campari Royale"
      ],
      "tags": [
        "sparkling",
        "bitter"
      ],
      "pairing_kind": "alcohol_alcohol"
    },
    {
      "a": "prosecco",
      "b": "elderflower_liqueur",
      "score": 94,
      "relationship": "classic pairing",
      "why": "Floral sweetness is refreshed by light bubbles.",
      "examples": [
        "Hugo Spritz"
      ],
      "tags": [
        "floral",
        "sparkling"
      ],
      "pairing_kind": "alcohol_alcohol"
    },
    {
      "a": "dry_vermouth",
      "b": "campari",
      "score": 87,
      "relationship": "aperitif pairing",
      "why": "Herbal dryness and bitter citrus form the backbone of low-proof aperitivo drinks.",
      "examples": [
        "Americano-family variations"
      ],
      "tags": [
        "herbal",
        "bitter"
      ],
      "pairing_kind": "alcohol_alcohol"
    },
    {
      "a": "sweet_vermouth",
      "b": "campari",
      "score": 96,
      "relationship": "classic cocktail",
      "why": "Sweet herbs soften and extend the bitter aperitif.",
      "examples": [
        "Americano",
        "Negroni"
      ],
      "tags": [
        "herbal",
        "bitter"
      ],
      "pairing_kind": "alcohol_alcohol"
    },
    {
      "a": "sherry_fino",
      "b": "dry_vermouth",
      "score": 85,
      "relationship": "low-proof pairing",
      "why": "Both are dry, savory and aromatic, producing a crisp aperitif.",
      "examples": [
        "Bamboo"
      ],
      "tags": [
        "dry",
        "savory"
      ],
      "pairing_kind": "alcohol_alcohol"
    },
    {
      "a": "sherry_amontillado",
      "b": "sweet_vermouth",
      "score": 83,
      "relationship": "complement",
      "why": "Nutty oxidative notes work with spiced sweetness.",
      "examples": [
        "Adonis variations"
      ],
      "tags": [
        "nutty",
        "herbal"
      ],
      "pairing_kind": "alcohol_alcohol"
    },
    {
      "a": "sake_junmai",
      "b": "dry_vermouth",
      "score": 80,
      "relationship": "savory complement",
      "why": "Umami-rich sake and herbal vermouth can create a dry, savory aperitif.",
      "examples": [
        "Sake Martini variations"
      ],
      "tags": [
        "umami",
        "herbal"
      ],
      "pairing_kind": "alcohol_alcohol"
    },
    {
      "a": "sake_ginjo",
      "b": "gin",
      "score": 84,
      "relationship": "aromatic complement",
      "why": "Delicate fruit and floral sake can soften juniper and citrus botanicals.",
      "examples": [
        "Sake Martini variations"
      ],
      "tags": [
        "floral",
        "botanical"
      ],
      "pairing_kind": "alcohol_alcohol"
    },
    {
      "a": "sake_nigori",
      "b": "amaretto",
      "score": 72,
      "relationship": "dessert complement",
      "why": "Creamy rice sweetness can work with almond notes in small amounts.",
      "examples": [
        "Dessert cocktail variations"
      ],
      "tags": [
        "creamy",
        "nutty"
      ],
      "pairing_kind": "alcohol_alcohol"
    },
    {
      "a": "pilsner",
      "b": "soju",
      "score": 88,
      "relationship": "traditional mixed serve",
      "why": "Clean lager and neutral-light soju combine without competing aromatics.",
      "examples": [
        "Somaek"
      ],
      "tags": [
        "korean",
        "crisp"
      ],
      "pairing_kind": "alcohol_alcohol"
    },
    {
      "a": "stout_porter",
      "b": "irish_whiskey",
      "score": 88,
      "relationship": "flavor complement",
      "why": "Roast, coffee and grain notes echo whiskey malt and oak.",
      "examples": [
        "Boilermaker-style pairing"
      ],
      "tags": [
        "roast",
        "malt"
      ],
      "pairing_kind": "alcohol_alcohol"
    },
    {
      "a": "pilsner",
      "b": "bourbon",
      "score": 75,
      "relationship": "contrast",
      "why": "Crisp lager refreshes after sweet oak and vanilla.",
      "examples": [
        "Boilermaker-style pairing"
      ],
      "tags": [
        "crisp",
        "oak"
      ],
      "pairing_kind": "alcohol_alcohol"
    },
    {
      "a": "dry_cider",
      "b": "bourbon",
      "score": 84,
      "relationship": "seasonal complement",
      "why": "Apple acidity and fruit suit bourbon vanilla and caramel.",
      "examples": [
        "Stone Fence variations"
      ],
      "tags": [
        "apple",
        "oak"
      ],
      "pairing_kind": "alcohol_alcohol"
    },
    {
      "a": "dry_cider",
      "b": "aged_rum",
      "score": 82,
      "relationship": "complement",
      "why": "Apple and acidity lift dark rum molasses and spice.",
      "examples": [
        "Cider Rum Punch"
      ],
      "tags": [
        "apple",
        "spice"
      ],
      "pairing_kind": "alcohol_alcohol"
    },
    {
      "a": "sweet_cider",
      "b": "brandy",
      "score": 80,
      "relationship": "fruit echo",
      "why": "Fruit brandy and cider share orchard-fruit notes.",
      "examples": [
        "Cider brandy punch"
      ],
      "tags": [
        "apple",
        "fruit"
      ],
      "pairing_kind": "alcohol_alcohol"
    },
    {
      "a": "coffee_liqueur",
      "b": "creme_de_cacao",
      "score": 82,
      "relationship": "dessert complement",
      "why": "Coffee roast and cocoa reinforce one another.",
      "examples": [
        "Dessert cocktails"
      ],
      "tags": [
        "coffee",
        "chocolate"
      ],
      "pairing_kind": "alcohol_alcohol"
    },
    {
      "a": "amaretto",
      "b": "coffee_liqueur",
      "score": 88,
      "relationship": "dessert complement",
      "why": "Almond and coffee create a familiar café-dessert profile.",
      "examples": [
        "Toasted Almond family"
      ],
      "tags": [
        "coffee",
        "nutty"
      ],
      "pairing_kind": "alcohol_alcohol"
    },
    {
      "a": "orange_liqueur",
      "b": "creme_de_cacao",
      "score": 80,
      "relationship": "dessert contrast",
      "why": "Orange zest brightens chocolate sweetness.",
      "examples": [
        "Chocolate-orange cocktails"
      ],
      "tags": [
        "citrus",
        "chocolate"
      ],
      "pairing_kind": "alcohol_alcohol"
    },
    {
      "a": "herbal_liqueur",
      "b": "sweet_vermouth",
      "score": 90,
      "relationship": "aperitif/digestif complement",
      "why": "Layered herbs, roots and spice create depth.",
      "examples": [
        "Amaro Manhattan variations"
      ],
      "tags": [
        "herbal",
        "bitter"
      ],
      "pairing_kind": "alcohol_alcohol"
    },
    {
      "a": "herbal_liqueur",
      "b": "champagne_brut",
      "score": 79,
      "relationship": "contrast",
      "why": "Dry bubbles lighten dense herbal sweetness.",
      "examples": [
        "Amaro spritz"
      ],
      "tags": [
        "sparkling",
        "herbal"
      ],
      "pairing_kind": "alcohol_alcohol"
    }
  ],
  "beverage_food_pairings": [
    {
      "beverage": "cabernet_sauvignon",
      "food": "ribeye steak",
      "score": 98,
      "relationship": "classic",
      "why": "High tannin and intensity fit rich, fatty beef."
    },
    {
      "beverage": "cabernet_sauvignon",
      "food": "grilled beef",
      "score": 96,
      "relationship": "classic",
      "why": "Tannin and dark fruit match char and beef."
    },
    {
      "beverage": "cabernet_sauvignon",
      "food": "lamb chops",
      "score": 92,
      "relationship": "complement",
      "why": "Structure and herbs suit savory lamb."
    },
    {
      "beverage": "cabernet_sauvignon",
      "food": "aged cheddar",
      "score": 94,
      "relationship": "classic",
      "why": "Fat and salt soften tannin; intensity is balanced."
    },
    {
      "beverage": "cabernet_sauvignon",
      "food": "aged gouda",
      "score": 92,
      "relationship": "classic",
      "why": "Nutty aged cheese matches oak and dark fruit."
    },
    {
      "beverage": "cabernet_sauvignon",
      "food": "mushroom ragout",
      "score": 82,
      "relationship": "earthy complement",
      "why": "Savory mushrooms echo earthy wine notes."
    },
    {
      "beverage": "cabernet_sauvignon",
      "food": "delicate white fish",
      "score": 30,
      "relationship": "challenging",
      "why": "Tannin and intensity can overwhelm delicate fish."
    },
    {
      "beverage": "merlot",
      "food": "roast beef",
      "score": 92,
      "relationship": "classic",
      "why": "Round fruit and moderate tannin suit roasted beef."
    },
    {
      "beverage": "merlot",
      "food": "roast chicken",
      "score": 85,
      "relationship": "complement",
      "why": "Softer tannin works with browned poultry."
    },
    {
      "beverage": "merlot",
      "food": "mushroom pasta",
      "score": 90,
      "relationship": "earthy complement",
      "why": "Plum and earth notes fit mushrooms."
    },
    {
      "beverage": "merlot",
      "food": "medium-aged cheese",
      "score": 88,
      "relationship": "classic",
      "why": "Moderate intensity matches semi-hard cheese."
    },
    {
      "beverage": "merlot",
      "food": "pork tenderloin",
      "score": 84,
      "relationship": "complement",
      "why": "Soft fruit and moderate body suit lean pork."
    },
    {
      "beverage": "pinot_noir",
      "food": "duck",
      "score": 97,
      "relationship": "classic",
      "why": "Bright acidity and red fruit suit rich duck."
    },
    {
      "beverage": "pinot_noir",
      "food": "salmon",
      "score": 90,
      "relationship": "classic exception",
      "why": "Light tannin and acidity can work with richer fish."
    },
    {
      "beverage": "pinot_noir",
      "food": "mushrooms",
      "score": 97,
      "relationship": "earthy complement",
      "why": "Earthy aromas strongly echo mushrooms."
    },
    {
      "beverage": "pinot_noir",
      "food": "brie",
      "score": 88,
      "relationship": "classic",
      "why": "Low tannin and bright fruit fit soft cheese."
    },
    {
      "beverage": "pinot_noir",
      "food": "roast chicken",
      "score": 92,
      "relationship": "classic",
      "why": "Elegant body and acidity suit poultry."
    },
    {
      "beverage": "pinot_noir",
      "food": "tuna",
      "score": 84,
      "relationship": "complement",
      "why": "Meaty fish can handle a light red."
    },
    {
      "beverage": "syrah_shiraz",
      "food": "grilled lamb",
      "score": 97,
      "relationship": "classic",
      "why": "Pepper, smoke and dark fruit match lamb and char."
    },
    {
      "beverage": "syrah_shiraz",
      "food": "barbecue ribs",
      "score": 94,
      "relationship": "complement",
      "why": "Bold fruit and spice stand up to smoky-sweet sauce."
    },
    {
      "beverage": "syrah_shiraz",
      "food": "smoked cheese",
      "score": 90,
      "relationship": "flavor echo",
      "why": "Smoky notes align."
    },
    {
      "beverage": "syrah_shiraz",
      "food": "pepper steak",
      "score": 96,
      "relationship": "flavor echo",
      "why": "Peppery wine matches black-pepper seasoning."
    },
    {
      "beverage": "syrah_shiraz",
      "food": "game meat",
      "score": 92,
      "relationship": "classic",
      "why": "Intensity fits venison and other game."
    },
    {
      "beverage": "malbec",
      "food": "grilled steak",
      "score": 97,
      "relationship": "classic",
      "why": "Dark fruit, moderate-high tannin and smoke fit beef."
    },
    {
      "beverage": "malbec",
      "food": "beef empanadas",
      "score": 94,
      "relationship": "regional",
      "why": "Savory beef and pastry suit ripe fruit and structure."
    },
    {
      "beverage": "malbec",
      "food": "blue cheese",
      "score": 82,
      "relationship": "contrast",
      "why": "Fruit can offset salt and pungency."
    },
    {
      "beverage": "malbec",
      "food": "grilled mushrooms",
      "score": 86,
      "relationship": "earthy complement",
      "why": "Dark savory flavors align."
    },
    {
      "beverage": "sangiovese_chianti",
      "food": "tomato pasta",
      "score": 99,
      "relationship": "regional/classic",
      "why": "High acidity is excellent with tomato sauce."
    },
    {
      "beverage": "sangiovese_chianti",
      "food": "pizza margherita",
      "score": 97,
      "relationship": "regional/classic",
      "why": "Acidity and savory herbs match tomato and cheese."
    },
    {
      "beverage": "sangiovese_chianti",
      "food": "lasagna",
      "score": 95,
      "relationship": "classic",
      "why": "Acidity cuts cheese and matches tomato."
    },
    {
      "beverage": "sangiovese_chianti",
      "food": "charcuterie",
      "score": 90,
      "relationship": "regional",
      "why": "Acidity refreshes salty cured meat."
    },
    {
      "beverage": "sangiovese_chianti",
      "food": "parmigiano-reggiano",
      "score": 91,
      "relationship": "regional",
      "why": "Salt, umami and firm texture work with acidity."
    },
    {
      "beverage": "tempranillo_rioja",
      "food": "roast lamb",
      "score": 98,
      "relationship": "regional/classic",
      "why": "Savory red fruit, oak and lamb are a traditional match."
    },
    {
      "beverage": "tempranillo_rioja",
      "food": "jamón / cured ham",
      "score": 95,
      "relationship": "regional",
      "why": "Salt and fat complement acidity and oak."
    },
    {
      "beverage": "tempranillo_rioja",
      "food": "manchego",
      "score": 96,
      "relationship": "regional/classic",
      "why": "Nutty sheep cheese matches oak-aged red wine."
    },
    {
      "beverage": "tempranillo_rioja",
      "food": "grilled pork",
      "score": 90,
      "relationship": "complement",
      "why": "Savory oak and red fruit suit browned pork."
    },
    {
      "beverage": "zinfandel",
      "food": "barbecue pork",
      "score": 96,
      "relationship": "classic",
      "why": "Ripe fruit and spice suit sweet-smoky barbecue."
    },
    {
      "beverage": "zinfandel",
      "food": "burger",
      "score": 90,
      "relationship": "classic",
      "why": "Bold fruit stands up to beef and toppings."
    },
    {
      "beverage": "zinfandel",
      "food": "spicy sausage",
      "score": 88,
      "relationship": "complement",
      "why": "Fruit and spice fit robust sausage; avoid very hot chili."
    },
    {
      "beverage": "zinfandel",
      "food": "aged cheddar",
      "score": 87,
      "relationship": "classic",
      "why": "Intensity and fruit balance aged cheese."
    },
    {
      "beverage": "gamay_beaujolais",
      "food": "charcuterie",
      "score": 95,
      "relationship": "classic",
      "why": "Low tannin and juicy acidity refresh salty meats."
    },
    {
      "beverage": "gamay_beaujolais",
      "food": "roast chicken",
      "score": 91,
      "relationship": "classic",
      "why": "Light body and fruit suit poultry."
    },
    {
      "beverage": "gamay_beaujolais",
      "food": "soft cheese",
      "score": 86,
      "relationship": "complement",
      "why": "Low tannin works with creamy cheese."
    },
    {
      "beverage": "gamay_beaujolais",
      "food": "grilled vegetables",
      "score": 90,
      "relationship": "complement",
      "why": "Fresh fruit and acidity fit vegetables."
    },
    {
      "beverage": "sauvignon_blanc",
      "food": "goat cheese",
      "score": 99,
      "relationship": "classic/regional",
      "why": "High acidity and herbal notes suit tangy goat cheese."
    },
    {
      "beverage": "sauvignon_blanc",
      "food": "oysters",
      "score": 96,
      "relationship": "classic",
      "why": "Crisp acidity and minerality fit briny shellfish."
    },
    {
      "beverage": "sauvignon_blanc",
      "food": "green salad",
      "score": 94,
      "relationship": "complement",
      "why": "Herbal citrus profile matches fresh greens."
    },
    {
      "beverage": "sauvignon_blanc",
      "food": "asparagus",
      "score": 91,
      "relationship": "classic",
      "why": "Herbaceous character handles a difficult vegetable."
    },
    {
      "beverage": "sauvignon_blanc",
      "food": "grilled fish",
      "score": 92,
      "relationship": "classic",
      "why": "Acidity and freshness suit light fish."
    },
    {
      "beverage": "sauvignon_blanc",
      "food": "herb chicken",
      "score": 88,
      "relationship": "flavor echo",
      "why": "Herbal aromas match fresh herbs."
    },
    {
      "beverage": "chardonnay_unoaked",
      "food": "white fish",
      "score": 94,
      "relationship": "classic",
      "why": "Fresh acidity and moderate body suit delicate fish."
    },
    {
      "beverage": "chardonnay_unoaked",
      "food": "shellfish",
      "score": 92,
      "relationship": "classic",
      "why": "Citrus/apple notes complement sweet shellfish."
    },
    {
      "beverage": "chardonnay_unoaked",
      "food": "chicken salad",
      "score": 88,
      "relationship": "complement",
      "why": "Freshness fits light poultry dishes."
    },
    {
      "beverage": "chardonnay_unoaked",
      "food": "fresh cheese",
      "score": 86,
      "relationship": "complement",
      "why": "Moderate acidity works with mild creamy cheese."
    },
    {
      "beverage": "chardonnay_oaked",
      "food": "lobster with butter",
      "score": 98,
      "relationship": "classic",
      "why": "Rich body and oak complement butter and sweet lobster."
    },
    {
      "beverage": "chardonnay_oaked",
      "food": "roast chicken",
      "score": 94,
      "relationship": "classic",
      "why": "Body and savory oak fit browned poultry."
    },
    {
      "beverage": "chardonnay_oaked",
      "food": "creamy pasta",
      "score": 96,
      "relationship": "congruent",
      "why": "Creamy texture and oak mirror rich sauce."
    },
    {
      "beverage": "chardonnay_oaked",
      "food": "salmon",
      "score": 91,
      "relationship": "classic",
      "why": "Body can handle rich fish."
    },
    {
      "beverage": "chardonnay_oaked",
      "food": "comté / gruyère",
      "score": 90,
      "relationship": "classic",
      "why": "Nutty cheese and oak integrate well."
    },
    {
      "beverage": "riesling_dry",
      "food": "sushi",
      "score": 96,
      "relationship": "classic",
      "why": "Acidity and low tannin suit rice, fish and soy."
    },
    {
      "beverage": "riesling_dry",
      "food": "pork",
      "score": 92,
      "relationship": "classic",
      "why": "Apple-citrus acidity suits slightly sweet pork."
    },
    {
      "beverage": "riesling_dry",
      "food": "spicy noodles",
      "score": 86,
      "relationship": "contrast",
      "why": "Aromatic fruit helps, though off-dry Riesling is safer for high heat."
    },
    {
      "beverage": "riesling_dry",
      "food": "smoked fish",
      "score": 90,
      "relationship": "contrast",
      "why": "Acidity refreshes smoke and oil."
    },
    {
      "beverage": "riesling_off_dry",
      "food": "thai curry",
      "score": 98,
      "relationship": "classic",
      "why": "Slight sweetness and aromatics soften chili heat."
    },
    {
      "beverage": "riesling_off_dry",
      "food": "spicy asian food",
      "score": 97,
      "relationship": "classic",
      "why": "Lower perceived dryness balances heat."
    },
    {
      "beverage": "riesling_off_dry",
      "food": "pork belly",
      "score": 94,
      "relationship": "contrast",
      "why": "Acidity and sweetness cut rich fat."
    },
    {
      "beverage": "riesling_off_dry",
      "food": "blue cheese",
      "score": 88,
      "relationship": "contrast",
      "why": "Sweetness balances salt and pungency."
    },
    {
      "beverage": "riesling_off_dry",
      "food": "fruit-based dishes",
      "score": 92,
      "relationship": "congruent",
      "why": "Fruit aromas echo the dish."
    },
    {
      "beverage": "pinot_grigio",
      "food": "light seafood",
      "score": 95,
      "relationship": "classic",
      "why": "Crisp, light style does not overpower delicate seafood."
    },
    {
      "beverage": "pinot_grigio",
      "food": "salad",
      "score": 92,
      "relationship": "classic",
      "why": "Fresh acidity fits raw vegetables."
    },
    {
      "beverage": "pinot_grigio",
      "food": "antipasti",
      "score": 90,
      "relationship": "regional",
      "why": "Light salty starters suit a crisp white."
    },
    {
      "beverage": "pinot_grigio",
      "food": "fresh mozzarella",
      "score": 88,
      "relationship": "complement",
      "why": "Mild cheese matches delicate wine."
    },
    {
      "beverage": "chenin_blanc",
      "food": "pork",
      "score": 91,
      "relationship": "classic",
      "why": "Acidity and apple/quince notes suit pork."
    },
    {
      "beverage": "chenin_blanc",
      "food": "goat cheese",
      "score": 92,
      "relationship": "classic",
      "why": "Acidity matches tangy cheese."
    },
    {
      "beverage": "chenin_blanc",
      "food": "roast chicken",
      "score": 89,
      "relationship": "complement",
      "why": "Body and acidity fit poultry."
    },
    {
      "beverage": "chenin_blanc",
      "food": "mild curry",
      "score": 88,
      "relationship": "aromatic complement",
      "why": "Fruit and acidity fit gentle spice."
    },
    {
      "beverage": "gewurztraminer",
      "food": "thai food",
      "score": 96,
      "relationship": "classic",
      "why": "Aromatic fruit and slight sweetness suit fragrant spice."
    },
    {
      "beverage": "gewurztraminer",
      "food": "indian curry",
      "score": 94,
      "relationship": "classic",
      "why": "Floral spice profile complements aromatic curries."
    },
    {
      "beverage": "gewurztraminer",
      "food": "munster cheese",
      "score": 92,
      "relationship": "regional/classic",
      "why": "Aromatic intensity handles pungent cheese."
    },
    {
      "beverage": "gewurztraminer",
      "food": "duck with fruit sauce",
      "score": 90,
      "relationship": "congruent",
      "why": "Lychee/rose-like aromas suit sweet-savory sauce."
    },
    {
      "beverage": "albarino",
      "food": "oysters",
      "score": 98,
      "relationship": "regional/classic",
      "why": "High acidity and saline character suit oysters."
    },
    {
      "beverage": "albarino",
      "food": "shrimp",
      "score": 95,
      "relationship": "classic",
      "why": "Citrus freshness complements sweet shellfish."
    },
    {
      "beverage": "albarino",
      "food": "grilled octopus",
      "score": 93,
      "relationship": "regional",
      "why": "Minerality and acidity suit charred seafood."
    },
    {
      "beverage": "albarino",
      "food": "fish tacos",
      "score": 91,
      "relationship": "contrast",
      "why": "Acidity works with lime and fried/grilled fish."
    },
    {
      "beverage": "rose_dry",
      "food": "charcuterie",
      "score": 94,
      "relationship": "classic",
      "why": "Freshness handles salt and fat."
    },
    {
      "beverage": "rose_dry",
      "food": "grilled vegetables",
      "score": 92,
      "relationship": "classic",
      "why": "Red-fruit freshness suits char and vegetables."
    },
    {
      "beverage": "rose_dry",
      "food": "salmon",
      "score": 90,
      "relationship": "classic",
      "why": "Enough body for richer fish without heavy tannin."
    },
    {
      "beverage": "rose_dry",
      "food": "mediterranean salads",
      "score": 93,
      "relationship": "regional",
      "why": "Acidity and fruit fit herbs, olives and tomatoes."
    },
    {
      "beverage": "champagne_brut",
      "food": "oysters",
      "score": 99,
      "relationship": "classic",
      "why": "Acidity and bubbles suit briny shellfish."
    },
    {
      "beverage": "champagne_brut",
      "food": "fried chicken",
      "score": 98,
      "relationship": "contrast",
      "why": "Bubbles and acidity cut fried richness."
    },
    {
      "beverage": "champagne_brut",
      "food": "french fries",
      "score": 96,
      "relationship": "contrast",
      "why": "Salt and fat are refreshed by bubbles."
    },
    {
      "beverage": "champagne_brut",
      "food": "brie / camembert",
      "score": 94,
      "relationship": "classic",
      "why": "Acidity cleanses creamy soft cheese."
    },
    {
      "beverage": "champagne_brut",
      "food": "sushi",
      "score": 94,
      "relationship": "classic",
      "why": "Low tannin, bubbles and acidity suit fish and rice."
    },
    {
      "beverage": "champagne_brut",
      "food": "caviar",
      "score": 98,
      "relationship": "classic",
      "why": "Salt, fat and delicate texture pair with dry bubbles."
    },
    {
      "beverage": "prosecco",
      "food": "prosciutto",
      "score": 94,
      "relationship": "classic",
      "why": "Fruit and bubbles balance salt."
    },
    {
      "beverage": "prosecco",
      "food": "light appetizers",
      "score": 92,
      "relationship": "classic",
      "why": "Low-to-moderate intensity fits starters."
    },
    {
      "beverage": "prosecco",
      "food": "fruit",
      "score": 90,
      "relationship": "congruent",
      "why": "Fresh pear/apple notes echo fruit."
    },
    {
      "beverage": "prosecco",
      "food": "salty snacks",
      "score": 91,
      "relationship": "contrast",
      "why": "Bubbles refresh the palate."
    },
    {
      "beverage": "moscato",
      "food": "fruit tart",
      "score": 96,
      "relationship": "classic",
      "why": "Aromatic sweetness matches fruit desserts."
    },
    {
      "beverage": "moscato",
      "food": "light cake",
      "score": 90,
      "relationship": "classic",
      "why": "Sweetness and low intensity suit delicate desserts."
    },
    {
      "beverage": "moscato",
      "food": "spicy food",
      "score": 91,
      "relationship": "contrast",
      "why": "Low alcohol and sweetness can soften heat."
    },
    {
      "beverage": "moscato",
      "food": "fresh berries",
      "score": 94,
      "relationship": "congruent",
      "why": "Fruit-forward aromas align."
    },
    {
      "beverage": "sauternes",
      "food": "foie gras",
      "score": 99,
      "relationship": "classic",
      "why": "Sweetness and acidity balance extreme richness."
    },
    {
      "beverage": "sauternes",
      "food": "roquefort",
      "score": 99,
      "relationship": "classic",
      "why": "Sweetness contrasts salt and blue-cheese intensity."
    },
    {
      "beverage": "sauternes",
      "food": "fruit dessert",
      "score": 95,
      "relationship": "classic",
      "why": "Sweet wine matches dessert sweetness."
    },
    {
      "beverage": "sauternes",
      "food": "creme brulee",
      "score": 93,
      "relationship": "congruent",
      "why": "Honeyed richness suits caramel custard."
    },
    {
      "beverage": "port_ruby",
      "food": "stilton / blue cheese",
      "score": 99,
      "relationship": "classic",
      "why": "Sweet dark fruit balances salt and pungency."
    },
    {
      "beverage": "port_ruby",
      "food": "dark chocolate dessert",
      "score": 94,
      "relationship": "classic",
      "why": "Dense fruit and sweetness can match intense chocolate."
    },
    {
      "beverage": "port_ruby",
      "food": "berry dessert",
      "score": 95,
      "relationship": "congruent",
      "why": "Dark berry flavors echo the dessert."
    },
    {
      "beverage": "port_tawny",
      "food": "walnut tart",
      "score": 98,
      "relationship": "congruent",
      "why": "Nutty oxidative notes mirror walnuts."
    },
    {
      "beverage": "port_tawny",
      "food": "caramel dessert",
      "score": 96,
      "relationship": "congruent",
      "why": "Toffee and dried-fruit notes fit caramel."
    },
    {
      "beverage": "port_tawny",
      "food": "aged cheese",
      "score": 92,
      "relationship": "classic",
      "why": "Sweetness contrasts salt and nuttiness."
    },
    {
      "beverage": "port_tawny",
      "food": "milk chocolate",
      "score": 90,
      "relationship": "congruent",
      "why": "Softer chocolate fits mellow tawny character."
    },
    {
      "beverage": "sherry_fino",
      "food": "olives",
      "score": 99,
      "relationship": "regional/classic",
      "why": "Saline, dry style matches briny olives."
    },
    {
      "beverage": "sherry_fino",
      "food": "almonds",
      "score": 97,
      "relationship": "regional/classic",
      "why": "Nutty savory notes align."
    },
    {
      "beverage": "sherry_fino",
      "food": "jamón",
      "score": 98,
      "relationship": "regional/classic",
      "why": "Dry saline wine refreshes cured ham."
    },
    {
      "beverage": "sherry_fino",
      "food": "fried fish",
      "score": 94,
      "relationship": "regional",
      "why": "Freshness cuts oil."
    },
    {
      "beverage": "sherry_fino",
      "food": "sushi",
      "score": 90,
      "relationship": "savory complement",
      "why": "Salinity and low fruit can fit umami and seafood."
    },
    {
      "beverage": "sherry_amontillado",
      "food": "mushrooms",
      "score": 96,
      "relationship": "congruent",
      "why": "Nutty oxidative notes echo earthy umami."
    },
    {
      "beverage": "sherry_amontillado",
      "food": "roast chicken",
      "score": 93,
      "relationship": "classic",
      "why": "Savory depth fits browned poultry."
    },
    {
      "beverage": "sherry_amontillado",
      "food": "hard cheese",
      "score": 92,
      "relationship": "classic",
      "why": "Nutty wine works with aged cheese."
    },
    {
      "beverage": "sherry_amontillado",
      "food": "jamón",
      "score": 95,
      "relationship": "regional",
      "why": "Salt and savory oxidation align."
    },
    {
      "beverage": "sherry_oloroso",
      "food": "braised beef",
      "score": 94,
      "relationship": "classic",
      "why": "Powerful nutty body suits rich meat."
    },
    {
      "beverage": "sherry_oloroso",
      "food": "aged cheese",
      "score": 96,
      "relationship": "classic",
      "why": "Intensity and nuttiness match."
    },
    {
      "beverage": "sherry_oloroso",
      "food": "nuts",
      "score": 98,
      "relationship": "congruent",
      "why": "Walnut-like oxidative flavors echo nuts."
    },
    {
      "beverage": "madeira",
      "food": "mushroom dishes",
      "score": 91,
      "relationship": "congruent",
      "why": "Oxidative savory notes suit mushrooms."
    },
    {
      "beverage": "madeira",
      "food": "roast meat",
      "score": 90,
      "relationship": "classic",
      "why": "Acidity keeps rich meat lively."
    },
    {
      "beverage": "madeira",
      "food": "caramelized nuts",
      "score": 95,
      "relationship": "congruent",
      "why": "Toffee-nut flavors align."
    },
    {
      "beverage": "madeira",
      "food": "hard cheese",
      "score": 92,
      "relationship": "classic",
      "why": "Acidity and oxidative complexity suit aged cheese."
    },
    {
      "beverage": "pilsner",
      "food": "fried chicken",
      "score": 97,
      "relationship": "contrast",
      "why": "Crisp carbonation and bitterness cut fried fat."
    },
    {
      "beverage": "pilsner",
      "food": "pizza",
      "score": 93,
      "relationship": "classic",
      "why": "Crisp malt and bitterness refresh cheese and crust."
    },
    {
      "beverage": "pilsner",
      "food": "sausages",
      "score": 94,
      "relationship": "classic",
      "why": "Carbonation and malt fit savory sausage."
    },
    {
      "beverage": "pilsner",
      "food": "salty snacks",
      "score": 96,
      "relationship": "classic",
      "why": "Clean bitterness and bubbles refresh salt."
    },
    {
      "beverage": "pilsner",
      "food": "sushi",
      "score": 88,
      "relationship": "complement",
      "why": "Light body does not overpower fish."
    },
    {
      "beverage": "wheat_beer",
      "food": "salad",
      "score": 90,
      "relationship": "complement",
      "why": "Light body and citrus/spice fit fresh vegetables."
    },
    {
      "beverage": "wheat_beer",
      "food": "seafood",
      "score": 91,
      "relationship": "classic",
      "why": "Citrus-like notes suit shellfish and fish."
    },
    {
      "beverage": "wheat_beer",
      "food": "goat cheese",
      "score": 88,
      "relationship": "complement",
      "why": "Fresh acidity and yeast character fit tangy cheese."
    },
    {
      "beverage": "wheat_beer",
      "food": "banana bread",
      "score": 84,
      "relationship": "flavor echo",
      "why": "Hefeweizen banana/clove notes can mirror baking flavors."
    },
    {
      "beverage": "pale_ale",
      "food": "burger",
      "score": 93,
      "relationship": "classic",
      "why": "Malt and hops stand up to beef and toppings."
    },
    {
      "beverage": "pale_ale",
      "food": "grilled chicken",
      "score": 90,
      "relationship": "classic",
      "why": "Caramel malt and hop bitterness fit char."
    },
    {
      "beverage": "pale_ale",
      "food": "cheddar",
      "score": 92,
      "relationship": "classic",
      "why": "Hop bitterness and malt work with sharp cheese."
    },
    {
      "beverage": "pale_ale",
      "food": "roasted vegetables",
      "score": 88,
      "relationship": "complement",
      "why": "Toast and hops suit caramelized vegetables."
    },
    {
      "beverage": "ipa",
      "food": "spicy tacos",
      "score": 91,
      "relationship": "contrast/complement",
      "why": "Hop citrus can fit tacos, though bitterness may amplify extreme chili."
    },
    {
      "beverage": "ipa",
      "food": "blue cheese",
      "score": 90,
      "relationship": "contrast",
      "why": "Bold hops match intense cheese."
    },
    {
      "beverage": "ipa",
      "food": "burger",
      "score": 94,
      "relationship": "classic",
      "why": "Bitterness cuts fat and intensity matches beef."
    },
    {
      "beverage": "ipa",
      "food": "fried food",
      "score": 92,
      "relationship": "contrast",
      "why": "Carbonation and bitterness refresh oil."
    },
    {
      "beverage": "ipa",
      "food": "carrot cake",
      "score": 80,
      "relationship": "aromatic complement",
      "why": "Citrus/pine hops can play against spice and sweetness."
    },
    {
      "beverage": "amber_ale",
      "food": "roast pork",
      "score": 92,
      "relationship": "classic",
      "why": "Caramel malt suits browned pork."
    },
    {
      "beverage": "amber_ale",
      "food": "grilled sausage",
      "score": 94,
      "relationship": "classic",
      "why": "Toasty malt complements savory char."
    },
    {
      "beverage": "amber_ale",
      "food": "medium cheddar",
      "score": 90,
      "relationship": "classic",
      "why": "Malt sweetness balances salt."
    },
    {
      "beverage": "amber_ale",
      "food": "roasted root vegetables",
      "score": 89,
      "relationship": "congruent",
      "why": "Caramelized flavors echo malt."
    },
    {
      "beverage": "stout_porter",
      "food": "oysters",
      "score": 95,
      "relationship": "classic",
      "why": "Roast and briny minerality are a traditional contrast."
    },
    {
      "beverage": "stout_porter",
      "food": "beef stew",
      "score": 96,
      "relationship": "classic",
      "why": "Roast and body suit deep savory flavors."
    },
    {
      "beverage": "stout_porter",
      "food": "chocolate cake",
      "score": 98,
      "relationship": "congruent",
      "why": "Coffee/cocoa malt echoes chocolate."
    },
    {
      "beverage": "stout_porter",
      "food": "blue cheese",
      "score": 91,
      "relationship": "contrast",
      "why": "Roast sweetness and body handle pungent cheese."
    },
    {
      "beverage": "stout_porter",
      "food": "barbecue",
      "score": 92,
      "relationship": "flavor echo",
      "why": "Smoke and roast fit charred meat."
    },
    {
      "beverage": "saison",
      "food": "mussels",
      "score": 97,
      "relationship": "classic",
      "why": "Dryness, pepper and carbonation suit shellfish."
    },
    {
      "beverage": "saison",
      "food": "goat cheese",
      "score": 93,
      "relationship": "classic",
      "why": "Earthy spice matches tangy cheese."
    },
    {
      "beverage": "saison",
      "food": "herb chicken",
      "score": 92,
      "relationship": "flavor echo",
      "why": "Peppery/herbal yeast notes suit herbs."
    },
    {
      "beverage": "saison",
      "food": "salad",
      "score": 90,
      "relationship": "complement",
      "why": "Dry refreshing profile fits vegetables."
    },
    {
      "beverage": "sour_beer",
      "food": "goat cheese",
      "score": 95,
      "relationship": "contrast",
      "why": "Acidity matches tang and refreshes fat."
    },
    {
      "beverage": "sour_beer",
      "food": "fruit dessert",
      "score": 92,
      "relationship": "congruent",
      "why": "Fruit acidity echoes berries and stone fruit."
    },
    {
      "beverage": "sour_beer",
      "food": "rich pork",
      "score": 90,
      "relationship": "contrast",
      "why": "Acidity cuts fat."
    },
    {
      "beverage": "sour_beer",
      "food": "fried food",
      "score": 90,
      "relationship": "contrast",
      "why": "Tartness refreshes oil."
    },
    {
      "beverage": "belgian_dubbel",
      "food": "braised beef",
      "score": 94,
      "relationship": "classic",
      "why": "Dark fruit and malt suit caramelized meat."
    },
    {
      "beverage": "belgian_dubbel",
      "food": "duck",
      "score": 91,
      "relationship": "complement",
      "why": "Rich fruit works with fatty poultry."
    },
    {
      "beverage": "belgian_dubbel",
      "food": "aged gouda",
      "score": 94,
      "relationship": "classic",
      "why": "Caramel malt fits nutty aged cheese."
    },
    {
      "beverage": "belgian_tripel",
      "food": "mussels",
      "score": 92,
      "relationship": "classic",
      "why": "High carbonation and spice suit shellfish."
    },
    {
      "beverage": "belgian_tripel",
      "food": "washed-rind cheese",
      "score": 91,
      "relationship": "intensity match",
      "why": "Strong aromas and carbonation handle pungent cheese."
    },
    {
      "beverage": "belgian_tripel",
      "food": "roast chicken",
      "score": 90,
      "relationship": "classic",
      "why": "Spice and body fit browned poultry."
    },
    {
      "beverage": "dry_cider",
      "food": "pork chops",
      "score": 97,
      "relationship": "classic",
      "why": "Apple acidity naturally suits pork."
    },
    {
      "beverage": "dry_cider",
      "food": "cheddar",
      "score": 95,
      "relationship": "classic",
      "why": "Acidity and fruit balance sharp cheese."
    },
    {
      "beverage": "dry_cider",
      "food": "roast chicken",
      "score": 90,
      "relationship": "classic",
      "why": "Fresh apple works with poultry."
    },
    {
      "beverage": "dry_cider",
      "food": "crepes / savory pastry",
      "score": 88,
      "relationship": "regional-style",
      "why": "Acidity balances butter and pastry."
    },
    {
      "beverage": "sweet_cider",
      "food": "apple pie",
      "score": 96,
      "relationship": "congruent",
      "why": "Apple-on-apple pairing; sweetness must match dessert."
    },
    {
      "beverage": "sweet_cider",
      "food": "blue cheese",
      "score": 89,
      "relationship": "contrast",
      "why": "Sweetness balances salt."
    },
    {
      "beverage": "sweet_cider",
      "food": "spicy pork",
      "score": 88,
      "relationship": "contrast",
      "why": "Sweetness softens spice and acidity cuts fat."
    },
    {
      "beverage": "mead",
      "food": "roast pork",
      "score": 90,
      "relationship": "classic",
      "why": "Honeyed notes suit pork's sweetness."
    },
    {
      "beverage": "mead",
      "food": "blue cheese",
      "score": 88,
      "relationship": "contrast",
      "why": "Honey sweetness balances pungency."
    },
    {
      "beverage": "mead",
      "food": "nuts",
      "score": 91,
      "relationship": "congruent",
      "why": "Honey and nuts form a natural flavor family."
    },
    {
      "beverage": "mead",
      "food": "spiced desserts",
      "score": 92,
      "relationship": "congruent",
      "why": "Honey fits baking spices."
    },
    {
      "beverage": "vodka",
      "food": "caviar",
      "score": 96,
      "relationship": "classic",
      "why": "Clean chilled spirit does not obscure delicate salt and fat."
    },
    {
      "beverage": "vodka",
      "food": "smoked fish",
      "score": 92,
      "relationship": "classic",
      "why": "Neutral spirit refreshes oily smoky fish."
    },
    {
      "beverage": "vodka",
      "food": "pickles",
      "score": 94,
      "relationship": "regional/classic",
      "why": "Sharp acidity and salt pair with a clean spirit."
    },
    {
      "beverage": "vodka",
      "food": "blini",
      "score": 88,
      "relationship": "regional",
      "why": "Neutrality works with sour cream and savory toppings."
    },
    {
      "beverage": "gin",
      "food": "oysters",
      "score": 92,
      "relationship": "classic",
      "why": "Juniper and citrus botanicals complement briny shellfish."
    },
    {
      "beverage": "gin",
      "food": "smoked salmon",
      "score": 90,
      "relationship": "complement",
      "why": "Botanicals and citrus lift rich smoked fish."
    },
    {
      "beverage": "gin",
      "food": "goat cheese",
      "score": 85,
      "relationship": "aromatic complement",
      "why": "Herbal notes suit tangy cheese."
    },
    {
      "beverage": "gin",
      "food": "cucumber salad",
      "score": 92,
      "relationship": "flavor echo",
      "why": "Fresh botanicals align with cucumber and herbs."
    },
    {
      "beverage": "bourbon",
      "food": "barbecue ribs",
      "score": 96,
      "relationship": "classic",
      "why": "Vanilla, caramel and char echo barbecue."
    },
    {
      "beverage": "bourbon",
      "food": "pecan pie",
      "score": 97,
      "relationship": "congruent",
      "why": "Caramel, vanilla and nut flavors align."
    },
    {
      "beverage": "bourbon",
      "food": "dark chocolate",
      "score": 92,
      "relationship": "classic",
      "why": "Oak, caramel and cocoa form a rich pairing."
    },
    {
      "beverage": "bourbon",
      "food": "smoked meat",
      "score": 94,
      "relationship": "flavor echo",
      "why": "Barrel char complements smoke."
    },
    {
      "beverage": "bourbon",
      "food": "aged cheddar",
      "score": 90,
      "relationship": "classic",
      "why": "Salt and fat balance oak and sweetness."
    },
    {
      "beverage": "rye_whiskey",
      "food": "pastrami",
      "score": 95,
      "relationship": "classic",
      "why": "Peppery rye mirrors spice and cuts fat."
    },
    {
      "beverage": "rye_whiskey",
      "food": "smoked sausage",
      "score": 92,
      "relationship": "classic",
      "why": "Spice and grain fit savory smoke."
    },
    {
      "beverage": "rye_whiskey",
      "food": "aged cheese",
      "score": 90,
      "relationship": "classic",
      "why": "Bold spice handles mature cheese."
    },
    {
      "beverage": "rye_whiskey",
      "food": "dark chocolate",
      "score": 86,
      "relationship": "contrast",
      "why": "Dry spice prevents the pairing becoming too sweet."
    },
    {
      "beverage": "irish_whiskey",
      "food": "smoked salmon",
      "score": 88,
      "relationship": "classic",
      "why": "Soft malt and light fruit fit smoke."
    },
    {
      "beverage": "irish_whiskey",
      "food": "apple tart",
      "score": 91,
      "relationship": "congruent",
      "why": "Fruit and vanilla suit apple pastry."
    },
    {
      "beverage": "irish_whiskey",
      "food": "milk chocolate",
      "score": 90,
      "relationship": "congruent",
      "why": "Smooth whiskey works with creamy chocolate."
    },
    {
      "beverage": "irish_whiskey",
      "food": "mild cheddar",
      "score": 87,
      "relationship": "classic",
      "why": "Gentler intensity matches medium cheese."
    },
    {
      "beverage": "scotch_unpeated",
      "food": "aged cheddar",
      "score": 94,
      "relationship": "classic",
      "why": "Malt, oak and salt-rich cheese align."
    },
    {
      "beverage": "scotch_unpeated",
      "food": "roast beef",
      "score": 90,
      "relationship": "classic",
      "why": "Malt and oak suit browned meat."
    },
    {
      "beverage": "scotch_unpeated",
      "food": "nuts",
      "score": 91,
      "relationship": "congruent",
      "why": "Nutty malt/oak notes echo roasted nuts."
    },
    {
      "beverage": "scotch_unpeated",
      "food": "dark chocolate",
      "score": 89,
      "relationship": "classic",
      "why": "Cocoa and oak complement one another."
    },
    {
      "beverage": "scotch_peated",
      "food": "smoked salmon",
      "score": 98,
      "relationship": "flavor echo",
      "why": "Smoke-on-smoke pairing with oily fish."
    },
    {
      "beverage": "scotch_peated",
      "food": "blue cheese",
      "score": 93,
      "relationship": "intensity match",
      "why": "Strong peat can stand up to pungent cheese."
    },
    {
      "beverage": "scotch_peated",
      "food": "barbecue",
      "score": 94,
      "relationship": "flavor echo",
      "why": "Smoke and char align."
    },
    {
      "beverage": "scotch_peated",
      "food": "oysters",
      "score": 90,
      "relationship": "coastal contrast",
      "why": "Saline shellfish can complement maritime peat."
    },
    {
      "beverage": "cognac",
      "food": "foie gras",
      "score": 93,
      "relationship": "classic",
      "why": "Rich fruit and oak fit luxurious fatty texture."
    },
    {
      "beverage": "cognac",
      "food": "aged cheese",
      "score": 94,
      "relationship": "classic",
      "why": "Dried fruit and oak suit mature cheese."
    },
    {
      "beverage": "cognac",
      "food": "dark chocolate",
      "score": 96,
      "relationship": "classic",
      "why": "Cocoa, fruit and oak form a deep pairing."
    },
    {
      "beverage": "cognac",
      "food": "duck",
      "score": 91,
      "relationship": "classic",
      "why": "Fruit and richness complement duck."
    },
    {
      "beverage": "brandy",
      "food": "fruit tart",
      "score": 91,
      "relationship": "congruent",
      "why": "Fruit spirit echoes baked fruit."
    },
    {
      "beverage": "brandy",
      "food": "hard cheese",
      "score": 89,
      "relationship": "classic",
      "why": "Oak and fruit pair with nutty cheese."
    },
    {
      "beverage": "brandy",
      "food": "roast pork",
      "score": 88,
      "relationship": "complement",
      "why": "Fruit notes suit pork."
    },
    {
      "beverage": "brandy",
      "food": "nuts",
      "score": 90,
      "relationship": "congruent",
      "why": "Oak-aged brandy works with roasted nuts."
    },
    {
      "beverage": "white_rum",
      "food": "ceviche",
      "score": 96,
      "relationship": "classic",
      "why": "Clean cane and citrus-friendly profile suit lime and raw fish."
    },
    {
      "beverage": "white_rum",
      "food": "grilled shrimp",
      "score": 92,
      "relationship": "classic",
      "why": "Light sweetness complements shellfish."
    },
    {
      "beverage": "white_rum",
      "food": "tropical fruit",
      "score": 94,
      "relationship": "congruent",
      "why": "Cane and fruit flavors align."
    },
    {
      "beverage": "white_rum",
      "food": "coconut dessert",
      "score": 90,
      "relationship": "congruent",
      "why": "Tropical flavors reinforce each other."
    },
    {
      "beverage": "aged_rum",
      "food": "jerk pork",
      "score": 96,
      "relationship": "classic",
      "why": "Molasses and spice suit caramelized, spicy meat."
    },
    {
      "beverage": "aged_rum",
      "food": "banana dessert",
      "score": 96,
      "relationship": "congruent",
      "why": "Caramel and tropical fruit align."
    },
    {
      "beverage": "aged_rum",
      "food": "dark chocolate",
      "score": 94,
      "relationship": "classic",
      "why": "Molasses, oak and cocoa integrate."
    },
    {
      "beverage": "aged_rum",
      "food": "grilled pineapple",
      "score": 97,
      "relationship": "congruent",
      "why": "Caramelized tropical fruit mirrors rum."
    },
    {
      "beverage": "aged_rum",
      "food": "aged cheese",
      "score": 88,
      "relationship": "classic",
      "why": "Richness and spice fit mature cheese."
    },
    {
      "beverage": "tequila_blanco",
      "food": "ceviche",
      "score": 99,
      "relationship": "classic",
      "why": "Agave and citrus character fit lime, chili and seafood."
    },
    {
      "beverage": "tequila_blanco",
      "food": "fish tacos",
      "score": 98,
      "relationship": "classic",
      "why": "Peppery agave and citrus suit tacos."
    },
    {
      "beverage": "tequila_blanco",
      "food": "guacamole",
      "score": 95,
      "relationship": "classic",
      "why": "Fresh agave, lime and herbs match avocado."
    },
    {
      "beverage": "tequila_blanco",
      "food": "grilled shrimp",
      "score": 94,
      "relationship": "classic",
      "why": "Clean agave lifts sweet shellfish."
    },
    {
      "beverage": "tequila_reposado",
      "food": "carnitas",
      "score": 97,
      "relationship": "classic",
      "why": "Oak-softened agave suits rich pork."
    },
    {
      "beverage": "tequila_reposado",
      "food": "grilled chicken tacos",
      "score": 94,
      "relationship": "classic",
      "why": "Roasted agave fits char."
    },
    {
      "beverage": "tequila_reposado",
      "food": "aged cheese",
      "score": 87,
      "relationship": "complement",
      "why": "Oak and savory cheese can work well."
    },
    {
      "beverage": "tequila_reposado",
      "food": "roasted corn",
      "score": 92,
      "relationship": "flavor echo",
      "why": "Roasted sweetness suits reposado."
    },
    {
      "beverage": "tequila_anejo",
      "food": "grilled steak",
      "score": 93,
      "relationship": "classic",
      "why": "Oak-aged agave has enough body for beef."
    },
    {
      "beverage": "tequila_anejo",
      "food": "dark chocolate",
      "score": 94,
      "relationship": "classic",
      "why": "Vanilla, oak and cocoa align."
    },
    {
      "beverage": "tequila_anejo",
      "food": "mole sauce",
      "score": 95,
      "relationship": "regional/classic",
      "why": "Agave, spice and cocoa notes complement mole."
    },
    {
      "beverage": "tequila_anejo",
      "food": "aged cheese",
      "score": 91,
      "relationship": "classic",
      "why": "Intensity and oak match mature cheese."
    },
    {
      "beverage": "mezcal",
      "food": "grilled octopus",
      "score": 97,
      "relationship": "classic",
      "why": "Smoke and char align with seafood."
    },
    {
      "beverage": "mezcal",
      "food": "mole",
      "score": 98,
      "relationship": "classic",
      "why": "Smoke, chile and cocoa-like complexity fit mezcal."
    },
    {
      "beverage": "mezcal",
      "food": "barbecue",
      "score": 95,
      "relationship": "flavor echo",
      "why": "Smoke-on-char pairing."
    },
    {
      "beverage": "mezcal",
      "food": "roasted vegetables",
      "score": 94,
      "relationship": "flavor echo",
      "why": "Earthy roast matches mezcal."
    },
    {
      "beverage": "sake_junmai",
      "food": "sushi",
      "score": 98,
      "relationship": "classic",
      "why": "Umami and moderate body complement rice and fish."
    },
    {
      "beverage": "sake_junmai",
      "food": "mushrooms",
      "score": 96,
      "relationship": "umami complement",
      "why": "Sake reinforces savory umami."
    },
    {
      "beverage": "sake_junmai",
      "food": "grilled chicken",
      "score": 92,
      "relationship": "classic",
      "why": "Rice umami and gentle acidity fit savory chicken."
    },
    {
      "beverage": "sake_junmai",
      "food": "hard cheese",
      "score": 88,
      "relationship": "umami complement",
      "why": "Sake can pair surprisingly well with aged cheese."
    },
    {
      "beverage": "sake_ginjo",
      "food": "sashimi",
      "score": 99,
      "relationship": "classic",
      "why": "Delicate fruit and clean texture preserve subtle fish."
    },
    {
      "beverage": "sake_ginjo",
      "food": "light seafood",
      "score": 97,
      "relationship": "classic",
      "why": "Aromatic freshness suits seafood."
    },
    {
      "beverage": "sake_ginjo",
      "food": "salad",
      "score": 90,
      "relationship": "complement",
      "why": "Clean aromatics fit fresh vegetables."
    },
    {
      "beverage": "sake_ginjo",
      "food": "fresh cheese",
      "score": 86,
      "relationship": "complement",
      "why": "Delicate profile matches mild cheese."
    },
    {
      "beverage": "sake_nigori",
      "food": "spicy food",
      "score": 92,
      "relationship": "contrast",
      "why": "Creamy sweetness can soften chili."
    },
    {
      "beverage": "sake_nigori",
      "food": "fruit dessert",
      "score": 90,
      "relationship": "congruent",
      "why": "Sweet rice and fruit work together."
    },
    {
      "beverage": "sake_nigori",
      "food": "coconut dessert",
      "score": 91,
      "relationship": "congruent",
      "why": "Creamy texture and tropical sweetness align."
    },
    {
      "beverage": "shochu",
      "food": "yakitori",
      "score": 95,
      "relationship": "classic",
      "why": "Clean grain/sweet-potato character fits grilled skewers."
    },
    {
      "beverage": "shochu",
      "food": "sashimi",
      "score": 90,
      "relationship": "classic",
      "why": "Light styles can accompany delicate fish."
    },
    {
      "beverage": "shochu",
      "food": "grilled vegetables",
      "score": 89,
      "relationship": "complement",
      "why": "Earthy notes suit char."
    },
    {
      "beverage": "shochu",
      "food": "pickles",
      "score": 88,
      "relationship": "contrast",
      "why": "Clean spirit works with sharp salty flavors."
    },
    {
      "beverage": "soju",
      "food": "korean barbecue",
      "score": 99,
      "relationship": "classic",
      "why": "Clean, lightly sweet spirit cuts fatty grilled meat."
    },
    {
      "beverage": "soju",
      "food": "fried chicken",
      "score": 96,
      "relationship": "classic",
      "why": "Refreshing neutral spirit suits crispy rich food."
    },
    {
      "beverage": "soju",
      "food": "spicy korean dishes",
      "score": 90,
      "relationship": "classic",
      "why": "Clean profile handles bold seasoning."
    },
    {
      "beverage": "soju",
      "food": "grilled pork belly",
      "score": 98,
      "relationship": "classic",
      "why": "Spirit refreshes between fatty bites."
    },
    {
      "beverage": "campari",
      "food": "olives",
      "score": 90,
      "relationship": "aperitivo",
      "why": "Salt and bitterness work as a pre-dinner pairing."
    },
    {
      "beverage": "campari",
      "food": "charcuterie",
      "score": 88,
      "relationship": "aperitivo",
      "why": "Bitter citrus refreshes fatty cured meat."
    },
    {
      "beverage": "campari",
      "food": "orange-based appetizers",
      "score": 86,
      "relationship": "flavor echo",
      "why": "Orange notes align."
    },
    {
      "beverage": "campari",
      "food": "rich cheese",
      "score": 82,
      "relationship": "contrast",
      "why": "Bitterness can cut fat."
    },
    {
      "beverage": "aperol",
      "food": "prosciutto",
      "score": 92,
      "relationship": "aperitivo",
      "why": "Gentler bittersweet orange suits salty ham."
    },
    {
      "beverage": "aperol",
      "food": "light antipasti",
      "score": 93,
      "relationship": "aperitivo",
      "why": "Low intensity matches starters."
    },
    {
      "beverage": "aperol",
      "food": "olives",
      "score": 88,
      "relationship": "aperitivo",
      "why": "Salt balances sweetness and bitterness."
    },
    {
      "beverage": "orange_liqueur",
      "food": "dark chocolate",
      "score": 95,
      "relationship": "classic",
      "why": "Orange and chocolate are a strong flavor match."
    },
    {
      "beverage": "orange_liqueur",
      "food": "crepes",
      "score": 92,
      "relationship": "classic",
      "why": "Citrus sweetness suits buttery pastry."
    },
    {
      "beverage": "orange_liqueur",
      "food": "fruit tart",
      "score": 90,
      "relationship": "congruent",
      "why": "Citrus amplifies fruit."
    },
    {
      "beverage": "orange_liqueur",
      "food": "duck à l'orange",
      "score": 88,
      "relationship": "flavor echo",
      "why": "Orange component directly matches."
    },
    {
      "beverage": "coffee_liqueur",
      "food": "tiramisu",
      "score": 98,
      "relationship": "congruent",
      "why": "Coffee-on-coffee pairing."
    },
    {
      "beverage": "coffee_liqueur",
      "food": "chocolate cake",
      "score": 95,
      "relationship": "classic",
      "why": "Coffee deepens cocoa flavor."
    },
    {
      "beverage": "coffee_liqueur",
      "food": "vanilla ice cream",
      "score": 94,
      "relationship": "contrast/congruent",
      "why": "Roast and sweetness complement cream and vanilla."
    },
    {
      "beverage": "amaretto",
      "food": "almond cake",
      "score": 99,
      "relationship": "congruent",
      "why": "Almond flavors directly match."
    },
    {
      "beverage": "amaretto",
      "food": "tiramisu",
      "score": 92,
      "relationship": "congruent",
      "why": "Nutty sweetness suits coffee and cream."
    },
    {
      "beverage": "amaretto",
      "food": "stone-fruit dessert",
      "score": 91,
      "relationship": "congruent",
      "why": "Almond aroma naturally fits peach/apricot/cherry."
    },
    {
      "beverage": "elderflower_liqueur",
      "food": "fresh berries",
      "score": 94,
      "relationship": "congruent",
      "why": "Floral sweetness lifts berry aromas."
    },
    {
      "beverage": "elderflower_liqueur",
      "food": "goat cheese crostini",
      "score": 87,
      "relationship": "contrast",
      "why": "Floral sweetness balances tang."
    },
    {
      "beverage": "elderflower_liqueur",
      "food": "light fruit dessert",
      "score": 92,
      "relationship": "congruent",
      "why": "Delicate floral profile suits fruit."
    },
    {
      "beverage": "herbal_liqueur",
      "food": "dark chocolate",
      "score": 90,
      "relationship": "classic",
      "why": "Bitter herbs and cocoa create digestif depth."
    },
    {
      "beverage": "herbal_liqueur",
      "food": "aged cheese",
      "score": 89,
      "relationship": "classic",
      "why": "Herbal bitterness contrasts fat and salt."
    },
    {
      "beverage": "herbal_liqueur",
      "food": "roasted nuts",
      "score": 88,
      "relationship": "congruent",
      "why": "Roasted and herbal bitterness align."
    },
    {
      "beverage": "creme_de_cacao",
      "food": "chocolate dessert",
      "score": 99,
      "relationship": "congruent",
      "why": "Direct cocoa match."
    },
    {
      "beverage": "creme_de_cacao",
      "food": "vanilla ice cream",
      "score": 94,
      "relationship": "classic",
      "why": "Chocolate and vanilla complement one another."
    },
    {
      "beverage": "creme_de_cacao",
      "food": "berries",
      "score": 88,
      "relationship": "contrast",
      "why": "Berry acidity brightens chocolate sweetness."
    },
    {
      "beverage": "cabernet_sauvignon",
      "food": "gouda",
      "score": 90,
      "relationship": "classic",
      "why": "Established style-level pairing based on intensity, acidity/sweetness, salt and fat."
    },
    {
      "beverage": "pinot_noir",
      "food": "gruyère",
      "score": 92,
      "relationship": "classic",
      "why": "Established style-level pairing based on intensity, acidity/sweetness, salt and fat."
    },
    {
      "beverage": "champagne_brut",
      "food": "brie",
      "score": 94,
      "relationship": "classic",
      "why": "Established style-level pairing based on intensity, acidity/sweetness, salt and fat."
    },
    {
      "beverage": "champagne_brut",
      "food": "camembert",
      "score": 93,
      "relationship": "classic",
      "why": "Established style-level pairing based on intensity, acidity/sweetness, salt and fat."
    },
    {
      "beverage": "port_ruby",
      "food": "stilton",
      "score": 99,
      "relationship": "classic",
      "why": "Established style-level pairing based on intensity, acidity/sweetness, salt and fat."
    },
    {
      "beverage": "sparkling_water",
      "food": "fried food",
      "score": 95,
      "relationship": "palate cleanser",
      "why": "Carbonation refreshes the palate without adding sweetness."
    },
    {
      "beverage": "sparkling_water",
      "food": "rich cheese",
      "score": 88,
      "relationship": "palate cleanser",
      "why": "Bubbles and neutrality cut richness."
    },
    {
      "beverage": "sprite_style_soda",
      "food": "spicy food",
      "score": 84,
      "relationship": "contrast",
      "why": "Sweet citrus can soften moderate heat, though sweetness may dominate delicate dishes."
    },
    {
      "beverage": "sprite_style_soda",
      "food": "salty snacks",
      "score": 88,
      "relationship": "classic soft-drink match",
      "why": "Citrus sweetness contrasts salt."
    },
    {
      "beverage": "cola",
      "food": "burger",
      "score": 91,
      "relationship": "classic soft-drink match",
      "why": "Caramel, spice and acidity suit grilled beef."
    },
    {
      "beverage": "cola",
      "food": "barbecue",
      "score": 93,
      "relationship": "classic soft-drink match",
      "why": "Caramel and spice echo sweet-smoky sauces."
    },
    {
      "beverage": "tonic_water",
      "food": "fried food",
      "score": 86,
      "relationship": "contrast",
      "why": "Bitterness and carbonation refresh oily food."
    },
    {
      "beverage": "tonic_water",
      "food": "citrus appetizers",
      "score": 90,
      "relationship": "flavor echo",
      "why": "Bitter citrus aligns with citrus-led dishes."
    },
    {
      "beverage": "ginger_ale",
      "food": "roast chicken",
      "score": 88,
      "relationship": "complement",
      "why": "Gentle ginger and sweetness fit browned poultry."
    },
    {
      "beverage": "ginger_ale",
      "food": "apple dessert",
      "score": 89,
      "relationship": "congruent",
      "why": "Soft spice suits baked apple."
    },
    {
      "beverage": "ginger_beer_na",
      "food": "spicy food",
      "score": 90,
      "relationship": "contrast",
      "why": "Bold ginger and carbonation stand up to spice."
    },
    {
      "beverage": "ginger_beer_na",
      "food": "barbecue",
      "score": 89,
      "relationship": "complement",
      "why": "Spicy ginger fits smoky-sweet flavors."
    },
    {
      "beverage": "lemonade",
      "food": "fried fish",
      "score": 94,
      "relationship": "classic",
      "why": "Acidic citrus cuts oil and suits fish."
    },
    {
      "beverage": "lemonade",
      "food": "salad",
      "score": 90,
      "relationship": "complement",
      "why": "Fresh citrus fits vegetables and herbs."
    },
    {
      "beverage": "orange_juice",
      "food": "brunch dishes",
      "score": 92,
      "relationship": "classic",
      "why": "Fruit acidity and sweetness fit eggs, pastries and breakfast foods."
    },
    {
      "beverage": "apple_juice",
      "food": "pork",
      "score": 93,
      "relationship": "classic flavor match",
      "why": "Apple is a classic partner for pork."
    },
    {
      "beverage": "cranberry_juice",
      "food": "turkey",
      "score": 92,
      "relationship": "classic flavor match",
      "why": "Tart berry flavors suit poultry."
    },
    {
      "beverage": "pineapple_juice",
      "food": "grilled pork",
      "score": 91,
      "relationship": "tropical complement",
      "why": "Sweet acidity works with browned pork."
    },
    {
      "beverage": "tomato_juice",
      "food": "savory brunch",
      "score": 94,
      "relationship": "savory complement",
      "why": "Tomato umami works with eggs and savory breakfast foods."
    },
    {
      "beverage": "cold_brew",
      "food": "chocolate dessert",
      "score": 96,
      "relationship": "congruent",
      "why": "Coffee roast deepens cocoa."
    },
    {
      "beverage": "cold_brew",
      "food": "smoked meat",
      "score": 88,
      "relationship": "roast-smoke complement",
      "why": "Roasted coffee notes can suit smoke and char."
    },
    {
      "beverage": "espresso",
      "food": "tiramisu",
      "score": 99,
      "relationship": "congruent",
      "why": "Direct coffee match."
    },
    {
      "beverage": "espresso",
      "food": "dark chocolate",
      "score": 96,
      "relationship": "classic",
      "why": "Bitterness and roast align with cocoa."
    },
    {
      "beverage": "black_tea",
      "food": "aged cheese",
      "score": 89,
      "relationship": "tannin-fat contrast",
      "why": "Tea tannin refreshes rich cheese."
    },
    {
      "beverage": "black_tea",
      "food": "pastries",
      "score": 91,
      "relationship": "classic",
      "why": "Tannin balances butter and sweetness."
    },
    {
      "beverage": "green_tea",
      "food": "sushi",
      "score": 97,
      "relationship": "classic",
      "why": "Fresh grassy bitterness and low sweetness fit fish and rice."
    },
    {
      "beverage": "green_tea",
      "food": "light seafood",
      "score": 92,
      "relationship": "classic",
      "why": "Delicate tea preserves subtle seafood."
    },
    {
      "beverage": "earl_grey",
      "food": "lemon cake",
      "score": 94,
      "relationship": "flavor echo",
      "why": "Bergamot and citrus align."
    },
    {
      "beverage": "mint_tea",
      "food": "middle eastern sweets",
      "score": 93,
      "relationship": "regional-style",
      "why": "Fresh mint balances sweet, nutty desserts."
    },
    {
      "beverage": "chamomile_tea",
      "food": "light biscuits",
      "score": 90,
      "relationship": "gentle complement",
      "why": "Soft floral notes fit delicate baked goods."
    },
    {
      "beverage": "kombucha",
      "food": "rich pork",
      "score": 90,
      "relationship": "acid contrast",
      "why": "Acidity cuts fat."
    },
    {
      "beverage": "kombucha",
      "food": "fermented foods",
      "score": 88,
      "relationship": "fermented complement",
      "why": "Tart fermented flavors can echo pickled or fermented dishes."
    },
    {
      "beverage": "na_lager",
      "food": "pizza",
      "score": 92,
      "relationship": "classic beer-style pairing",
      "why": "Crisp bitterness refreshes cheese and crust."
    },
    {
      "beverage": "na_lager",
      "food": "fried chicken",
      "score": 94,
      "relationship": "contrast",
      "why": "Carbonation and bitterness cut fat."
    },
    {
      "beverage": "na_wheat_beer",
      "food": "seafood",
      "score": 91,
      "relationship": "beer-style complement",
      "why": "Citrus-like wheat character suits seafood."
    },
    {
      "beverage": "na_sparkling_wine",
      "food": "oysters",
      "score": 95,
      "relationship": "wine-style classic",
      "why": "Acidity and bubbles suit briny shellfish."
    },
    {
      "beverage": "na_sparkling_wine",
      "food": "fried food",
      "score": 96,
      "relationship": "contrast",
      "why": "Bubbles and acidity refresh richness."
    },
    {
      "beverage": "na_white_wine",
      "food": "white fish",
      "score": 90,
      "relationship": "wine-style classic",
      "why": "Fresh acidity and light body fit delicate fish."
    },
    {
      "beverage": "na_red_wine",
      "food": "roast beef",
      "score": 82,
      "relationship": "wine-style complement",
      "why": "Red-fruit and tannin-like structure can suit roasted beef, depending on product quality."
    },
    {
      "beverage": "virgin_mojito",
      "food": "ceviche",
      "score": 95,
      "relationship": "flavor echo",
      "why": "Lime and mint suit citrus-cured seafood."
    },
    {
      "beverage": "virgin_mojito",
      "food": "salad",
      "score": 91,
      "relationship": "fresh complement",
      "why": "Mint and citrus match fresh herbs and vegetables."
    },
    {
      "beverage": "virgin_colada",
      "food": "spicy food",
      "score": 88,
      "relationship": "contrast",
      "why": "Creamy coconut and fruit can soften moderate heat."
    },
    {
      "beverage": "shirley_temple",
      "food": "salty snacks",
      "score": 84,
      "relationship": "contrast",
      "why": "Sweet fruit and bubbles contrast salt."
    },
    {
      "beverage": "citrus_spritz_na",
      "food": "charcuterie",
      "score": 91,
      "relationship": "aperitivo-style",
      "why": "Bitter citrus and bubbles refresh salt and fat."
    },
    {
      "beverage": "berry_spritz_na",
      "food": "soft cheese",
      "score": 88,
      "relationship": "contrast",
      "why": "Berry acidity and fruit suit creamy cheese."
    },
    {
      "beverage": "spiced_apple_fizz",
      "food": "pork",
      "score": 94,
      "relationship": "classic flavor match",
      "why": "Apple and spice are natural partners for pork."
    },
    {
      "beverage": "coffee_tonic",
      "food": "chocolate dessert",
      "score": 89,
      "relationship": "contrast",
      "why": "Coffee roast plus tonic bitterness keeps chocolate from feeling overly sweet."
    }
  ],
  "context_dimensions": {
    "mood": [
      "neutral",
      "happy",
      "celebratory",
      "sad",
      "angry",
      "stressed",
      "tired",
      "nervous",
      "lonely"
    ],
    "setting": [
      "bar",
      "home",
      "balcony",
      "terrace",
      "dinner_table",
      "party",
      "date",
      "business_dinner",
      "gift_shop",
      "outdoors"
    ],
    "activity": [
      "conversation",
      "cigar",
      "pipe",
      "reading",
      "gaming",
      "dinner",
      "dessert",
      "party",
      "relaxing",
      "gift_buying"
    ],
    "time_of_day": [
      "morning",
      "afternoon",
      "evening",
      "late_night"
    ],
    "weather": [
      "hot",
      "warm",
      "cool",
      "cold",
      "rainy"
    ],
    "company": [
      "alone",
      "partner",
      "friend",
      "family",
      "colleague",
      "group",
      "client"
    ],
    "preference_axes": [
      "sweet",
      "dry",
      "bitter",
      "sour",
      "smoky",
      "smooth",
      "fresh",
      "fruity",
      "spicy",
      "herbal",
      "roasted",
      "creamy"
    ],
    "intensity": [
      "light",
      "medium",
      "full"
    ]
  },
  "context_rules": [
    {
      "id": "negative_mood_safety",
      "when": {
        "mood": [
          "sad",
          "angry",
          "stressed",
          "lonely"
        ]
      },
      "rule": "Do not increase alcohol score because of negative mood. Offer a non-alcoholic option alongside any alcoholic recommendation and keep dialogue supportive rather than framing alcohol as emotional treatment.",
      "score_effect": {
        "alcohol": 0,
        "non_alcoholic": 8
      }
    },
    {
      "id": "tired_or_late",
      "when": {
        "mood": [
          "tired"
        ],
        "time_of_day": [
          "late_night"
        ]
      },
      "rule": "Prefer lower-intensity and non-alcoholic choices unless the customer explicitly asks otherwise.",
      "score_effect": {
        "full_strength_spirits": -12,
        "non_alcoholic": 10
      }
    },
    {
      "id": "hot_weather",
      "when": {
        "weather": [
          "hot"
        ]
      },
      "rule": "Favor refreshing, lower-intensity, sparkling, citrus or long drinks.",
      "score_effect": {
        "sparkling_or_fresh": 10,
        "heavy_sweet": -5
      }
    },
    {
      "id": "cold_weather",
      "when": {
        "weather": [
          "cold"
        ]
      },
      "rule": "Warm, roasted, spiced and fuller flavors may receive a moderate context bonus.",
      "score_effect": {
        "warm_roasted_spiced": 8
      }
    },
    {
      "id": "gift_unknown_preferences",
      "when": {
        "activity": [
          "gift_buying"
        ]
      },
      "rule": "When recipient preferences are unknown, avoid extreme flavor profiles and prioritize broadly approachable products, presentation, budget and occasion.",
      "score_effect": {
        "extreme_bitter_or_smoky": -10,
        "balanced": 8
      }
    },
    {
      "id": "cigar_context",
      "when": {
        "activity": [
          "cigar"
        ]
      },
      "rule": "Pair by cigar body and flavor notes, not by mood. Include coffee, tea and sparkling-water options as valid non-alcoholic recommendations.",
      "score_effect": {
        "use_cigar_pairing_table": true
      }
    }
  ],
  "context_pairings": [
    {
      "context": {
        "setting": "balcony",
        "activity": "cigar",
        "time_of_day": "evening"
      },
      "beverage": "cognac",
      "score": 90,
      "why": "Slow-sipping, aromatic and compatible with many medium/full cigar profiles."
    },
    {
      "context": {
        "setting": "balcony",
        "activity": "cigar",
        "time_of_day": "evening"
      },
      "beverage": "cold_brew",
      "score": 88,
      "why": "Roasted profile works with tobacco and keeps the scenario non-alcoholic."
    },
    {
      "context": {
        "setting": "balcony",
        "activity": "cigar",
        "time_of_day": "evening"
      },
      "beverage": "black_tea",
      "score": 84,
      "why": "Tannin and warmth suit tobacco without alcohol."
    },
    {
      "context": {
        "setting": "balcony",
        "activity": "cigar",
        "time_of_day": "evening"
      },
      "beverage": "sparkling_water",
      "score": 80,
      "why": "Neutral palate cleanser; useful when the cigar itself should remain dominant."
    },
    {
      "context": {
        "setting": "terrace",
        "weather": "hot"
      },
      "beverage": "citrus_spritz_na",
      "score": 94,
      "why": "Cold, sparkling and citrus-forward."
    },
    {
      "context": {
        "setting": "terrace",
        "weather": "hot"
      },
      "beverage": "virgin_mojito",
      "score": 95,
      "why": "Mint, lime and ice fit hot-weather refreshment."
    },
    {
      "context": {
        "activity": "reading",
        "time_of_day": "evening"
      },
      "beverage": "earl_grey",
      "score": 93,
      "why": "Aromatic but calm and easy to sip slowly."
    },
    {
      "context": {
        "activity": "gaming",
        "company": "friend"
      },
      "beverage": "na_lager",
      "score": 90,
      "why": "Casual, food-friendly and easy to serve over a long session."
    },
    {
      "context": {
        "activity": "dessert"
      },
      "beverage": "espresso",
      "score": 92,
      "why": "Classic after-dessert roast and bitterness."
    },
    {
      "context": {
        "activity": "gift_buying"
      },
      "beverage": "na_sparkling_wine",
      "score": 84,
      "why": "Useful celebratory option when alcohol preferences or restrictions are unknown."
    }
  ],
  "cigar_beverage_pairings": [
    {
      "cigar_body": "mild",
      "cigar_note": "cedar",
      "beverage": "earl_grey",
      "score": 92,
      "why": "Bergamot and gentle tannin complement cedar without overpowering a mild cigar.",
      "alcoholic": false
    },
    {
      "cigar_body": "mild",
      "cigar_note": "cedar",
      "beverage": "cognac",
      "score": 86,
      "why": "Elegant fruit and oak can support cedar if the spirit is not too aggressive.",
      "alcoholic": true
    },
    {
      "cigar_body": "mild",
      "cigar_note": "nuts",
      "beverage": "black_tea",
      "score": 91,
      "why": "Tea tannin and nutty notes create a dry, restrained match.",
      "alcoholic": false
    },
    {
      "cigar_body": "mild",
      "cigar_note": "nuts",
      "beverage": "sherry_amontillado",
      "score": 94,
      "why": "Nutty oxidative sherry closely echoes nut flavors.",
      "alcoholic": true
    },
    {
      "cigar_body": "mild",
      "cigar_note": "cream",
      "beverage": "cold_brew",
      "score": 84,
      "why": "Soft roast gives contrast while staying lower in aromatic intensity than many spirits.",
      "alcoholic": false
    },
    {
      "cigar_body": "medium",
      "cigar_note": "coffee",
      "beverage": "cold_brew",
      "score": 97,
      "why": "Direct roast-on-roast pairing with no alcohol.",
      "alcoholic": false
    },
    {
      "cigar_body": "medium",
      "cigar_note": "coffee",
      "beverage": "bourbon",
      "score": 92,
      "why": "Vanilla, caramel and char support coffee notes.",
      "alcoholic": true
    },
    {
      "cigar_body": "medium",
      "cigar_note": "cocoa",
      "beverage": "cognac",
      "score": 94,
      "why": "Dried fruit and oak complement cocoa richness.",
      "alcoholic": true
    },
    {
      "cigar_body": "medium",
      "cigar_note": "cocoa",
      "beverage": "espresso",
      "score": 95,
      "why": "Intense coffee bitterness deepens cocoa.",
      "alcoholic": false
    },
    {
      "cigar_body": "medium",
      "cigar_note": "pepper",
      "beverage": "rye_whiskey",
      "score": 95,
      "why": "Peppery rye mirrors spicy cigar notes.",
      "alcoholic": true
    },
    {
      "cigar_body": "medium",
      "cigar_note": "pepper",
      "beverage": "ginger_beer_na",
      "score": 88,
      "why": "Spicy ginger provides a lively non-alcoholic echo.",
      "alcoholic": false
    },
    {
      "cigar_body": "medium",
      "cigar_note": "earth",
      "beverage": "scotch_unpeated",
      "score": 91,
      "why": "Malt and oak suit earthy tobacco.",
      "alcoholic": true
    },
    {
      "cigar_body": "medium",
      "cigar_note": "earth",
      "beverage": "black_tea",
      "score": 89,
      "why": "Dry tannin and earthy tea tones fit tobacco.",
      "alcoholic": false
    },
    {
      "cigar_body": "full",
      "cigar_note": "smoke",
      "beverage": "scotch_peated",
      "score": 99,
      "why": "Peat smoke and full-bodied tobacco are an intensity match.",
      "alcoholic": true
    },
    {
      "cigar_body": "full",
      "cigar_note": "smoke",
      "beverage": "mezcal",
      "score": 94,
      "why": "Roasted agave and smoke complement smoky tobacco.",
      "alcoholic": true
    },
    {
      "cigar_body": "full",
      "cigar_note": "smoke",
      "beverage": "coffee_tonic",
      "score": 86,
      "why": "Roast and bitterness give a non-alcoholic counterpoint with carbonation.",
      "alcoholic": false
    },
    {
      "cigar_body": "full",
      "cigar_note": "coffee",
      "beverage": "aged_rum",
      "score": 95,
      "why": "Molasses, caramel and oak fit deep coffee notes.",
      "alcoholic": true
    },
    {
      "cigar_body": "full",
      "cigar_note": "coffee",
      "beverage": "espresso",
      "score": 98,
      "why": "High-intensity roast matches a full cigar without alcohol.",
      "alcoholic": false
    },
    {
      "cigar_body": "full",
      "cigar_note": "cocoa",
      "beverage": "port_tawny",
      "score": 94,
      "why": "Nutty dried-fruit sweetness complements cocoa and rich tobacco.",
      "alcoholic": true
    },
    {
      "cigar_body": "full",
      "cigar_note": "cocoa",
      "beverage": "cold_brew",
      "score": 90,
      "why": "Coffee roast supports cocoa and full tobacco.",
      "alcoholic": false
    },
    {
      "cigar_body": "full",
      "cigar_note": "leather",
      "beverage": "cognac",
      "score": 96,
      "why": "Oak, dried fruit and mature spirit character fit leathery tobacco.",
      "alcoholic": true
    },
    {
      "cigar_body": "full",
      "cigar_note": "leather",
      "beverage": "black_tea",
      "score": 87,
      "why": "Firm tannin gives a dry non-alcoholic match.",
      "alcoholic": false
    },
    {
      "cigar_body": "full",
      "cigar_note": "sweet",
      "beverage": "aged_rum",
      "score": 97,
      "why": "Caramel and molasses echo sweet tobacco notes.",
      "alcoholic": true
    },
    {
      "cigar_body": "full",
      "cigar_note": "sweet",
      "beverage": "spiced_apple_fizz",
      "score": 84,
      "why": "Apple spice offers a softer non-alcoholic complement.",
      "alcoholic": false
    }
  ],
  "recommendation_engine": {
    "weights": {
      "taste_match": 0.25,
      "food_pairing": 0.18,
      "activity_match": 0.14,
      "setting_match": 0.1,
      "recipient_occasion_match": 0.1,
      "budget_match": 0.08,
      "inventory_availability": 0.08,
      "regional_availability": 0.04,
      "weather_time_match": 0.03
    },
    "hard_rules": [
      "Never recommend an unavailable inventory item as purchasable.",
      "Respect explicit no-alcohol / allergy / ingredient restrictions before scoring.",
      "Negative mood never increases alcoholic beverage score.",
      "Do not describe alcohol as a treatment for sadness, anger, stress, anxiety or loneliness.",
      "When mood is negative, include at least one non-alcoholic recommendation where the dialogue flow allows recommendations.",
      "For tobacco/cigar scenarios, match beverage intensity to cigar body and flavor notes."
    ],
    "candidate_groups": [
      "alcoholic",
      "non_alcoholic",
      "mocktail",
      "soft_drink",
      "coffee",
      "tea",
      "juice",
      "fermented_na"
    ]
  }
} as const;

export function pairingBand(score: number): PairingBand {
  if (score >= 90) return 'excellent';
  if (score >= 80) return 'good';
  if (score >= 65) return 'situational';
  if (score >= 45) return 'weak';
  return 'challenging';
}

export function findBeverageFoodPairings(beverageId: string) {
  return BAR_PAIRINGS.beverage_food_pairings
    .filter((x) => x.beverage === beverageId)
    .sort((a, b) => b.score - a.score);
}

export function findBeveragePairings(beverageId: string) {
  return BAR_PAIRINGS.beverage_beverage_pairings
    .filter((x) => x.a === beverageId || x.b === beverageId)
    .sort((a, b) => b.score - a.score);
}

export function findCigarPairings(
  cigarBody: 'mild' | 'medium' | 'full',
  cigarNote: string
) {
  return BAR_PAIRINGS.cigar_beverage_pairings
    .filter((x) => x.cigar_body === cigarBody && x.cigar_note === cigarNote)
    .sort((a, b) => b.score - a.score);
}

export function shouldOfferNonAlcoholic(mood: string) {
  return ['sad', 'angry', 'stressed', 'lonely'].includes(mood);
}