#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Chemin vers les fichiers
const packageJsonPath = path.join(__dirname, '../package.json');
const versionServicePath = path.join(__dirname, '../src/app/services/version.service.ts');

// Lecture du package.json
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Incrément de la version patch
const currentVersion = packageJson.version;
const versionParts = currentVersion.split('.');
const major = parseInt(versionParts[0]);
const minor = parseInt(versionParts[1]);
const patch = parseInt(versionParts[2]) + 1;

const newVersion = `${major}.${minor}.${patch}`;

// Mise à jour du package.json
packageJson.version = newVersion;
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

// Mise à jour du service version
const versionServiceContent = fs.readFileSync(versionServicePath, 'utf8');
const updatedVersionServiceContent = versionServiceContent.replace(
  /private readonly version = '[^']+';/,
  `private readonly version = '${newVersion}';`
).replace(
  /private readonly buildDate = new Date\(\)\.toISOString\(\);/,
  `private readonly buildDate = '${new Date().toISOString()}';`
);

fs.writeFileSync(versionServicePath, updatedVersionServiceContent);

console.log(`✅ Version mise à jour de ${currentVersion} vers ${newVersion}`);
console.log(`📅 Date de build: ${new Date().toISOString()}`);

// Écriture des informations dans un fichier version.json pour Vercel
const versionInfo = {
  version: newVersion,
  buildDate: new Date().toISOString(),
  previousVersion: currentVersion,
  commitHash: process.env.VERCEL_GIT_COMMIT_SHA || 'local',
  branch: process.env.VERCEL_GIT_COMMIT_REF || 'local'
};

fs.writeFileSync(
  path.join(__dirname, '../src/assets/version.json'), 
  JSON.stringify(versionInfo, null, 2)
);

console.log('📄 Fichier version.json créé dans src/assets/');