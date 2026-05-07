import type { Socket } from 'node:net';
import { query, prepare, execute, stringMap, request as encodeRequest } from './helpers/encoder.ts';
import Queue from './helpers/queue.ts';
import type { Options } from './defaults.ts';

export type QueryContext = {
    opcode: 'prepare' | 'execute' | 'query' | 'startup'
    body?: number[]
    statement?: string
    vars?: any[]
    streamId?: number
    options?: any
    signal?: AbortSignal
    preparedId?: string
    resultMetadataId?: string
}

export default class Writer {
  #getSocket: () => Socket | undefined;
  #queue: Queue;

  constructor(getSocket: () => Socket | undefined) {
    this.#getSocket = getSocket;

    this.#queue = new Queue(b => this.#writeBytes(b), { locked: false });
  }

  write(payload: any, skipQueue = false, options: Options) {
    switch (payload.opcode) {
      case 'query':
        payload.body = query(payload, options);
        break;
      case 'prepare':
        payload.body = prepare(payload);
        break;
      case 'execute':
        payload.body = execute(payload, options);
        break;
      case 'startup':
        payload.body = stringMap({
          CQL_VERSION: options.cqlVersion,
          COMPRESSION: options.compression,
        });
        break;
    }

    if (skipQueue) return this.#writeBytes(encodeRequest(payload));
    return this.#queue.add(encodeRequest(payload));
  }

  #writeBytes(bytes: Buffer) {
    const socket = this.#getSocket();
    if (!socket) return console.error('Socket is unavailable. Cannot write to database');
    return socket.write(bytes);
  }
}
