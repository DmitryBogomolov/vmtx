const { expect } = require('chai');
const path = require('path');
const lib = require('../src/index');

describe('Lib', () => {
    function fail() {
        throw new Error('It should not be called!');
    }

    describe('basics', () => {
        it('returns last block result', () => {
            const result = lib('10');

            expect(result).to.equal(10);
        });

        it('executes code', () => {
            const result = lib({
                code: '20'
            });

            expect(result).to.equal(20);
        });

        it('executes file', () => {
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

        it('fails when nether code nor file is provided', () => {
            try {
                lib({});
                fail();
            } catch (e) {
                expect(e.message).to.equal('Neiher *code* nor *file* is defined.');
            }
        });

        it('fails when code execution fails', () => {
            try {
                lib(`
                    throw new Error('test');
                `);
                fail();
            } catch (e) {
                expect(e.message).to.equal('test');
            }
        });

        it('fails when file execution fails', () => {
            try {
                lib({ file: './no-file' });
                fail();
            } catch (e) {
                expect(e.message.startsWith('ENOENT: no such file or directory')).to.be.true;
            }
        });

        it('blocks access to real context', () => {
            try {
                lib(`
                    this.constructor.constructor('return process')().assert(0);
                `);
                fail();
            } catch (e) {
                expect(e.message).to
                    .equal('this.constructor.constructor(...)(...).assert is not a function');
            }
        });

        it('sets execution timeout', () => {
            const result = lib({
                code: '10',
                timeout: 3
            });

            expect(result).to.equal(10);
        });
    });

    describe('loading files', () => {
        it('loads local .js file', () => {
            const result = lib('require("./test/data/tester-1.js");');

            expect(result).to.equal(102);
        });

        it('loads local .json file', () => {
            const result = lib('require("./test/data/tester-2.json");');

            expect(result).to.deep.equal({ tag: 'test-data' });
        });

        it('fails when local file is not found', () => {
            try {
                lib('require("./test/data/no-file.js");');
                fail();
            } catch (e) {
                expect(e.message.startsWith('ENOENT: no such file or directory')).to.be.true;
            }
        });

        it('guesses .js file extension', () => {
            const result = lib('require("./test/data/tester-1");');

            expect(result).to.equal(102);
        });

        it('guesses .json file extension', () => {
            const result = lib('require("./test/data/tester-2");');

            expect(result).to.deep.equal({ tag: 'test-data' });
        });

        it('loads complex file', () => {
            const result = lib('require("./test/data/tester-3");');

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
                obj;
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
                obj1;
            `;
            const result = lib({
                code,
                modules: {
                    'test-package': { tag: 'test-package' }
                }
            });

            expect(result).to.deep.equal({
                tag: 'test-package',
                'test-change': 2
            });
        });

        it('caches failed files', () => {
            const code = `
                try {
                    require('./test/no-file');
                } catch (e) {
                    errors.e1 = e;
                }
                try {
                    require('./test/no-file');
                } catch (e) {
                    errors.e2 = e;
                }
            `;
            const errors = {};
            lib({
                code,
                globals: { errors }
            });

            expect(errors.e1).to.equal(errors.e2);
        });
    });

    describe('root dir', () => {
        it('allows to change root dir', () => {
            const result = lib({
                code: 'require("./tester-2");',
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
                code: 'a + b',
                globals: {
                    a: 1, b: 2
                }
            });

            expect(result).to.equal(3);
        });

        it('does not allow to redefine *module*, *exports* and *require*', () => {
            const result = lib({
                code: 'require("./test/data/tester-1");',
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
                fail();
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
                fail();
            } catch (e) {
                expect(e.message).to.equal('Buffer is not defined');
            }
        });
    });

    describe('loading modules', () => {
        it('stubs module', () => {
            const obj = { tag: 'test-package' };
            const result = lib({
                code: 'require("test-package");',
                modules: {
                    'test-package': obj
                }
            });

            expect(result).to.equal(obj);
        });

        it('stubs file', () => {
            const obj = { tag: 'test-file' };
            const result = lib({
                code: 'require("./test-file");',
                modules: {
                    [path.resolve('./test-file')]: obj
                }
            });

            expect(result).to.equal(obj);
        });

        it('fails on not-found module', () => {
            try {
                lib('require("test");');
            } catch (e) {
                expect(e.message).to.equal('Cannot find module \'test\'');
            }
        });

        it('inherits modules', () => {
            const result = lib({
                code: 'require("chai");',
                modules: {
                    chai: lib.INHERIT
                }
            });

            expect(result.expect).to.equal(expect);
        });

        it('handles error for inherited modules', () => {
            try {
                lib({
                    code: 'require("not-found");',
                    modules: {
                        'not-found': lib.INHERIT
                    }
                });
                fail();
            } catch (e) {
                expect(e.message).to.equal('Cannot find module \'not-found\'');
            }
        });
    });
});
