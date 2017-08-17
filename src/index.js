const vm = require('vm');
const fs = require('fs');
const path = require('path');

const DEFAULT_TIMEOUT = 60000;

const INHERIT = Symbol('INHERIT');

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

function loadModuleCore(name, context, dir) {
    const cache = context.cache;
    const isLocal = name.startsWith('/') || name.startsWith('.');
    let moduleId = isLocal ? path.resolve(dir, name) : name;
    let obj = cache[moduleId];
    if (obj) {
        return obj;
    }
    if (!isLocal) {
        obj = cache[name] = { name };
        if (context.inherited[name]) {
            try {
                obj.data = require(name);
            } catch (e) {
                obj.error = e;
            }
        } else {
            obj.error = new Error(`Cannot find module '${name}'`);
        }
        return obj;
    }
    moduleId = guessFileExtension(moduleId);
    obj = cache[moduleId];
    if (obj) {
        return obj;
    }
    obj = cache[moduleId] = {
        name: moduleId,
        dir: path.dirname(moduleId)
    };
    const parseContent = PARSERS[path.extname(moduleId)] || PARSERS['.js'];
    try {
        const content = fs.readFileSync(moduleId, 'utf8');
        obj.data = parseContent(content, context, obj);
    } catch (e) {
        obj.error = e;
    }
    return obj;
}

function loadModule(...args) {
    const obj = loadModuleCore(...args);
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
    const ctx = Object.assign(
        Object.create(null),
        context.globals,
        {
            require: name => loadModule(name, context, dir),
        },
        ctxFields
    );
    return vm.runInNewContext(code, ctx, { timeout: context.timeout });
}

function runRootCode(_options) {
    const options = typeof _options === 'string' ? { code: _options } : _options;
    const cache = {};
    const modules = Object.assign({}, options.modules);
    const inherited = {};
    Object.keys(modules).forEach((name) => {
        const data = modules[name];
        if (data === INHERIT) {
            inherited[name] = true;
        } else {
            cache[name] = { name, data };
        }
    });
    const context = {
        cache,
        inherited,
        globals: Object.assign({}, options.noDefaultGlobals || DEFAULT_GLOBALS, options.globals),
        timeout: options.timeout > 0 ? Number(options.timeout) : DEFAULT_TIMEOUT
    };
    const dir = path.resolve(options.root || '.');
    if (options.code !== undefined) {
        return callVmRun(options.code, context, dir);
    }
    if (options.file !== undefined) {
        return loadModule(options.file, context, dir);
    }
    throw new Error('Neiher *code* nor *file* is defined.');
}

runRootCode.INHERIT = INHERIT;
module.exports = runRootCode;
