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

test('require local .js file', (t) => {
    const result = vmx('module.exports = require("./test/data/tester-1.js");');

    t.is(result, 102);
});

test('require local .json file', (t) => {
    const result = vmx('module.exports = require("./test/data/tester-2.json");');

    t.deepEqual(result, {  tag: 'test-data' });
});

test('fail when local file is not found', (t) => {
    try {
        vmx('require("./test/data/no-file.js");');
        t.fail('should fail');
    } catch (e) {
        t.pass();
    }
});
