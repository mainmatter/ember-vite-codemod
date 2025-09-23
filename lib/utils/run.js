import yocto from 'yocto-spinner';

const nl = (msg) => (msg ? `\n${msg}` : msg);

export async function run(message, fn, ...options) {
  const spinner = yocto().start(message);
  const oLog = console.log;
  const oWarn = console.warn;
  const oError = console.error;

  // Prefix messages with \n to not interfere with the spinner
  console.log = (message, ...args) => oLog(nl(message), ...args);
  console.warn = (message, ...args) => oWarn(nl(message), ...args);
  console.error = (message, ...args) => oError(nl(message), ...args);

  try {
    await fn(...options, spinner);
    spinner.success(message);
  } catch (error) {
    spinner.error(error.message);

    throw error;
  } finally {
    console.log = oLog;
    console.warn = oWarn;
    console.error = oError;
  }
}
