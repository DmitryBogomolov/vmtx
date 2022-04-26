# vmtx

[![CI](https://github.com/DmitryBogomolov/vmtx/actions/workflows/ci.yml/badge.svg)](https://github.com/DmitryBogomolov/vmtx/actions/workflows/ci.yml)

[![Coverage Status](https://coveralls.io/repos/github/DmitryBogomolov/vmtx/badge.svg?branch=master)](https://coveralls.io/github/DmitryBogomolov/vmtx?branch=master)

Executes code in sandbox using `vm` package.

```javascript
const execute = require('vmtx');

assert.equal(execute('123'), 123);
```

## Examples

### Load local files

Path to file is resolved against working directory.

```javascript
execute(`require('./path/to/file')`);
```

But can also be resolved against custom directory.

```javascript
execute({
    code: `require('./path/to/file')`,
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

### Inherit real modules

```javascript
execute({
    code: `
        const fs = require('fs');
        const path = require('path');

        fs.writeFile(path.resolve('./test.txt'), 'Hello', 'utf8');
    `,
    modules: {
        fs: execute.INHERIT,
        path: execute.INHERIT
    }
});
```

### Provide custom modules

```javascript
execute({
    code: `
        const myModule = require('my-test');
        const myFile = require('./my-file');

        console.log(myModule.myData);
        console.log(myFile.myData);
    `,
    modules: {
        'my-test': { myData: 'Hello module' },
        [path.resolve('./my-file')]: { myData: 'Hello file' }
    }
});
```

### Control execution timeout

```javascript
execute({
    code: `
        doSomeLongRunningTask()
    `,
    timeout: 30
});
```

## License

  [MIT](LICENSE)
