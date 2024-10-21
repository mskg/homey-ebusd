/* eslint-disable import/prefer-default-export */
/* eslint-disable max-classes-per-file */
/* eslint-disable no-console */

'use strict';

import { REPLTCPReader } from './REPLTCPReader';

export class EBUSDProtocol {

  connected = false;
  host: string;
  port: number;
  client = new REPLTCPReader();

  constructor(host: string, port = 8888) {
    this.host = host;
    this.port = port;
  }

  private async connect() {
    if (!this.connected) {
      this.connected = true;
      await this.client.connect(this.host, this.port);
    }
  }

  public close() {
    this.client.close();
    this.connected = false;
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

    const command = `write -c ${circuit} ${name} ${value}`;
    const result = this.trimResult(await this.client.send(command));

    if (result !== 'done') {
      throw result;
    }
  }

  public async read(circuit: string, name: string, field?: string) {
    await this.connect();

    let command = `read -c ${circuit} -f ${name}`;
    if (field) {
      command += ` ${field}`;
    }

    const result = this.trimResult(await this.client.send(command));
    if (result.startsWith('ERR: ')) {
      throw result;
    }

    return result;
  }
}
