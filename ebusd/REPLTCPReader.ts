/* eslint-disable max-classes-per-file */
/* eslint-disable no-console */

'use strict';

import { Socket } from 'net';
import { DeferedPromise } from './DeferedPromise';
import { Mutex } from './Mutex';

// eslint-disable-next-line import/prefer-default-export
export class REPLTCPReader {

  private commandTermination = '\n';
  private endSymbol = '\n\n';

  private debug;
  private mutex = new Mutex();
  private socket: Socket;
  private chunks: string[] = [];
  private replies: DeferedPromise<string>[] = [];

  constructor(debug = false) {
    this.debug = debug;
    this.socket = new Socket();
    this.socket.on('data', this.onData.bind(this));

    // this.socket.on('close', () => {
    //   console.log('Connection closed');
    // });
  }

  async connect(host: string, port: number) {
    return new Promise<void>((resolve, reject) => {
      const errF = (e: Error) => reject(e);

      this.socket.on('error', errF);
      this.socket.connect(port, host, () => {
        this.socket.off('error', errF);
        resolve();
      });
    });
  }

  close() {
    this.socket.destroy();
  }

  async send(m: string) {
    const unlock = await this.mutex.lock();
    let result: DeferedPromise<string>;

    try {
      // wait for all existing commands to finish or fail
      // eslint-disable-next-line node/no-unsupported-features/es-builtins
      await Promise.allSettled(
        this.replies.map((r) => r.promise),
      );

      result = new DeferedPromise<string>();
      this.replies.push(result);
    } finally {
      unlock();
    }

    if (!m.endsWith(this.commandTermination)) {
      m += this.commandTermination;
    }

    if (this.debug) {
      console.log('[S]', m);
    }

    this.socket.write(m, (e) => {
      if (e) {
        result.reject(e || new Error('Unkown fault during write'));
      }
    });

    return result.promise;
  }

  private onData(chunkB: Buffer) {
    const chunk = chunkB.toString();

    if (this.debug) {
      console.log('[S]', chunk);
    }

    this.chunks.push(chunk);

    // https://github.com/john30/ebusd/wiki/3.1.-TCP-client-commands
    if (chunk.endsWith(this.endSymbol)) {
      const result = this.replies.shift();
      result!.resolve(this.chunks.join(''));

      this.chunks = [];
    }
  }

}
