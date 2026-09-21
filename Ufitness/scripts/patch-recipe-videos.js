const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '../src/features/meals/data/recipes.js');
let s = fs.readFileSync(file, 'utf8');

const videos = {
  'pap-porridge': "v('KpRy9Odj1j0', 'South African Pap Recipe | How to Make Pap', 'Infoods Specials', 'how to cook South African pap porridge maize meal')",
  'oats-banana': "v('r7kb0-ZgnPI', 'Peanut Butter Banana Oatmeal', 'Cooking With Ms. Kristi', 'banana oatmeal breakfast')",
  'pb-bread': "v('Hle9uZEW2fs', 'Peanut Butter Toast | Hearty and Healthy Breakfast toast', 'Flavours Of Food', 'peanut butter on toast')",
  'eggs-toast': "v('aUwldQM9__w', 'The Perfect Fried Egg on Toast', 'Dont Go Bacon My Heart', 'fried eggs on toast')",
  'beans-toast': "v('t9IVuqj7oNE', 'How to make the perfect Heinz beans on toast', 'Cost of living crisis tips', 'baked beans on toast')",
  'pilchard-bread': "v('bVzJAkS7YYk', 'Pilchard and Mayo Toasties', 'EatMee Recipes', 'Lucky Star pilchard toasties')",
  'bunny-chow': "v('82GqOaSC6wk', 'Durban Style Bunny Chow - South African Vegan Curry in a Loaf', 'Steven Heap Recipes', 'bean bunny chow Durban South Africa')",
  'chicken-sandwich': "v('FWgiA8i8GcE', 'Chicken Mayo Sandwich | South Africa', 'Busisiwe Maseko', 'chicken mayonnaise sandwich South Africa')",
  'pap-chakalaka': "v('iqLcZ0Qgkmc', 'South African Chakalaka Recipe | Baked Beans Recipe', 'Infoods Specials', 'South African chakalaka with baked beans')",
  'pap-eggs': "v('0B8Yy45DLi4', 'Fully-Loaded Pap Cups 3-Ways', 'Foodies of South Africa', 'pap cups with eggs South Africa')",
  'rice-beans': "v('-opNeAZIuMM', 'One Pot Rice and Beans Recipe | Easy Budget-Friendly Dinner', \"Nancy's Kitchen corner\", 'one pot rice and beans')",
  'cabbage-stew': "v('AJYf327wTuE', 'Old Fashioned Rustic Peasant Cabbage and Potato Soup', 'Backyard Chef', 'cabbage and potato stew')",
  'chicken-rice': "v('pe_KDAKKdNE', '5-Ingredient One-Pot Chicken Rice', 'Foodies of South Africa', 'one pot chicken rice South Africa')",
  'pap-wors': "v('PP_u8V0OhnI', 'Delicious South African Pap and Wors Recipe', 'Iwan Ross', 'South African pap and wors')",
  'jam-bread': "v('29rA-StyPOU', 'Easy Jam Heart Toast Hack', 'The Fast Foodie', 'jam on toast')",
  'banana-bread': "v('D3DtOOEp0r8', 'Healthy Banana sandwich | Peanut Butter banana sandwich', \"Kabita's Kitchen\", 'banana sandwich on bread')",
  'oats-milk': "v('JzsNQOwI-sA', 'How to Make Oatmeal with Old Fashioned Oats | Stovetop Recipe', 'MOMables - Laura Fuentes', 'how to make oatmeal on the stove')",
  'pap-peanut': "v('KpRy9Odj1j0', 'South African Pap Recipe | How to Make Pap', 'Infoods Specials', 'how to cook pap porridge maize meal')",
  'pb-banana-toast': "v('UFiTy5QMRS0', 'This Banana PB Toast Is BREAKFAST MAGIC', 'Cookreview FL', 'peanut butter banana toast')",
  'yoghurt-banana': "v('QXa-f_0eZh8', 'How to Make a Crunchy Banana and Toasted Oat Yogurt Bowl', '5arbouch officiel', 'yoghurt banana bowl breakfast')",
  'french-toast': "v('r1ZLSbQ0r0I', 'How to Make French Toast!! Classic Quick and Easy Recipe', 'Crouton Crackerjacks', 'how to make french toast')",
  'cheese-toast': "v('WZOgBrgzQ2A', 'Ultimate Grilled Cheese Sandwich | Jamie Oliver', 'Jamie Oliver', 'cheese toastie grilled cheese sandwich')",
  'polony-sandwich': "v('izzNPk5iilU', 'CHEESE AND POLONY SANDWICHES', 'Nthabiseng Khoza', 'polony sandwich South Africa')",
  'maggi-veg': "v('yojGGcnqink', 'Instant Noodles Making - Maggi on the stove or microwave', 'Bong Cookhouse Recipes', 'Maggi 2 minute noodles recipe')",
  'cabbage-beans-bowl': "v('iqLcZ0Qgkmc', 'South African Chakalaka Recipe | Baked Beans Recipe', 'Infoods Specials', 'cabbage and baked beans recipe')",
  'pasta-tomato': "v('OA6sUvTNkVI', 'One Pot Spaghetti', 'The Stay At Home Chef', 'spaghetti with tomato sauce')",
  'rice-pilchards': "v('4ZNm9ECddAs', 'Pilchards Fish Curry Recipe | Lucky Star Tinned Fish Recipe', 'COOKING QUEEN', 'Lucky Star pilchards with rice')",
  'egg-mayo-sandwich': "v('4VeCpol3eoM', 'Creamy Egg Salad Sandwich with Salad Cress', 'Vikalinka by Julia Frey', 'egg mayonnaise sandwich')",
  'cheese-tomato-sandwich': "v('tKx-3eZRpiU', 'How to Make Cheese and Tomato Sandwich in a Pan', 'Kitchen Draft', 'cheese and tomato sandwich')",
  'tuna-sandwich': "v('plIXQLCM2Gw', 'MY ULTIMATE TUNA MAYO SANDWICH RECIPE', 'EATOUTGUIDELONDON', 'tuna mayonnaise sandwich')",
  'pap-spinach': "v('j8UsN2X_fhw', 'Pap and Morogo | African Food You must try', 'PastorBoitumeloThelma', 'pap and morogo spinach South Africa')",
  'potato-bean-curry': "v('aFr5EmKAKG8', 'Butter Beans and Potato Curry In The Instant Pot', 'Priyanka Govender', 'potato and bean curry')",
  'samp-beans': "v('fE0DuXu53Pk', 'The Best Samp and Beans Recipe | Umngqusho', 'Nomhle Cooks', 'samp and beans umngqusho South Africa')",
  'lentil-stew': "v('85QxhVQaKDQ', 'This 1-Pot Lentil Stew Is TOO Good', 'Food Friends', 'lentil stew with rice')",
  'pap-pilchards': "v('4ZNm9ECddAs', 'Pilchards Fish Curry Recipe | Lucky Star Tinned Fish Recipe', 'COOKING QUEEN', 'pap and Lucky Star pilchards')",
  'sweet-potato-beans': "v('v__-p3vlTbQ', 'We prepared Mugoyo (Sweet potatoes and Beans) African Traditional Food Recipe', 'The Iryn train', 'sweet potatoes and beans recipe')",
  'egg-fried-rice': "v('8kFT7b5qTK0', 'Quick Egg Fried Rice Recipe | Your favorite takeout made at home', 'ChineseHealthyCook', 'egg fried rice leftover rice')",
  'pasta-soya': "v('c4Rq_Vt6rVo', 'Soya Mince Bolognese', 'Rate My Supermarket', 'soya mince spaghetti bolognese')",
};

const miss = [];
for (const [id, call] of Object.entries(videos)) {
  const re = new RegExp(`('${id}': \\{[\\s\\S]*?video: )v\\([^)]*\\)`);
  if (!re.test(s)) {
    miss.push(id);
    continue;
  }
  s = s.replace(re, `$1${call}`);
}

fs.writeFileSync(file, s);
console.log('updated', Object.keys(videos).length - miss.length, 'miss', miss);
