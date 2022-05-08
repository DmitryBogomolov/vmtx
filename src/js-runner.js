const path = require('path');
const vm = require('vm');
const { ErrorWrapper } = require('./error-wrapper');

function runJs(code, filename, moduleLoader, variables) {
    const dirname = path.dirname(filename);
    const require = (modulePath) => moduleLoader.load(modulePath, dirname);
    const exports = {};
    const vmModule = { exports };
    const vmContext = {
        ...moduleLoader.globals,
        ...variables,
        __filename: filename,
        __dirname: dirname,
        module: vmModule,
        require,
        exports,
    };
    const vmOptions = {
        filename,
    };
    try {
        const result = vm.runInNewContext(code, vmContext, vmOptions);
        const exp = vmModule.exports === exports ? exports : vmModule.exports;
        return variables ? result : exp;
    } catch (err) {
        throw new ErrorWrapper(err);
    }
}

exports.runJs = runJs;
