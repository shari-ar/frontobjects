
const he = require('he');
const cssesc = require('cssesc');
const constants = require('./constants');



function getRegexUntilClosing(regex, code) {
  const match = regex.exec(code);

  if (match !== null) {
    const closingIndex = getClosing(code, match.index);

    if (closingIndex !== -1) {
      const enclosedContent = code.substring(match.index + match[0].length, closingIndex);

      match.push(enclosedContent);

      match[0] = code.substring(match.index, closingIndex + 1);

      return match;
    }
  }

  return null;
}


function getClosing(code, startIndex) {
  let i = startIndex;
  let openingChar, closingChar;

  for (const char of code.slice(i)) {
    const desiredPair = Object.entries(constants.openingClosingPairs).find(pair => pair[0] === char);
    if (desiredPair) {
      openingChar = desiredPair[0];
      closingChar = desiredPair[1];
      break;
    }
    i++;
  }

  let count = 1;

  for (let j = i + 1; j < code.length; j++) {
    if (code[j] === openingChar) {
      count++;
    } else if (code[j] === closingChar) {
      count--;

      if (count === 0) {
        return j; // Found the matching closing character.
      }
    }
  }

  return -1; // Closing character not found.
}


// It uses the Fisher-Yates shuffle algorithm to shuffle the characters
// and then returns the first `length` characters of the shuffled string.
function getRandomString(length) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

  const charArray = characters.split('');

  for (let i = charArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [charArray[i], charArray[j]] = [charArray[j], charArray[i]];
  }

  return charArray.slice(0, length).join('');
}


function encode(txt) {

  if (txt === null) {
    return '';
  }

  return cssesc(
    he.encode(
      JSON.stringify(
        txt.
          replace(/\{/g, '!obrc!').
          replace(/}/g, '!cbrc!').
          replace(/\(/g, '!oprtc!').
          replace(/\)/g, '!cprtc!').
          replace(/#result/g, '!rslt!');
      )
    )
  );
}


function decode(txt) {

  if (txt === null) {
    return '';
  }

  return jhtmlDecode(
    JSON.parse(
      he.decode(
        txt.replace(/\\([0-9A-Fa-f]{1,6})\s?/g, (match, hex) => {
          return String.fromCharCode(parseInt(hex, 16));
        })
      )
    )
  );

}


function jhtmlDecode(txt) {
  if (txt === null) {
    return '';
  }

  return txt.
    replace(/!obrc!/g, '{').
    replace(/!cbrc!/g, '}').
    replace(/!oprtc!/g, '(').
    replace(/!cprtc!/g, ')').
    replace(/!rslt!/g, '#result');
}


module.exports = {
  getRegexUntilClosing,
  getClosing,
  getRandomString,
  encode,
  decode,
  jhtmlDecode
}
