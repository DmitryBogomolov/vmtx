class ErrorWrapper extends Error {
    constructor(err) {
        super();
        /** @type {Error} */
        const { name, message, stack } = err;
        const lines = stack.split('\n');
        const idx = lines.findIndex((line) => line.indexOf('at Script.runInContext') >= 0);
        const cleanStack = lines.slice(0, idx).join('\n');
        this.name = name;
        this.message = message;
        this.stack = cleanStack;
    }
}

exports.ErrorWrapper = ErrorWrapper;
