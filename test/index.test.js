const test = require('ava');
const fs = require('fs');
const vmx = require('../src/index');

test('execute simple code', (t) => {
    const result = vmx('module.exports = 10;');

    t.is(result, 10);
});

test('require package', (t) => {
    const obj = { tag: 'test-package' };
    const result = vmx('module.exports = require("test-package");', {
        packages: {
            'test-package': obj
        }
    });

    t.is(result, obj);
});

test('require local file', (t) => {
    const result = vmx('module.exports = require("./test/data/tester-1.js");');

    t.is(result, 102);
});
