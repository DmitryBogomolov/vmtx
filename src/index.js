const vm = require('vm');

function runCode(content, _options) {
    const _exports = {};
    const _module = { exports: _exports };
    const options = _options || {};
    vm.runInNewContext(content, {
        exports: _exports,
        module: _module,
        require(arg) {
            return (options.packages && options.packages[arg]) || null;
        }
    });
    return _exports === _module.exports ? _exports : _module.exports;
}

module.exports = runCode;
