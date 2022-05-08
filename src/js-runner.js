const path = require('path');
const vm = require('vm');
const { ErrorWrapper } = require('./error-wrapper');

// vm.runInNewContext('this.constructor') return real Object.
const SAFE_PREFIX = '(this.constructor = Object);';

class JsRunner {
    constructor(globals, timeout) {
        this._globals = globals;
        this._vmOptions = {
            microtaskMode: 'afterEvaluate',
            codeGeneration: false,
        };
        if (timeout > 0) {
            this._vmOptions.timeout = timeout;
        }
    }

    setModuleLoader(moduleLoader) {
        this._moduleLoader = moduleLoader;
    }

    run(code, filename, variables) {
        const dirname = path.dirname(filename);
        const require = (modulePath) => this._moduleLoader.load(modulePath, dirname);
        const exports = {};
        const vmModule = { exports };
        const vmContext = {
            ...this._globals,
            ...variables,
            __filename: filename,
            __dirname: dirname,
            module: vmModule,
            require,
            exports,
        };
        const vmOptions = {
            ...this._vmOptions,
            filename,
        };
        try {
            const result = vm.runInNewContext(SAFE_PREFIX + code, vmContext, vmOptions);
            const exp = vmModule.exports === exports ? exports : vmModule.exports;
            return variables ? result : exp;
        } catch (err) {
            throw new ErrorWrapper(err);
        }
    }
}

exports.JsRunner = JsRunner;
