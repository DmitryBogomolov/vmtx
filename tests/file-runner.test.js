const assert = require('assert/strict');
const { runFile } = require('../src/file-runner');

describe('file-runner', () => {
    describe('basics', () => {
        it('run file', () => {
            assert.strictEqual(
                runFile('./tests/data/tester-4.js'),
                3,
            );
            assert.strictEqual(
                runFile('./tests/data/tester-5.js', {
                    variables: { a: 1, b: 2 },
                }),
                3,
            );
        });

        it('apply rootdir', () => {
            assert.strictEqual(
                runFile('./tester-4.js', {
                    rootdir: './tests/data',
                }),
                3,
            );
            assert.strictEqual(
                runFile('./tester-5.js', {
                    rootdir: './tests/data',
                    variables: { a: 1, b: 2 },
                }),
                3,
            );
        });
    });
});
