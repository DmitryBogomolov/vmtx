const { expect } = require('chai');
const vmtx = require('..');

const result = vmtx(`
    const pack = require('./package');

    const obj = { name: pack.name, license: pack.license };
    obj;
`);

expect(result).to.deep.equal({
    name: 'vmtx',
    license: 'MIT'
});
