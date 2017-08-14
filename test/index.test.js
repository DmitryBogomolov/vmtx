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
        const result = lib({
            code: 'module.exports = require("test-package");',
            packages: {
                'test-package': obj
            }
        });

        expect(result).to.equal(obj);
    });

    it('loads local .js file', () => {
        const result = lib('module.exports = require("./test/data/tester-1.js");');

        expect(result).to.equal(102);
    });

    it('loads local .json file', () => {
        const result = lib('module.exports = require("./test/data/tester-2.json");');

        expect(result).to.deep.equal({ tag: 'test-data' });
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

        expect(result).to.deep.equal({ tag: 'test-data' });
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
        const code = `
            const obj1 = require('test-package');
            const obj2 = require('test-package');
            obj2['test-change'] = 2;
            module.exports = obj1;
        `;
        const result = lib({
            code,
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

    it('executes file instead of code', () => {
        const result = lib({
            file: './test/data/tester-5'
        });

        expect(result).to.deep.equal({
            a: 103,
            b: {
                tag: 'test-data',
                test: 'Hello'
            }
        });
    });

    it('allows to change root dir', () => {
        const result = lib({
            code: 'module.exports = require("./tester-2");',
            root: './test/data'
        });

        expect(result).to.deep.equal({
            tag: 'test-data'
        });
    });

    it('allows to define *console*', () => {
        let arg = null;
        lib({
            code: 'console.log("Hello");',
            globals: {
                console: {
                    log: (message) => { arg = message; }
                }
            }
        });

        expect(arg).to.equal('Hello');
    });

    it('allows to define custom globals', () => {
        const result = lib({
            code: 'exports.a = a; exports.b = b;',
            globals: {
                a: 1, b: 2
            }
        });

        expect(result).to.deep.equal({ a: 1, b: 2 });
    });

    it('does not allow to redefine *module*, *exports* and *require*', () => {
        const result = lib({
            code: 'module.exports = require("./test/data/tester-1");',
            globals: {
                module: 10,
                exports: 'test',
                require: () => { }
            }
        });

        expect(result).to.equal(102);
    });
});
