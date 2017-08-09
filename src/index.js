const vm = require('vm');
const fs = require('fs');
const path = require('path');

function requireJsFile(pathToFile, options) {
    const content = fs.readFileSync(pathToFile, 'utf8');
    return runCode(content, options);
}

function requirePackage(arg, options) {
    if (arg.startsWith('/') || arg.startsWith('.')) {
        const pathToFile = path.resolve(arg);
        return requireJsFile(pathToFile, options);
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
