# vmtx

[![Build Status](https://travis-ci.org/DmitryBogomolov/vmtx.svg?branch=master)](https://travis-ci.org/DmitryBogomolov/vmtx)

Executes code in sandbox using `vm` package.

```javascript
const execute = require('vmtx');

assert.equal(execute('module.exports = 123'), 123);
```

## Examples

### Load local files

Path to file is resolved against working directory.

```javascript
execute(`module.exports = require('./path/to/file')`);
```

But can also be resolved against custom directory.

```javascript
execute({
    code: `module.exports = require('./path/to/file')`,
    root: './path/to/dir'
});
```

### Execute file instead of code

```javascript
execute({ file: './path/to/file' });
```

### Default globals

Some globals are provided by default.

```javascript
execute(`console.log('Hello');`);
```

Use `noDefaultGlobals: true` to disable.

### Custom globals

```javascript
execute({
    code: 'doSomething();',
    globals: {
        doSomething() { }
    }
});
```

### Use real packages

```javascript
execute({
    code: `
        const fs = require('fs');
        const path = require('path');

        fs.writeFile(path.resolve('./test.txt'), 'Hello', 'utf8');
    `,
    realPackages: ['fs', 'path']
});
```

### Provide custom (stub) packages

```javascript
execute({
    code: `
        const myTest = require('my-test');

        console.log(myTest.myData);
    `,
    packages: {
        'my-test': { myData: 'Hello' }
    }
});
```

## License

  [MIT](LICENSE)
