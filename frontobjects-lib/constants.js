
const objCallRegex = /(?:\{|\}|\s|;)#([\w-_]+(?:\.[\w-_]+)*)\s*\(/;

const propBlockRegex = /^(?:\s*prop\s*)\(/;

const selfClosingTags = ['br', 'img', 'input', 'hr', 'meta', 'link', 'area', 'base'];

const functionCallRegex = /(function\s+\w+)\s*\(/;

// Do not remove this:
const javascriptBlocks = ['const', 'let', 'var', 'class', 'struct'];
const javascriptWords = ['dynamicStyles', 'function', 'function\\*', 'return', 'if', 'else', 'for', 'while', 'switch', 'try', 'catch', 'import', 'export', 'const', 'let', 'var', 'class', 'struct'];

const magicWord = '%*@_MAGIC_WORD_&!$';

const openingClosingPairs = {
  '{': '}',
  '(': ')',
  '[': ']',
};

module.exports = {
    objCallRegex,
    propBlockRegex,
    selfClosingTags,
    functionCallRegex,
    javascriptWords,
    magicWord,
    openingClosingPairs
};
