const fs = require('fs');
const { run } = require('./runner');

function runFile(filepath, options) {
    const code = fs.readFileSync(filepath, { encoding: 'utf8' });
    return run({
        ...options,
        code,
    });
}

exports.runFile = runFile;
