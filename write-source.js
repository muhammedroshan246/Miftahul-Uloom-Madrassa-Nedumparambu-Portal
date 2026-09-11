const fs = require('fs');
const path = require('path');

const action = process.argv[2];
const target = process.argv[3];
const b64 = process.argv[4];

if (action === 'write_b64') {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, Buffer.from(b64, 'base64').toString('utf8'), 'utf8');
  console.log('Wrote ' + target);
} else if (action === 'append_b64') {
  fs.appendFileSync(target, Buffer.from(b64, 'base64').toString('utf8'), 'utf8');
  console.log('Appended to ' + target);
}
