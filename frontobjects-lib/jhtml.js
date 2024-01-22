const path = require('path');
const he = require('he');
const cssesc = require('cssesc');
const constants = require('./constants');
const { getRegexUntilClosing, getClosing, getRandomString, encode, decode, jhtmlDecode } = require('./common');
const { renderStyle, parse: parseStyle } = require('./jhtml-styles');


let globalStylesList = [];

const includedObjectsForExecuteJsFunc = [];

let viewData;


async function renderAsync(jhtml, options) {

  viewData = options;

  jhtml.functionName = 'main';

  putObjects(jhtml, options.jobjects);

  transformJhtmlFile(jhtml);

  const htmlBlocks = await executeJs(jhtml, options.jobjects);

  const htmlBlockTree = parse(htmlBlocks);

  solveStyles(htmlBlockTree);

  solveScripts(htmlBlockTree);

  // analyze(htmlBlockTree);

  addStyleTag(htmlBlockTree);

  addScriptTag(htmlBlockTree);

  const optimizedBlockTree = optimize(htmlBlockTree);

  let html = generateCode(optimizedBlockTree);

  return html;

}


function putObjects(jhtml, jobjects) {

  // Remove comments
  jhtml.code = jhtml.code.replace(/\/\*.*?\*\/|([^\\:]|^)\/\/.*$/gm, '');

  // Encode '{{', '}}', '@(', ')@', '##result'
  jhtml.code = jhtml.code
  .replace(/\{\{/g, encode('{').slice(6, -6))
  .replace(/}}/g, encode('}').slice(6, -6))
  .replace(/@\(/g, encode('(').slice(6, -6))
  .replace(/\)@/g, encode(')').slice(6, -6))
  .replace(/##result/g, encode('#result').slice(6, -6));

  jhtml.code = fixFunctions(jhtml.code);

  if (!jhtml.subFunctions) { jhtml.subFunctions = []; }

  let objCallMatch;
  while ((objCallMatch = getRegexUntilClosing(constants.objCallRegex, jhtml.code)) !== null) {

    const relativePath = objCallMatch[1].replace(/\./g, '/').replace(/upDir/gi, '..') + '.jobj';
    const absolutePath = path.resolve(path.dirname(jhtml.path), relativePath);

    const jobject = jobjects.find(x => x.path.split('-').map((word, index) => index !== 0 ? word.charAt(0).toUpperCase() + word.slice(1) : word).join('') === absolutePath);

    if (jobject) {
      // try {

      // Lock(jobject.status);
      if (!jhtml.subFunctions.includes(jobject.functionName)) {
        // Recursively run putObjects and then transform
        if (!jobject.functionName) {
          const functionName = getRandomString(20);
          jobject.functionName = functionName;
          putObjects(jobject, jobjects);
          transformJhtmlFile(jobject);
        }
        jhtml.subFunctions.push(jobject.functionName);
      }
      // unlock(jobject.status);

      const awaitAsync = awaitAsyncCheck([jobject.functionName, objCallMatch[2]]) ? 'await ' : '';

      jhtml.code = jhtml.code.replace(objCallMatch[0], `;result += ${awaitAsync}${jobject.functionName}(${objCallMatch[2]});`);

      // } catch (error) {
      // }
    } else {
      throw new Error(`Jobject not found for path: ${absolutePath}\n${objCallMatch}`);
    }
  }

}


function fixFunctions(jhtmlCode) {

  let functionCallMatch;
  while ((functionCallMatch = getProblematicFunctionRegexUntilClosing(jhtmlCode)) !== null) {

    const transformedFunction = `${functionCallMatch[1]}(${functionCallMatch[2]}){let result = '';${functionCallMatch[3]};return result;}`;

    jhtmlCode = jhtmlCode.replace(functionCallMatch[0], transformedFunction);

  }

  return jhtmlCode;
}


function getProblematicFunctionRegexUntilClosing(jhtmlCode) {

  let index = 0;
  while (index < jhtmlCode.length) {

    const match = getRegexUntilClosing(constants.functionCallRegex, jhtmlCode.substring(index));
    if (match === null) { break; }

    const matchEndIndex = index + match.index + match[0].length;
    const obrcIndex = jhtmlCode.indexOf('{', matchEndIndex);
    if (obrcIndex === -1) { break; }

    const whiteSpace = jhtmlCode.substring(matchEndIndex, obrcIndex).trim();
    const startOfBlock = jhtmlCode.substring(obrcIndex + 1).trim();

    if (whiteSpace === '' && !startOfBlock.startsWith('let result =')) {

      const cbrcIndex = getClosing(jhtmlCode, obrcIndex);
      match[0] = jhtmlCode.substring(index + match.index, cbrcIndex + 1);
      match.push(jhtmlCode.substring(obrcIndex + 1, cbrcIndex));

      return match;
    }

    index = matchEndIndex;
  }

  return null;
}


function transformJhtmlFile(jhtml) {

  jhtml.code = jhtml.code
    .replace(/\r\n/g, ' ')
    .replace(/#result/g, 'result');

  let functionInputs = '';

  const propMatch = getRegexUntilClosing(constants.propBlockRegex, jhtml.code);
  if (propMatch != null) {
    functionInputs = propMatch[1];
    jhtml.code = jhtml.code.replace(propMatch[0], '');
  }

  const transformedJhtml = transformJhtml(jhtml.code);

  const awaitAsync = awaitAsyncCheck([jhtml.functionName, transformedJhtml.stringResult]) ? 'async ' : '';

  jhtml.code = `;\n${awaitAsync}function ${jhtml.functionName}(${functionInputs}){ \nreturn ${transformedJhtml.stringResult};\n};`;

}


function transformJhtml(jhtmlCode) {

  const styleList = [];
  let jhtmlBlockMatch;
  while ((jhtmlBlockMatch = getJhtmlBlockRegexUntilClosing(jhtmlCode)) !== null) {

    const transformedjhtmlBlock = transformJhtmlBlock(jhtmlBlockMatch);

    jhtmlCode = jhtmlCode.replace(jhtmlBlockMatch[0], transformedjhtmlBlock.stringResult);

    if (transformedjhtmlBlock.styleList && transformedjhtmlBlock.styleList.length) {
      styleList.push(...transformedjhtmlBlock.styleList);
    }

  }

  if (awaitAsyncCheck([jhtmlCode])) {
    jhtmlCode = `await (async ()=>{ \nlet result = '';\n${jhtmlCode};\nreturn result; \n})()`;
  } else {
    jhtmlCode = `(()=>{ \nlet result = '';\n${jhtmlCode};\nreturn result; \n})()`;
  }

  return { stringResult: jhtmlCode, styleList };

}


function transformJhtmlBlock(jhtmlBlockMatch) {
  let result = {};
  if (jhtmlBlockMatch[1] === 'styles') {
    const compiledStyles = renderStyle(jhtmlBlockMatch[3]);
    compiledStyles.stringResult = `;\n;result += \` dynamicStyles { ${encode(compiledStyles.stringResult).replace(/##(\w+)/g, `$\{$1}`)}\n }\`;`;
    result = compiledStyles;
  } else if (jhtmlBlockMatch[1] === 'scripts') {
    result = { stringResult: `;\n;result += \` scripts { ${jhtmlBlockMatch[3]}\n }\`;` };
  } else {
    const transformedContent = transformJhtml(jhtmlBlockMatch[3]);

    let propertyArray;
    propertyArray = parseProperties(jhtmlBlockMatch[2]);
    let properties = propertyArray.map(p => `${p.key}=${p.value.startsWith('"') ? p.value : `"$\{${p.value}}"`}`).join(' ');

    if (transformedContent.styleList && transformedContent.styleList.length) {
      const className = getRandomString(10);
      globalStylesList.push(...addClassToStyleList(transformedContent.styleList, className));
      properties = addClassToAttributes(properties, className);
      result.styleList = [];
    }

    properties = properties.length ? `(${properties})` : '';

    result.stringResult = `;\n;result += \` ${jhtmlBlockMatch[1]} ${properties} { $\{${transformedContent.stringResult}\n} }\`;`;
  }
  return result;
}


function addClassToStyleList(styleList, clas) {
  const replaceSelectors = (array) => {
    array.forEach((style) => {
      style.selector = '.' + clas + style.selector
    });
  };

  replaceSelectors(styleList);
  return styleList;
}


function addClassToAttributes(attributes, clas) {
  const regex1 = /class\s*=\s*"/;
  const regex2_part1 = /class\s*=\s*\$\{/;
  const regex2_part2 = /\w+}/;

  if (regex1.test(attributes)) {
    attributes = attributes.replace(regex1, '$&' + clas + ' ');
  } else if ((new RegExp(regex2_part1 + regex2_part2)).test(attributes)) {
    attributes = attributes.replace(regex2_part1, '$&"' + clas + '"+ ');
  } else {
    attributes += ' class="' + clas + '"';
  }

  return attributes;
}


function parseProperties(value) {

  if (!value || value.trim() === '') {
    return [];
  }

  const properties = [];

  const eIndex = value.indexOf('=') !== -1 ? value.indexOf('=') : value.length;

  const varName = value.substring(0, eIndex).trim();

  const { varValue, rest } = separateVariableValue(value.substring(eIndex + 1));

  properties.push({ key: varName, value: varValue });

  return properties.concat(parseProperties(rest));

}


function separateVariableValue(value) {
  value = value.trim();

  if (!value) {
    return { varValue: '', rest: '' };
  }

  if (value.startsWith('"')) {
    const sepCharIndex = value.indexOf('"', 1) + 1;
    if (sepCharIndex === -1) { throw new Error(); }
    return { varValue: value.substring(0, sepCharIndex).trim(), rest: value.substring(sepCharIndex).trim() };
  }

  const sepCharIndex = value.indexOf(' ') === -1 ? value.length : value.indexOf(' ');
  return { varValue: value.substring(0, sepCharIndex).trim(), rest: value.substring(sepCharIndex).trim() };
}


function getJhtmlBlockRegexUntilClosing(jhtmlCode) {

  const jhtmlBlockNameRegexString = `(?<!${constants.javascriptWords.map(x => `\\b${x}\\s*\\W*\\s*`).join('|')}|\\;result\\s\\+\\=\\s\\\`\\s|\\.)(?!${constants.javascriptWords.map(x => `\\b${x}\\b`).join('|')})\\b(\\w+)\\b\\s*`;

  const jhtmlBlockRegexString = `${jhtmlBlockNameRegexString}\\{`;
  const jhtmlBlockRegex = new RegExp(jhtmlBlockRegexString, 'i');
  const match1 = getRegexUntilClosing(jhtmlBlockRegex, jhtmlCode);

  if (match1 !== null) {
    // Insert an empty string for properties (not applicable to JavaScript blocks).
    match1.splice(2, 0, '');
  }

  let index = 0;

  while (index < jhtmlCode.length) {
    const jhtmlBlockHasPropRegexString = `${jhtmlBlockNameRegexString}\\(`;
    const jhtmlBlockHasPropRegex = new RegExp(jhtmlBlockHasPropRegexString, 'i');
    const match2 = getRegexUntilClosing(jhtmlBlockHasPropRegex, jhtmlCode.substring(index));

    if (match2 === null || (match1 && ((index + match2.index) > match1.index))) {
      return match1;
    }

    const matchEndIndex = index + match2.index + match2[0].length;
    const obrcIndex = jhtmlCode.indexOf('{', matchEndIndex);

    if (obrcIndex === -1) {
      return null;
    }

    const whiteSpace = jhtmlCode.substring(matchEndIndex, obrcIndex).trim();

    if (whiteSpace === '') {
      if (match2[2].trim() === '') {
        throw new Error(`The parentheses of the block cannot be empty. Delete them if not needed.\n${match2[0]}`);
      }
      const cbrcIndex = getClosing(jhtmlCode, obrcIndex);
      match2[0] = jhtmlCode.substring(index + match2.index, cbrcIndex + 1);
      match2.push(jhtmlCode.substring(obrcIndex + 1, cbrcIndex));
      return match2;
    }

    index = matchEndIndex;
  }

  return match1;
}


async function executeJs(jhtml, jobjects) {

  getIncludedObjects(jhtml, jobjects);
  const filteredObjectsCode = includedObjectsForExecuteJsFunc.map(x => x.code).join(';');
  const awaitAsyncBool = awaitAsyncCheck([jhtml.code]) ? true : false;
  const a = path.dirname(jhtml.path).replace(/\\/g, `\\\\`);
  const srcPathStr = `const __dirname = '${a}';\n`;

  let entireCode = '';
  if (awaitAsyncBool) {
    entireCode = `(async () => { ${srcPathStr}${jhtml.code};${filteredObjectsCode};\nreturn await main(); })()`;
  } else {
    entireCode = `(() => { ${srcPathStr}${jhtml.code};${filteredObjectsCode};\nreturn main(); })()`;
  }

  try {
    let result = '';
    if (awaitAsyncBool) {
      result = await eval(entireCode);
    } else {
      result = eval(entireCode);
    }
    return result;

  } catch (error) {
    console.error(`Error evaluating the code\n`, error);
  }

}


function getIncludedObjects(jhtml, jobjects) {
  if (jhtml.subFunctions && jhtml.subFunctions.length > 0) {
    for (const obj of jobjects) {
      if (jhtml.subFunctions.includes(obj.functionName) && !includedObjectsForExecuteJsFunc.includes(obj)) {
        includedObjectsForExecuteJsFunc.push(obj);
        getIncludedObjects(obj, jobjects);
      }
    }
  }
}


function parse(jhtmlCode) {
  if (!jhtmlCode || jhtmlCode.trim() === '') {
    return [];
  }

  const trees = [];
  let currentIndex = 0;

  while (currentIndex < jhtmlCode.length) {
    const obrcIndex = jhtmlCode.indexOf('{', currentIndex);
    if (obrcIndex === -1) {
      const content = jhtmlCode.substring(currentIndex);
      if (content.length > 0) {
        trees.push({ type: 'content', value: jhtmlDecode(content) });
      }
      break;
    }

    const cbrcIndex = getClosing(jhtmlCode, obrcIndex);
    if (cbrcIndex === -1) {
      throw new Error('Mismatched curly braces.');
    }

    const blockContent = jhtmlCode.substring(obrcIndex + 1, cbrcIndex);
    const blockInfo = parseBlockInfo(jhtmlCode.substring(currentIndex, obrcIndex).trim());

    if (blockInfo.otherContents.length > 0) {
      trees.push({ type: 'content', value: jhtmlDecode(blockInfo.otherContents) });
    }

    if (blockInfo.tagName === 'dynamicStyles') {
      trees.push({ type: 'block', tagName: blockInfo.tagName, attributes: blockInfo.attributes, subNodes: [{ type: 'content', value: decode(blockContent) }] });
    } else if (blockInfo.tagName === 'scripts') {
      trees.push({ type: 'block', tagName: blockInfo.tagName, attributes: blockInfo.attributes, subNodes: [{ type: 'content', value: decode(blockContent) }] });
    } else {
      trees.push({ type: 'block', tagName: blockInfo.tagName, attributes: blockInfo.attributes, subNodes: parse(blockContent) });
    }

    currentIndex = cbrcIndex + 1;
  }

  return trees;
}


function parseBlockInfo(blockInfoStr) {
  const oprtcIndex = blockInfoStr.indexOf('(');
  let otherContents, tagName, attributes = '';

  if (oprtcIndex !== -1) {
    const blockParts = blockInfoStr.split('(');
    tagName = blockParts[0].trim().split(' ').pop();
    otherContents = blockParts[0].trim().split(' ').slice(0, -1).join(' ').trim();
    attributes = blockParts[1].slice(0, -1);
  } else {
    tagName = blockInfoStr.trim().split(' ').pop();
    otherContents = blockInfoStr.trim().split(' ').slice(0, -1).join(' ').trim();
  }

  return { otherContents, tagName, attributes };
}


function solveStyles(htmlBlockTree) {
  htmlBlockTree.forEach(htmlBlock => {
    if (htmlBlock.subNodes) {
      const styleNodeIndex = htmlBlock.subNodes.findIndex(subNode => subNode.tagName === 'dynamicStyles');
      if (styleNodeIndex !== -1) {
        const className = getRandomString(10);
        htmlBlock.attributes = addClassToAttributes(htmlBlock.attributes, className);
        const styleList = parseStyle(htmlBlock.subNodes[styleNodeIndex].subNodes[0].value);
        const newStyleList = addClassToStyleList(styleList, className);
        globalStylesList.push(...newStyleList);
        htmlBlock.subNodes.splice(styleNodeIndex, 1)[0];
      }
      solveStyles(htmlBlock.subNodes);
    }
  });
}


function solveScripts(htmlBlockTree) {
  // const scriptNode = node.subNodes.find(subNode => subNode.tagName === 'scripts');
  // if (scriptNode) {
  //   node.script = scriptNode.subNodes.length > 0 ? scriptNode.subNodes[0].value : '';
  //   node.subNodes = node.subNodes.filter(subNode => subNode !== scriptNode);
  //   scripts += `(() => { ${node.script} })();`;
  // }
}


function addStyleTag(htmlBlockTree) {
  let styleString = '';
  globalStylesList.forEach(style => {
    styleString += `${style.selector}{${style.declarations.join(';')}}`;
  });
  htmlBlockTree[1].subNodes[0].subNodes.push({ type: 'block', tagName: 'style', subNodes: [{ type: 'content', value: styleString }] });
}


function addScriptTag(htmlBlockTree) { }


function analyze(ast) {
  if (!ast) return;
  for (const node of ast) {
    if (node.type === 'block') {
      analyze(node.subNodes);
      if (!(/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(node.tagName))) {
        console.error(`Invalid value for tag name at this line: \t${logNode(node)} `);
      }
      if (!(/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(node.attributes))) {
        console.error(`Invalid value for attributes at this line: \t${logNode(node)} `);
      }
      if (node.htmlProperties) {
        for (const prop of node.htmlProperties.map(x => x.key)) {
          if (!(/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(prop))) {
            console.error(`Invalid value for html properties at this line: \t${logNode(node)} `);
          }
        }
      }
      // If any analysis is needed.
    }
  }

  function logNode(node) {
    const htmlProperties = (node.htmlProperties && node.htmlProperties.length > 0) ? node.htmlProperties.map(x => x.key + '=' + x.value).join(' ') : '\'undefined\'';
    const styles = (node.styles && node.styles.length > 0) ? node.styles.join(' ') : '\'undefined\'';
    return `type: '${node.type}', value: '${node.value}', idAttr: '${node.idAttr}', htmlProperties: ${htmlProperties}, styles: ${styles}, subTrees: {
      `;
  }
}


function generateCode(ast) {
  let code = '';
  for (const node of ast) {
    if (node.type === 'block') {
      const subNodes = node.subNodes ? generateCode(node.subNodes) : '';
      const closing = constants.selfClosingTags.includes(node.tagName) ? `/>` : `>${subNodes}</${node.tagName}>`;
      code += `<${node.tagName} ${node.attributes}${closing}`;
    }
    else {
      code += node.value;
    }
  }

  return code;
}


function optimize(compiledCode) {
  return compiledCode;
}


function awaitAsyncCheck(stringArray) {
  let exist = false;
  stringArray.forEach(item => {
    if (item.includes('await ') || item.includes('async ')) {
      exist = true;
    }
  });
  return exist;
}



module.exports = {
  renderAsync
};
