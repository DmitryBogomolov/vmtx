const vmx = require('../src/index');

describe('vmx', () => {
    test('execute simple code', () => {
        expect(vmx('module.exports = 10;')).toEqual(10);
    });
});
