/* eslint-disable max-classes-per-file */
/* eslint-disable no-console */

'use strict';

import { FIELDS } from '../drivers/ebusd-tcp/fields';
import { EBUSDProtocol } from '../ebusd/EBUSDProtocol';

const client = new EBUSDProtocol('vaillant-ebusd.iot.home-arpa');

(async () => {

  const ps = FIELDS.map(async (f) => {
    try {
      const r = await client.read(f.circuit, f.name, f.field);
      console.log(f.circuit, f.name, f.field, r);
    }
    catch (e) {
      console.log('Failed', f.circuit, f.name, f.field, e);
    }
  });

  await Promise.all(ps);

  client.close();
})();
