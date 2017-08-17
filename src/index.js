const vm = require('vm');
const fs = require('fs');
const path = require('path');

const DEFAULT_TIMEOUT = 60000;

const DEFAULT_GLOBALS_LIST = [
    'Buffer',
    'console',
    'setTimeout', 'clearTimeout',
    'setInterval', 'clearInterval',
    'setImmediate', 'clearImmediate'
];
const DEFAULT_GLOBALS = {
    process: {
        nextTick: process.nextTick,
        exit: (code) => {
            throw new Error(code);
        }
    }
};
DEFAULT_GLOBALS_LIST.forEach((name) => {
    DEFAULT_GLOBALS[name] = global[name];
});

function checkFileExists(pathToFile, ext) {
    const pathWithExt = pathToFile + ext;
    return fs.existsSync(pathWithExt) ? pathWithExt : null;
}

function guessFileExtension(pathToFile) {
    if (path.extname(pathToFile) !== '') {
        return pathToFile;
    }
    return checkFileExists(pathToFile, '.js')
        || checkFileExists(pathToFile, '.json') || pathToFile;
}

const PARSERS = {
    '.js': runFileCode,
    '.json': JSON.parse
};

function loadLocalModule(name, context, dir) {
    const pathToFile = guessFileExtension(path.resolve(dir, name));
    const cache = context.modules;
    if (cache[pathToFile]) {
        return cache[pathToFile];
    }
    const obj = cache[pathToFile] = {
        name: pathToFile,
        dir: path.dirname(pathToFile)
    };
    if (context.packages[pathToFile]) {
        obj.data = context.packages[pathToFile];
        return obj;
    }
    const parseContent = PARSERS[path.extname(pathToFile)] || PARSERS['.js'];
    try {
        const content = fs.readFileSync(pathToFile, 'utf8');
        obj.data = parseContent(content, context, obj);
    } catch (e) {
        obj.error = e;
    }
    return obj;
}

function loadNodeModule(name, context) {
    const cache = context.modules;
    if (cache[name]) {
        return cache[name];
    }
    const obj = cache[name] = { name };
    try {
        obj.data = context.getPackage(name);
    } catch (e) {
        obj.error = e;
    }
    return obj;
}

function loadModule(name, context, dir) {
    const load = name.startsWith('/') || name.startsWith('.')
        ? loadLocalModule : loadNodeModule;
    return returnLoadedModule(load(name, context, dir));
}

function returnLoadedModule(obj) {
    if (obj.error) {
        throw obj.error;
    }
    return obj.data;
}

function runFileCode(code, context, obj) {
    const _exports = {};
    const _module = { exports: _exports };
    callVmRun(code, context, obj.dir, {
        exports: _exports,
        module: _module,
        __filename: obj.name,
        __dirname: obj.dir
    });
    return _exports === _module.exports ? _exports : _module.exports;
}

function callVmRun(code, context, dir, ctxFields) {
    const ctx = Object.assign(Object.create(null), context.globals, {
        require: arg => loadModule(arg, context, dir),
    }, ctxFields);
    return vm.runInNewContext(code, ctx, { timeout: context.timeout });
}

function createPackageGetter(realList, customMap) {
    const cache = Object.assign({}, customMap);
    return (name) => {
        if (cache[name]) {
            return cache[name];
        } else if (realList.indexOf(name) >= 0) {
            return (cache[name] = require(name));
        } else {
            throw new Error(`Cannot find module '${name}'`);
        }
    };
}

function runRootCode(_options) {
    const options = typeof _options === 'string' ? { code: _options } : _options;
    const context = {
        modules: {},
        packages: Object.assign({}, options.packages),
        getPackage: createPackageGetter(options.realPackages || [], options.packages),
        globals: Object.assign({}, options.noDefaultGlobals || DEFAULT_GLOBALS, options.globals),
        timeout: options.timeout > 0 ? Number(options.timeout) : DEFAULT_TIMEOUT
    };
    const dir = path.resolve(options.root || '.');
    if (options.code !== undefined) {
        return callVmRun(options.code, context, dir);
    }
    if (options.file !== undefined) {
        return returnLoadedModule(loadLocalModule(options.file, context, dir));
    }
    throw new Error('Neiher *code* nor *file* is defined.');
}

module.exports = runRootCode;
