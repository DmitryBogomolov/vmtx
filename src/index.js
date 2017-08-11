const vm = require('vm');
const fs = require('fs');
const path = require('path');

const PARSERS = {
    '.js': runCode,
    '.json': JSON.parse
};

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
    obj.data = context.options.packages[name] || null;
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

function runCode(content, context, dir) {
    const _exports = {};
    const _module = { exports: _exports };
    vm.runInNewContext(content, {
        exports: _exports,
        module: _module,
        require: arg => loadModule(arg, context, dir)
    });
    return _exports === _module.exports ? _exports : _module.exports;
}

function runRootCode(content, options) {
    return runCode(content, {
        modules: {},
        options: Object.assign({
            packages: {}
        }, options)
    }, path.resolve('.'));
}

module.exports = runRootCode;
