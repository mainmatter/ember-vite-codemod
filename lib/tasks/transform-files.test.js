import { describe, it, beforeEach, expect, vi } from 'vitest';
import { print } from 'recast';

import transformFiles from './transform-files';
import transformEmberCliBuild from '../transforms/ember-cli-build.js';
import transformEnvironment from '../transforms/environment.js';
import transformIndexHTML from '../transforms/index-html.js';
import transformTestem from '../transforms/testem.js';
import transformTestHelper from '../transforms/test-helper.js';
import transformApp from '../transforms/app.js';
import transformTsConfig from '../transforms/tsconfig.js';
import transformTypesIndex from '../transforms/typesIndex.js';

let files;
let mockedVersions;

vi.mock('node:fs', () => {
  return {
    existsSync: (filename) => filename in files,
  };
});

vi.mock('node:fs/promises', () => {
  return {
    readFile: (filename) => {
      return files[filename];
    },
    writeFile: (filename, content) => {
      files[filename] = content;
    },
  };
});

vi.mock('../utils/resolve-version.js', () => {
  return {
    resolveVersion: function (packageName) {
      return mockedVersions[packageName];
    },
  };
});

// Each transform has its own unit tests, so we only check here that
// transformFiles() calls the right transforms with the right inputs.

// Text-based transforms append a marker
function mockReplaceTransform(name) {
  return {
    default: vi.fn((code) => `${code}\n<!-- ${name} -->`),
  };
}

// AST-based transforms append a comment
// to the program body so we can check the AST is printed back to the file.
function mockAstTransform(name) {
  return {
    default: vi.fn((ast) => {
      ast.program.body.push({
        type: 'ExpressionStatement',
        expression: { type: 'StringLiteral', value: name },
      });
      return ast;
    }),
  };
}

vi.mock('../transforms/index-html.js', () =>
  mockReplaceTransform('index-html'),
);
vi.mock('../transforms/environment.js', () =>
  mockReplaceTransform('environment'),
);
vi.mock('../transforms/tsconfig.js', () => mockReplaceTransform('tsconfig'));
vi.mock('../transforms/typesIndex.js', () =>
  mockReplaceTransform('typesIndex'),
);
vi.mock('../transforms/ember-cli-build.js', () =>
  mockAstTransform('ember-cli-build'),
);
vi.mock('../transforms/testem.js', () => mockAstTransform('testem'));
vi.mock('../transforms/app.js', () => mockAstTransform('app'));
vi.mock('../transforms/test-helper.js', () => mockAstTransform('test-helper'));

const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => undefined);

function createFiles({ ts = false } = {}) {
  const ext = ts ? 'ts' : 'js';
  return {
    'index.html': '<html></html>',
    'tests/index.html': '<html></html>',
    [`app/config/environment.${ext}`]: 'export default {};',
    'ember-cli-build.js': 'module.exports = function () {};',
    'testem.js': 'module.exports = {};',
    [`app/app.${ext}`]: 'export default class App {}',
    [`tests/test-helper.${ext}`]: 'start();',
    '.gitignore': '/dist/\n',
  };
}

