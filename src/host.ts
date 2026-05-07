import Connection from './connection.ts';
import type { Options } from './defaults.ts';
import type { LoadBalancer } from './helpers/loadBalancing.ts';
import { RoundRobin } from './helpers/loadBalancing.ts';
import type { ParsedQuery } from './helpers/queryPlan.ts';

export default class Host {
  #connectionPool: Connection[];
  #loadBalancer: LoadBalancer<Connection>;
  nodeInfo: Partial<{
    host: string
    port: number
    broadcast_ip: string
    data_center: string
    cluster_name: string
    rack: string
    tokens: string[]
    schema_version: string
  }>
  #localPreparedStatements: { [statement: string]: { preparedId: string, resultMetadataId: string } };
  #errorChannel: Function;

  constructor(host: string, port: number | undefined, options: Options, errorChannel: Function) {
    this.nodeInfo = {
        host,
        port
    };
    this.#errorChannel = errorChannel;
    this.#connectionPool = [];
    this.#localPreparedStatements = {};
    this.#loadBalancer = new RoundRobin(this.#connectionPool, options.poolSize, this.#spawn.bind(this, host, port, options));

    this.#loadBalancer.getNext();
  }

  async query(parsedQuery: ParsedQuery, signal?: AbortSignal) {
    if (parsedQuery.prepared) {
      if (!(parsedQuery.statement in this.#localPreparedStatements)) {
        await this.#prepare(parsedQuery.statement);
      }
    }
    return this.#loadBalancer.getNext().ready.then((c) => c.request({
        opcode: parsedQuery.prepared ? 'execute' : 'query',
        ...parsedQuery,
        signal,
        ...this.#localPreparedStatements[parsedQuery.statement]
    }));
  }

  async* stream(parsedQuery: ParsedQuery, signal?: AbortSignal): AsyncIterator<any> {
    if (parsedQuery.prepared) {
      if (!(parsedQuery.statement in this.#localPreparedStatements)) {
        await this.#prepare(parsedQuery.statement);
      }
    }

    yield* await this.#loadBalancer.getNext().ready.then((c) => c.request({
        opcode: parsedQuery.prepared ? 'execute' : 'query',
        ...parsedQuery,
        signal,
        ...this.#localPreparedStatements[parsedQuery.statement]
    }));
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
    const result = await this.#loadBalancer.getNext().ready.then((c) => c.request({ opcode: 'prepare', statement, streamId: -1 }));

    this.#localPreparedStatements[statement] = {
      preparedId: result.metadata.preparedId,
      resultMetadataId: result.metadata.resultMetadataId,
    };
  }

  #spawn(host: string, port: number | undefined, options: Options): Connection {
    const connection = (new Connection(host, port, options, this.#errorChannel)).connect();

    if (this.#connectionPool.length === 0) {
        connection.ready.then(() => {
            connection.request({
                opcode: 'query',
                statement: 'SELECT * FROM system.local;',
                options: options.queryOptions,
            }).then((result) => {
                console.log('nodeinfo update!', result);

                if (result.rows[0]) {
                    this.nodeInfo.data_center = result.rows[0].data_center;
                    this.nodeInfo.cluster_name = result.rows[0].cluster_name;
                    this.nodeInfo.rack = result.rows[0].rack;
                    this.nodeInfo.tokens = result.rows[0].tokens;
                    this.nodeInfo.schema_version = result.rows[0].schema_version;
                }
            }).catch(e => this.#errorChannel(e));
        });
    }

    return connection;
  }
}
