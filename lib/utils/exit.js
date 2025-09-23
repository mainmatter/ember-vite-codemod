export class ExitError extends Error {
  constructor(messages, ...args) {
    super(
      (Array.isArray(messages) ? messages : [messages]).join('\n'),
      ...args,
    );
  }
}

export function isExit(error) {
  return error instanceof ExitError;
}
