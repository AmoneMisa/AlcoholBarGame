import type { Ingredient, Modifier, Recipe, Region, Supplier } from './types';
import { FOOD_INGREDIENTS } from './foods';

export const REGIONS: Region[] = [
  { id: 'new-york', name: 'New York', currencySymbol: '$', marketFactor: 1.35, rentPerDay: 50, tagline: 'Classic & diverse' },
  { id: 'london', name: 'London', currencySymbol: '£', marketFactor: 1.28, rentPerDay: 42, tagline: 'Pubs & cocktails' },
  { id: 'berlin', name: 'Berlin', currencySymbol: '€', marketFactor: 1.02, rentPerDay: 31, tagline: 'Trendy & modern' },
  { id: 'tashkent', name: 'Tashkent', currencySymbol: 'soʻm ', marketFactor: 0.62, rentPerDay: 18, tagline: 'Warm & social' },
  { id: 'bucharest', name: 'Bucharest', currencySymbol: 'lei ', marketFactor: 0.78, rentPerDay: 22, tagline: 'Busy nightlife' },
  { id: 'tokyo', name: 'Tokyo', currencySymbol: '¥', marketFactor: 1.30, rentPerDay: 47, tagline: 'Precise & premium' }
];

export const INGREDIENTS: Ingredient[] = [
  { id: 'white-rum', name: 'White rum', unit: 'ml', basePrice: 0.035, pourStep: 15, category: 'spirit' },
  { id: 'dark-rum', name: 'Dark rum', unit: 'ml', basePrice: 0.040, pourStep: 15, category: 'spirit' },
  { id: 'gin', name: 'Gin', unit: 'ml', basePrice: 0.040, pourStep: 15, category: 'spirit' },
  { id: 'vodka', name: 'Vodka', unit: 'ml', basePrice: 0.032, pourStep: 15, category: 'spirit' },
  { id: 'tequila', name: 'Tequila', unit: 'ml', basePrice: 0.045, pourStep: 15, category: 'spirit' },
  { id: 'whiskey', name: 'Whiskey', unit: 'ml', basePrice: 0.052, pourStep: 15, category: 'spirit' },
  { id: 'orange-liqueur', name: 'Orange liqueur', unit: 'ml', basePrice: 0.048, pourStep: 10, category: 'spirit' },
  { id: 'vermouth', name: 'Vermouth', unit: 'ml', basePrice: 0.030, pourStep: 10, category: 'spirit' },
  { id: 'bitter-aperitif', name: 'Bitter aperitif', unit: 'ml', basePrice: 0.046, pourStep: 15, category: 'spirit' },
  { id: 'sparkling-wine', name: 'Sparkling wine', unit: 'ml', basePrice: 0.042, pourStep: 30, category: 'spirit' },
  { id: 'coffee-liqueur', name: 'Coffee liqueur', unit: 'ml', basePrice: 0.044, pourStep: 15, category: 'spirit' },
  { id: 'blue-curacao', name: 'Blue Curaçao', unit: 'ml', basePrice: 0.040, pourStep: 5, category: 'spirit' },
  { id: 'herbal-liqueur', name: 'Herbal liqueur', unit: 'ml', basePrice: 0.052, pourStep: 5, category: 'spirit' },
  { id: 'specialty-liqueur', name: 'Specialty liqueur', unit: 'ml', basePrice: 0.045, pourStep: 5, category: 'spirit' },
  { id: 'fruit-wine', name: 'Fruit wine', unit: 'ml', basePrice: 0.022, pourStep: 15, category: 'spirit' },
  { id: 'alcohol-free-beer', name: 'Alcohol-free beer', unit: 'ml', basePrice: 0.010, pourStep: 30, category: 'mixer' },
  { id: 'lime-juice', name: 'Lime', unit: 'ml', basePrice: 0.012, pourStep: 5, category: 'fruit' },
  { id: 'lemon-juice', name: 'Lemon', unit: 'ml', basePrice: 0.012, pourStep: 5, category: 'fruit' },
  { id: 'pineapple-juice', name: 'Pineapple', unit: 'ml', basePrice: 0.008, pourStep: 30, category: 'fruit' },
  { id: 'cranberry-juice', name: 'Cranberry', unit: 'ml', basePrice: 0.009, pourStep: 30, category: 'fruit' },
  { id: 'sugar-syrup', name: 'Sugar', unit: 'ml', basePrice: 0.006, pourStep: 5, category: 'mixer' },
  { id: 'coconut-cream', name: 'Coconut cream', unit: 'ml', basePrice: 0.012, pourStep: 15, category: 'mixer' },
  { id: 'milk', name: 'Milk', unit: 'ml', basePrice: 0.006, pourStep: 5, category: 'mixer' },
  { id: 'coconut-milk', name: 'Coconut milk', unit: 'ml', basePrice: 0.010, pourStep: 5, category: 'mixer' },
  { id: 'tonic', name: 'Tonic', unit: 'ml', basePrice: 0.006, pourStep: 30, category: 'mixer' },
  { id: 'soda', name: 'Soda water', unit: 'ml', basePrice: 0.004, pourStep: 30, category: 'mixer' },
  { id: 'cola', name: 'Cola', unit: 'ml', basePrice: 0.005, pourStep: 30, category: 'mixer' },
  { id: 'ginger-beer', name: 'Ginger beer', unit: 'ml', basePrice: 0.008, pourStep: 30, category: 'mixer' },
  { id: 'grapefruit-soda', name: 'Grapefruit soda', unit: 'ml', basePrice: 0.008, pourStep: 30, category: 'mixer' },
  { id: 'mint', name: 'Mint', unit: 'piece', basePrice: 0.030, pourStep: 2, category: 'herb' },
  { id: 'ice', name: 'Ice', unit: 'piece', basePrice: 0.010, pourStep: 1, category: 'garnish' },
  { id: 'lime-wedge', name: 'Fresh lime', unit: 'piece', basePrice: 0.18, pourStep: 1, category: 'fruit' },
  { id: 'orange', name: 'Fresh orange', unit: 'piece', basePrice: 0.22, pourStep: 1, category: 'fruit' },
  { id: 'pineapple-wedge', name: 'Pineapple wedge', unit: 'piece', basePrice: 0.24, pourStep: 1, category: 'fruit' },
  { id: 'salt', name: 'Bar salt', unit: 'piece', basePrice: 0.04, pourStep: 1, category: 'garnish' },
  // Food for the menu: stock items like the rest, kept out of the cocktail mixer.
  ...FOOD_INGREDIENTS
];

