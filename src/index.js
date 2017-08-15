const vm = require('vm');
const fs = require('fs');
const path = require('path');

const PARSERS = {
    '.js': runCode,
    '.json': JSON.parse
};

const DEFAULT_GLOBALS_LIST = [
    'Object', 'String', 'Number', 'Boolean', 'Array', 'Date', 'Buffer',
    'Function', 'RegExp', 'Promise', 'Error',
    'console',
    'Map', 'Set', 'WeakMap', 'WeakSet',
    'setTimeout', 'clearTimeout',
    'setInterval', 'clearInterval',
    'setImmediate', 'clearImmediate'
];
const DEFAULT_GLOBALS = {};
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
    const parseContent = PARSERS[path.extname(pathToFile)] || PARSERS['.js'];
    try {
        const content = fs.readFileSync(pathToFile, 'utf8');
        obj.data = parseContent(content, context, obj.dir);
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
    obj.data = context.packages[name] || null;
    return obj;
}

function loadModule(name, context, dir) {
    const load = name.startsWith('/') || name.startsWith('.')
        ? loadLocalModule : loadNodeModule;
    const obj = load(name, context, dir);
    if (obj.error) {
        throw obj.error;
    }
    return obj.data;
}

function runCode(code, context, dir) {
    const _exports = {};
    const _module = { exports: _exports };
    vm.runInNewContext(code, Object.assign({}, context.globals, {
        exports: _exports,
        module: _module,
        require: arg => loadModule(arg, context, dir)
    }));
    return _exports === _module.exports ? _exports : _module.exports;
}

function runRootCode(_options) {
    const options = typeof _options === 'string' ? { code: _options } : _options;
    const context = {
        modules: {},
        packages: options.packages || {},
        globals: Object.assign({}, options.noDefaultGlobals || DEFAULT_GLOBALS, options.globals)
    };
    const dir = path.resolve(options.root || '.');
    if (options.code !== undefined) {
        return runCode(options.code, context, dir);
    }
    if (options.file !== undefined) {
        return loadLocalModule(options.file, context, dir).data;
    }
    throw new Error('Neiher *code* nor *file* is defined.');
}

module.exports = runRootCode;
