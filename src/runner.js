const vm = require('vm');
const path = require('path');

class ErrorWrapper extends Error {
    constructor(err) {
        super();
        /** @type {Error} */
        const { name, message, stack } = err;
        const lines = stack.split('\n');
        const idx = lines.findIndex((line) => line.indexOf('at Script.runInContext') >= 0);
        const cleanStack = lines.slice(0, idx).join('\n');
        this.name = name;
        this.message = message;
        this.stack = cleanStack;
    }
}

function runJs(code, filepath, context) {
    const ctxExports = Object.create(null);
    const ctxRequire = (_dependency) => {

    };
    const vmContext = {
        ...context,
        __filename: filepath,
        __dirname: path.dirname(filepath),
        module: {
            require: ctxRequire,
            exports: ctxExports,
        },
        require: ctxRequire,
        exports: ctxExports,
    };
    const vmOptions = {
        filename: filepath,
        timeout: 1000,
    };
    try {
        const result = vm.runInNewContext(code, vmContext, vmOptions);
        return result;
    } catch (err) {
        throw new ErrorWrapper(err);
    }
}

function run(code, context) {
    return runJs(code, 'ENTRY', context);
}

Object.assign(exports, { run });
