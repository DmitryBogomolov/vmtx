const path = require('path');
const { runJs } = require('./js-runner');
const { runJson } = require('./json-runner');

class ModuleLoader {
    constructor(rootdir, loadModuleHandler, isFileHandler, readFileHandler) {
        this._rootdir = rootdir;
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
                throw new Error(`module ${moduleName} is not found`);
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
                throw new Error(`${modulePath} is outside of root directory`);
            }
            ext = path.extname(modulePath);
            if (ext === '') {
                if (this._isFileHandler(modulePath)) {
                    throw null;
                }
                if (this._isFileHandler(modulePath + '.js')) {
                    const js = this._readFileHandler(modulePath + '.js');
                }
                if (this._isFileHandler(modulePath + '.json')) {
                    const json = this._readFileHandler(modulePath + '.json');

                }
                if (this._isFileHandler(path.join(modulePath, 'index.js'))) {
                    this._readFileHandler(path.join(modulePath, 'index.js'));
                }
                if (this._isFileHandler(path.join(modulePath, 'index.json'))) {
                    this._readFileHandler(path.join(modulePath, 'index.json'));
                }
            }
            if (ext === '.js') {
                if (this._isFileHandler(modulePath)) {
                    this._readFileHandler(modulePath);
                } else {
                    throw null;
                }
            }
            if (ext === '.json') {
                if (this._isFileHandler(modulePath)) {
                    this._readFileHandler(modulePath);
                } else {
                    throw null;
                }
            }
            throw null;
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

exports.ModuleLoader = ModuleLoader;
