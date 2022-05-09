const assert = require('assert/strict');
const { run } = require('vmtx');

const result = run(`
    const { name, license } = require('./package');
    name + ':' + license;
`);

assert.strictEqual(result, 'vmtx:MIT');
