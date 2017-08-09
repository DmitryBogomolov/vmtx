const fs = require('fs');
const vmx = require('../src/index');

describe('vmx', () => {
    test('execute simple code', () => {
        expect(vmx('module.exports = 10;')).toEqual(10);
    });

    test('require package', () => {
        const obj = { tag: 'test-package' };
        const result = vmx('module.exports = require("test-package");', {
            packages: {
                'test-package': obj
            }
        });

        expect(result).toEqual(obj);
    });

    test('require local file', () => {
        const result = vmx('module.exports = require("./test/data/tester-1.js");');

        expect(result).toEqual(102);
    });
});
