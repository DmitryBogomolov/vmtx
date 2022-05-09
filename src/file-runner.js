const path = require('path');
const fs = require('fs');
const { run } = require('./runner');

function runFile(filepath, options) {
    if (options && options.rootdir) {
        filepath = path.resolve(options.rootdir, filepath);
    }
    const code = fs.readFileSync(filepath, { encoding: 'utf8' });
    return run({
        ...options,
        code,
    });
}

exports.runFile = runFile;
