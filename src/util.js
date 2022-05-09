const fs = require('fs');

function defaultIsFile(filepath) {
    try {
        return fs.statSync(filepath).isFile();
    } catch (_) {
        return false;
    }
}

function defaultReadFile(filepath) {
    return fs.readFileSync(filepath, { encoding: 'utf8' });
}

exports.defaultIsFile = defaultIsFile;
exports.defaultReadFile = defaultReadFile;
