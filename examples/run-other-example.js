const path = require('path');
const { expect } = require('chai');
const vmtx = require('..');

vmtx({
    file: './read-package-info',
    root: path.resolve('./examples'),
    modules: {
        [path.resolve()]: () => ({
            name: 'vmtx',
            license: 'MIT'
        }),
        chai: { expect }
    }
});
