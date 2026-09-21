const p = (staple, role, amount, unit, carbs, protein, label) => ({
  staple,
  role,
  amount,
  unit,
  carbs,
  protein,
  label,
});

const v = (youtubeId, title, channel, query) => ({
  youtubeId,
  title,
  channel,
  origin: 'ZA',
  query,
});

export const RECIPES = {
  'pap-porridge': {
    time: '10 min',
    source: 'Traditional SA breakfast porridge · maize meal from Open Food Facts',
    video: v('KpRy9Odj1j0', 'South African Pap Recipe | How to Make Pap', 'Infoods Specials', 'how to cook South African pap porridge maize meal'),
    portions: [
      p('maize_meal', 'carbs', 1, 'cups', 55, 4, 'dry maize meal'),
      p('milk', 'protein', 1.5, 'cups', 9, 6, 'milk'),
    ],
    steps: [
      'Boil 2 small cups of water in a pot.',
      'Rain in the maize meal while stirring so it does not lump.',
      'Pour in the milk, keep stirring on low heat until it thickens.',
      'Eat warm. Add a pinch of salt or a teaspoon of sugar if you have it.',
    ],
  },
  'oats-banana': {
    time: '8 min',
    source: 'Student oats bowl · Jungle-style oats from Open Food Facts',
    video: v('r7kb0-ZgnPI', 'Peanut Butter Banana Oatmeal', 'Cooking With Ms. Kristi', 'banana oatmeal breakfast'),
    portions: [
      p('oats', 'carbs', 1, 'cups', 40, 8, 'dry rolled oats'),
      p('milk', 'protein', 1.5, 'cups', 9, 6, 'milk'),
      p('bananas', 'carbs', 1, 'piece', 27, 1, 'banana, sliced'),
    ],
    steps: [
      'Put oats and milk in a mug or small pot.',
      'Microwave 90 seconds or simmer 4 minutes, stirring once.',
      'Slice the banana on top. Eat before class.',
    ],
  },
  'pb-bread': {
    time: '3 min',
    source: 'No-cook campus breakfast · Albany bread + peanut butter from Open Food Facts',
    video: v('Hle9uZEW2fs', 'Peanut Butter Toast | Hearty and Healthy Breakfast toast', 'Flavours Of Food', 'peanut butter on toast'),
    portions: [
      p('bread', 'carbs', 2, 'slices', 30, 6, 'brown bread'),
      p('peanut_butter', 'fat', 2, 'tbsp', 8, 8, 'peanut butter'),
    ],
    steps: [
      'Toast the bread if you can, or eat it as is.',
      'Spread peanut butter edge to edge.',
      'Optional: add banana slices if they are in this week’s basket.',
    ],
  },
  'eggs-toast': {
    time: '8 min',
    source: 'High-protein breakfast · eggs + brown bread from Open Food Facts',
    video: v('aUwldQM9__w', 'The Perfect Fried Egg on Toast', 'Dont Go Bacon My Heart', 'fried eggs on toast'),
    portions: [
      p('eggs', 'protein', 2, 'eggs', 1, 12, 'eggs'),
      p('bread', 'carbs', 2, 'slices', 30, 6, 'brown bread'),
    ],
    steps: [
      'Boil or fry the eggs in a little oil.',
      'Toast the bread.',
      'Salt lightly. Eat the yolks if you are bulking.',
    ],
  },
  'beans-toast': {
    time: '8 min',
    source: 'Campus lunch · Koo beans and Albany bread from Open Food Facts',
    video: v('t9IVuqj7oNE', 'How to make the perfect Heinz beans on toast', 'Cost of living crisis tips', 'baked beans on toast'),
    portions: [
      p('beans', 'protein', 1, 'cups', 22, 10, 'baked beans'),
      p('bread', 'carbs', 2, 'slices', 30, 6, 'brown bread'),
      p('tomato_sauce', 'carbs', 1, 'tbsp', 4, 0, 'tomato sauce'),
    ],
    steps: [
      'Warm the beans in a pan or microwave.',
      'Stir in a spoon of tomato sauce.',
      'Toast the bread and spoon the beans over.',
    ],
  },
  'pilchard-bread': {
    time: '5 min',
    source: 'Tinned-fish lunch · Lucky Star from Open Food Facts',
    video: v('bVzJAkS7YYk', 'Pilchard and Mayo Toasties', 'EatMee Recipes', 'Lucky Star pilchard toasties'),
    portions: [
      p('pilchards', 'protein', 0.75, 'cups', 2, 22, 'pilchards in tomato'),
      p('bread', 'carbs', 2, 'slices', 30, 6, 'brown bread'),
    ],
    steps: [
      'Open the tin and mash the pilchards with a fork, bones and all.',
      'Spread onto bread or eat with pap leftover from breakfast.',
      'Do not drain all the sauce — that is flavour and extra carbs.',
    ],
  },
  'bunny-chow': {
    time: '20 min',
    source: 'Durban-style student bunny · hollowed bread with beans',
    video: v('82GqOaSC6wk', 'Durban Style Bunny Chow - South African Vegan Curry in a Loaf', 'Steven Heap Recipes', 'bean bunny chow Durban South Africa'),
    portions: [
      p('bread', 'carbs', 0.25, 'piece', 50, 10, 'quarter loaf, hollowed'),
      p('beans', 'protein', 1.5, 'cups', 33, 15, 'beans in gravy'),
      p('tomato_sauce', 'carbs', 2, 'tbsp', 8, 0, 'tomato sauce'),
    ],
    steps: [
      'Warm beans with tomato sauce and a splash of water until saucy.',
      'Cut a quarter loaf, pull out the soft inside, keep the lid.',
      'Fill the hole with beans. Use the pulled bread to scoop.',
    ],
  },
  'chicken-sandwich': {
    time: '10 min',
    source: 'Sunday batch chicken on brown bread',
    video: v('FWgiA8i8GcE', 'Chicken Mayo Sandwich | South Africa', 'Busisiwe Maseko', 'chicken mayonnaise sandwich South Africa'),
    portions: [
      p('chicken', 'protein', 1, 'cups', 0, 28, 'shredded cooked chicken'),
      p('bread', 'carbs', 2, 'slices', 30, 6, 'brown bread'),
    ],
    steps: [
      'Use leftover stew chicken or boil a piece and shred it.',
      'Mix with a teaspoon of mayo or tomato sauce.',
      'Pack between two slices. Wrap for campus.',
    ],
  },
  'pap-chakalaka': {
    time: '20 min',
    source: 'Traditional stiff pap with bean chakalaka · Ace/Iwisa maize meal from Open Food Facts',
    video: v('iqLcZ0Qgkmc', 'South African Chakalaka Recipe | Baked Beans Recipe', 'Infoods Specials', 'South African chakalaka with baked beans'),
    portions: [
      p('maize_meal', 'carbs', 1.5, 'cups', 80, 6, 'dry maize meal for stiff pap'),
      p('beans', 'protein', 1, 'cups', 22, 10, 'beans'),
      p('tomato_sauce', 'carbs', 2, 'tbsp', 8, 0, 'tomato sauce'),
    ],
    steps: [
      'Boil water with a pinch of salt. Rain in maize meal and stir hard until stiff.',
      'Cover 5 minutes on low heat so the pap steams.',
      'In another pan, heat beans with tomato sauce until thick like chakalaka.',
      'Spoon relish next to a wedge of pap.',
    ],
  },
  'pap-eggs': {
    time: '10 min',
    source: 'Budget dinner · stiff pap and scrambled eggs',
    video: v('0B8Yy45DLi4', 'Fully-Loaded Pap Cups 3-Ways', 'Foodies of South Africa', 'pap cups with eggs South Africa'),
    portions: [
      p('maize_meal', 'carbs', 1.5, 'cups', 80, 6, 'dry maize meal'),
      p('eggs', 'protein', 2, 'eggs', 1, 12, 'eggs, scrambled'),
    ],
    steps: [
      'Cook stiff pap the same way as pap & chakalaka.',
      'Scramble the eggs in a little oil.',
      'Serve eggs on a slice of pap.',
    ],
  },
  'rice-beans': {
    time: '25 min',
    source: 'One-pot rice and beans · Tastic-style rice + Koo beans',
    video: v('-opNeAZIuMM', 'One Pot Rice and Beans Recipe | Easy Budget-Friendly Dinner', "Nancy's Kitchen corner", 'one pot rice and beans'),
    portions: [
      p('rice', 'carbs', 1.5, 'cups', 82, 8, 'uncooked white rice'),
      p('beans', 'protein', 1, 'cups', 22, 10, 'beans'),
      p('tomato_sauce', 'carbs', 2, 'tbsp', 8, 0, 'tomato sauce'),
    ],
    steps: [
      'Rinse the rice. Cook in 3 small cups of water until soft.',
      'Stir beans and tomato sauce through the hot rice.',
      'Rest 5 minutes with the lid on. This also reheats well for tomorrow.',
    ],
  },
  'cabbage-stew': {
    time: '25 min',
    source: 'One-pot veg stew · cabbage and potatoes',
    video: v('AJYf327wTuE', 'Old Fashioned Rustic Peasant Cabbage and Potato Soup', 'Backyard Chef', 'cabbage and potato stew'),
    portions: [
      p('potatoes', 'carbs', 1.5, 'cups', 40, 4, 'diced potato'),
      p('cabbage', 'veg', 2, 'cups', 10, 3, 'shredded cabbage'),
      p('tomato_sauce', 'carbs', 2, 'tbsp', 8, 0, 'tomato sauce'),
    ],
    steps: [
      'Fry potato cubes until they pick up colour.',
      'Add cabbage, tomato sauce and a small cup of water.',
      'Lid on, simmer until the potato is soft. Salt to taste.',
    ],
  },
  'chicken-rice': {
    time: '35 min',
    source: 'Sunday stew · IQF chicken with tomato rice',
    video: v('pe_KDAKKdNE', '5-Ingredient One-Pot Chicken Rice', 'Foodies of South Africa', 'one pot chicken rice South Africa'),
    portions: [
      p('rice', 'carbs', 1.5, 'cups', 82, 8, 'uncooked white rice'),
      p('chicken', 'protein', 1.5, 'cups', 0, 38, 'chicken pieces'),
      p('tomato_sauce', 'carbs', 2, 'tbsp', 8, 0, 'tomato sauce'),
    ],
    steps: [
      'Brown chicken pieces in a pot.',
      'Add tomato sauce and 2 small cups of water. Simmer 20 minutes.',
      'Cook rice in a second pot: 1 small cup rice to 2 small cups water.',
      'Serve stew over the rice. Batch extra chicken for sandwiches.',
    ],
  },
  'pap-wors': {
    time: '20 min',
    source: 'SA classic plate · stiff pap and boerewors',
    video: v('PP_u8V0OhnI', 'Delicious South African Pap and Wors Recipe', 'Iwan Ross', 'South African pap and wors'),
    portions: [
      p('maize_meal', 'carbs', 2, 'cups', 110, 8, 'dry maize meal'),
      p('wors', 'protein', 1, 'cups', 2, 22, 'boerewors, sliced after frying'),
    ],
    steps: [
      'Cook a big pot of stiff pap.',
      'Fry or grill the wors until browned. Slice.',
      'Plate pap first, wors on the side. Fat from the wors flavours the pap.',
    ],
  },
  'jam-bread': {
    time: '3 min',
    source: 'No-cook campus breakfast · brown bread and jam',
    video: v('29rA-StyPOU', 'Easy Jam Heart Toast Hack', 'The Fast Foodie', 'jam on toast'),
    portions: [
      p('bread', 'carbs', 2, 'slices', 30, 6, 'brown bread'),
      p('jam', 'carbs', 2, 'tbsp', 18, 0, 'jam'),
    ],
    steps: [
      'Toast the bread if you have a toaster.',
      'Spread jam edge to edge.',
      'Eat with tea or water before class.',
    ],
  },
  'banana-bread': {
    time: '4 min',
    source: 'No-cook fruit breakfast · Albany bread and banana',
    video: v('D3DtOOEp0r8', 'Healthy Banana sandwich | Peanut Butter banana sandwich', "Kabita's Kitchen", 'banana sandwich on bread'),
    portions: [
      p('bread', 'carbs', 2, 'slices', 30, 6, 'brown bread'),
      p('bananas', 'carbs', 1, 'piece', 27, 1, 'banana, sliced'),
    ],
    steps: [
      'Slice or mash the banana.',
      'Spread it onto the bread.',
      'Wrap the second slice on top if you are eating on the bus.',
    ],
  },
  'oats-milk': {
    time: '8 min',
    source: 'Student oats bowl · Jungle-style oats from Open Food Facts',
    video: v('JzsNQOwI-sA', 'How to Make Oatmeal with Old Fashioned Oats | Stovetop Recipe', 'MOMables - Laura Fuentes', 'how to make oatmeal on the stove'),
    portions: [
      p('oats', 'carbs', 1, 'cups', 40, 8, 'dry rolled oats'),
      p('milk', 'protein', 1.5, 'cups', 9, 6, 'milk'),
    ],
    steps: [
      'Put oats and milk in a mug or small pot.',
      'Microwave 90 seconds or simmer 4 minutes, stirring once.',
      'Add a pinch of salt or sugar if you have it.',
    ],
  },
  'pap-peanut': {
    time: '12 min',
    source: 'Maize porridge with peanut butter for extra energy',
    video: v('KpRy9Odj1j0', 'South African Pap Recipe | How to Make Pap', 'Infoods Specials', 'how to cook pap porridge maize meal'),
    portions: [
      p('maize_meal', 'carbs', 1, 'cups', 55, 4, 'dry maize meal'),
      p('milk', 'protein', 1, 'cups', 6, 4, 'milk'),
      p('peanut_butter', 'fat', 1, 'tbsp', 4, 4, 'peanut butter'),
    ],
    steps: [
      'Cook soft pap with water and milk.',
      'Stir a spoon of peanut butter through while it is hot.',
      'Eat warm. It is thicker and more filling than plain porridge.',
    ],
  },
  'pb-banana-toast': {
    time: '5 min',
    source: 'Campus toast · peanut butter and banana',
    video: v('UFiTy5QMRS0', 'This Banana PB Toast Is BREAKFAST MAGIC', 'Cookreview FL', 'peanut butter banana toast'),
    portions: [
      p('bread', 'carbs', 2, 'slices', 30, 6, 'brown bread'),
      p('peanut_butter', 'fat', 2, 'tbsp', 8, 8, 'peanut butter'),
      p('bananas', 'carbs', 1, 'piece', 27, 1, 'banana, sliced'),
    ],
    steps: [
      'Toast the bread.',
      'Spread peanut butter, then lay banana slices on top.',
      'Press the second slice on if you need a sandwich for campus.',
    ],
  },
  'yoghurt-banana': {
    time: '3 min',
    source: 'No-cook protein bowl · yoghurt and banana',
    video: v('QXa-f_0eZh8', 'How to Make a Crunchy Banana and Toasted Oat Yogurt Bowl', '5arbouch officiel', 'yoghurt banana bowl breakfast'),
    portions: [
      p('yoghurt', 'protein', 1, 'cups', 12, 10, 'plain yoghurt'),
      p('bananas', 'carbs', 1, 'piece', 27, 1, 'banana, sliced'),
    ],
    steps: [
      'Spoon yoghurt into a bowl or tub.',
      'Slice the banana on top.',
      'Eat cold. Add oats from the pantry if you need more carbs.',
    ],
  },
  'french-toast': {
    time: '12 min',
    source: 'Stale bread rescued in egg and milk',
    video: v('r1ZLSbQ0r0I', 'How to Make French Toast!! Classic Quick and Easy Recipe', 'Crouton Crackerjacks', 'how to make french toast'),
    portions: [
      p('bread', 'carbs', 2, 'slices', 30, 6, 'brown bread'),
      p('eggs', 'protein', 1, 'eggs', 0.5, 6, 'egg'),
      p('milk', 'protein', 0.25, 'cups', 2, 2, 'milk for the soak'),
    ],
    steps: [
      'Beat the egg with a splash of milk.',
      'Soak each slice for 10 seconds a side.',
      'Fry in a little oil until both sides are golden.',
    ],
  },
  'cheese-toast': {
    time: '8 min',
    source: 'Melted cheese on brown bread',
    video: v('WZOgBrgzQ2A', 'Ultimate Grilled Cheese Sandwich | Jamie Oliver', 'Jamie Oliver', 'cheese toastie grilled cheese sandwich'),
    portions: [
      p('bread', 'carbs', 2, 'slices', 30, 6, 'brown bread'),
      p('cheese', 'protein', 2, 'slices', 2, 10, 'cheese slices'),
    ],
    steps: [
      'Lay cheese between two slices.',
      'Toast in a dry pan and press with a lid or mug until it melts.',
      'Cut in half. Eat hot.',
    ],
  },
  'polony-sandwich': {
    time: '4 min',
    source: 'Residence lunch · polony on brown bread',
    video: v('izzNPk5iilU', 'CHEESE AND POLONY SANDWICHES', 'Nthabiseng Khoza', 'polony sandwich South Africa'),
    portions: [
      p('bread', 'carbs', 2, 'slices', 30, 6, 'brown bread'),
      p('polony', 'protein', 3, 'slices', 2, 8, 'polony'),
    ],
    steps: [
      'Lay polony on the bread.',
      'Add tomato sauce if you have it.',
      'Wrap for campus. Keep it out of the sun.',
    ],
  },
  'maggi-veg': {
    time: '5 min',
    source: '2-minute noodles stretched with carrot',
    video: v('yojGGcnqink', 'Instant Noodles Making - Maggi on the stove or microwave', 'Bong Cookhouse Recipes', 'Maggi 2 minute noodles recipe'),
    portions: [
      p('maggi', 'carbs', 1, 'pack', 50, 8, '2-minute noodles'),
      p('carrots', 'veg', 0.5, 'cups', 6, 1, 'grated carrot'),
    ],
    steps: [
      'Boil the noodles in a small pot as on the pack.',
      'Stir in grated carrot for the last minute.',
      'Use half the flavour sachet if it tastes too salty.',
    ],
  },
  'cabbage-beans-bowl': {
    time: '15 min',
    source: 'Leftover cabbage fried with beans',
    video: v('iqLcZ0Qgkmc', 'South African Chakalaka Recipe | Baked Beans Recipe', 'Infoods Specials', 'cabbage and baked beans recipe'),
    portions: [
      p('cabbage', 'veg', 2, 'cups', 10, 3, 'shredded cabbage'),
      p('beans', 'protein', 1, 'cups', 22, 10, 'baked beans'),
      p('tomato_sauce', 'carbs', 1, 'tbsp', 4, 0, 'tomato sauce'),
    ],
    steps: [
      'Fry cabbage in a little oil until it softens.',
      'Stir in beans and tomato sauce.',
      'Simmer 5 minutes. Eat from a bowl with bread if you still have room.',
    ],
  },
  'pasta-tomato': {
    time: '18 min',
    source: 'Student pasta · spaghetti and All Gold',
    video: v('OA6sUvTNkVI', 'One Pot Spaghetti', 'The Stay At Home Chef', 'spaghetti with tomato sauce'),
    portions: [
      p('pasta', 'carbs', 1.5, 'cups', 70, 8, 'dry spaghetti, broken'),
      p('tomato_sauce', 'carbs', 3, 'tbsp', 12, 0, 'tomato sauce'),
      p('onions', 'veg', 0.5, 'cups', 6, 1, 'onion, chopped'),
    ],
    steps: [
      'Boil pasta in salted water until soft.',
      'Fry onion, then stir in tomato sauce and a splash of pasta water.',
      'Toss the pasta through. This reheats for tomorrow’s lunch.',
    ],
  },
  'rice-pilchards': {
    time: '20 min',
    source: 'Warm rice with Lucky Star stirred through',
    video: v('4ZNm9ECddAs', 'Pilchards Fish Curry Recipe | Lucky Star Tinned Fish Recipe', 'COOKING QUEEN', 'Lucky Star pilchards with rice'),
    portions: [
      p('rice', 'carbs', 1, 'cups', 55, 5, 'uncooked white rice'),
      p('pilchards', 'protein', 0.75, 'cups', 2, 22, 'pilchards in tomato'),
    ],
    steps: [
      'Cook the rice until fluffy.',
      'Warm the pilchards in their sauce.',
      'Spoon fish over rice. Do not drain the tin.',
    ],
  },
  'egg-mayo-sandwich': {
    time: '12 min',
    source: 'Boiled eggs mashed with mayo on brown bread',
    video: v('4VeCpol3eoM', 'Creamy Egg Salad Sandwich with Salad Cress', 'Vikalinka by Julia Frey', 'egg mayonnaise sandwich'),
    portions: [
      p('eggs', 'protein', 2, 'eggs', 1, 12, 'eggs, boiled'),
      p('bread', 'carbs', 2, 'slices', 30, 6, 'brown bread'),
      p('mayo', 'fat', 1, 'tbsp', 0, 0, 'mayonnaise'),
    ],
    steps: [
      'Boil eggs for 9 minutes, then cool under tap water.',
      'Peel and mash with a spoon of mayo.',
      'Spread onto bread. Pack two for a long campus day.',
    ],
  },
  'cheese-tomato-sandwich': {
    time: '6 min',
    source: 'Cheese and fresh tomato on brown bread',
    video: v('tKx-3eZRpiU', 'How to Make Cheese and Tomato Sandwich in a Pan', 'Kitchen Draft', 'cheese and tomato sandwich'),
    portions: [
      p('bread', 'carbs', 2, 'slices', 30, 6, 'brown bread'),
      p('cheese', 'protein', 2, 'slices', 2, 10, 'cheese slices'),
      p('tomatoes', 'veg', 0.5, 'cups', 4, 1, 'tomato, sliced'),
    ],
    steps: [
      'Layer cheese and tomato on the bread.',
      'Salt the tomato lightly.',
      'Eat fresh — tomato makes the bread soggy if it sits too long.',
    ],
  },
  'tuna-sandwich': {
    time: '6 min',
    source: 'Tinned tuna mixed with mayo on brown bread',
    video: v('plIXQLCM2Gw', 'MY ULTIMATE TUNA MAYO SANDWICH RECIPE', 'EATOUTGUIDELONDON', 'tuna mayonnaise sandwich'),
    portions: [
      p('tuna', 'protein', 1, 'tin', 0, 24, 'tinned tuna, drained'),
      p('bread', 'carbs', 2, 'slices', 30, 6, 'brown bread'),
      p('mayo', 'fat', 1, 'tbsp', 0, 0, 'mayonnaise'),
    ],
    steps: [
      'Drain the tuna and mash with mayo.',
      'Spread onto bread.',
      'Wrap for campus. Higher protein than polony.',
    ],
  },
  'pap-spinach': {
    time: '20 min',
    source: 'Stiff pap with fried onion and spinach',
    video: v('j8UsN2X_fhw', 'Pap and Morogo | African Food You must try', 'PastorBoitumeloThelma', 'pap and morogo spinach South Africa'),
    portions: [
      p('maize_meal', 'carbs', 1.5, 'cups', 80, 6, 'dry maize meal'),
      p('spinach', 'veg', 2, 'cups', 4, 4, 'spinach, chopped'),
      p('onions', 'veg', 0.5, 'cups', 6, 1, 'onion, chopped'),
    ],
    steps: [
      'Cook stiff pap.',
      'Fry onion until soft, then add spinach until it wilts.',
      'Serve greens next to a wedge of pap.',
    ],
  },
  'potato-bean-curry': {
    time: '30 min',
    source: 'Student curry · potatoes, beans, onion and tomato',
    video: v('aFr5EmKAKG8', 'Butter Beans and Potato Curry In The Instant Pot', 'Priyanka Govender', 'potato and bean curry'),
    portions: [
      p('potatoes', 'carbs', 1.5, 'cups', 40, 4, 'diced potato'),
      p('beans', 'protein', 1, 'cups', 22, 10, 'baked beans'),
      p('tomato_sauce', 'carbs', 2, 'tbsp', 8, 0, 'tomato sauce'),
      p('onions', 'veg', 0.5, 'cups', 6, 1, 'onion, chopped'),
    ],
    steps: [
      'Fry onion, then add potato cubes and a splash of water.',
      'Lid on until the potato is soft.',
      'Stir in beans and tomato sauce. Simmer 5 minutes.',
    ],
  },
  'samp-beans': {
    time: '45 min',
    source: 'Umngqusho-style samp simmered with beans',
    video: v('fE0DuXu53Pk', 'The Best Samp and Beans Recipe | Umngqusho', 'Nomhle Cooks', 'samp and beans umngqusho South Africa'),
    portions: [
      p('samp', 'carbs', 1, 'cups', 70, 6, 'dry samp, soaked'),
      p('beans', 'protein', 1, 'cups', 22, 10, 'beans'),
      p('onions', 'veg', 0.5, 'cups', 6, 1, 'onion, chopped'),
    ],
    steps: [
      'Soak samp for an hour if you can, then boil until soft.',
      'Fry onion and stir in the beans.',
      'Mix through the samp. This pot feeds you twice.',
    ],
  },
  'lentil-stew': {
    time: '30 min',
    source: 'Red lentils cooked with rice and tomato',
    video: v('85QxhVQaKDQ', 'This 1-Pot Lentil Stew Is TOO Good', 'Food Friends', 'lentil stew with rice'),
    portions: [
      p('lentils', 'protein', 0.75, 'cups', 20, 14, 'dry red lentils'),
      p('rice', 'carbs', 1, 'cups', 55, 5, 'uncooked white rice'),
      p('tomatoes', 'veg', 1, 'cups', 8, 2, 'chopped tomato'),
    ],
    steps: [
      'Rinse lentils. Simmer in water 12 minutes until soft.',
      'Cook rice in a second pot.',
      'Stir chopped tomato into the lentils, then spoon over rice.',
    ],
  },
  'pap-pilchards': {
    time: '20 min',
    source: 'Stiff pap with Lucky Star on the side',
    video: v('4ZNm9ECddAs', 'Pilchards Fish Curry Recipe | Lucky Star Tinned Fish Recipe', 'COOKING QUEEN', 'pap and Lucky Star pilchards'),
    portions: [
      p('maize_meal', 'carbs', 1.5, 'cups', 80, 6, 'dry maize meal'),
      p('pilchards', 'protein', 0.75, 'cups', 2, 22, 'pilchards in tomato'),
    ],
    steps: [
      'Cook stiff pap.',
      'Warm the pilchards in their sauce.',
      'Serve fish next to a wedge of pap.',
    ],
  },
  'sweet-potato-beans': {
    time: '25 min',
    source: 'Boiled sweet potato with a bean-and-tomato topping',
    video: v('v__-p3vlTbQ', 'We prepared Mugoyo (Sweet potatoes and Beans) African Traditional Food Recipe', 'The Iryn train', 'sweet potatoes and beans recipe'),
    portions: [
      p('sweet_potato', 'carbs', 1.5, 'cups', 45, 3, 'sweet potato, cubed'),
      p('beans', 'protein', 1, 'cups', 22, 10, 'baked beans'),
      p('tomato_sauce', 'carbs', 1, 'tbsp', 4, 0, 'tomato sauce'),
    ],
    steps: [
      'Boil sweet potato cubes until a fork slides in.',
      'Warm beans with tomato sauce.',
      'Spoon the beans over the sweet potato.',
    ],
  },
  'egg-fried-rice': {
    time: '15 min',
    source: 'Yesterday’s rice with scrambled egg, onion and carrot',
    video: v('8kFT7b5qTK0', 'Quick Egg Fried Rice Recipe | Your favorite takeout made at home', 'ChineseHealthyCook', 'egg fried rice leftover rice'),
    portions: [
      p('rice', 'carbs', 1.5, 'cups', 82, 8, 'cooked leftover rice'),
      p('eggs', 'protein', 2, 'eggs', 1, 12, 'eggs'),
      p('carrots', 'veg', 0.5, 'cups', 6, 1, 'carrot, diced'),
      p('onions', 'veg', 0.5, 'cups', 6, 1, 'onion, chopped'),
    ],
    steps: [
      'Fry onion and carrot until soft.',
      'Push aside, scramble the eggs in the same pan.',
      'Add cold leftover rice and stir until hot.',
    ],
  },
  'pasta-soya': {
    time: '25 min',
    source: 'Student bolognaise · soya mince in tomato sauce',
    video: v('c4Rq_Vt6rVo', 'Soya Mince Bolognese', 'Rate My Supermarket', 'soya mince spaghetti bolognese'),
    portions: [
      p('pasta', 'carbs', 1.5, 'cups', 70, 8, 'dry spaghetti'),
      p('soya', 'protein', 1, 'cups', 8, 18, 'soya mince, rehydrated'),
      p('tomato_sauce', 'carbs', 3, 'tbsp', 12, 0, 'tomato sauce'),
    ],
    steps: [
      'Soak soya mince in hot water for 5 minutes, then drain.',
      'Fry it with tomato sauce until thick.',
      'Boil pasta and toss through the mince.',
    ],
  },
  'avocado-toast': {
    time: '6 min',
    source: 'Campus upgrade · ripe avocado on brown bread',
    video: v('2ezxWTSao4A', 'How To Make Avocado Toast', 'McCormick Spice', 'avocado toast recipe'),
    portions: [
      p('bread', 'carbs', 2, 'slices', 30, 6, 'brown bread, toasted'),
      p('avocado', 'fat', 0.5, 'fruit', 6, 2, 'avocado, mashed'),
    ],
    steps: [
      'Toast the bread.',
      'Mash the avocado with a pinch of salt.',
      'Spread edge to edge. Eat before it browns.',
    ],
  },
  'avocado-egg-toast': {
    time: '10 min',
    source: 'Cafe breakfast at residence · avocado, egg, bread',
    video: v('fbr4oagI7Ak', 'The BEST Avocado Toast with Fried Egg', 'Dyana kitchen', 'avocado toast with fried egg'),
    portions: [
      p('bread', 'carbs', 2, 'slices', 30, 6, 'brown bread, toasted'),
      p('avocado', 'fat', 0.5, 'fruit', 6, 2, 'avocado, mashed'),
      p('eggs', 'protein', 1, 'eggs', 0.5, 6, 'fried egg'),
    ],
    steps: [
      'Toast the bread and mash avocado onto it.',
      'Fry the egg in a little oil until the white is set.',
      'Slide the egg on top. Salt lightly.',
    ],
  },
  'yoghurt-berries': {
    time: '5 min',
    source: 'No-cook bowl · yoghurt, oats and mixed berries',
    video: v('IoiNtt7JWc0', 'Yogurt Berry Granola Parfait in Less than 5 Minutes', 'To Go Gourmet', 'yoghurt granola berry bowl'),
    portions: [
      p('yoghurt', 'protein', 1, 'cups', 12, 10, 'plain yoghurt'),
      p('oats', 'carbs', 0.5, 'cups', 20, 4, 'oats, for crunch'),
      p('berries', 'carbs', 0.5, 'cups', 10, 1, 'mixed berries'),
    ],
    steps: [
      'Spoon yoghurt into a bowl.',
      'Scatter oats and berries on top.',
      'Eat cold. This does not travel well in a hot bag.',
    ],
  },
  'salmon-bagel': {
    time: '8 min',
    source: 'Woolies smoked salmon on toast with avocado',
    video: v('hsg-qoz_SAo', 'Smoked Salmon Bagel Schmear | 5 Minute Easy Brunch Recipe', 'At Home with Mama Mila', 'smoked salmon bagel toast'),
    portions: [
      p('bread', 'carbs', 2, 'slices', 30, 6, 'toasted bread'),
      p('salmon', 'protein', 4, 'slices', 0, 18, 'smoked salmon'),
      p('avocado', 'fat', 0.25, 'fruit', 3, 1, 'avocado, sliced'),
    ],
    steps: [
      'Toast the bread.',
      'Lay avocado, then smoked salmon.',
      'Eat immediately. Do not pack this for a long lecture.',
    ],
  },
  'beef-stew-rice': {
    time: '50 min',
    source: 'Sunday beef pot · stew cubes and rice',
    video: v('QHgl_P3qvlU', 'HOW TO COOK THE MOST DELICIOUS BEEF STEW', 'Nomhle Cooks', 'South African beef stew with rice'),
    portions: [
      p('beef', 'protein', 1, 'cups', 0, 32, 'beef cubes'),
      p('rice', 'carbs', 1, 'cups', 55, 5, 'uncooked white rice'),
      p('tomato_sauce', 'carbs', 2, 'tbsp', 8, 0, 'tomato sauce'),
    ],
    steps: [
      'Brown the beef cubes in a pot.',
      'Add tomato sauce and water. Simmer until the meat is soft.',
      'Cook rice separately and spoon the stew over.',
    ],
  },
  'chicken-avo-wrap': {
    time: '12 min',
    source: 'Campus wrap · leftover chicken and avocado',
    video: v('kKndOe9oxzg', 'Meal Prep Chicken Avocado Wraps', 'Chef Jack Ovens', 'chicken avocado wrap'),
    portions: [
      p('chicken', 'protein', 1, 'cups', 0, 28, 'shredded chicken'),
      p('avocado', 'fat', 0.5, 'fruit', 6, 2, 'avocado, sliced'),
      p('bread', 'carbs', 2, 'slices', 30, 6, 'bread, rolled as a wrap'),
    ],
    steps: [
      'Shred leftover chicken.',
      'Lay chicken and avocado on the bread.',
      'Roll tight and wrap in paper for campus.',
    ],
  },
  'peri-peri-chicken': {
    time: '35 min',
    source: 'Nando’s-style chicken on rice',
    video: v('N6CKNUR7xlc', 'The BEST Peri Peri Chicken & Rice Recipe', 'Chef Nehal Karkera', 'peri peri chicken and rice'),
    portions: [
      p('chicken', 'protein', 1.5, 'cups', 0, 38, 'chicken pieces'),
      p('rice', 'carbs', 1, 'cups', 55, 5, 'uncooked white rice'),
      p('tomato_sauce', 'carbs', 2, 'tbsp', 8, 0, 'tomato sauce, for the spice base'),
    ],
    steps: [
      'Brown chicken. Stir in tomato sauce and a pinch of chilli or peri-peri if you have it.',
      'Simmer 20 minutes.',
      'Serve on rice. Keep leftover chicken for tomorrow’s wrap.',
    ],
  },
  'salmon-avo-bowl': {
    time: '15 min',
    source: 'Rice bowl · smoked salmon and avocado',
    video: v('PYpDHXzVwlw', 'Grilled Salmon with Mango Salsa & Rice', 'Summer plate cook-along', 'salmon avocado rice bowl'),
    portions: [
      p('rice', 'carbs', 1, 'cups', 55, 5, 'cooked rice'),
      p('salmon', 'protein', 4, 'slices', 0, 18, 'smoked salmon'),
      p('avocado', 'fat', 0.5, 'fruit', 6, 2, 'avocado, sliced'),
    ],
    steps: [
      'Cook or reheat rice.',
      'Lay salmon and avocado on top.',
      'Eat cold or warm. Do not mix until you sit down.',
    ],
  },
  'butter-chicken': {
    time: '40 min',
    source: 'Residence butter chicken · yoghurt tomato gravy',
    video: v('a03U45jFxOI', 'How To Make Butter Chicken At Home | Restaurant Style Recipe', 'The Bombay Chef – Varun Inamdar', 'butter chicken with rice'),
    portions: [
      p('chicken', 'protein', 1.5, 'cups', 0, 38, 'chicken pieces'),
      p('yoghurt', 'protein', 0.5, 'cups', 6, 5, 'yoghurt for the marinade'),
      p('tomato_sauce', 'carbs', 3, 'tbsp', 12, 0, 'tomato sauce'),
      p('rice', 'carbs', 1, 'cups', 55, 5, 'uncooked white rice'),
    ],
    steps: [
      'Coat chicken in yoghurt and rest 10 minutes.',
      'Fry the chicken, then stir in tomato sauce and a splash of water. Simmer until thick.',
      'Serve over rice.',
    ],
  },
  'steak-potatoes': {
    time: '25 min',
    source: 'Pan sirloin with fried potatoes',
    video: v('lkwJhbeIQaE', 'Skillet Garlic Butter Herb Steak and Potatoes', 'Cooking With Claudia', 'steak and potatoes skillet'),
    portions: [
      p('steak', 'protein', 1, 'piece', 0, 36, 'sirloin steak'),
      p('potatoes', 'carbs', 1.5, 'cups', 40, 4, 'potato cubes'),
    ],
    steps: [
      'Fry potato cubes until golden. Set aside.',
      'Sear the steak 3 minutes a side in a hot pan. Rest 5 minutes.',
      'Slice against the grain. Plate with the potatoes.',
    ],
  },
  'lamb-chops-pap': {
    time: '30 min',
    source: 'Braai chops with stiff pap',
    video: v('xgaJfO-csWM', 'Sticky Lamb Chops', 'Jamie Oliver', 'lamb chops and pap South Africa'),
    portions: [
      p('lamb', 'protein', 2, 'chops', 0, 32, 'lamb chops'),
      p('maize_meal', 'carbs', 1.5, 'cups', 80, 6, 'dry maize meal'),
    ],
    steps: [
      'Cook a pot of stiff pap.',
      'Fry or braai the chops until browned, still slightly pink inside.',
      'Rest the meat 3 minutes. Serve next to a wedge of pap.',
    ],
  },
  'salmon-rice': {
    time: '20 min',
    source: 'Pan salmon on rice with spinach',
    video: v('XVggNpe5WVo', 'Honey Teriyaki Glazed Salmon Rice Bowl', "Cookin And Vib'n With T", 'pan salmon with rice'),
    portions: [
      p('salmon', 'protein', 1, 'fillet', 0, 28, 'salmon portion'),
      p('rice', 'carbs', 1, 'cups', 55, 5, 'uncooked white rice'),
      p('spinach', 'veg', 1, 'cups', 2, 2, 'spinach, wilted'),
    ],
    steps: [
      'Cook the rice.',
      'Sear salmon 3 minutes a side. Wilt spinach in the same pan.',
      'Plate rice, greens, then fish on top.',
    ],
  },
};

export function getRecipe(recipeId) {
  return RECIPES[recipeId] || null;
}
