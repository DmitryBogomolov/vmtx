# vmtx

[![Build Status](https://travis-ci.org/DmitryBogomolov/vmtx.svg?branch=master)](https://travis-ci.org/DmitryBogomolov/vmtx)

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
