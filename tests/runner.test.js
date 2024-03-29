const assert = require('assert/strict');
const path = require('path');
const { run } = require('../src/runner');

describe('runner', () => {
    describe('basics', () => {
        it('execute simple code', () => {
            assert.strictEqual(run('1'), 1);
            assert.strictEqual(run('"test"'), 'test');
            assert.strictEqual(run('1 + 2 * 3'), 7);
        });

        it('fail on undefined argument', () => {
            assert.throws(() => {
                run();
            }, {
                name: 'Error',
                message: 'Code is not provided',
            });
        });

        it('return last command result', () => {
            assert.strictEqual(run('1;2;3;'), 3);
        });

        it('report code execution errors', () => {
            assert.throws(() => {
                run('throw new Error("test");');
            }, {
                name: 'Error',
                message: 'test',
            });
            assert.throws(() => {
                run('1 + a');
            }, {
                name: 'ReferenceError',
                message: 'a is not defined',
            });
        });

        it('execute code with variables', () => {
            assert.strictEqual(
                run({
                    code: 'a + b',
                    variables: { a: 1, b: 2 },
                }),
                3,
            );
        });

        it('execute code with globals', () => {
            assert.strictEqual(
                run({
                    code: 'a + b',
                    globals: { a: 1, b: 2 },
                }),
                3,
            );
        });

        it('provide common constants', () => {
            assert.strictEqual(
                run('__filename'),
                path.resolve('__main__'),
            );
            assert.strictEqual(
                run('__dirname'),
                path.resolve('.'),
            );
            assert.strictEqual(
                run({
                    code: '__filename',
                    rootdir: '/test1/test2',
                }),
                '/test1/test2/__main__',
            );
            assert.strictEqual(
                run({
                    code: '__dirname',
                    rootdir: '/test1/test2',
                }),
                '/test1/test2',
            );
        });

        it('set execution timeout', () => {
            assert.throws(() => {
                run({
                    code: 'const now = Date.now(); while ((Date.now() - now) < 3000) { };',
                    timeout: 25,
                });
            }, {
                name: 'Error',
                message: 'Script execution timed out after 25ms',
            });
        }).timeout(5000);
    });

    describe('restrictions', () => {
        it('do not define "process"', () => {
            assert.throws(() => {
                run('process');
            }, {
                name: 'ReferenceError',
                message: 'process is not defined',
            });
        });

        it('block access to "process"', () => {
            assert.throws(() => {
                run('this.constructor.constructor("return process")()');
            }, {
                name: 'ReferenceError',
                message: 'process is not defined',
            });
        });
    });

    describe('named modules loading', () => {
        it('load modules', () => {
            let loadedModule;
            assert.strictEqual(
                run({
                    code: 'const { a } = require("test-module"); a;',
                    loadModule: (moduleName) => {
                        loadedModule = moduleName;
                        return { a: 123 };
                    },
                }),
                123,
            );
            assert.strictEqual(loadedModule, 'test-module');
        });

        it('report errors on not found modules', () => {
            assert.throws(() => {
                run('require("test-module");');
            }, {
                name: 'Error',
                message: 'Module "test-module" is not found',
            });
        });

        it('cache loaded modules', () => {
            let callCount = 0;
            assert.strictEqual(
                run({
                    code: `
                const mod1 = require("test-module");
                const mod2 = require("test-module");
                mod1 === mod2;
            `,
                    loadModule: () => {
                        ++callCount;
                        return { tag: 'test' };
                    },
                }),
                true,
            );
            assert.strictEqual(callCount, 1);
        });
    });

    describe('relative modules loading', () => {
        it('load files', () => {
            assert.strictEqual(
                run('require("./tests/data/tester-1.js")'),
                102,
            );
            assert.strictEqual(
                run('require("./tests/data/tester-1")'),
                102,
            );
            assert.deepStrictEqual(
                run('require("./tests/data/tester-2.json")'),
                { tag: 'test-data' },
            );
            assert.deepStrictEqual(
                run('require("./tests/data/tester-2")'),
                { tag: 'test-data' },
            );
            assert.deepStrictEqual(
                run('require("./tests/data/tester-3")'),
                {
                    'tester-1': 102,
                    'tester-2': { tag: 'test-data' },
                },
            );
        });

        it('apply rootdir', () => {
            assert.strictEqual(
                run({ code: 'require("./tester-1")', rootdir: './tests/data' }),
                102,
            );
            assert.deepStrictEqual(
                run({ code: 'require("./data/tester-2")', rootdir: './tests' }),
                { tag: 'test-data' },
            );
            assert.deepStrictEqual(
                run({ code: 'require("./tests/data/tester-3")', rootdir: '.' }),
                {
                    'tester-1': 102,
                    'tester-2': { tag: 'test-data' },
                },
            );
            assert.strictEqual(
                run({ code: 'require("./data/folder-1")', rootdir: './tests' }),
                101,
            );
            assert.deepStrictEqual(
                run({ code: 'require("./folder-2")', rootdir: './tests/data' }),
                { tag: 'test-data' },
            );
        });

        it('forbid path outside of rootdir', () => {
            assert.throws(() => {
                run({ code: 'require("../tmp")', rootdir: './tests' });
            }, {
                name: 'Error',
                message: `Module "${path.resolve('tmp')}" is outside of root directory`,
            });
        });

        it('cache loaded modules', () => {
            assert.strictEqual(
                run(`
                const mod1 = require("./tests/data/tester-2");
                const mod2 = require("./tests/data/tester-2");
                mod1 === mod2;
            `),
                true,
            );
        });

        it('raise error when file does not exist', () => {
            assert.throws(() => {
                run('require("./tests/data/tester-1.json")');
            }, {
                name: 'Error',
                message: `Module "${path.resolve('./tests/data/tester-1.json')}" is not found`,
            });
            assert.throws(() => {
                run('require("./tests/data/tester-2.js")');
            }, {
                name: 'Error',
                message: `Module "${path.resolve('./tests/data/tester-2.js')}" is not found`,
            });
        });
    });

    describe('relative modules loading with callbacks', () => {
        it('load files', () => {
            assert.strictEqual(
                run({
                    code: 'require("./tests/data/tester-1.js")',
                    isFile(filepath) {
                        return filepath === path.resolve('./tests/data/tester-1.js');
                    },
                    readFile(_filepath) {
                        return 'module.exports = 202;';
                    },
                }),
                202,
            );
            assert.strictEqual(
                run({
                    code: 'require("./tests/data/tester-1")',
                    isFile(filepath) {
                        return filepath === path.resolve('./tests/data/tester-1.js');
                    },
                    readFile(_filepath) {
                        return 'module.exports = 202;';
                    },
                }),
                202,
            );
            assert.deepStrictEqual(
                run({
                    code: 'require("./tests/data/tester-2.json")',
                    isFile(filepath) {
                        return filepath === path.resolve('./tests/data/tester-2.json');
                    },
                    readFile(_filepath) {
                        return '{ "tag": "test" }';
                    },
                }),
                { tag: 'test' },
            );
            assert.deepStrictEqual(
                run({
                    code: 'require("./tests/data/tester-2")',
                    isFile(filepath) {
                        return filepath === path.resolve('./tests/data/tester-2.json');
                    },
                    readFile(_filepath) {
                        return '{ "tag": "test" }';
                    },
                }),
                { tag: 'test' },
            );
            assert.deepStrictEqual(
                run({
                    code: 'require("./tests/data/tester-3")',
                    isFile(filepath) {
                        return [
                            path.resolve('./tests/data/tester-1.js'),
                            path.resolve('./tests/data/tester-2.json'),
                            path.resolve('./tests/data/tester-3.js'),
                        ].includes(filepath);
                    },
                    readFile(filepath) {
                        if (filepath === path.resolve('./tests/data/tester-3.js')) {
                            return `
                            exports['tester-1'] = require('./tester-1.js');
                            exports['tester-2'] = require('./tester-2.json');
                        `;
                        }
                        if (filepath === path.resolve('./tests/data/tester-1.js')) {
                            return 'module.exports = 202;';
                        }
                        if (filepath === path.resolve('./tests/data/tester-2.json')) {
                            return '{ "tag": "test" }';
                        }
                    },
                }),
                {
                    'tester-1': 202,
                    'tester-2': { tag: 'test' },
                },
            );
        });

        it('raise error when file does not exist', () => {
            assert.throws(() => {
                run({
                    code: 'require("./tests/data/tester-1.js")',
                    isFile(_filepath) {
                        return false;
                    },
                });
            }, {
                name: 'Error',
                message: `Module "${path.resolve('./tests/data/tester-1.js')}" is not found`,
            });
            assert.throws(() => {
                run({
                    code: 'require("./tests/data/tester-2.json")',
                    isFile(_filepath) {
                        return false;
                    },
                });
            }, {
                name: 'Error',
                message: `Module "${path.resolve('./tests/data/tester-2.json')}" is not found`,
            });
        });

        it('pass variables only to main module', () => {
            assert.throws(() => {
                run({
                    code: 'require("./test")',
                    variables: {
                        a: 1,
                        b: 2,
                    },
                    isFile(filepath) {
                        return filepath === path.resolve('./test.js');
                    },
                    readFile(_filepath) {
                        return 'module.exports = a + b';
                    },
                });
            }, {
                name: 'ReferenceError',
                message: 'a is not defined',
            });
        });

        it('pass globals to all modules', () => {
            assert.strictEqual(
                run({
                    code: 'require("./test")',
                    globals: {
                        a: 1,
                        b: 2,
                    },
                    isFile(filepath) {
                        return filepath === path.resolve('./test.js');
                    },
                    readFile(_filepath) {
                        return 'module.exports = a + b';
                    },
                }),
                3,
            );
        });
    });
});
