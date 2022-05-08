const path = require('path');
const fs = require('fs');
const { ModuleLoader } = require('./module-loader');
const { JsParser } = require('./js-parser');
const { JsonParser } = require('./json-parser');

function defaultLoadModule() {
    return null;
}

function defaultIsFile(filepath) {
    try {
        return fs.statSync(filepath).isFile();
    } catch (_) {
        return false;
    }
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
        code: opts.code && String(opts.code),
        globals: opts.globals || {},
        variables: opts.variables || {},
        rootdir: opts.rootdir ? path.resolve(opts.rootdir) : process.cwd(),
        timeout: opts.timeout > 0 ? Number(opts.timeout) : 0,
        loadModule: pickFunction(opts.loadModule, defaultLoadModule),
        isFile: pickFunction(opts.isFile, defaultIsFile),
        readFile: pickFunction(opts.readFile, defaultReadFile),
    };
}

function run(options) {
    const {
        code, globals, variables, rootdir, timeout, loadModule, isFile, readFile,
    } = normalizeOptions(options);
    if (!code) {
        throw new Error('Code is not provided');
    }
    const filename = path.join(rootdir, '__main__');
    const moduleLoader = new ModuleLoader(rootdir, loadModule, isFile, readFile);
    const jsParser = new JsParser(globals, timeout);
    const jsonParser = new JsonParser();
    jsParser.setModuleLoader(moduleLoader);
    moduleLoader.setJsParser(jsParser);
    moduleLoader.setJsonParser(jsonParser);
    return jsParser.run(code, filename, variables);
}

exports.run = run;
