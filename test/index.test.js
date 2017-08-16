const { expect } = require('chai');
const path = require('path');
const lib = require('../src/index');

describe('Lib', () => {
    describe('exports', () => {
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

        it('blocks access to real context', () => {
            try {
                lib(`
                    this.constructor.constructor('return process')().assert(0);
                `);
                expect(false).to.be.true;
            } catch (e) {
                expect(e.message).to
                    .equal('this.constructor.constructor(...)(...).assert is not a function');
            }
        });
    });

    describe('loading files', () => {
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

        it('provides __filename and __dirname arguments', () => {
            const result = lib({ file: './test/data/tester-7' });

            expect(result).to.deep.equal({
                dir: path.join(__dirname, './data'),
                file: path.join(__dirname, './data/tester-7.js'),
                next: {
                    dir: path.join(__dirname, './data'),
                    file: path.join(__dirname, './data/tester-6.js'),
                }
            });
        });
    });

    describe('cache', () => {
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
    });

    describe('file execution', () => {
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
    });

    describe('root dir', () => {
        it('allows to change root dir', () => {
            const result = lib({
                code: 'module.exports = require("./tester-2");',
                root: './test/data'
            });

            expect(result).to.deep.equal({
                tag: 'test-data'
            });
        });
    });

    describe('globals', () => {
        it('allows to define custom globals', () => {
            const result = lib({
                code: `
                    exports.a = a;
                    exports.b = b;
                `,
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

        it('provides Buffer', () => {
            const code = `
                expect(Buffer.from('test').toString()).to.equal('test');
            `;
            lib({
                code,
                globals: { expect }
            });
        });

        it('provides console', () => {
            const code = `
                expect(typeof console.log).to.equal('function');
                expect(typeof console.error).to.equal('function');
                expect(typeof console.warn).to.equal('function');
            `;
            lib({
                code,
                globals: { expect }
            });
        });

        it('provides timeout, interval, immediate functions', () => {
            const code = `
                const timeout = setTimeout(() => 1, 1000);
                clearTimeout(timeout);

                const interval = setInterval(() => 1, 1000);
                clearInterval(interval);

                const immediate = setImmediate(() => 1, 1000);
                clearImmediate(immediate);
            `;
            lib(code);
        });

        it('provides Map and Set classes', () => {
            const code = `
                new Map();
                new Set();
                new WeakMap();
                new WeakSet();
            `;
            lib(code);
        });

        it('provides process.nextTick', () => {
            lib(`
                process.nextTick(() => 1);
            `);
        });

        it('provides process.exit', () => {
            const code = `
                obj.a = 1;
                process.exit();
                obj.b = 2;
            `;
            const obj = {};
            try {
                lib({
                    code,
                    globals: { obj }
                });
                expect(false).to.be.true;
            } catch (e) {
                expect(obj.a).to.equal(1);
                expect(obj.b).to.be.undefined;
            }
        });

        it('disables default globals', () => {
            try {
                lib({
                    code: 'new Buffer();',
                    noDefaultGlobals: true
                });
                expect(false).to.be.true;
            } catch (e) {
                expect(e.message).to.equal('Buffer is not defined');
            }
        });
    });

    describe('loading packages', () => {
        it('stubs package', () => {
            const obj = { tag: 'test-package' };
            const result = lib({
                code: 'module.exports = require("test-package");',
                packages: {
                    'test-package': obj
                }
            });

            expect(result).to.equal(obj);
        });

        it('fails on not found package', () => {
            try {
                lib('require("test");');
                expect(false).to.be.true;
            } catch (e) {
                expect(e.message).to.equal('Cannot find module \'test\'');
            }
        });

        it('uses real packages', () => {
            const result = lib({
                code: 'module.exports = require("chai");',
                realPackages: ['chai']
            });

            expect(result.expect).to.equal(expect);
        });
    });
});
