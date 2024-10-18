'use strict';

import Homey from 'homey';
import { EBUSDProtocol } from '../../test/EBUSDProtocol';

module.exports = class extends Homey.Driver {

  /**
   * onInit is called when the driver is initialized.
   */
  async onInit() {
    this.log('TCP Driver has been initialized');
  }

  async onPairListDevices() {
    return [];
  }

  async onPair(session: any) {
    let devices: any = [];

    // this is called when the user presses save settings button in start.html
    session.setHandler('get_devices', async (data: any, callback: any) => {
      this.log('Data', data, 'Devices', devices);

      try {
        const tcpreader = new EBUSDProtocol(data.hostname);
        await tcpreader.test();

        devices = [{
          name: 'eBUSd TCP',
          settings: data,
          data: {
            id: data.hostname,
          },
        }];

        // ready to continue pairing
        session.emit('found', null);
      } catch (e) {
        this.log(e);
        session.emit('not_found', null);
      }
    });

    // pairing: start.html -> get_devices -> list_devices -> add_devices
    session.setHandler('list_devices', (data: any, callback: any) => {
      this.log('Data', data, 'Devices', devices);
      return devices;
    });
  }

};
