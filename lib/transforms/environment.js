import { getAppName } from '../utils/get-app-name.js';

export default async function transformEnvironment(code) {
  const modulePrefix = await getAppName();

  // app/config/environment.js is created out of the app blueprint,
  // that uses <%= name %> placeholder for the app prefix.
  code = code.replace('<%= name %>', modulePrefix);
  return code;
}
