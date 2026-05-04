import Host from './host.ts';
import type { Options } from './defaults.ts';
import ScyllaError from './helpers/errors.ts';

export default class Client {
  #hosts: Host[];
  #queryOptions: any;
  // #queryPlanner: QueryPlanner

  constructor(options: Partial<Options> & { hosts: string[], keyspace: string }) {
    this.#hosts = options.hosts.map((h) => {
      const [_h, _p] = h.split(':');
      const host = new Host(_h, _p && parseInt(_p), options, this.#errorHandler);
      return host;
    });

    this.#queryOptions = { ...options.queryOptions ?? {} };
  }

  query(statement: string, vars?: any[], options?: any): Promise<any> {
    if (options === undefined && !Array.isArray(vars)) {
      options = vars || {};
      vars = [];
    }
    if (!Array.isArray(vars)) vars = [vars];

    const finalOptions = Object.assign({}, this.#queryOptions, options);
    const selectedHost = this.#selectHost();

    return selectedHost.query(statement, vars, finalOptions, options?.signal);
  }

  async* stream(statement: string, vars?: any[], options?: any): AsyncGenerator<any> {
    if (options === undefined && !Array.isArray(vars)) {
      options = vars || {};
      vars = [];
    }
    if (!Array.isArray(vars)) vars = [vars];

    const finalOptions = Object.assign({}, this.#queryOptions, options);
    const selectedHost = this.#selectHost();
    const signal: AbortSignal | undefined = options?.signal;

    yield* await selectedHost.stream(statement, vars, finalOptions, signal);
  }

  batch(): Promise<void> {
    throw new ScyllaError('batch queries are not yet implemented');
  }

  close(): Promise<void[][]> {
    return Promise.all(this.#hosts.map(h => h.close()));
  }

  #errorHandler(err) {
    console.log('Global error handler', err);
  }

  #selectHost() {
    // TODO
    return this.#hosts[0];
  }
}
