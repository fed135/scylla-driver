import Client from './client.ts';
import type { Options } from './defaults.ts';
import defaults from './defaults.ts';

export function connect(options: Partial<Options> & { hosts: string[], keyspace: string }) {
  return new Client({ ...defaults, ...options });
}
