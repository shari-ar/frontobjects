const fs = require('fs').promises;
const path = require('path');
const jhtml = require('./frontobjects-lib/jhtml');


async function getAllFiles(directoryPath, extensions) {

  try {
    const allFiles = [];
    const files = await fs.readdir(directoryPath);

    for (const file of files) {
      const filePath = path.join(directoryPath, file);
      const fileStat = await fs.stat(filePath);

      if (fileStat.isDirectory()) {
        const subdirectoryFiles = await getAllFiles(filePath, extensions);
        allFiles.push(...subdirectoryFiles);
      } else if (extensions.includes(path.extname(filePath))) {
        allFiles.push(filePath);
      }
    }

    return allFiles;
  } catch (error) {
    throw new Error(`Error in getAllFiles`, error);
  }

}


async function readJObjectFiles(files) {

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


async function render(viewPath, options, callback) {
  try {
    const viewContent = await fs.readFile(viewPath, 'utf-8');

    const jhtmlFile = { path: viewPath, code: viewContent };

    if (!options.jobjects) {
      if (options.viewsPath) {
        const jobjectPaths = await getAllFiles(options.viewsPath, ['.jobj']);
        options.jobjects = await readJObjectFiles(jobjectPaths);
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


module.exports = {
  render
};
