var CodeGenerator = (function () {
  "use strict";

  var codeGenerator = function () {
  };

  /**
   * @type {{
   *  alphanumericChars: string,
   *  numericChars: string,
   *  alphanumericRegex: RegExp,
   *  numericRegex: RegExp,
   *  alphanumericMoreRegex: RegExp,
   *  numericMoreRegex: RegExp,
   *  sparsity: number,
   *  existingCodesLoader: Function
   * }}
   */
  var defaultOptions = {
    alphanumericChars: '123456789ABCDEFGHJKLMNPQRSTUVWXYZ',
    numericChars: '0123456789',
    alphanumericRegex: /\*(?!\+)/g,
    numericRegex: /#(?!\+)/g,
    alphanumericMoreRegex: /\*\+/g,
    numericMoreRegex: /#\+/g,
    sparsity: 1,
    existingCodesLoader: function (pattern) {
      return [];
    }
  };

  codeGenerator.prototype = {

    /**
     * Generates howMany codes following a pattern.
     * In the pattern, the following characters are replaced:
     * # -> with a single numeric character
     * * -> with a single alphanumeric character (excluding ambiguous letters and numbers)
     * #+ -> with more numeric characters (the number of characters depends on howMany codes we need to generate)
     * *+ -> with more alphanumeric characters (idem)
     *
     * @param {string} pattern
     * @param {number} [howMany]
     * @param {Object} [options]
     * @param {string} [options.alphanumericChars]
     * @param {string} [options.numericChars]
     * @param {RegExp} [options.alphanumericRegex]
     * @param {RegExp} [options.numericRegex]
     * @param {RegExp} [options.alphanumericMoreRegex]
     * @param {RegExp} [options.numericMoreRegex]
     * @param {number} [options.sparsity]
     * @param {Function} [options.existingCodesLoader]
     * @throws {Error}
     * @returns {Array}
     */
    generateCodes: function (pattern, howMany, options) {
      options = mergeOptions(defaultOptions, options);
      if (options.sparsity < 1) options.sparsity = 1;
      howMany = howMany || 1;
      var howManySparse = Math.ceil(howMany * options.sparsity);

      var repetitions = [];
      var existingCodes = loadExistingCodes(pattern, options);
      var existingCount = Object.keys(existingCodes).length;
      var existingCountSparse = Math.ceil(existingCount * options.sparsity);

      if (hasMorePlaceholder(pattern, options)) {
        repetitions = calculateRepetitions(pattern, howManySparse, existingCountSparse, options);
      } else {
        checkRequestedCode(pattern, options, existingCountSparse, howManySparse, howMany, existingCount)
      }

      var combinedRegexp = combineRegexps([
        options.alphanumericMoreRegex,
        options.numericMoreRegex,
        options.alphanumericRegex,
        options.numericRegex
      ], 'g');

      var generated = [];

      while (generated.length < howMany) {
        var rep = repetitions.slice();
        var code = pattern.replace(combinedRegexp, ( function (match, alphanumericMore, numericMore, alphanumeric, numeric) {
          switch (true) {
            case (alphanumericMore !== undefined):
              return this.randomChars(options.alphanumericChars, rep.shift());
            case (numericMore !== undefined):
              return this.randomChars(options.numericChars, rep.shift());
            case (alphanumeric !== undefined):
              return this.randomChars(options.alphanumericChars, 1);
            case (numeric) !== undefined:
              return this.randomChars(options.numericChars, 1);
          }
        }).bind(this));

        if (!existingCodes.hasOwnProperty(code)) {
          generated.push(code);
          existingCodes[code] = true;
        }
      }

      return generated;
    },

    /**
     * Generates a random string of length howMany given a list of allowed characters
     *
     * @param {string} allowedChars
     * @param {number} howMany
     * @returns {string}
     */
    randomChars: function (allowedChars, howMany) {
      var text = '';
      for (var i = 0; i < howMany; i++) {
        text += allowedChars.charAt(Math.floor(Math.random() * allowedChars.length));
      }
      return text;
    }
  };

  function loadExistingCodes (pattern, options) {
    var existingCodes = [];
    if (typeof options.existingCodesLoader === 'function') {
      existingCodes = options.existingCodesLoader(pattern);
    }
    return convertToObject(existingCodes);
  }

  /**
   * Converts an array of strings to an object so that all the elements of the array are keys of the object
   *
   * @param ary
   * @returns {{}}
   */
  function convertToObject (ary) {
    var obj = {};
    ary.forEach( function(el) {
      obj[el] = true;
    });
    return obj;
  }

  /**
   * Throws an error if the requested codes are more than the available ones given the fixed part of the pattern
   *
   * @param {string} pattern
   * @param {Object} options
   * @param {number} existingCountSparse
   * @param {number} howManySparse
   * @param {number} howMany
   * @param {number} existingCount
   * @throws {Error}
   */
  function checkRequestedCode (pattern, options, existingCountSparse, howManySparse, howMany, existingCount) {
    var possible = countNonRepeatingPermutations(pattern, options);
    var available = possible - existingCountSparse;
    if (available < howManySparse) {
      throw new Error(
        'Cannot generate ' + howMany +
        ' codes. Maximum: ' + Math.round(possible / options.sparsity) +
        ', existing: ' + existingCount +
        ', sparsity: ' + options.sparsity
      );
    }
  }

  /**
   * @param {string} pattern
   * @param {number} howMany
   * @param {number} existing
   * @param {Object} options
   * @returns {Array}
   */
  function calculateRepetitions (pattern, howMany, existing, options) {
    var nonRepeatingPermutations = countNonRepeatingPermutations(pattern, options);
    var alphanumericMatches = pattern.match(options.alphanumericMoreRegex);
    var numericMatches = pattern.match(options.numericMoreRegex);
    howMany = Math.max(1, howMany - nonRepeatingPermutations + existing);

    var totalMatches = (alphanumericMatches ? alphanumericMatches.length : 0) +
      (numericMatches ? numericMatches.length : 0);
    var distribute = Math.ceil(howMany / totalMatches);
    var combined = combineRegexps([options.alphanumericMoreRegex, options.numericMoreRegex], 'g');
    var repetitions = [];
    pattern.replace(combined, (function (match, alphanum, numeric) {
      switch (true) {
        case (alphanum !== undefined):
          repetitions.push(neededChars(distribute, options.alphanumericChars));
          break;
        case (numeric) !== undefined:
          repetitions.push(neededChars(distribute, options.numericChars));
          break;
      }
    }).bind(this));
    return repetitions;
  }

  /**
   * Returns the possible permutations given a pattern relative to the non-repeating part
   *
   * @param {string} pattern
   * @param {Object} options
   * @returns {number}
   */
  function countNonRepeatingPermutations (pattern, options) {
    var numericPermutations = countPermutations(pattern, options.numericRegex, options.numericChars);
    var alphanumericPermutations = countPermutations(pattern, options.alphanumericRegex, options.alphanumericChars);
    if (numericPermutations > 0 && alphanumericPermutations > 0) {
      return numericPermutations * alphanumericPermutations;
    }
    return numericPermutations + alphanumericPermutations;
  }

  function countPermutations (pattern, matcher, chars) {
    var matches = pattern.match(matcher);
    return matches ? Math.pow(chars.length, matches.length) : 0;
  }

  /**
   * Counts the number of characters needed to generate a certain number of permutations
   * with a given list of allowed characters.
   *
   * @param {number} howMany
   * @param {string} allowedChars
   * @returns {number}
   */
  function neededChars (howMany, allowedChars) {
    return Math.ceil(Math.log(howMany) / Math.log(allowedChars.length));
  }

  /**
   * @param {Array} regexps
   * @param {string} flags
   * @returns {RegExp}
   */
  function combineRegexps (regexps, flags) {
    var combined = [];
    regexps.forEach(function (regexp) {
      combined.push('(' + regexp.source + ')');
    });
    return new RegExp(combined.join('|'), flags);
  }

  /**
   * Whether the pattern contains the alphanumericMore (*+) or the numericMore (#+) placeholders.
   *
   * @param {string} pattern
   * @param {Object} options
   * @returns {boolean}
   */
  function hasMorePlaceholder (pattern, options) {
    return options.alphanumericMoreRegex.test(pattern) || options.numericMoreRegex.test(pattern);
  }

  /**
   * Merges two objects and returns a new object
   *
   * @param {Object} defaultOptions
   * @param {Object} options
   * @returns {Object}
   */
  function mergeOptions (defaultOptions, options) {
    var result = {};
    var opts = options || {};
    for (var i in defaultOptions) {
      if (defaultOptions.hasOwnProperty(i)) {
        result[i] = (opts.hasOwnProperty(i)) ? opts[i] : defaultOptions[i];
      }
    }
    return result;
  }

  return codeGenerator;

})();

module.exports = CodeGenerator;