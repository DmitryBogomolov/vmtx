const path = require('path');
const { runJs } = require('./js-runner');
const { runJson } = require('./json-runner');

const JS_EXT = '.js';
const JSON_EXT = '.json';
const INDEX_JS = 'index' + JS_EXT;
const INDEX_JSON = 'index' + JSON_EXT;

class ModuleLoader {
    constructor(rootdir, globals, loadModuleHandler, isFileHandler, readFileHandler) {
        this._rootdir = rootdir;
        this.globals = globals;
        this._loadModuleHandler = loadModuleHandler;
        this._isFileHandler = isFileHandler;
        this._readFileHandler = readFileHandler;
        this._cache = new Map();
    }

    _loadByName(moduleName) {
        const mod = this._loadModuleHandler(moduleName);
        if (mod === null) {
            throw moduleNotFound(moduleName);
        }
        return mod;
    }

    _loadByPath(modulePath) {
        if (!modulePath.startsWith(this._rootdir)) {
            throw new Error(`Module "${modulePath}" is outside of root directory`);
        }
        const ext = path.extname(modulePath);
        let filename = modulePath;
        if (ext === '') {
            if (this._isFileHandler(filename)) {
                throw moduleNotFound(filename);
            }
            filename = modulePath + JS_EXT;
            if (this._isFileHandler(filename)) {
                const js = this._readFileHandler(filename);
                return runJs(js, filename, this);
            }
            filename = modulePath + JSON_EXT;
            if (this._isFileHandler(filename)) {
                const json = this._readFileHandler(filename);
                return runJson(json);
            }
            filename = path.join(modulePath, INDEX_JS);
            if (this._isFileHandler(filename)) {
                const js = this._readFileHandler(filename);
                return runJs(js, filename, this);
            }
            filename = path.join(modulePath, INDEX_JSON);
            if (this._isFileHandler(filename)) {
                const json = this._readFileHandler(filename);
                return runJson(json);
            }
        }
        if (ext === JS_EXT) {
            if (this._isFileHandler(modulePath)) {
                const js = this._readFileHandler(modulePath);
                return runJs(js, modulePath, this);
            } else {
                throw moduleNotFound(moduleNotFound);
            }
        }
        if (ext === JSON_EXT) {
            if (this._isFileHandler(modulePath)) {
                const json = this._readFileHandler(modulePath);
                return runJson(json);
            } else {
                throw moduleNotFound(modulePath);
            }
        }
        throw moduleNotFound(modulePath);
    }

    load(moduleName, dir) {
        const isRelativePath = isRelativeModulePath(moduleName);
        const modulePath = isRelativePath ? path.resolve(dir, moduleName) : moduleName;
        let cached = this._cache.get(modulePath);
        if (!cached) {
            cached = {};
            try {
                cached.exports = isRelativePath
                    ? this._loadByPath(modulePath)
                    : this._loadByName(modulePath);
            } catch (err) {
                cached.error = err;
            }
            this._cache.set(modulePath, cached);
        }
        if (cached.error) {
            throw cached.error;
        }
        return cached.exports;
    }
}

function isRelativeModulePath(moduleName) {
    return moduleName.startsWith('/') || moduleName.startsWith('./') || moduleName.startsWith('../');
}

function moduleNotFound(modulePath) {
    throw new Error(`Module "${modulePath}" is not found`);
}

exports.ModuleLoader = ModuleLoader;
