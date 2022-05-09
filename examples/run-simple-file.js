const assert = require('assert/strict');
const { run, runFile } = require('..');

runFile('./examples/simple', {
    loadModule: (moduleName) => {
        if (moduleName === 'assert/strict') {
            return assert;
        }
        if (moduleName === 'vmtx') {
            return { run };
        }
        return null;
    },
});
