# CodeGenerator

[![npm version](https://badge.fury.io/js/node-code-generator.svg)](http://badge.fury.io/js/node-code-generator)
![build](https://api.travis-ci.org/palicao/node-code-generator.svg?branch=master)

## Installation

```bash
$ npm install node-code-generator
```

## Usage

```js
var CodeGenerator = require('node-code-generator');
var generator = new CodeGenerator();
var pattern = 'ABC#+';
var howMany = 100;
var options = {};
// Generate an array of random unique codes according to the provided pattern:
var codes = generator.generateCodes(pattern, howMany, options);
```

## Pattern

In the pattern, the following characters are replaced:
* `#` with a single numeric character
* `*` with a single alphanumeric character (excluding ambiguous letters and numbers)
* `#+` with a variable number of numeric characters (the number of characters depends on how many codes we need to generate and on the sparsity option)
* `*+` with a variable number of alphanumeric characters (the number of characters depends on how many codes we need to generate and on the sparsity option)

## Options

Name | Default | Description
-----|---------|------------
`sparsity` | `1` | How sparse should the generated set be? The default setting generates a dense set, but probably if you are generating vouchers you want to provide an higer number to __avoid consecutive (guessable) codes__ 
`existingCodesLoader` | `function(pattern) { return []; }` | Provide a function that returns an array of previously generated codes for this pattern to __avoid duplicates__ 
`alphanumericChars` | `123456789ABCDEFGHJKLMNPQRSTUVWXYZ` | Characters that will be substituted to `*`
`numericChars` | `0123456789` | Characters that will be substituted to `#`
`alphanumericRegex` | `/\*(?!\+)/g` | Regular expression to match `*`
`numericRegex` | `/#(?!\+)/g` | Regular expression to match `#`
`alphanumericMoreRegex` | `/\*\+/g` | Regular expression to match `*+`
`numericMoreRegex` | `/#\+/g` | Regular expression to match `#+`

## Extra
The library also exposes the simple `randomChars(allowedChars, howMany)` function to simply generate random strings (based on Math.random(), so don't use it where security matters!

## Contribute
Fork -> Branch -> Pull request!

## License
MIT (see [LICENSE](https://github.com/palicao/node-code-generator/blob/master/LICENSE))
