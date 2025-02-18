
// These packages are used in the latest classic app blueprint,
// but they are no longer used in the Vite app blueprint so the
// codemod should remove them.
export const packagesToRemove = [
  'broccoli-asset-rev',
  'ember-cli-app-version',
  'ember-cli-clean-css',
  'ember-cli-dependency-checker',
  'ember-cli-inject-live-reload',
  'ember-fetch', // used in the code?
  'ember-cli-sri',
  'ember-cli-terser',
  'loader.js',
  'webpack', // used to customize the build?
]

// export default async function removeUnusedPackages() {
//   for (let package of packagesToRemove) { 
//   // TODO actually remove the packages from the package.json

//   }
// }