describe('transformFiles() function', () => {
  beforeEach(() => {
    files = {};
    mockedVersions = {
      'ember-source': '5.12.0',
      'ember-cli': '5.12.0',
    };
    vi.clearAllMocks();
  });

  describe('emberVersion', () => {
    it('is coerced from ember-source in devDependencies', async () => {
      files = createFiles();
      mockedVersions = {
        'ember-source': '5.12.0',
        'ember-cli': '5.12.0',
      };
      await transformFiles({});

      expect(transformApp.mock.calls[0][1].emberVersion).toBe('5.12.0');
    });

    it('is undefined when ember-source is not found', async () => {
      files = createFiles();
      mockedVersions = {};
      await transformFiles({});

      expect(transformApp.mock.calls[0][1].emberVersion).toBe(undefined);
    });
  });

  describe('text transformations', () => {
    it('transforms index.html and tests/index.html', async () => {
      files = createFiles();
      await transformFiles({ emberExam: true });

      expect(transformIndexHTML).toHaveBeenCalledTimes(2);
      expect(transformIndexHTML).toHaveBeenCalledWith('<html></html>', {
        isTest: false,
      });
      expect(transformIndexHTML).toHaveBeenCalledWith('<html></html>', {
        isTest: true,
        emberExam: true,
      });
      expect(files['index.html']).toBe('<html></html>\n<!-- index-html -->');
      expect(files['tests/index.html']).toBe(
        '<html></html>\n<!-- index-html -->',
      );
    });

    it('transforms app/config/environment.js', async () => {
      files = createFiles();
      await transformFiles({});

      expect(transformEnvironment).toHaveBeenCalledTimes(1);
      expect(files['app/config/environment.js']).toBe(
        'export default {};\n<!-- environment -->',
      );
    });

    it('transforms app/config/environment.ts with --ts', async () => {
      files = { ...createFiles({ ts: true }), 'tsconfig.json': '{}' };
      await transformFiles({ ts: true });

      expect(transformEnvironment).toHaveBeenCalledTimes(1);
      expect(files['app/config/environment.ts']).toBe(
        'export default {};\n<!-- environment -->',
      );
    });

    it('does not transform TS-specific files without --ts', async () => {
      files = {
        ...createFiles(),
        'tsconfig.json': '{}',
        'types/index.d.ts': '',
      };
      await transformFiles({});

      expect(transformTsConfig).not.toHaveBeenCalled();
      expect(transformTypesIndex).not.toHaveBeenCalled();
      expect(files['tsconfig.json']).toBe('{}');
      expect(files['types/index.d.ts']).toBe('');
    });

    it('transforms types/index.d.ts when it exists with --ts', async () => {
      files = {
        ...createFiles({ ts: true }),
        'tsconfig.json': '{}',
        'types/index.d.ts': '',
      };
      await transformFiles({ ts: true });

      expect(transformTypesIndex).toHaveBeenCalledTimes(1);
      expect(transformTsConfig).not.toHaveBeenCalled();
      expect(files['types/index.d.ts']).toBe('\n<!-- typesIndex -->');
      expect(files['tsconfig.json']).toBe('{}');
    });

    it('transforms tsconfig.json when types/index.d.ts does not exist with --ts', async () => {
      files = { ...createFiles({ ts: true }), 'tsconfig.json': '{}' };
      await transformFiles({ ts: true });

      expect(transformTsConfig).toHaveBeenCalledTimes(1);
      expect(transformTypesIndex).not.toHaveBeenCalled();
      expect(files['tsconfig.json']).toBe('{}\n<!-- tsconfig -->');
    });
  });

  describe('AST transformations', () => {
    it('passes down the options when it transforms JS files with an AST', async () => {
      files = createFiles();
      const passedOptions = {
        embroiderWebpack: true,
        emberExam: true,
        ts: false,
        errorTrace: false,
      };
      const expectedOptions = {
        embroiderWebpack: true,
        emberVersion: undefined,
        emberExam: true,
        ts: false,
      };
      await transformFiles(passedOptions);

      expect(transformEmberCliBuild).toHaveBeenCalledWith(
        expect.anything(),
        expectedOptions,
      );
      expect(transformTestem).toHaveBeenCalledWith(
        expect.anything(),
        expectedOptions,
      );
      expect(transformTestHelper).toHaveBeenCalledWith(
        expect.anything(),
        expectedOptions,
      );
      expect(transformApp).toHaveBeenCalledWith(expect.anything(), {
        ...expectedOptions,
        emberVersion: '5.12.0',
      });
    });

    it('gives the transforms an AST of the original code', async () => {
      files = createFiles();
      await transformFiles({});

      const ast = transformTestem.mock.calls[0][0];
      expect(ast.program.body[0].type).toBe('ExpressionStatement');
      expect(print(ast.program.body[0]).code).toBe('module.exports = {};');
    });

    it('prints back to the file the AST returned by the transform', async () => {
      files = createFiles();
      await transformFiles({});

      expect(files['ember-cli-build.js']).toBe(
        `module.exports = function () {};\n"ember-cli-build";`,
      );
      expect(files['testem.js']).toBe(`module.exports = {};\n"testem";`);
      expect(files['app/app.js']).toBe(`export default class App {}\n"app";`);
      expect(files['tests/test-helper.js']).toBe(`start();\n"test-helper";`);
    });

    it('resolves the extension of the files to transform with an AST', async () => {
      files = createFiles({ ts: true });
      delete files['ember-cli-build.js'];
      delete files['testem.js'];
      files['ember-cli-build.cjs'] = 'module.exports = function () {};';
      files['testem.mjs'] = 'export default {};';
      files['tsconfig.json'] = '{}';
      await transformFiles({ ts: true });

      expect(files['ember-cli-build.cjs']).toBe(
        `module.exports = function () {};\n"ember-cli-build";`,
      );
      expect(files['testem.mjs']).toBe(`export default {};\n"testem";`);
      expect(files['app/app.ts']).toBe(`export default class App {}\n"app";`);
      expect(files['tests/test-helper.ts']).toBe(`start();\n"test-helper";`);
    });
  });

  describe('.gitignore', () => {
    it('adds /tmp/ when it is not ignored yet', async () => {
      files = createFiles();
      await transformFiles({});

      expect(files['.gitignore']).toBe('/tmp/\n\n/dist/\n');
    });

    it.each(['/tmp/\n', 'tmp\n', '/tmp\n', 'tmp/\r\n'])(
      'does not modify .gitignore when it already contains %j',
      async (tmpEntry) => {
        files = createFiles();
        files['.gitignore'] = `/dist/\n${tmpEntry}`;
        await transformFiles({});

        expect(files['.gitignore']).toBe(`/dist/\n${tmpEntry}`);
      },
    );

    it('skips .gitignore when it does not exist', async () => {
      files = createFiles();
      delete files['.gitignore'];
      await transformFiles({});

      expect(files['.gitignore']).toBeUndefined();
      expect(consoleLog).toHaveBeenCalledTimes(1);
      expect(consoleLog).toHaveBeenCalledWith(
        'Skiping file .gitignore since it was not found.',
      );
    });
  });
});
