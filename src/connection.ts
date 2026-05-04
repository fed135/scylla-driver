import { connect as connectSocket, Socket } from 'node:net';
import type { Options } from './defaults.ts';
import { wrap, deferred } from './helpers/utils.ts';
import Reader from './reader.ts';
import Writer from './writer.ts';
import AuthenticationHandler from './helpers/authentication.ts';
import ScyllaError from './helpers/errors.ts';
import type { Deferred } from './helpers/utils.ts';

export default class Connection {
  #connectionState: {
    attempts: number
    details?: Error
    timer?: NodeJS.Timeout
  } = { attempts: 0 };

  #socket?: Socket;
  #host: string;
  #port?: number;
  #options: Options;

  #authHandler: AuthenticationHandler;

  #streams: (Deferred | null)[];
  #internalQueue: Deferred[];

  #reader: Reader;
  #writer: Writer;

  #errorChannel: Function;

  status: number;

  constructor(host: string, port: number | undefined, options: Options, errorChannel: Function) {
    this.#host = host;
    this.#port = port;
    this.#options = options;

    this.#authHandler = new AuthenticationHandler(this);

    this.#reader = new Reader(() => this.#socket, wrap(d => this.#handleData(d), this.#authHandler.hook().data), wrap(errorChannel, this.#authHandler.hook().error));
    this.#writer = new Writer(() => this.#socket);
    this.#errorChannel = errorChannel;

    this.#streams = Array.from(Array(Connection.MAX_STREAM_ID)).fill(null);
    this.#internalQueue = [];

    this.status = Connection.STATUS.init;
  }

  connect(): Connection {
    this.status = Connection.STATUS.init;

    const isUnixSocket = this.#host[0] === '/';
    if (isUnixSocket) this.#socket = connectSocket(this.#host);
    else this.#socket = connectSocket(this.#port as number, this.#host);

    this.#socket.on('connect', () => this.#handleConnection());
    this.#socket.on('error', e => this.#handleError(e));
    this.#socket.on('close', () => this.#handleClose());
    this.#reader.listen(this.#options);

    return this;
  }

  async request(payload: { opcode: 'prepare' | 'execute' | 'query' | 'startup', body?: number[], statement?: string, vars?: any[], streamId?: number, options?: any, signal?: AbortSignal, preparedId?: string, resultMetadataId?: string }): Promise<any> {
    if (payload.opcode !== 'startup') await this.#authHandler.hook().ready;

    // TODO: Assign stream, send query, return handler
    const streamId = payload.streamId || this.#getNextStream();

    this.#writer.write({ ...payload, streamId }, streamId === -1, this.#options);

    if (streamId === -1) {
      const handle = deferred();
      this.#internalQueue.push(handle);
      return handle.promise;
    }

    return this.#streams[streamId]?.promise;
  }

  close() {
    this.status = Connection.STATUS.closing;
  }

  load() {
    return this.#getNextStream(true) + this.#internalQueue.length;
  }

  #handleConnection() {
    this.#connectionState.attempts = 0;
    this.#authHandler.begin(this.#options);
  }

  #handleError(err: Error) {
    this.#connectionState.details = err;
    this.#errorChannel(err);
  }

  #handleClose() {
    if (this.status === Connection.STATUS.ready) {
      this.#authHandler.reset();

      const delay = this.#options.baseReconnectTimeMs + (this.#connectionState.attempts * this.#options.baseReconnectTimeMs) * 1.5;
      this.#connectionState.attempts++;

      console.log('connection attempt', this.#connectionState.attempts, '/', this.#options.maxRetryAttempts);
      if (this.#connectionState.attempts >= this.#options.maxRetryAttempts) {
        throw ScyllaError.ConnectionError(`Unable to connect to ${this.#host} after ${this.#connectionState.attempts} attempts`, this.#connectionState.details);
      }

      clearTimeout(this.#connectionState.timer);
      this.#connectionState.timer = undefined;
      this.#connectionState.timer = setTimeout(this.connect, delay);
    }
  }

  #handleData(response) {
    let handle;
    if (response.metadata.streamId === -1 && this.#internalQueue.length > 0) {
      handle = this.#internalQueue.shift();
    }
    else {
      handle = this.#streams[response.metadata.streamId - 1];
    }

    handle?.resolve?.(response);

    this.#streams[response.metadata.streamId - 1] = null;
  }

  #getNextStream(readOnly: boolean = false) {
    for (let i = 0; i < Connection.MAX_STREAM_ID; i++) {
      if (this.#streams[i] === null) {
        if (!readOnly) this.#streams[i] = deferred();
        return i;
      }
    }
    return 0;
  }

  static STATUS = {
    init: 0,
    ready: 1,
    errored: 2,
    closing: 3,
  };

  static MAX_STREAM_ID = (0xffff >> 1);
}
