const vm = require('vm');
const fs = require('fs');
const path = require('path');

function parseJsFile(content, options) {
    return runCode(content, options);
}

function requireJsonFile(content) {
    return JSON.parse(content);
}

const PARSERS = {
    '.js': runCode,
    '.json': JSON.parse
};

function requirePackage(arg, options) {
    if (arg.startsWith('/') || arg.startsWith('.')) {
        const pathToFile = path.resolve(arg);
        const content = fs.readFileSync(pathToFile, 'utf8');
        return PARSERS[path.extname(arg)](content, options);
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
