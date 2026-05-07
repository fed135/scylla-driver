import type { Socket } from 'node:net';
import { streamDecode, verifyPayload } from './helpers/stream.ts';
import type { Options } from './defaults.ts';
import { int32 } from './helpers/decoder.ts';

export default class Reader {
  #getSocket: () => Socket | undefined;
  #dataChannel: Function;
  #errorChannel: Function;

  constructor(getSocket: () => Socket | undefined, dataChannel: Function, errorChannel: Function) {
    this.#getSocket = getSocket;
    this.#dataChannel = dataChannel;
    this.#errorChannel = errorChannel;
  }

  listen(options: Options) {
    this.#readLoop(this.#getSocket() as Socket, options);
  }

  async #readLoop(socket: Socket, options: Options) {
    let buffer: number[] = [];

    try {
      for await (const chunk of socket!) {
        buffer = [...buffer, ...chunk];

        while (buffer.length >= 9) {
          const totalSize = int32([buffer[5], buffer[6], buffer[7], buffer[8]]);
          const frameSize = 9 + totalSize;

          if (buffer.length < frameSize) break;

          const frame = [...buffer.slice(0, frameSize)];
          buffer = buffer.slice(frameSize);

          if (!verifyPayload(frame, options)) {
            console.log('Junk in the pipe:', Buffer.from(frame).toString());
            continue;
          }

          this.#routeFrame(frame, options);
        }
      }
    }
    catch (err) {
      this.#errorChannel(err);
    }
  }

  #routeFrame(payload: number[], options: Options) {
    const decoded = streamDecode(payload, options);

    return this.#dataChannel(decoded);
  }
}
