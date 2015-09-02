describe('CodeGenerator', function () {

  "use strict";

  var CodeGenerator = require('../../lib/code-generator.js');
  var cg = new CodeGenerator();


  it('generates the correct number of random chars', function () {
    var rand = cg.randomChars('A', 66);
    expect(rand.length).toBe(66);
  });

  it('generates random chars from a list', function () {
    var rand = cg.randomChars('ABCDEFGHIJKLMNOPQRSTUVWXYZ', 100);
    var pattern = /\d/;
    expect(rand.match(pattern)).toBe(null);
  });

  it('creates enough numeric characters', function () {

    var codes = cg.generateCodes('#+', 100, {sparsity: 1});
    for (var i in codes) {
      expect(codes[i].length).toBe(2);
    }

    var codes = cg.generateCodes('#+', 101, {sparsity: 1});
    for (var i in codes) {
      expect(codes[i].length).toBe(3);
    }
  });

  it('creates enough alphanumeric characters', function () {
    var codes = cg.generateCodes('*+', 33, {sparsity: 1});
    for (var i in codes) {
      expect(codes[i].length).toBe(1);
    }

    var codes = cg.generateCodes('*+', 34, {sparsity: 1});
    for (var i in codes) {
      expect(codes[i].length).toBe(2);
    }
  });

  it('create the enough characters with custom options', function () {
    var codes = cg.generateCodes('#+', 4, {numericChars: '01', sparsity: 1});
    for (var i in codes) {
      expect(codes[i].length).toBe(2);
    }

    var codes = cg.generateCodes('#+', 5, {numericChars: '01', sparsity: 1});
    for (var i in codes) {
      expect(codes[i].length).toBe(3);
    }
  });

  it('respect fixed part of the pattern', function () {
    var codes = cg.generateCodes('ABC#+123');
    expect(codes[0].substring(0, 3)).toBe('ABC');
    expect(codes[0].substring(codes[0].length - 3)).toBe('123');
  });

  it('loads external codes', function () {
    var externalLoader = function () {
      return ['ABC01'];
    };
    var codes = cg.generateCodes('ABC#+', 3, {numericChars: '01', existingCodesLoader: externalLoader, sparsity: 1});
    expect(codes.length).toBe(3);
    expect(codes.indexOf('ABC01')).toBe(-1);
  });

  it('throws error when too many codes are required', function () {
    expect(function () {
      cg.generateCodes('ABC#', 11, {sparsity: 1});
    }).toThrowError();
  });

  it('creates longer codes when shorter are taken', function () {
    var existingLoader = function () {
      return ['0ABC0', '0ABC1', '1ABC0', '1ABC1'];
    };
    var codes = cg.generateCodes('#ABC#+', 2, {numericChars: '01', existingCodesLoader: existingLoader, sparsity: 1});
    expect(codes.length).toBe(2);
    var existing = existingLoader();
    existing.forEach(function (element) {
      expect(codes).not.toContain(element);
    });
    codes.forEach(function (element) {
      expect(element.length).toBe(6);
    });
  });

  it('creates fixed lenght codes sparsely', function () {
    var codes = cg.generateCodes('##', 66, {sparsity: 1.5});
    expect(codes.length).toBe(66);

    expect(function () {
      cg.generateCodes('##', 67, {sparsity: 1.5});
    }).toThrowError();
  });

  it('creates variable length codes sparsely', function () {
    var codes = cg.generateCodes('#+', 10, {sparsity: 2});
    codes.forEach(function(code) {
      expect(code.length).toBe(2);
    });
  });

});
