/* eslint-disable import/prefer-default-export */
/* eslint-disable max-classes-per-file */
/* eslint-disable no-console */

'use strict';

export class DeferedPromise<T> {

  private resolver!: (v: T) => void;
  private rejector!: (e: Error) => void;

  public readonly promise: Promise<T>;

  constructor() {
    this.promise = new Promise((r, e) => {
      this.resolver = r;
      this.rejector = e;
    });
  }

  public resolve(t: T) {
    this.resolver(t);
  }

  public reject(e: Error) {
    this.rejector(e);
  }

}
