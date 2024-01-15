const { getRegexUntilClosing } = require('./common');


function renderStyle(style) {

  const styleList = parse(style);

  const seperatedStyle = seperateStyle(styleList);

  const stringResult = seperatedStyle.dynamicStyleList.map(style => `${style.selector}{${style.declarations.join(';')}}`).join('');

  return { stringResult, styleList: seperatedStyle.styleList };

}


function parse(style) {
  const styleList = [];
  const styleBlockRegex = /([^;}]*)\{/;

  const getDelerations = (inputString) => { return inputString.split(';').map(x => x.trim()).filter(x => x !== "") }

  while (match = getRegexUntilClosing(styleBlockRegex, style)) {
    styleList.push({ selector: match[1].trim(), declarations: getDelerations(match[2]) });
    style = style.replace(match[0], '');
  }

  styleList.unshift({ selector: '', declarations: getDelerations(style) });

  return styleList;
}


function seperateStyle(styleList) {
  const dynamicStyleList = [];

  styleList.forEach(style => {
    const dynamicStyle = { selector: style.selector, declarations: [] };

    style.declarations.forEach(declaration => {
      if (declaration.includes('##')) {
        dynamicStyle.declarations.push(declaration);
        style.declarations.splice(style.declarations.indexOf(declaration), 1);
      }
    });

    if (dynamicStyle.declarations.length > 0) {
      dynamicStyleList.push(dynamicStyle);
    }
  });

  return { styleList, dynamicStyleList };
}



module.exports = {
  renderStyle,
  parse
};
