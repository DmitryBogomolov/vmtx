const test = require('ava');
const lib = require('../src/index');

test('execute simple code', (t) => {
    const result = lib('module.exports = 10;');

    t.is(result, 10);
});

test('require package', (t) => {
    const obj = { tag: 'test-package' };
    const result = lib('module.exports = require("test-package");', {
        packages: {
            'test-package': obj
        }
    });

    t.is(result, obj);
});

test('require local .js file', (t) => {
    const result = lib('module.exports = require("./test/data/tester-1.js");');

    t.is(result, 102);
});

test('require local .json file', (t) => {
    const result = lib('module.exports = require("./test/data/tester-2.json");');

    t.deepEqual(result, {  tag: 'test-data' });
});

test('fail when local file is not found', (t) => {
    try {
        lib('require("./test/data/no-file.js");');
        t.fail('should fail');
    } catch (e) {
        t.pass();
    }
});

test('guess local .js file extension', (t) => {
    const result = lib('module.exports = require("./test/data/tester-1");');

    t.is(result, 102);
});

test('guess local .json file extension', (t) => {
    const result = lib('module.exports = require("./test/data/tester-2");');

    t.deepEqual(result, {  tag: 'test-data' });
});

test('require complex local file', (t) => {
    const result = lib('module.exports = require("./test/data/tester-3");');

    t.deepEqual(result, {
        'tester-1': 102,
        'tester-2': { tag: 'test-data' }
    });
});
