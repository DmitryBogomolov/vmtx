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
        let cached = this._cache.get(moduleName);
        if (cached) {
            return cached;
        }
        cached = {};
        try {
            const mod = this._loadModuleHandler(moduleName);
            if (mod === null) {
                throw moduleNotFound(moduleName);
            }
            cached.exports = mod;
        } catch (err) {
            cached.error = err;
        }
        this._cache.set(moduleName, cached);
        return cached;
    }

    _loadByPath(modulePath) {
        let cached = this._cache.get(modulePath);
        if (cached) {
            return cached;
        }
        cached = {};
        try {
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
                    cached.exports = runJs(js, filename, this);
                    // BREAK
                }
                filename = modulePath + JSON_EXT;
                if (this._isFileHandler(filename)) {
                    const json = this._readFileHandler(filename);
                    cached.exports = runJson(json);
                    // BREAK
                }
                filename = path.join(modulePath, INDEX_JS);
                if (this._isFileHandler(filename)) {
                    const js = this._readFileHandler(filename);
                    cached.exports = runJs(js, filename, this);
                    // BREAK
                }
                filename = path.join(modulePath, INDEX_JSON);
                if (this._isFileHandler(filename)) {
                    const json = this._readFileHandler(filename);
                    cached.exports = runJson(json);
                    // BREAK
                }
            }
            if (ext === JS_EXT) {
                if (this._isFileHandler(modulePath)) {
                    const js = this._readFileHandler(modulePath);
                    cached.exports = runJs(js, modulePath, this);
                    // BREAK
                } else {
                    throw moduleNotFound(moduleNotFound);
                }
            }
            if (ext === JSON_EXT) {
                if (this._isFileHandler(modulePath)) {
                    const json = this._readFileHandler(modulePath);
                    cached.exports = runJson(json);
                    // BREAK
                } else {
                    throw moduleNotFound(modulePath);
                }
            }
            throw moduleNotFound(modulePath);
        } catch (err) {
            cached.error = err;
        }
        return cached;
    }

    load(modulePath, dir) {
        let moduleInfo;
        if (modulePath.startsWith('/') || modulePath.startsWith('./') || modulePath.startsWith('../')) {
            moduleInfo = this._loadByPath(path.resolve(dir, modulePath));
        } else {
            moduleInfo = this._loadByName(modulePath);
        }
        if (moduleInfo.error) {
            throw moduleInfo.error;
        }
        return moduleInfo.exports;
    }
}

function moduleNotFound(modulePath) {
    throw new Error(`Module "${modulePath}" is not found`);
}

exports.ModuleLoader = ModuleLoader;
