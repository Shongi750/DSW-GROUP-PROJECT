const fs = require('fs');
const xml = fs.readFileSync(process.argv[2] || 'scripts/ui.xml', 'utf8');
const re = /text="([^"]{1,80})"[^>]*bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/g;
const seen = new Set();
let m;
while ((m = re.exec(xml))) {
  const key = m[1];
  if (seen.has(key)) continue;
  seen.add(key);
  const l = +m[2], t = +m[3], r = +m[4], b = +m[5];
  console.log(`${key}  [${l},${t}][${r},${b}]  center ${Math.round((l+r)/2)},${Math.round((t+b)/2)}`);
}
