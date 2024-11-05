/* eslint-disable import/prefer-default-export */
/* eslint-disable max-classes-per-file */
/* eslint-disable no-console */

'use strict';

import { REPLTCPReader } from './REPLTCPReader';

interface ILog {
  log(...args: any[]): void;
  error(...args: any[]): void;
}

export class EBUSDProtocol {

  log?: ILog;
  connected = false;
  host: string;
  port: number;
  client = new REPLTCPReader();

  constructor(host: string, port = 8888, log?: ILog) {
    this.host = host;
    this.port = port;
    this.log = log;
  }

  private async connect() {
    if (!this.connected) {
      this.connected = true;
      this.log?.log('Connecting', this.host);
      await this.client.connect(this.host, this.port);
    }
  }

  public close() {
    if (this.connected) {
      this.client.close();
      this.connected = false;
      this.log?.log('Closed');
    }
  }

  public async test() {
    await this.connect();
    return this.client.send('state');
  }

  trimResult(r: string) {
    return r.replace(/\n\n$/, '');
  }

  public async write(circuit: string, name: string, value: string | number) {
    await this.connect();

    this.log?.log('Writing', circuit, name, value);

    const command = `write -c ${circuit} ${name} ${value}`;
    const result = this.trimResult(await this.client.send(command));

    // eslint-disable-next-line eqeqeq
    if (result !== 'done' && result != value) {
      this.log?.error('Received', result);
      throw result;
    }
  }

  public async read(circuit: string, name: string, field?: string) {
    await this.connect();

    let command = `read -c ${circuit} -f ${name}`;
    if (field) {
      command += ` ${field}`;
    }

    this.log?.log('Reading', circuit, name, field ?? '');
    const result = this.trimResult(await this.client.send(command));

    if (result.startsWith('ERR: ')) {
      throw result;
    }

    return result;
  }

}