export const RECIPES: Recipe[] = [
  {
    "id": "mojito",
    "name": "Mojito",
    "price": 9.5,
    "needsShake": false,
    "category": "classic",
    "origin": "",
    "story": "",
    "tastingNotes": [
      "fresh",
      "citrusy",
      "herbal",
      "sparkling"
    ],
    "occasions": [],
    "method": [],
    "ingredients": [
      {
        "ingredientId": "white-rum",
        "amount": 45
      },
      {
        "ingredientId": "lime-juice",
        "amount": 20
      },
      {
        "ingredientId": "mint",
        "amount": 6
      },
      {
        "ingredientId": "sugar-syrup",
        "amount": 10
      },
      {
        "ingredientId": "soda",
        "amount": 90
      },
      {
        "ingredientId": "ice",
        "amount": 5
      },
      {
        "ingredientId": "lime-wedge",
        "amount": 1
      }
    ]
  },
  {
    "id": "daiquiri",
    "name": "Daiquiri",
    "price": 8.5,
    "needsShake": true,
    "category": "classic",
    "origin": "",
    "story": "",
    "tastingNotes": [
      "sharp",
      "clean",
      "rum-forward"
    ],
    "occasions": [],
    "method": [],
    "ingredients": [
      {
        "ingredientId": "white-rum",
        "amount": 45
      },
      {
        "ingredientId": "lime-juice",
        "amount": 25
      },
      {
        "ingredientId": "sugar-syrup",
        "amount": 15
      },
      {
        "ingredientId": "ice",
        "amount": 4
      }
    ]
  },
  {
    "id": "margarita",
    "name": "Margarita",
    "price": 10,
    "needsShake": true,
    "category": "classic",
    "origin": "",
    "story": "",
    "tastingNotes": [
      "tart",
      "agave",
      "citrus",
      "saline"
    ],
    "occasions": [],
    "method": [],
    "ingredients": [
      {
        "ingredientId": "tequila",
        "amount": 45
      },
      {
        "ingredientId": "orange-liqueur",
        "amount": 20
      },
      {
        "ingredientId": "lime-juice",
        "amount": 20
      },
      {
        "ingredientId": "ice",
        "amount": 4
      },
      {
        "ingredientId": "salt",
        "amount": 1
      }
    ]
  },
  {
    "id": "pina-colada",
    "name": "Piña Colada",
    "price": 11,
    "needsShake": true,
    "category": "cocktail",
    "origin": "",
    "story": "",
    "tastingNotes": [
      "creamy",
      "tropical",
      "sweet"
    ],
    "occasions": [],
    "method": [],
    "ingredients": [
      {
        "ingredientId": "white-rum",
        "amount": 45
      },
      {
        "ingredientId": "pineapple-juice",
        "amount": 90
      },
      {
        "ingredientId": "coconut-cream",
        "amount": 30
      },
      {
        "ingredientId": "ice",
        "amount": 5
      },
      {
        "ingredientId": "pineapple-wedge",
        "amount": 1
      }
    ]
  },
  {
    "id": "cosmopolitan",
    "name": "Cosmopolitan",
    "price": 10.5,
    "needsShake": true,
    "category": "cocktail",
    "origin": "",
    "story": "",
    "tastingNotes": [
      "crisp",
      "berry",
      "citrusy"
    ],
    "occasions": [],
    "method": [],
    "ingredients": [
      {
        "ingredientId": "vodka",
        "amount": 45
      },
      {
        "ingredientId": "orange-liqueur",
        "amount": 15
      },
      {
        "ingredientId": "cranberry-juice",
        "amount": 30
      },
      {
        "ingredientId": "lime-juice",
        "amount": 10
      },
      {
        "ingredientId": "ice",
        "amount": 4
      },
      {
        "ingredientId": "orange",
        "amount": 1
      }
    ]
  },
  {
    "id": "old-fashioned",
    "name": "Old Fashioned",
    "price": 12,
    "needsShake": false,
    "category": "classic",
    "origin": "",
    "story": "",
    "tastingNotes": [
      "rich",
      "spirit-forward",
      "aromatic"
    ],
    "occasions": [],
    "method": [],
    "ingredients": [
      {
        "ingredientId": "whiskey",
        "amount": 45
      },
      {
        "ingredientId": "sugar-syrup",
        "amount": 10
      },
      {
        "ingredientId": "ice",
        "amount": 3
      },
      {
        "ingredientId": "orange",
        "amount": 1
      }
    ]
  },
  {
    "id": "martini",
    "name": "Martini",
    "price": 11.5,
    "needsShake": false,
    "category": "classic",
    "origin": "",
    "story": "",
    "tastingNotes": [
      "dry",
      "botanical",
      "silky"
    ],
    "occasions": [],
    "method": [],
    "ingredients": [
      {
        "ingredientId": "gin",
        "amount": 60
      },
      {
        "ingredientId": "vermouth",
        "amount": 20
      },
      {
        "ingredientId": "ice",
        "amount": 4
      }
    ]
  },
  {
    "id": "whiskey-sour",
    "name": "Whiskey Sour",
    "price": 10.5,
    "needsShake": true,
    "category": "classic",
    "origin": "",
    "story": "",
    "tastingNotes": [
      "balanced",
      "citrusy",
      "warming"
    ],
    "occasions": [],
    "method": [],
    "ingredients": [
      {
        "ingredientId": "whiskey",
        "amount": 45
      },
      {
        "ingredientId": "lemon-juice",
        "amount": 25
      },
      {
        "ingredientId": "sugar-syrup",
        "amount": 15
      },
      {
        "ingredientId": "ice",
        "amount": 4
      },
      {
        "ingredientId": "orange",
        "amount": 1
      }
    ]
  },
  {
    "id": "long-island",
    "name": "Long Island",
    "price": 13,
    "needsShake": true,
    "category": "cocktail",
    "origin": "",
    "story": "",
    "tastingNotes": [
      "strong",
      "citrusy",
      "cola"
    ],
    "occasions": [],
    "method": [],
    "ingredients": [
      {
        "ingredientId": "vodka",
        "amount": 15
      },
      {
        "ingredientId": "gin",
        "amount": 15
      },
      {
        "ingredientId": "white-rum",
        "amount": 15
      },
      {
        "ingredientId": "tequila",
        "amount": 15
      },
      {
        "ingredientId": "orange-liqueur",
        "amount": 10
      },
      {
        "ingredientId": "lemon-juice",
        "amount": 20
      },
      {
        "ingredientId": "cola",
        "amount": 60
      },
      {
        "ingredientId": "ice",
        "amount": 5
      }
    ]
  },
  {
    "id": "gin-tonic",
    "name": "Gin & Tonic",
    "price": 9,
    "needsShake": false,
    "category": "classic",
    "origin": "",
    "story": "",
    "tastingNotes": [
      "botanical",
      "bitter",
      "refreshing"
    ],
    "occasions": [],
    "method": [],
    "ingredients": [
      {
        "ingredientId": "gin",
        "amount": 45
      },
      {
        "ingredientId": "tonic",
        "amount": 90
      },
      {
        "ingredientId": "ice",
        "amount": 5
      },
      {
        "ingredientId": "lime-wedge",
        "amount": 1
      }
    ]
  },
  {
    "id": "negroni",
    "name": "Negroni",
    "price": 13,
    "needsShake": false,
    "category": "classic",
    "origin": "",
    "story": "",
    "tastingNotes": [
      "bitter",
      "botanical",
      "orange"
    ],
    "occasions": [],
    "method": [],
    "ingredients": [
      {
        "ingredientId": "gin",
        "amount": 30
      },
      {
        "ingredientId": "bitter-aperitif",
        "amount": 30
      },
      {
        "ingredientId": "vermouth",
        "amount": 30
      },
      {
        "ingredientId": "ice",
        "amount": 3
      },
      {
        "ingredientId": "orange",
        "amount": 1
      }
    ]
  },
  {
    "id": "mai-tai",
    "name": "Mai Tai",
    "price": 14,
    "needsShake": true,
    "category": "cocktail",
    "origin": "",
    "story": "",
    "tastingNotes": [
      "tropical",
      "nutty",
      "rum-forward"
    ],
    "occasions": [],
    "method": [],
    "ingredients": [
      {
        "ingredientId": "white-rum",
        "amount": 30
      },
      {
        "ingredientId": "dark-rum",
        "amount": 30
      },
      {
        "ingredientId": "orange-liqueur",
        "amount": 15
      },
      {
        "ingredientId": "lime-juice",
        "amount": 25
      },
      {
        "ingredientId": "sugar-syrup",
        "amount": 10
      },
      {
        "ingredientId": "ice",
        "amount": 5
      },
      {
        "ingredientId": "mint",
        "amount": 2
      }
    ]
  },
  {
    "id": "french-75",
    "name": "French 75",
    "price": 14,
    "needsShake": true,
    "category": "classic",
    "origin": "",
    "story": "",
    "tastingNotes": [
      "sparkling",
      "dry",
      "citrusy"
    ],
    "occasions": [],
    "method": [],
    "ingredients": [
      {
        "ingredientId": "gin",
        "amount": 30
      },
      {
        "ingredientId": "lemon-juice",
        "amount": 15
      },
      {
        "ingredientId": "sugar-syrup",
        "amount": 10
      },
      {
        "ingredientId": "sparkling-wine",
        "amount": 60
      },
      {
        "ingredientId": "ice",
        "amount": 3
      }
    ]
  },
  {
    "id": "moscow-mule",
    "name": "Moscow Mule",
    "price": 11,
    "needsShake": false,
    "category": "cocktail",
    "origin": "",
    "story": "",
    "tastingNotes": [
      "gingery",
      "zesty",
      "sparkling"
    ],
    "occasions": [],
    "method": [],
    "ingredients": [
      {
        "ingredientId": "vodka",
        "amount": 45
      },
      {
        "ingredientId": "lime-juice",
        "amount": 15
      },
      {
        "ingredientId": "ginger-beer",
        "amount": 90
      },
      {
        "ingredientId": "ice",
        "amount": 5
      },
      {
        "ingredientId": "lime-wedge",
        "amount": 1
      }
    ]
  },
  {
    "id": "espresso-martini",
    "name": "Espresso Martini",
    "price": 14,
    "needsShake": true,
    "category": "cocktail",
    "origin": "",
    "story": "",
    "tastingNotes": [
      "coffee",
      "rich",
      "energizing"
    ],
    "occasions": [],
    "method": [],
    "ingredients": [
      {
        "ingredientId": "vodka",
        "amount": 45
      },
      {
        "ingredientId": "coffee-liqueur",
        "amount": 30
      },
      {
        "ingredientId": "sugar-syrup",
        "amount": 10
      },
      {
        "ingredientId": "ice",
        "amount": 5
      }
    ]
  },
  {
    "id": "paloma",
    "name": "Paloma",
    "price": 11.5,
    "needsShake": false,
    "category": "cocktail",
    "origin": "",
    "story": "",
    "tastingNotes": [
      "grapefruit",
      "tart",
      "refreshing"
    ],
    "occasions": [],
    "method": [],
    "ingredients": [
      {
        "ingredientId": "tequila",
        "amount": 45
      },
      {
        "ingredientId": "lime-juice",
        "amount": 15
      },
      {
        "ingredientId": "grapefruit-soda",
        "amount": 90
      },
      {
        "ingredientId": "ice",
        "amount": 5
      },
      {
        "ingredientId": "salt",
        "amount": 1
      }
    ]
  },
  {
    "id": "cuba-libre",
    "name": "Cuba Libre",
    "price": 10,
    "needsShake": false,
    "category": "classic",
    "origin": "",
    "story": "",
    "tastingNotes": [
      "cola",
      "lime",
      "rum"
    ],
    "occasions": [],
    "ingredients": [
      {
        "ingredientId": "white-rum",
        "amount": 45
      },
      {
        "ingredientId": "cola",
        "amount": 90
      },
      {
        "ingredientId": "lime-juice",
        "amount": 10
      },
      {
        "ingredientId": "ice",
        "amount": 5
      },
      {
        "ingredientId": "lime-wedge",
        "amount": 1
      }
    ],
    "method": []
  },
  {
    "id": "dark-stormy",
    "name": "Dark ’n’ Stormy",
    "price": 11,
    "needsShake": false,
    "category": "classic",
    "origin": "",
    "story": "",
    "tastingNotes": [
      "ginger",
      "dark rum",
      "zesty"
    ],
    "occasions": [],
    "ingredients": [
      {
        "ingredientId": "dark-rum",
        "amount": 50
      },
      {
        "ingredientId": "ginger-beer",
        "amount": 90
      },
      {
        "ingredientId": "lime-juice",
        "amount": 15
      },
      {
        "ingredientId": "ice",
        "amount": 5
      }
    ],
    "method": []
  },
  {
    "id": "tom-collins",
    "name": "Tom Collins",
    "price": 10.5,
    "needsShake": true,
    "category": "classic",
    "origin": "",
    "story": "",
    "tastingNotes": [
      "lemon",
      "botanical",
      "sparkling"
    ],
    "occasions": [],
    "ingredients": [
      {
        "ingredientId": "gin",
        "amount": 45
      },
      {
        "ingredientId": "lemon-juice",
        "amount": 25
      },
      {
        "ingredientId": "sugar-syrup",
        "amount": 15
      },
      {
        "ingredientId": "soda",
        "amount": 75
      },
      {
        "ingredientId": "ice",
        "amount": 5
      }
    ],
    "method": []
  },
  {
    "id": "gin-fizz",
    "name": "Gin Fizz",
    "price": 10.5,
    "needsShake": true,
    "category": "classic",
    "origin": "",
    "story": "",
    "tastingNotes": [
      "bright",
      "foamy",
      "botanical"
    ],
    "occasions": [],
    "ingredients": [
      {
        "ingredientId": "gin",
        "amount": 45
      },
      {
        "ingredientId": "lemon-juice",
        "amount": 25
      },
      {
        "ingredientId": "sugar-syrup",
        "amount": 15
      },
      {
        "ingredientId": "soda",
        "amount": 45
      },
      {
        "ingredientId": "ice",
        "amount": 4
      }
    ],
    "method": []
  },
  {
    "id": "gimlet",
    "name": "Gimlet",
    "price": 10,
    "needsShake": true,
    "category": "classic",
    "origin": "",
    "story": "",
    "tastingNotes": [
      "lime",
      "dry",
      "botanical"
    ],
    "occasions": [],
    "ingredients": [
      {
        "ingredientId": "gin",
        "amount": 60
      },
      {
        "ingredientId": "lime-juice",
        "amount": 25
      },
      {
        "ingredientId": "sugar-syrup",
        "amount": 15
      },
      {
        "ingredientId": "ice",
        "amount": 4
      }
    ],
    "method": []
  },
  {
    "id": "southside",
    "name": "Southside",
    "price": 11,
    "needsShake": true,
    "category": "classic",
    "origin": "",
    "story": "",
    "tastingNotes": [
      "mint",
      "lime",
      "fresh"
    ],
    "occasions": [],
    "ingredients": [
      {
        "ingredientId": "gin",
        "amount": 50
      },
      {
        "ingredientId": "lime-juice",
        "amount": 25
      },
      {
        "ingredientId": "sugar-syrup",
        "amount": 15
      },
      {
        "ingredientId": "mint",
        "amount": 5
      },
      {
        "ingredientId": "ice",
        "amount": 4
      }
    ],
    "method": []
  },
  {
    "id": "gin-rickey",
    "name": "Gin Rickey",
    "price": 9.5,
    "needsShake": false,
    "category": "classic",
    "origin": "",
    "story": "",
    "tastingNotes": [
      "dry",
      "lime",
      "sparkling"
    ],
    "occasions": [],
    "ingredients": [
      {
        "ingredientId": "gin",
        "amount": 45
      },
      {
        "ingredientId": "lime-juice",
        "amount": 20
      },
      {
        "ingredientId": "soda",
        "amount": 90
      },
      {
        "ingredientId": "ice",
        "amount": 5
      },
      {
        "ingredientId": "lime-wedge",
        "amount": 1
      }
    ],
    "method": []
  },
  {
    "id": "bees-knees",
    "name": "Bee’s Knees",
    "price": 11,
    "needsShake": true,
    "category": "classic",
    "origin": "",
    "story": "",
    "tastingNotes": [
      "lemon",
      "soft",
      "floral"
    ],
    "occasions": [],
    "ingredients": [
      {
        "ingredientId": "gin",
        "amount": 50
      },
      {
        "ingredientId": "lemon-juice",
        "amount": 25
      },
      {
        "ingredientId": "sugar-syrup",
        "amount": 20
      },
      {
        "ingredientId": "ice",
        "amount": 4
      }
    ],
    "method": []
  },
  {
    "id": "white-lady",
    "name": "White Lady",
    "price": 12,
    "needsShake": true,
    "category": "classic",
    "origin": "",
    "story": "",
    "tastingNotes": [
      "citrus",
      "dry",
      "silky"
    ],
    "occasions": [],
    "ingredients": [
      {
        "ingredientId": "gin",
        "amount": 40
      },
      {
        "ingredientId": "orange-liqueur",
        "amount": 25
      },
      {
        "ingredientId": "lemon-juice",
        "amount": 20
      },
      {
        "ingredientId": "ice",
        "amount": 4
      }
    ],
    "method": []
  },
  {
    "id": "pegu-club",
    "name": "Pegu Club",
    "price": 12,
    "needsShake": true,
    "category": "classic",
    "origin": "",
    "story": "",
    "tastingNotes": [
      "lime",
      "orange",
      "aromatic"
    ],
    "occasions": [],
    "ingredients": [
      {
        "ingredientId": "gin",
        "amount": 45
      },
      {
        "ingredientId": "orange-liqueur",
        "amount": 20
      },
      {
        "ingredientId": "lime-juice",
        "amount": 20
      },
      {
        "ingredientId": "sugar-syrup",
        "amount": 5
      },
      {
        "ingredientId": "ice",
        "amount": 4
      }
    ],
    "method": []
  },
  {
    "id": "corpse-reviver-2",
    "name": "Corpse Reviver Number Two",
    "price": 13.5,
    "needsShake": true,
    "category": "classic",
    "origin": "",
    "story": "",
    "tastingNotes": [
      "sharp",
      "complex",
      "orange"
    ],
    "occasions": [],
    "ingredients": [
      {
        "ingredientId": "gin",
        "amount": 25
      },
      {
        "ingredientId": "orange-liqueur",
        "amount": 25
      },
      {
        "ingredientId": "vermouth",
        "amount": 25
      },
      {
        "ingredientId": "lemon-juice",
        "amount": 25
      },
      {
        "ingredientId": "ice",
        "amount": 4
      }
    ],
    "method": []
  },
  {
    "id": "vesper",
    "name": "Vesper",
    "price": 14,
    "needsShake": false,
    "category": "classic",
    "origin": "",
    "story": "",
    "tastingNotes": [
      "strong",
      "dry",
      "botanical"
    ],
    "occasions": [],
    "ingredients": [
      {
        "ingredientId": "gin",
        "amount": 45
      },
      {
        "ingredientId": "vodka",
        "amount": 15
      },
      {
        "ingredientId": "vermouth",
        "amount": 10
      },
      {
        "ingredientId": "ice",
        "amount": 4
      }
    ],
    "method": []
  },
  {
    "id": "vodka-martini",
    "name": "Vodka Martini",
    "price": 12,
    "needsShake": false,
    "category": "classic",
    "origin": "",
    "story": "",
    "tastingNotes": [
      "clean",
      "dry",
      "silky"
    ],
    "occasions": [],
    "ingredients": [
      {
        "ingredientId": "vodka",
        "amount": 60
      },
      {
        "ingredientId": "vermouth",
        "amount": 15
      },
      {
        "ingredientId": "ice",
        "amount": 4
      }
    ],
    "method": []
  },
  {
    "id": "kamikaze",
    "name": "Kamikaze",
    "price": 10.5,
    "needsShake": true,
    "category": "cocktail",
    "origin": "",
    "story": "",
    "tastingNotes": [
      "lime",
      "orange",
      "sharp"
    ],
    "occasions": [],
    "ingredients": [
      {
        "ingredientId": "vodka",
        "amount": 35
      },
      {
        "ingredientId": "orange-liqueur",
        "amount": 20
      },
      {
        "ingredientId": "lime-juice",
        "amount": 25
      },
      {
        "ingredientId": "ice",
        "amount": 4
      }
    ],
    "method": []
  },
  {
    "id": "lemon-drop",
    "name": "Lemon Drop",
    "price": 10.5,
    "needsShake": true,
    "category": "cocktail",
    "origin": "",
    "story": "",
    "tastingNotes": [
      "lemon",
      "sweet-tart",
      "clean"
    ],
    "occasions": [],
    "ingredients": [
      {
        "ingredientId": "vodka",
        "amount": 45
      },
      {
        "ingredientId": "lemon-juice",
        "amount": 25
      },
      {
        "ingredientId": "sugar-syrup",
        "amount": 20
      },
      {
        "ingredientId": "ice",
        "amount": 4
      }
    ],
    "method": []
  },
  {
    "id": "cape-codder",
    "name": "Cape Codder",
    "price": 9.5,
    "needsShake": false,
    "category": "cocktail",
    "origin": "",
    "story": "",
    "tastingNotes": [
      "cranberry",
      "tart",
      "easy"
    ],
    "occasions": [],
    "ingredients": [
      {
        "ingredientId": "vodka",
        "amount": 45
      },
      {
        "ingredientId": "cranberry-juice",
        "amount": 90
      },
      {
        "ingredientId": "lime-juice",
        "amount": 10
      },
      {
        "ingredientId": "ice",
        "amount": 5
      }
    ],
    "method": []
  },
  {
    "id": "sea-breeze",
    "name": "Sea Breeze",
    "price": 10,
    "needsShake": false,
    "category": "cocktail",
    "origin": "",
    "story": "",
    "tastingNotes": [
      "cranberry",
      "grapefruit",
      "crisp"
    ],
    "occasions": [],
    "ingredients": [
      {
        "ingredientId": "vodka",
        "amount": 40
      },
      {
        "ingredientId": "cranberry-juice",
        "amount": 60
      },
      {
        "ingredientId": "grapefruit-soda",
        "amount": 60
      },
      {
        "ingredientId": "ice",
        "amount": 5
      }
    ],
    "method": []
  },
  {
    "id": "bay-breeze",
    "name": "Bay Breeze",
    "price": 10,
    "needsShake": false,
    "category": "cocktail",
    "origin": "",
    "story": "",
    "tastingNotes": [
      "pineapple",
      "cranberry",
      "soft"
    ],
    "occasions": [],
    "ingredients": [
      {
        "ingredientId": "vodka",
        "amount": 40
      },
      {
        "ingredientId": "cranberry-juice",
        "amount": 60
      },
      {
        "ingredientId": "pineapple-juice",
        "amount": 60
      },
      {
        "ingredientId": "ice",
        "amount": 5
      }
    ],
    "method": []
  },
  {
    "id": "madras",
    "name": "Madras",
    "price": 10,
    "needsShake": false,
    "category": "cocktail",
    "origin": "",
    "story": "",
    "tastingNotes": [
      "berry",
      "citrus",
      "light"
    ],
    "occasions": [],
    "ingredients": [
      {
        "ingredientId": "vodka",
        "amount": 40
      },
      {
        "ingredientId": "cranberry-juice",
        "amount": 75
      },
      {
        "ingredientId": "orange-liqueur",
        "amount": 10
      },
      {
        "ingredientId": "soda",
        "amount": 30
      },
      {
        "ingredientId": "ice",
        "amount": 5
      }
    ],
    "method": []
  },
  {
    "id": "woo-woo",
    "name": "Woo Woo",
    "price": 10.5,
    "needsShake": true,
    "category": "cocktail",
    "origin": "",
    "story": "",
    "tastingNotes": [
      "cranberry",
      "fruity",
      "bright"
    ],
    "occasions": [],
    "ingredients": [
      {
        "ingredientId": "vodka",
        "amount": 40
      },
      {
        "ingredientId": "orange-liqueur",
        "amount": 20
      },
      {
        "ingredientId": "cranberry-juice",
        "amount": 60
      },
      {
        "ingredientId": "ice",
        "amount": 4
      }
    ],
    "method": []
  },
  {
    "id": "sex-on-the-beach",
    "name": "Sex on the Beach",
    "price": 11.5,
    "needsShake": true,
    "category": "cocktail",
    "origin": "",
    "story": "",
    "tastingNotes": [
      "tropical",
      "berry",
      "sweet"
    ],
    "occasions": [],
    "ingredients": [
      {
        "ingredientId": "vodka",
        "amount": 35
      },
      {
        "ingredientId": "orange-liqueur",
        "amount": 20
      },
      {
        "ingredientId": "cranberry-juice",
        "amount": 45
      },
      {
        "ingredientId": "pineapple-juice",
        "amount": 45
      },
      {
        "ingredientId": "ice",
        "amount": 5
      }
    ],
    "method": []
  },
  {
    "id": "french-martini",
    "name": "French Martini",
    "price": 12.5,
    "needsShake": true,
    "category": "cocktail",
    "origin": "",
    "story": "",
    "tastingNotes": [
      "pineapple",
      "berry",
      "silky"
    ],
    "occasions": [],
    "ingredients": [
      {
        "ingredientId": "vodka",
        "amount": 45
      },
      {
        "ingredientId": "pineapple-juice",
        "amount": 45
      },
      {
        "ingredientId": "cranberry-juice",
        "amount": 20
      },
      {
        "ingredientId": "sugar-syrup",
        "amount": 5
      },
      {
        "ingredientId": "ice",
        "amount": 4
      }
    ],
    "method": []
  },
  {
    "id": "black-russian",
    "name": "Black Russian",
    "price": 11,
    "needsShake": false,
    "category": "classic",
    "origin": "",
    "story": "",
    "tastingNotes": [
      "coffee",
      "strong",
      "rich"
    ],
    "occasions": [],
    "ingredients": [
      {
        "ingredientId": "vodka",
        "amount": 50
      },
      {
        "ingredientId": "coffee-liqueur",
        "amount": 25
      },
      {
        "ingredientId": "ice",
        "amount": 3
      }
    ],
    "method": []
  },
  {
    "id": "white-russian",
    "name": "White Russian",
    "price": 12,
    "needsShake": false,
    "category": "cocktail",
    "origin": "",
    "story": "",
    "tastingNotes": [
      "creamy",
      "coffee",
      "sweet"
    ],
    "occasions": [],
    "ingredients": [
      {
        "ingredientId": "vodka",
        "amount": 45
      },
      {
        "ingredientId": "coffee-liqueur",
        "amount": 25
      },
      {
        "ingredientId": "milk",
        "amount": 30
      },
      {
        "ingredientId": "ice",
        "amount": 3
      }
    ],
    "method": []
  },
  {
    "id": "mudslide",
    "name": "Mudslide",
    "price": 13,
    "needsShake": true,
    "category": "cocktail",
    "origin": "",
    "story": "",
    "tastingNotes": [
      "creamy",
      "coffee",
      "decadent"
    ],
    "occasions": [],
    "ingredients": [
      {
        "ingredientId": "vodka",
        "amount": 30
      },
      {
        "ingredientId": "coffee-liqueur",
        "amount": 30
      },
      {
        "ingredientId": "milk",
        "amount": 40
      },
      {
        "ingredientId": "ice",
        "amount": 5
      }
    ],
    "method": []
  },
  {
    "id": "boulevardier",
    "name": "Boulevardier",
    "price": 14,
    "needsShake": false,
    "category": "classic",
    "origin": "",
    "story": "",
    "tastingNotes": [
      "bitter",
      "warming",
      "rich"
    ],
    "occasions": [],
    "ingredients": [
      {
        "ingredientId": "whiskey",
        "amount": 40
      },
      {
        "ingredientId": "bitter-aperitif",
        "amount": 30
      },
      {
        "ingredientId": "vermouth",
        "amount": 30
      },
      {
        "ingredientId": "ice",
        "amount": 3
      },
      {
        "ingredientId": "orange",
        "amount": 1
      }
    ],
    "method": []
  },
  {
    "id": "manhattan",
    "name": "Manhattan",
    "price": 14,
    "needsShake": false,
    "category": "classic",
    "origin": "",
    "story": "",
    "tastingNotes": [
      "spirit-forward",
      "silky",
      "aromatic"
    ],
    "occasions": [],
    "ingredients": [
      {
        "ingredientId": "whiskey",
        "amount": 60
      },
      {
        "ingredientId": "vermouth",
        "amount": 30
      },
      {
        "ingredientId": "ice",
        "amount": 4
      },
      {
        "ingredientId": "orange",
        "amount": 1
      }
    ],
    "method": []
  },
  {
    "id": "rob-roy",
    "name": "Rob Roy",
    "price": 13.5,
    "needsShake": false,
    "category": "classic",
    "origin": "",
    "story": "",
    "tastingNotes": [
      "malty",
      "aromatic",
      "strong"
    ],
    "occasions": [],
    "ingredients": [
      {
        "ingredientId": "whiskey",
        "amount": 60
      },
      {
        "ingredientId": "vermouth",
        "amount": 25
      },
      {
        "ingredientId": "ice",
        "amount": 4
      }
    ],
    "method": []
  },
  {
    "id": "mint-julep",
    "name": "Mint Julep",
    "price": 12.5,
    "needsShake": false,
    "category": "classic",
    "origin": "",
    "story": "",
    "tastingNotes": [
      "mint",
      "whiskey",
      "cool"
    ],
    "occasions": [],
    "ingredients": [
      {
        "ingredientId": "whiskey",
        "amount": 60
      },
      {
        "ingredientId": "mint",
        "amount": 6
      },
      {
        "ingredientId": "sugar-syrup",
        "amount": 15
      },
      {
        "ingredientId": "ice",
        "amount": 6
      }
    ],
    "method": []
  },
  {
    "id": "whiskey-highball",
    "name": "Whiskey Highball",
    "price": 10.5,
    "needsShake": false,
    "category": "classic",
    "origin": "",
    "story": "",
    "tastingNotes": [
      "clean",
      "sparkling",
      "whiskey"
    ],
    "occasions": [],
    "ingredients": [
      {
        "ingredientId": "whiskey",
        "amount": 45
      },
      {
        "ingredientId": "soda",
        "amount": 105
      },
      {
        "ingredientId": "ice",
        "amount": 5
      }
    ],
    "method": []
  },
  {
    "id": "whiskey-ginger",
    "name": "Whiskey Ginger",
    "price": 10.5,
    "needsShake": false,
    "category": "cocktail",
    "origin": "",
    "story": "",
    "tastingNotes": [
      "ginger",
      "warming",
      "zesty"
    ],
    "occasions": [],
    "ingredients": [
      {
        "ingredientId": "whiskey",
        "amount": 45
      },
      {
        "ingredientId": "ginger-beer",
        "amount": 90
      },
      {
        "ingredientId": "lime-juice",
        "amount": 10
      },
      {
        "ingredientId": "ice",
        "amount": 5
      }
    ],
    "method": []
  },
  {
    "id": "lynchburg-lemonade",
    "name": "Lynchburg Lemonade",
    "price": 12,
    "needsShake": true,
    "category": "cocktail",
    "origin": "",
    "story": "",
    "tastingNotes": [
      "lemon",
      "whiskey",
      "sparkling"
    ],
    "occasions": [],
    "ingredients": [
      {
        "ingredientId": "whiskey",
        "amount": 40
      },
      {
        "ingredientId": "orange-liqueur",
        "amount": 20
      },
      {
        "ingredientId": "lemon-juice",
        "amount": 25
      },
      {
        "ingredientId": "sugar-syrup",
        "amount": 10
      },
      {
        "ingredientId": "soda",
        "amount": 60
      },
      {
        "ingredientId": "ice",
        "amount": 5
      }
    ],
    "method": []
  },
  {
    "id": "gold-rush",
    "name": "Gold Rush",
    "price": 12.5,
    "needsShake": true,
    "category": "cocktail",
    "origin": "",
    "story": "",
    "tastingNotes": [
      "lemon",
      "warming",
      "soft"
    ],
    "occasions": [],
    "ingredients": [
      {
        "ingredientId": "whiskey",
        "amount": 50
      },
      {
        "ingredientId": "lemon-juice",
        "amount": 25
      },
      {
        "ingredientId": "sugar-syrup",
        "amount": 20
      },
      {
        "ingredientId": "ice",
        "amount": 4
      }
    ],
    "method": []
  },
  {
    "id": "sazerac",
    "name": "Sazerac",
    "price": 14.5,
    "needsShake": false,
    "category": "classic",
    "origin": "",
    "story": "",
    "tastingNotes": [
      "strong",
      "aromatic",
      "dry"
    ],
    "occasions": [],
    "ingredients": [
      {
        "ingredientId": "whiskey",
        "amount": 60
      },
      {
        "ingredientId": "bitter-aperitif",
        "amount": 5
      },
      {
        "ingredientId": "sugar-syrup",
        "amount": 10
      },
      {
        "ingredientId": "ice",
        "amount": 3
      }
    ],
    "method": []
  },
  {
    "id": "paper-plane",
    "name": "Paper Plane",
    "price": 13.5,
    "needsShake": true,
    "category": "cocktail",
    "origin": "",
    "story": "",
    "tastingNotes": [
      "bittersweet",
      "lemon",
      "balanced"
    ],
    "occasions": [],
    "ingredients": [
      {
        "ingredientId": "whiskey",
        "amount": 30
      },
      {
        "ingredientId": "bitter-aperitif",
        "amount": 30
      },
      {
        "ingredientId": "vermouth",
        "amount": 20
      },
      {
        "ingredientId": "lemon-juice",
        "amount": 25
      },
      {
        "ingredientId": "ice",
        "amount": 4
      }
    ],
    "method": []
  },
  {
    "id": "rum-runner",
    "name": "Rum Runner",
    "price": 13,
    "needsShake": true,
    "category": "cocktail",
    "origin": "",
    "story": "",
    "tastingNotes": [
      "tropical",
      "rum",
      "fruit"
    ],
    "occasions": [],
    "ingredients": [
      {
        "ingredientId": "white-rum",
        "amount": 30
      },
      {
        "ingredientId": "dark-rum",
        "amount": 30
      },
      {
        "ingredientId": "pineapple-juice",
        "amount": 60
      },
      {
        "ingredientId": "lime-juice",
        "amount": 20
      },
      {
        "ingredientId": "sugar-syrup",
        "amount": 10
      },
      {
        "ingredientId": "ice",
        "amount": 5
      }
    ],
    "method": []
  },
  {
    "id": "hurricane",
    "name": "Hurricane",
    "price": 13.5,
    "needsShake": true,
    "category": "cocktail",
    "origin": "",
    "story": "",
    "tastingNotes": [
      "rum",
      "tropical",
      "bold"
    ],
    "occasions": [],
    "ingredients": [
      {
        "ingredientId": "white-rum",
        "amount": 30
      },
      {
        "ingredientId": "dark-rum",
        "amount": 30
      },
      {
        "ingredientId": "pineapple-juice",
        "amount": 60
      },
      {
        "ingredientId": "lime-juice",
        "amount": 20
      },
      {
        "ingredientId": "cranberry-juice",
        "amount": 20
      },
      {
        "ingredientId": "sugar-syrup",
        "amount": 10
      },
      {
        "ingredientId": "ice",
        "amount": 5
      }
    ],
    "method": []
  },
  {
    "id": "planters-punch",
    "name": "Planter’s Punch",
    "price": 12,
    "needsShake": true,
    "category": "classic",
    "origin": "",
    "story": "",
    "tastingNotes": [
      "dark rum",
      "lime",
      "spice"
    ],
    "occasions": [],
    "ingredients": [
      {
        "ingredientId": "dark-rum",
        "amount": 60
      },
      {
        "ingredientId": "lime-juice",
        "amount": 25
      },
      {
        "ingredientId": "sugar-syrup",
        "amount": 20
      },
      {
        "ingredientId": "soda",
        "amount": 45
      },
      {
        "ingredientId": "ice",
        "amount": 5
      }
    ],
    "method": []
  },
  {
    "id": "zombie",
    "name": "Zombie",
    "price": 16,
    "needsShake": true,
    "category": "cocktail",
    "origin": "",
    "story": "",
    "tastingNotes": [
      "strong",
      "tropical",
      "complex"
    ],
    "occasions": [],
    "ingredients": [
      {
        "ingredientId": "white-rum",
        "amount": 30
      },
      {
        "ingredientId": "dark-rum",
        "amount": 45
      },
      {
        "ingredientId": "orange-liqueur",
        "amount": 15
      },
      {
        "ingredientId": "lime-juice",
        "amount": 20
      },
      {
        "ingredientId": "pineapple-juice",
        "amount": 60
      },
      {
        "ingredientId": "sugar-syrup",
        "amount": 10
      },
      {
        "ingredientId": "ice",
        "amount": 5
      }
    ],
    "method": []
  },
  {
    "id": "painkiller",
    "name": "Painkiller",
    "price": 13.5,
    "needsShake": true,
    "category": "cocktail",
    "origin": "",
    "story": "",
    "tastingNotes": [
      "creamy",
      "pineapple",
      "dark rum"
    ],
    "occasions": [],
    "ingredients": [
      {
        "ingredientId": "dark-rum",
        "amount": 60
      },
      {
        "ingredientId": "pineapple-juice",
        "amount": 90
      },
      {
        "ingredientId": "coconut-cream",
        "amount": 30
      },
      {
        "ingredientId": "ice",
        "amount": 5
      }
    ],
    "method": []
  },
  {
    "id": "jungle-bird",
    "name": "Jungle Bird",
    "price": 13.5,
    "needsShake": true,
    "category": "cocktail",
    "origin": "",
    "story": "",
    "tastingNotes": [
      "bitter",
      "pineapple",
      "rum"
    ],
    "occasions": [],
    "ingredients": [
      {
        "ingredientId": "dark-rum",
        "amount": 45
      },
      {
        "ingredientId": "bitter-aperitif",
        "amount": 20
      },
      {
        "ingredientId": "pineapple-juice",
        "amount": 45
      },
      {
        "ingredientId": "lime-juice",
        "amount": 15
      },
      {
        "ingredientId": "sugar-syrup",
        "amount": 10
      },
      {
        "ingredientId": "ice",
        "amount": 5
      }
    ],
    "method": []
  },
  {
    "id": "old-cuban",
    "name": "Old Cuban",
    "price": 14.5,
    "needsShake": true,
    "category": "cocktail",
    "origin": "",
    "story": "",
    "tastingNotes": [
      "mint",
      "sparkling",
      "rum"
    ],
    "occasions": [],
    "ingredients": [
      {
        "ingredientId": "dark-rum",
        "amount": 45
      },
      {
        "ingredientId": "lime-juice",
        "amount": 20
      },
      {
        "ingredientId": "sugar-syrup",
        "amount": 15
      },
      {
        "ingredientId": "mint",
        "amount": 5
      },
      {
        "ingredientId": "sparkling-wine",
        "amount": 60
      },
      {
        "ingredientId": "ice",
        "amount": 4
      }
    ],
    "method": []
  },
  {
    "id": "el-presidente",
    "name": "El Presidente",
    "price": 13.5,
    "needsShake": false,
    "category": "classic",
    "origin": "",
    "story": "",
    "tastingNotes": [
      "orange",
      "silky",
      "rum"
    ],
    "occasions": [],
    "ingredients": [
      {
        "ingredientId": "white-rum",
        "amount": 45
      },
      {
        "ingredientId": "vermouth",
        "amount": 25
      },
      {
        "ingredientId": "orange-liqueur",
        "amount": 15
      },
      {
        "ingredientId": "ice",
        "amount": 4
      }
    ],
    "method": []
  },
  {
    "id": "hotel-nacional",
    "name": "Hotel Nacional",
    "price": 13,
    "needsShake": true,
    "category": "classic",
    "origin": "",
    "story": "",
    "tastingNotes": [
      "pineapple",
      "lime",
      "elegant"
    ],
    "occasions": [],
    "ingredients": [
      {
        "ingredientId": "white-rum",
        "amount": 45
      },
      {
        "ingredientId": "pineapple-juice",
        "amount": 30
      },
      {
        "ingredientId": "lime-juice",
        "amount": 20
      },
      {
        "ingredientId": "orange-liqueur",
        "amount": 15
      },
      {
        "ingredientId": "sugar-syrup",
        "amount": 5
      },
      {
        "ingredientId": "ice",
        "amount": 4
      }
    ],
    "method": []
  },
  {
    "id": "aperol-spritz",
    "name": "Aperitivo Spritz",
    "price": 11.5,
    "needsShake": false,
    "category": "classic",
    "origin": "",
    "story": "",
    "tastingNotes": [
      "bittersweet",
      "sparkling",
      "orange"
    ],
    "occasions": [],
    "ingredients": [
      {
        "ingredientId": "bitter-aperitif",
        "amount": 45
      },
      {
        "ingredientId": "sparkling-wine",
        "amount": 75
      },
      {
        "ingredientId": "soda",
        "amount": 30
      },
      {
        "ingredientId": "ice",
        "amount": 5
      },
      {
        "ingredientId": "orange",
        "amount": 1
      }
    ],
    "method": []
  },
  {
    "id": "americano",
    "name": "Americano",
    "price": 10.5,
    "needsShake": false,
    "category": "classic",
    "origin": "",
    "story": "",
    "tastingNotes": [
      "bitter",
      "herbal",
      "sparkling"
    ],
    "occasions": [],
    "ingredients": [
      {
        "ingredientId": "bitter-aperitif",
        "amount": 30
      },
      {
        "ingredientId": "vermouth",
        "amount": 30
      },
      {
        "ingredientId": "soda",
        "amount": 75
      },
      {
        "ingredientId": "ice",
        "amount": 5
      },
      {
        "ingredientId": "orange",
        "amount": 1
      }
    ],
    "method": []
  },
  {
    "id": "negroni-sbagliato",
    "name": "Negroni Sbagliato",
    "price": 13,
    "needsShake": false,
    "category": "cocktail",
    "origin": "",
    "story": "",
    "tastingNotes": [
      "bitter",
      "sparkling",
      "herbal"
    ],
    "occasions": [],
    "ingredients": [
      {
        "ingredientId": "bitter-aperitif",
        "amount": 30
      },
      {
        "ingredientId": "vermouth",
        "amount": 30
      },
      {
        "ingredientId": "sparkling-wine",
        "amount": 60
      },
      {
        "ingredientId": "ice",
        "amount": 4
      },
      {
        "ingredientId": "orange",
        "amount": 1
      }
    ],
    "method": []
  },
  {
    "id": "hugo-spritz",
    "name": "Hugo Spritz",
    "price": 11.5,
    "needsShake": false,
    "category": "cocktail",
    "origin": "",
    "story": "",
    "tastingNotes": [
      "mint",
      "lime",
      "sparkling"
    ],
    "occasions": [],
    "ingredients": [
      {
        "ingredientId": "sparkling-wine",
        "amount": 90
      },
      {
        "ingredientId": "soda",
        "amount": 45
      },
      {
        "ingredientId": "lime-juice",
        "amount": 15
      },
      {
        "ingredientId": "sugar-syrup",
        "amount": 10
      },
      {
        "ingredientId": "mint",
        "amount": 5
      },
      {
        "ingredientId": "ice",
        "amount": 5
      }
    ],
    "method": []
  },
  {
    "id": "blue-lagoon",
    "name": "Blue Lagoon",
    "price": 11,
    "needsShake": false,
    "category": "cocktail",
    "origin": "",
    "story": "",
    "tastingNotes": [
      "citrus",
      "sweet",
      "bright",
      "sparkling"
    ],
    "occasions": [],
    "ingredients": [
      {
        "ingredientId": "vodka",
        "amount": 30
      },
      {
        "ingredientId": "blue-curacao",
        "amount": 20
      },
      {
        "ingredientId": "lemon-juice",
        "amount": 15
      },
      {
        "ingredientId": "sugar-syrup",
        "amount": 10
      },
      {
        "ingredientId": "soda",
        "amount": 60
      },
      {
        "ingredientId": "ice",
        "amount": 5
      }
    ],
    "method": []
  },
  {
    "id": "champagne-cocktail",
    "name": "Champagne Cocktail",
    "price": 12.5,
    "needsShake": false,
    "category": "classic",
    "origin": "",
    "story": "",
    "tastingNotes": [
      "dry",
      "bubbly",
      "elegant",
      "light"
    ],
    "occasions": [],
    "ingredients": [
      {
        "ingredientId": "sparkling-wine",
        "amount": 120
      },
      {
        "ingredientId": "sugar-syrup",
        "amount": 10
      },
      {
        "ingredientId": "bitter-aperitif",
        "amount": 5
      },
      {
        "ingredientId": "orange",
        "amount": 1
      }
    ],
    "method": []
  },
  {
    "id": "tommys-margarita",
    "name": "Tommy’s Margarita",
    "price": 12,
    "needsShake": true,
    "category": "cocktail",
    "origin": "",
    "story": "",
    "tastingNotes": [
      "tart",
      "clean",
      "agave",
      "fresh"
    ],
    "occasions": [],
    "ingredients": [
      {
        "ingredientId": "tequila",
        "amount": 60
      },
      {
        "ingredientId": "lime-juice",
        "amount": 30
      },
      {
        "ingredientId": "sugar-syrup",
        "amount": 15
      },
      {
        "ingredientId": "ice",
        "amount": 4
      }
    ],
    "method": []
  },
  {
    "id": "batanga",
    "name": "Batanga",
    "price": 10.5,
    "needsShake": false,
    "category": "cocktail",
    "origin": "",
    "story": "",
    "tastingNotes": [
      "cola",
      "salty",
      "lime",
      "easy"
    ],
    "occasions": [],
    "ingredients": [
      {
        "ingredientId": "tequila",
        "amount": 60
      },
      {
        "ingredientId": "lime-juice",
        "amount": 15
      },
      {
        "ingredientId": "cola",
        "amount": 120
      },
      {
        "ingredientId": "salt",
        "amount": 1
      },
      {
        "ingredientId": "ice",
        "amount": 5
      }
    ],
    "method": []
  },
  {
    "id": "rusty-nail",
    "name": "Rusty Nail",
    "price": 12.5,
    "needsShake": false,
    "category": "classic",
    "origin": "",
    "story": "",
    "tastingNotes": [
      "honey",
      "smooth",
      "warm",
      "herbal"
    ],
    "occasions": [],
    "ingredients": [
      {
        "ingredientId": "whiskey",
        "amount": 45
      },
      {
        "ingredientId": "herbal-liqueur",
        "amount": 25
      },
      {
        "ingredientId": "ice",
        "amount": 3
      }
    ],
    "method": []
  },
  {
    "id": "whiskey-smash",
    "name": "Whiskey Smash",
    "price": 12,
    "needsShake": true,
    "category": "classic",
    "origin": "",
    "story": "",
    "tastingNotes": [
      "mint",
      "lemon",
      "whiskey",
      "fresh"
    ],
    "occasions": [],
    "ingredients": [
      {
        "ingredientId": "whiskey",
        "amount": 60
      },
      {
        "ingredientId": "lemon-juice",
        "amount": 25
      },
      {
        "ingredientId": "sugar-syrup",
        "amount": 15
      },
      {
        "ingredientId": "mint",
        "amount": 6
      },
      {
        "ingredientId": "ice",
        "amount": 5
      }
    ],
    "method": []
  },
  {
    "id": "mamie-taylor",
    "name": "Mamie Taylor",
    "price": 11.5,
    "needsShake": false,
    "category": "classic",
    "origin": "",
    "story": "",
    "tastingNotes": [
      "ginger",
      "lime",
      "spicy",
      "refreshing"
    ],
    "occasions": [],
    "ingredients": [
      {
        "ingredientId": "whiskey",
        "amount": 60
      },
      {
        "ingredientId": "lime-juice",
        "amount": 15
      },
      {
        "ingredientId": "ginger-beer",
        "amount": 90
      },
      {
        "ingredientId": "ice",
        "amount": 5
      },
      {
        "ingredientId": "lime-wedge",
        "amount": 1
      }
    ],
    "method": []
  },
  {
    "id": "bronx",
    "name": "Bronx",
    "price": 12,
    "needsShake": true,
    "category": "classic",
    "origin": "",
    "story": "",
    "tastingNotes": [
      "orange",
      "botanical",
      "smooth",
      "fruity"
    ],
    "occasions": [],
    "ingredients": [
      {
        "ingredientId": "gin",
        "amount": 45
      },
      {
        "ingredientId": "vermouth",
        "amount": 30
      },
      {
        "ingredientId": "orange",
        "amount": 1
      },
      {
        "ingredientId": "ice",
        "amount": 4
      }
    ],
    "method": []
  },
  {
    "id": "martinez",
    "name": "Martinez",
    "price": 13.5,
    "needsShake": false,
    "category": "classic",
    "origin": "",
    "story": "",
    "tastingNotes": [
      "rich",
      "botanical",
      "sweet",
      "smooth"
    ],
    "occasions": [],
    "ingredients": [
      {
        "ingredientId": "gin",
        "amount": 45
      },
      {
        "ingredientId": "vermouth",
        "amount": 45
      },
      {
        "ingredientId": "specialty-liqueur",
        "amount": 5
      },
      {
        "ingredientId": "ice",
        "amount": 3
      }
    ],
    "method": []
  },
  {
    "id": "bijou",
    "name": "Bijou",
    "price": 14,
    "needsShake": false,
    "category": "classic",
    "origin": "",
    "story": "",
    "tastingNotes": [
      "herbal",
      "strong",
      "spicy",
      "deep"
    ],
    "occasions": [],
    "ingredients": [
      {
        "ingredientId": "gin",
        "amount": 30
      },
      {
        "ingredientId": "herbal-liqueur",
        "amount": 30
      },
      {
        "ingredientId": "vermouth",
        "amount": 30
      },
      {
        "ingredientId": "ice",
        "amount": 3
      }
    ],
    "method": []
  },
  {
    "id": "last-word",
    "name": "Last Word",
    "price": 14,
    "needsShake": true,
    "category": "classic",
    "origin": "",
    "story": "",
    "tastingNotes": [
      "herbal",
      "tart",
      "nutty",
      "complex"
    ],
    "occasions": [],
    "ingredients": [
      {
        "ingredientId": "gin",
        "amount": 25
      },
      {
        "ingredientId": "herbal-liqueur",
        "amount": 25
      },
      {
        "ingredientId": "specialty-liqueur",
        "amount": 25
      },
      {
        "ingredientId": "lime-juice",
        "amount": 25
      },
      {
        "ingredientId": "ice",
        "amount": 4
      }
    ],
    "method": []
  },
  {
    "id": "blue-hawaii",
    "name": "Blue Hawaii",
    "price": 13,
    "needsShake": true,
    "category": "cocktail",
    "origin": "",
    "story": "",
    "tastingNotes": [
      "tropical",
      "creamy",
      "fruity",
      "sweet"
    ],
    "occasions": [],
    "ingredients": [
      {
        "ingredientId": "white-rum",
        "amount": 30
      },
      {
        "ingredientId": "vodka",
        "amount": 15
      },
      {
        "ingredientId": "blue-curacao",
        "amount": 15
      },
      {
        "ingredientId": "pineapple-juice",
        "amount": 90
      },
      {
        "ingredientId": "coconut-cream",
        "amount": 15
      },
      {
        "ingredientId": "ice",
        "amount": 4
      },
      {
        "ingredientId": "pineapple-wedge",
        "amount": 1
      }
    ],
    "method": []
  },
  {
    "id": "ti-punch",
    "name": "Ti’ Punch",
    "price": 10.5,
    "needsShake": false,
    "category": "classic",
    "origin": "",
    "story": "",
    "tastingNotes": [
      "strong",
      "lime",
      "rum",
      "simple"
    ],
    "occasions": [],
    "ingredients": [
      {
        "ingredientId": "white-rum",
        "amount": 60
      },
      {
        "ingredientId": "sugar-syrup",
        "amount": 10
      },
      {
        "ingredientId": "lime-wedge",
        "amount": 1
      },
      {
        "ingredientId": "ice",
        "amount": 2
      }
    ],
    "method": []
  },
  {
    "id": "greyhound",
    "name": "Greyhound",
    "price": 9.5,
    "needsShake": false,
    "category": "classic",
    "origin": "",
    "story": "",
    "tastingNotes": [
      "grapefruit",
      "bitter",
      "fresh",
      "light"
    ],
    "occasions": [],
    "ingredients": [
      {
        "ingredientId": "vodka",
        "amount": 45
      },
      {
        "ingredientId": "grapefruit-soda",
        "amount": 120
      },
      {
        "ingredientId": "ice",
        "amount": 5
      }
    ],
    "method": []
  },
  {
    "id": "queens-park-swizzle",
    "name": "Queen’s Park Swizzle",
    "price": 12.5,
    "needsShake": false,
    "category": "classic",
    "origin": "",
    "story": "",
    "tastingNotes": [
      "mint",
      "spiced",
      "tangy",
      "cold"
    ],
    "occasions": [],
    "ingredients": [
      {
        "ingredientId": "dark-rum",
        "amount": 60
      },
      {
        "ingredientId": "lime-juice",
        "amount": 25
      },
      {
        "ingredientId": "sugar-syrup",
        "amount": 15
      },
      {
        "ingredientId": "mint",
        "amount": 8
      },
      {
        "ingredientId": "bitter-aperitif",
        "amount": 5
      },
      {
        "ingredientId": "soda",
        "amount": 30
      },
      {
        "ingredientId": "ice",
        "amount": 6
      }
    ],
    "method": []
  },
  {
    "id": "singapore-sling",
    "name": "Singapore Sling",
    "price": 14,
    "needsShake": true,
    "category": "classic",
    "origin": "",
    "story": "",
    "tastingNotes": [
      "fruity",
      "herbal",
      "pink",
      "tropical"
    ],
    "occasions": [],
    "ingredients": [
      {
        "ingredientId": "gin",
        "amount": 30
      },
      {
        "ingredientId": "specialty-liqueur",
        "amount": 15
      },
      {
        "ingredientId": "herbal-liqueur",
        "amount": 8
      },
      {
        "ingredientId": "orange-liqueur",
        "amount": 8
      },
      {
        "ingredientId": "pineapple-juice",
        "amount": 90
      },
      {
        "ingredientId": "lime-juice",
        "amount": 15
      },
      {
        "ingredientId": "ice",
        "amount": 5
      }
    ],
    "method": []
  }
];

