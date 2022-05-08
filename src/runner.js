const path = require('path');
const fs = require('fs');
const { ModuleLoader } = require('./module-loader');
const { runJs } = require('./js-runner');

function defaultLoadModule() {
    return null;
}

function defaultIsFile(filepath) {
    return fs.existsSync(filepath);
}

function defaultReadFile(filepath) {
    return fs.readFileSync(filepath, { encoding: 'utf8' });
}

function pickFunction(value, defaultValue) {
    return typeof value === 'function' ? value : defaultValue;
}

function normalizeOptions(options) {
    const opts = typeof options === 'string' ? { code: options } : (options || {});
    return {
        code: opts.code,
        globals: opts.globals || {},
        rootdir: opts.rootdir || process.cwd(),
        loadModule: pickFunction(opts.loadModule, defaultLoadModule),
        isFile: pickFunction(opts.isFile, defaultIsFile),
        readFile: pickFunction(opts.readFile, defaultReadFile),
    };
}

function run(options) {
    const { code, globals, rootdir, loadModule, isFile, readFile } = normalizeOptions(options);
    if (!code) {
        throw new Error('code is not provided');
    }
    const loader = new ModuleLoader(rootdir, loadModule, isFile, readFile);
    return runJs(code, path.join(rootdir, '__main__'), loader, globals);
}

exports.run = run;
