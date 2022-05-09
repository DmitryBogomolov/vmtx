# vmtx

[![CI](https://github.com/DmitryBogomolov/vmtx/actions/workflows/ci.yml/badge.svg)](https://github.com/DmitryBogomolov/vmtx/actions/workflows/ci.yml)

Executes code in sandbox using `vm` package.

```javascript
const assert = require('assert/strict');
const { run } = require('vmtx');

assert.strictEqual(execute('123'), 123);
```

## Examples

### Load local files

Path to file is resolved against working directory.

```javascript
run(`require('./path/to/file')`);
```

But can also be resolved against custom directory.

```javascript
run({
    code: 'require("./path/to/file")',
    rootdir: './path/to/dir',
});
```

### Execute js file

```javascript
const { runFile } = require('vmtx');
runFile('./path/to/file');
```

### Variables

```javascript
run({
    code: 'a + b',
    variables: {
        a: 1,
        b: 2,
    },
});
```
Variables are visible only in main code.

### Globals

```javascript
run({
    code: 'doSomething();',
    globals: {
        doSomething() { }
    },
});
```
Unlike variables globals are visible in other modules also.

### Modules

```javascript
run({
    code: `
        const myModule = require("my-test");
        const myFile = require("./my-file");

        console.log(myModule.myData);
        console.log(myFile.myData);
    `,
    loadModule(moduleName) {
        if (moduleName === 'my-test') {
            return { myData: 'Hello World' };
        }
        return null;
    },
    isFile(filepath) {
        return filepath === path.resolve('./my-file.js');
    },
    readFile(filepath) {
        if (filepath === path.resolve('./my-file.js')) {
            return { myData: 'Hello World' };
        }
    },
});
```

### Execution timeout

```javascript
run({
    code: 'doSomeLongRunningTask()',
    timeout: 30,
});
```

## License

[MIT](LICENSE)
