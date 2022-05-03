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

function resolveModuleName(dir, name) {
    if (name[0] === '/' || name === '.') {
        return path.resolve(dir, name);
    }
    return name;
}

function runJs({ code, filename, modulesCache, resolve, variables }) {
    const ctxRequire = (dependency) => {
        let cacheItem = modulesCache[dependency];
        if (cacheItem) {
            if (cacheItem.error) {
                throw cacheItem.error;
            }
            return cacheItem.exports;
        }
        cacheItem = Object.create(null);
        modulesCache[dependency] = cacheItem;
        try {
            const content = resolve(dependency);
            cacheItem.exports = content;
        } catch (err) {
            cacheItem.error = err;
        }
        if (cacheItem.error) {
            throw cacheItem.error;
        }
        return cacheItem.exports;
    };
    const ctxExports = Object.create(null);
    const vmContext = {
        ...variables,
        __filename,
        __dirname: path.dirname(filename),
        module: {
            require: ctxRequire,
            exports: ctxExports,
        },
        require: ctxRequire,
        exports: ctxExports,
    };
    const vmOptions = {
        filename,
        timeout: 1000,
    };
    try {
        const result = vm.runInNewContext(code, vmContext, vmOptions);
        return {
            result,
            exports: vmContext.module.exports,
        };
    } catch (err) {
        return {
            error: new ErrorWrapper(err),
        };
    }
}

function run(code, options) {
    const modulesCache = Object.create(null);
    const item = runJs({
        code,
        filename: path.resolve('__main__'),
        variables: options ? options.variables : {},
        resolve: options && options.resolve,
        modulesCache,
    });
    if (item.error) {
        throw item.error;
    }
    return item.result;
}

Object.assign(exports, { run });
