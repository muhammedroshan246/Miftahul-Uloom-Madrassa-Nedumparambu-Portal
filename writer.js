const fs = require('fs');
const path = require('path');
const mode = process.argv[2];
const target = process.argv[3];
const content = process.argv.slice(4).join(' ');

if (mode === 'write') {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content, 'utf8');
  console.log('Wrote ' + target);
} else if (mode === 'append') {
  fs.appendFileSync(target, content, 'utf8');
  console.log('Appended to ' + target);
}
