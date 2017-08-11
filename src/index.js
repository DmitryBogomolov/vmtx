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

function throwFileNotFound(pathToFile) {
    throw new Error(`Cannot find '${pathToFile}`);
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
    const obj = context.modules[pathToFile] = {
        name: pathToFile,
        dir: path.dirname(pathToFile)
    };
    const parseContent = PARSERS[path.extname(pathToFile)] || PARSERS['.js'];
    const content = fs.readFileSync(pathToFile, 'utf8');
    obj.data = parseContent(content, context, obj.dir);
    return obj.data;
}

function loadNodeModule(name, context) {
    const obj = context.modules[name] = { name };
    obj.data = context.options.packages[name] || null;
    return obj.data;
}

function loadModule(name, context, dir) {
    const load = name.startsWith('/') || name.startsWith('.')
        ? loadLocalModule : loadNodeModule;
    return load(name, context, dir);
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
