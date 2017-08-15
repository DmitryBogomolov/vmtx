const a = require('./tester-1');
const b = require('./tester-2');

b.test = 'Hello';

module.exports = {
    a: a + 1,
    b
};
