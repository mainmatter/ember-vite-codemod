import { rm } from 'node:fs/promises';

const FILES_TO_REMOVE = {
  ts: ['app/config/environment.d.ts'],
  js: [],
};

export default async function addMissingFiles({ ts } = { ts: false }) {
  await Promise.all(
    FILES_TO_REMOVE[ts ? 'ts' : 'js'].map(async (file) => {
      try {
        await rm(file);
      } catch (error) {
        if (error.code !== 'ENOENT') {
          throw error;
        }
      }
    }),
  );
}
