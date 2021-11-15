import { contextBridge } from 'electron';

const API_KEY = 'electron';

const api = {
  versions: process.versions,
}

export type ExposedInMainWorld = Readonly<typeof api>;

contextBridge.exposeInMainWorld(API_KEY, api);
