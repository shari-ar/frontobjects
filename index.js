const fs = require('fs').promises;
const path = require('path');
const jhtml = require('./frontobjects-lib/jhtml');


async function getAllFilesAsync(directoryPath, extensions) {

  try {
    const allFiles = [];
    const files = await fs.readdir(directoryPath);

    for (const file of files) {
      const filePath = path.join(directoryPath, file);
      const fileStat = await fs.stat(filePath);

      if (fileStat.isDirectory()) {
        const subdirectoryFiles = await getAllFilesAsync(filePath, extensions);
        allFiles.push(...subdirectoryFiles);
      } else if (extensions.includes(path.extname(filePath))) {
        allFiles.push(filePath);
      }
    }

    return allFiles;
  } catch (error) {
    throw new Error(`Error in getAllFilesAsync`, error);
  }

}


async function readJObjectFilesAsync(files) {

  const jobjects = await Promise.all(files.map(async (filePath) => {

    try {

      const code = await fs.readFile(filePath, 'utf8');

      return { path: filePath, code };

    } catch (error) {
      throw new Error(`Error reading file ${filePath}`, error);
    }

  }));

  return jobjects.filter(result => result !== null);

}


async function renderAsync(viewPath, options, callback) {
  try {
    let viewContent;
    try { viewContent = await fs.readFile(viewPath, 'utf-8'); }
    catch (err) {
      viewPath = viewPath.substring(0, viewPath.lastIndexOf('\\')) + viewPath.substring(viewPath.lastIndexOf('\\')).replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
      viewContent = await fs.readFile(viewPath, 'utf-8');
    }

    const jhtmlFile = { path: viewPath, code: viewContent };

    if (!options.jobjects) {
      if (options.viewsPath) {
        const jobjectPaths = await getAllFilesAsync(options.viewsPath, ['.jobj']);
        options.jobjects = await readJObjectFilesAsync(jobjectPaths);
      } else {
        throw new Error('options must contain viewsPath or jobjects. If there is no jobjects, please set viewsPath (viewsPath is the path of the folder where the .jobj files are located).');
      }
    }

    const renderedContent = await jhtml.renderAsync(jhtmlFile, options);

    callback(null, renderedContent);
  } catch (err) {
    callback(err);
  }
}


async function webbrRenderAsync(code) {
  return await jhtml.renderAsync({ path: './', code }, { jobjects: [] });
}


module.exports = {
  renderAsync
};

try { window.webbrRenderAsync = webbrRenderAsync; }
catch { }
