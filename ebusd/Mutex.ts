/* eslint-disable import/prefer-default-export */

'use strict';

export class Mutex {

  _locking: Promise<void>;
  _locks: number;

  constructor() {
    this._locking = Promise.resolve();
    this._locks = 0;
  }

  isLocked() {
    return this._locks > 0;
  }

  lock() {
    this._locks += 1;

    let unlockNext: () => void;

    const willLock = new Promise<void>((resolve) => {
      unlockNext = () => {
        this._locks -= 1;
        resolve();
      };
    });

    const willUnlock = this._locking.then(() => unlockNext);
    this._locking = this._locking.then(() => willLock);

    return willUnlock;
  }

}

