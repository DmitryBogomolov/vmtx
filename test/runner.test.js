const assert = require('assert/strict');
const { run } = require('../src/runner');

describe('run', () => {
    it('execute simple code', () => {
        assert.strictEqual(run('1'), 1);
        assert.strictEqual(run('"test"'), 'test');
        assert.strictEqual(run('1 + 2 * 3'), 7);
    });

    it('report errors', () => {
        assert.throws(() => {
            run('1 + a');
        }, {
            name: 'ReferenceError',
            message: 'a is not defined',
        });
    });

    it('execute code with context', () => {
        assert.strictEqual(
            run('a + b', { a: 1, b: 2 }),
            3,
        );
    });
});
