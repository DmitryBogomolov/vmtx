const vm = require('vm');
const fs = require('fs');
const path = require('path');

const PARSERS = {
    '.js': runCode,
    '.json': JSON.parse
};

function checkFileExists(pathToFile, ext) {
    const pathWithExt = pathToFile + ext;
    return fs.existsSync(pathWithExt) ? pathWithExt : null;
}

function throwFileNotFound(pathToFile) {
    throw new Error(`Cannot find '${pathToFile}`);
}

function guessFileExtension(pathToFile) {
    return path.extname(pathToFile) !== ''
        ? pathToFile
        : (checkFileExists(pathToFile, '.js')
            || checkFileExists(pathToFile, '.json')
            || throwFileNotFound(pathToFile)
        );
}

function requirePackage(arg, options) {
    if (arg.startsWith('/') || arg.startsWith('.')) {
        const pathToFile = guessFileExtension(path.resolve(arg));
        const content = fs.readFileSync(pathToFile, 'utf8');
        return PARSERS[path.extname(pathToFile)](content, options);
    } else {
        return (options.packages && options.packages[arg]) || null;
    }
}

function runCode(content, _options) {
    const _exports = {};
    const _module = { exports: _exports };
    const options = _options || {};
    vm.runInNewContext(content, {
        exports: _exports,
        module: _module,
        require: arg => requirePackage(arg, options)
    });
    return _exports === _module.exports ? _exports : _module.exports;
}

module.exports = runCode;
