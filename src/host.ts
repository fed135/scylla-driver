import Connection from './connection.ts';
import type { Options } from './defaults.ts';
import type { LoadBalancer } from './helpers/loadBalancing.ts';
import { RoundRobin } from './helpers/loadBalancing.ts';

export default class Host {
  #connectionPool: Connection[];
  #loadBalancer: LoadBalancer<Connection>;
  #nodeInfo: any;
  #localPreparedStatements: { [statement: string]: { preparedId: string, resultMetadataId: string } };
  #errorChannel: Function;

  constructor(host: string, port: number | undefined, options: Options, errorChannel: Function) {
    this.#errorChannel = errorChannel;
    this.#connectionPool = [];
    this.#localPreparedStatements = {};
    this.#loadBalancer = new RoundRobin(this.#connectionPool, options.connections.local, this.#spawn.bind(this, host, port, options));
  }

  async query(statement: string, vars: any[], finalOptions: any, signal?: AbortSignal) {
    const isPrepared = finalOptions.prepare === true || (statement.indexOf('?') > -1 && vars.length > 0);

    if (isPrepared) {
      if (!(statement in this.#localPreparedStatements)) {
        await this.#prepare(statement);
      }
    }
    return this.#loadBalancer.getNext().request({ opcode: isPrepared ? 'execute' : 'query', statement, vars, options: finalOptions, signal, ...this.#localPreparedStatements[statement] });
  }

  async* stream(statement: string, vars: any[], finalOptions: any, signal?: AbortSignal): AsyncIterator<any> {
    const isPrepared = finalOptions.prepare === true || (statement.indexOf('?') > -1 && vars.length > 0);

    if (isPrepared) {
      if (!(statement in this.#localPreparedStatements)) {
        await this.#prepare(statement);
      }
    }

    yield* await this.#loadBalancer.getNext().request({ opcode: isPrepared ? 'execute' : 'query', statement, vars, options: finalOptions, signal, ...this.#localPreparedStatements[statement] });
  }

  close() {
    return Promise.all(this.#connectionPool.map(c => c.close()));
  }

  load() {
    return this.#connectionPool.reduce((acc, curr) => {
      acc += curr.load();
      return acc;
    }, 0);
  }

  async #prepare(statement: string) {
    const result = await this.#loadBalancer.getNext().request({ opcode: 'prepare', statement, streamId: -1 });

    this.#localPreparedStatements[statement] = {
      preparedId: result.metadata.preparedId,
      resultMetadataId: result.metadata.resultMetadataId,
    };
  }

  #spawn(host: string, port: number | undefined, options: Options): Connection {
    const connection = new Connection(host, port, options, this.#errorChannel);
    return connection.connect();
  }
}
