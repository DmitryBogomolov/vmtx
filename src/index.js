const vm = require('vm');

function runCode(content) {
    const _exports = {};
    const _module = { exports: _exports };
    vm.runInNewContext(content, {
        exports: _exports,
        module: _module
    });
    return _exports === _module.exports ? _exports : _module.exports;
}

module.exports = runCode;
