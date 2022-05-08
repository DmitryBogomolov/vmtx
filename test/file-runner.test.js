const assert = require('assert/strict');
const { runFile } = require('../src/file-runner');

describe('file-runner', () => {
    describe('basics', () => {
        it('run file', () => {
            assert.strictEqual(
                runFile('./test/data/tester-4.js'),
                3,
            );
            assert.strictEqual(
                runFile('./test/data/tester-5.js', {
                    variables: {
                        a: 1, b: 2,
                    },
                }),
                3,
            );
        });
    });
});
