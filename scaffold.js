const fs = require('fs');
const path = require('path');

const packages = [
  'types',
  'registry',
  'wallet',
  'security',
  'runtime',
  'sdk',
  'ui'
];

const basePath = path.join(__dirname, 'packages');

if (!fs.existsSync(basePath)) {
  fs.mkdirSync(basePath);
}

for (const pkg of packages) {
  const pkgPath = path.join(basePath, pkg);
  const srcPath = path.join(pkgPath, 'src');
  
  if (!fs.existsSync(pkgPath)) fs.mkdirSync(pkgPath, { recursive: true });
  if (!fs.existsSync(srcPath)) fs.mkdirSync(srcPath, { recursive: true });

  const isUI = pkg === 'ui';
  const isTypes = pkg === 'types';
  const isSDK = pkg === 'sdk';

  // package.json
  const packageJson = {
    name: `@stackagent/${pkg}`,
    version: "0.0.0",
    main: "dist/index.js",
    types: "dist/index.d.ts",
    scripts: {
      "build": "tsc",
      "lint": "eslint src/",
      "typecheck": "tsc --noEmit"
    },
    dependencies: {},
    devDependencies: {
      "typescript": "^5.4.5",
      "@stackagent/config": "workspace:*"
    }
  };
  
  if (isSDK) {
    packageJson.dependencies = {
      "@stackagent/runtime": "workspace:*",
      "@stackagent/registry": "workspace:*",
      "@stackagent/wallet": "workspace:*",
      "@stackagent/types": "workspace:*"
    };
  }

  fs.writeFileSync(
    path.join(pkgPath, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );

  // tsconfig.json
  const tsconfig = {
    extends: "@stackagent/config/tsconfig.base.json",
    compilerOptions: {
      outDir: "dist",
      rootDir: "src"
    },
    include: ["src/**/*"]
  };

  fs.writeFileSync(
    path.join(pkgPath, 'tsconfig.json'),
    JSON.stringify(tsconfig, null, 2)
  );

  // README.md
  const readme = `# @stackagent/${pkg}\n\nInternal package for ${pkg}.`;
  fs.writeFileSync(path.join(pkgPath, 'README.md'), readme);

  // src/index.ts
  const indexTs = `export const hello${pkg} = () => console.log('Hello from ${pkg}');`;
  fs.writeFileSync(path.join(srcPath, 'index.ts'), indexTs);
  
  console.log(`Scaffolded packages/${pkg}`);
}

// Applications
const apps = ['dashboard', 'docs'];
const appsBasePath = path.join(__dirname, 'apps');
if (!fs.existsSync(appsBasePath)) {
  fs.mkdirSync(appsBasePath);
}
// For now, just create empty dirs for apps so Turborepo doesn't complain,
// we will initialize them using create-next-app later if needed.

// Contracts & Examples
const contractsPath = path.join(__dirname, 'contracts');
const examplesPath = path.join(__dirname, 'examples');
if (!fs.existsSync(contractsPath)) fs.mkdirSync(contractsPath);
if (!fs.existsSync(examplesPath)) fs.mkdirSync(examplesPath);

console.log('Scaffolding complete!');
