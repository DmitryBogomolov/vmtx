const path = require('path');
const { run } = require('./runner');
const { defaultIsFile, defaultReadFile } = require('./util');

function readCode(filepath, options) {
    if (options && options.rootdir) {
        filepath = path.resolve(options.rootdir, filepath);
    }
    if (defaultIsFile(filepath)) {
        return defaultReadFile(filepath);
    }
    if (defaultIsFile(filepath + '.js')) {
        return defaultReadFile(filepath + '.js');
    }
    if (defaultIsFile(filepath + '.json')) {
        return defaultReadFile(filepath + '.json');
    }
    throw new Error(`File "${filepath}" is not found`);
}

function runFile(filepath, options) {
    const code = readCode(filepath, options);
    return run({
        ...options,
        code,
    });
}

exports.runFile = runFile;
