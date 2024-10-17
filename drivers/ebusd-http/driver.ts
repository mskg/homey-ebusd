'use strict';

import Homey from 'homey';
import axios from 'axios';

module.exports = class extends Homey.Driver {

  /**
   * onInit is called when the driver is initialized.
   */
  async onInit() {
    this.log('HTTP Driver has been initialized');
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
        const response = await axios.get(
          `http://${data.ip}/data`,
          {
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
          },
        );

        this.log(response);

        if (!response.data.global) {
          session.emit('not_found', null);
        } else {
          devices = [{
            name: 'eBUSd',
            settings: data,
            data: {
              id: data.ip,
            },
          }];

          // ready to continue pairing
          session.emit('found', null);
        }
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
