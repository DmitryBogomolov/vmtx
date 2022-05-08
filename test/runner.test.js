const assert = require('assert/strict');
const path = require('path');
const { run } = require('../src/runner');

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
});

describe('modules loading', () => {
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
});
