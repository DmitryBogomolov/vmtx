const { expect } = require('chai');
const lib = require('../src/index');

describe('Lib', () => {
    it('returns module.exports', () => {
        const result = lib('module.exports = 10;');

        expect(result).to.equal(10);
    });

    it('returns exports', () => {
        const result = lib(`
            exports.a = 1;
            exports.b = 2;
        `);

        expect(result).to.deep.equal({
            a: 1,
            b: 2
        });
    });

    it('loads package', () => {
        const obj = { tag: 'test-package' };
        const result = lib('module.exports = require("test-package");', {
            packages: {
                'test-package': obj
            }
        });

        expect(result).to.deep.equal(obj);
    });

    it('loads local .js file', () => {
        const result = lib('module.exports = require("./test/data/tester-1.js");');

        expect(result).to.equal(102);
    });

    it('loads local .json file', () => {
        const result = lib('module.exports = require("./test/data/tester-2.json");');

        expect(result).to.deep.equal({  tag: 'test-data' });
    });

    it('fails when local file is not found', () => {
        let isThrown = false;
        try {
            lib('require("./test/data/no-file.js");');
        } catch (_) {
            isThrown = true;
        }
        expect(isThrown).to.be.true;
    });

    it('guesses .js file extension', () => {
        const result = lib('module.exports = require("./test/data/tester-1");');

        expect(result).to.equal(102);
    });

    it('guesses .json file extension', () => {
        const result = lib('module.exports = require("./test/data/tester-2");');

        expect(result).to.deep.equal({  tag: 'test-data' });
    });

    it('loads complex file', () => {
        const result = lib('module.exports = require("./test/data/tester-3");');

        expect(result).to.deep.equal({
            'tester-1': 102,
            'tester-2': { tag: 'test-data' }
        });
    });

    it('caches loaded files', () => {
        const result = lib(`
            const obj = require('./test/data/tester-2');
            require('./test/data/tester-4');
            module.exports = obj;
        `);

        expect(result).to.deep.equal({
            tag: 'test-data',
            'test-change': 2
        });
    });

    it('caches loaded modules', () => {
        const result = lib(`
            const obj1 = require('test-package');
            const obj2 = require('test-package');
            obj2['test-change'] = 2;
            module.exports = obj1;
        `, {
            packages: {
                'test-package': { tag: 'test-package' }
            }
        });

        expect(result).to.deep.equal({
            tag: 'test-package',
            'test-change': 2
        });
    });

    it('caches failed files', () => {
        const result = lib(`
            try {
                require('./test/no-file');
            } catch (e) {
                exports.e1 = e;
            }
            try {
                require('./test/no-file');
            } catch (e) {
                exports.e2 = e;
            }
        `);

        expect(result.e1).to.equal(result.e2);
    });
});
