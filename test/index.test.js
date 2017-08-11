const { expect } = require('chai');
const lib = require('../src/index');

describe('Lib', () => {
    it('executes simple code', () => {
        const result = lib('module.exports = 10;');

        expect(result).to.equal(10);
    });

    it('loads package', () => {
        const obj = { tag: 'test-package' };
        const result = lib('module.exports = require("test-package");', {
            packages: {
                'test-package': obj
            }
        });

        expect(result).to.deep.equal(obj);
    });

    it('loads local .js file', () => {
        const result = lib('module.exports = require("./test/data/tester-1.js");');

        expect(result).to.equal(102);
    });

    it('loads local .json file', () => {
        const result = lib('module.exports = require("./test/data/tester-2.json");');

        expect(result).to.deep.equal({  tag: 'test-data' });
    });

    it('fails when local file is not found', () => {
        let isThrown = false;
        try {
            lib('require("./test/data/no-file.js");');
        } catch (_) {
            isThrown = true;
        }
        expect(isThrown).to.be.true;
    });

    it('guesses local .js file extension', () => {
        const result = lib('module.exports = require("./test/data/tester-1");');

        expect(result).to.equal(102);
    });

    it('guesses local .json file extension', () => {
        const result = lib('module.exports = require("./test/data/tester-2");');

        expect(result).to.deep.equal({  tag: 'test-data' });
    });

    it('loads complex local file', () => {
        const result = lib('module.exports = require("./test/data/tester-3");');

        expect(result).to.deep.equal({
            'tester-1': 102,
            'tester-2': { tag: 'test-data' }
        });
    });
});