// Server and command-line simulations retain complete synchronous catalogue data.
if (typeof (globalThis as { process?: { versions?: { node?: string } } }).process?.versions?.node === 'string') {
  const { RECIPE_DETAILS } = await import('./recipeDetails');
  for (const recipe of RECIPES) Object.assign(recipe, RECIPE_DETAILS[recipe.id as keyof typeof RECIPE_DETAILS]);
}


const INGREDIENT_ABV: Record<string, number> = {
  'white-rum': 40, 'dark-rum': 40, gin: 40, vodka: 40, tequila: 40, whiskey: 40,
  'orange-liqueur': 25, vermouth: 16, 'bitter-aperitif': 25, 'sparkling-wine': 12, 'coffee-liqueur': 20,
  'blue-curacao': 21, 'herbal-liqueur': 38, 'specialty-liqueur': 22, 'fruit-wine': 10
};

/** Approximate serving strength after normal shaking/stirring dilution. */
export function estimateRecipeAbv(recipe: Recipe) {
  const liquid = recipe.ingredients.reduce((sum, part) => sum + (INGREDIENTS.find((item) => item.id === part.ingredientId)?.unit === 'ml' ? part.amount : 0), 0);
  if (!liquid) return 0;
  const alcohol = recipe.ingredients.reduce((sum, part) => sum + part.amount * (INGREDIENT_ABV[part.ingredientId] ?? 0), 0);
  const dilution = recipe.needsShake ? .82 : .9;
  return Math.round((alcohol / liquid) * dilution);
}

