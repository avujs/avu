const args = require("minimist")(process.argv.slice(2));
const fs = require("fs");
const path = require("path");
const version = require("../package.json").version;

const packagesDir = path.resolve(__dirname, "../packages");
const files = fs.readdirSync(packagesDir);

files.forEach((shortName) => {
  if (!fs.statSync(path.join(packagesDir, shortName)).isDirectory()) {
    return;
  }
  
  const pkgName = shortName == "avu" ? "avu" : `avu-${shortName}`;
  const name = `@aimlabs/${pkgName}`
  const pkgPath = path.join(packagesDir, shortName, `package.json`);
  const pkgExists = fs.existsSync(pkgPath);
  if (pkgExists) {
    const pkg = require(pkgPath);
    if (pkg.private) {
      return;
    }
  }

  if (args.force || !pkgExists) {
    const json = {
      name,
      version,
      description: name,
      main: "index.js",
      module: `dist/${pkgName}.esm-bundler.js`,
      files: [`index.js`, `dist`],
      types: `dist/${pkgName}.d.ts`,
      repository: {
        type: "git",
        url: "git+https://github.com/aimlabs-os/avu.git",
      },
      keywords: ["avu"],
      author: "Suresh Reddy Guntaka",
      license: "MIT",
      bugs: {
        url: "https://github.com/aimlabs-os/avu/issues",
      },
      homepage: `https://github.com/aimlabs-os/avu/tree/develop/packages/${shortName}#readme`,
    };
    fs.writeFileSync(pkgPath, JSON.stringify(json, null, 2));
  }

  const readmePath = path.join(packagesDir, shortName, `README.md`);
  if (args.force || !fs.existsSync(readmePath)) {
    fs.writeFileSync(readmePath, `# ${name}`);
  }

  const apiExtractorConfigPath = path.join(
    packagesDir,
    shortName,
    `api-extractor.json`
  );
  if (args.force || !fs.existsSync(apiExtractorConfigPath)) {
    fs.writeFileSync(
      apiExtractorConfigPath,
      `
{
  "extends": "../../api-extractor.json",
  "mainEntryPointFilePath": "./dist/packages/<unscopedPackageName>/src/index.d.ts",
  "dtsRollup": {
    "publicTrimmedFilePath": "./dist/<unscopedPackageName>.d.ts"
  }
}
`.trim()
    );
  }

  const srcDir = path.join(packagesDir, shortName, `src`);
  const indexPath = path.join(packagesDir, shortName, `src/index.ts`);
  if (args.force || !fs.existsSync(indexPath)) {
    if (!fs.existsSync(srcDir)) {
      fs.mkdirSync(srcDir);
    }
    fs.writeFileSync(indexPath, ``);
  }

  const nodeIndexPath = path.join(packagesDir, shortName, "index.js");
  if (args.force || !fs.existsSync(nodeIndexPath)) {
    fs.writeFileSync(
      nodeIndexPath,
      `
'use strict'

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./dist/${pkgName}.cjs.prod.js')
} else {
  module.exports = require('./dist/${pkgName}.cjs.js')
}
    `.trim() + "\n"
    );
  }
});