export function recipeAlcoholLabel(recipe: Recipe) {
  const abv = estimateRecipeAbv(recipe);
  const strength = abv === 0 ? 'Alcohol-free' : abv <= 12 ? 'Light' : abv <= 22 ? 'Medium' : 'Strong';
  return abv === 0 ? strength : `~${abv}% ABV · ${strength}`;
}

export const MODIFIERS: Modifier[] = [
  { id: 'extra-lime', label: 'Extra lime, please', add: { ingredientId: 'lime-juice', amount: 10 } },
  { id: 'no-ice', label: 'No ice, please', removeIngredientId: 'ice' }
];

export const SUPPLIERS: Supplier[] = [
  { id: 'global', name: 'Global Drinks Co.', description: 'Reliable spirits & mixers', deliveryDays: 3, reputation: 4, deliveryFee: 12, freeDeliveryAt: 160, icon: 'truck' },
  { id: 'local', name: 'Local Market', description: 'Budget produce & mixers', deliveryDays: 5, reputation: 3, deliveryFee: 6, freeDeliveryAt: 70, icon: 'basket' },
  { id: 'premium', name: 'Premium Spirits', description: 'Premium bottles, fast route', deliveryDays: 2, reputation: 5, deliveryFee: 18, freeDeliveryAt: 220, icon: 'bottle' },
  { id: 'fresh', name: 'Fresh & Green', description: 'Fresh fruit, herbs & mixers', deliveryDays: 2, reputation: 4, deliveryFee: 8, freeDeliveryAt: 90, icon: 'leaf' }
];

export const STARTING_INVENTORY = INGREDIENTS.map((item) => ({
  ingredientId: item.id,
  amount: item.unit === 'ml' ? 360 : item.id === 'ice' ? 45 : 18
}));

export const ingredientName = (id: string) => INGREDIENTS.find((item) => item.id === id)?.name ?? id;
