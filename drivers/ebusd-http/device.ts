'use strict';

import Homey from 'homey';
import axios from 'axios';
// import config from './driver.compose.json';
import { FIELDS } from './fields';

module.exports = class extends Homey.Device {

  pollingTask: NodeJS.Timeout | undefined;
  configureTask: NodeJS.Timeout | undefined;

  async onInit() {
    this.log('HTTP Device has been initialized');

    // // during debug
    // await Promise.all(
    //   config.capabilities.map((c: string) => this.addCapability(c)),
    // );

    await this.startPolling();
  }

  async onAdded() {
    this.log('HTTP Device has been added');
  }

  async onSettings({
    oldSettings,
    newSettings,
    changedKeys,
  }: {
    oldSettings: { [key: string]: boolean | string | number | undefined | null };
    newSettings: { [key: string]: boolean | string | number | undefined | null };
    changedKeys: string[];
  }): Promise<string | void> {
    this.log('HTTP Device settings where changed');
    await this.startPolling();
  }

  async startPolling() {
    // Clear any existing intervals
    if (this.pollingTask) this.homey.clearInterval(this.pollingTask);
    if (this.configureTask) this.homey.clearInterval(this.configureTask);

    const refreshInterval = this.getSetting('interval') < 10
      ? 10 // refresh interval in seconds minimum 10
      : this.getSetting('interval');

    this.log('Interval is', refreshInterval);

    // Set up a new interval
    this.pollingTask = this.homey.setInterval(this.fetchData.bind(this), refreshInterval * 1000);

    // every hour
    this.configureTask = this.homey.setInterval(this.configurePolling.bind(this), 60 * 60 * 1000);

    await this.configurePolling();
    await this.fetchData();
  }

  // eslint-disable-next-line no-empty-function, @typescript-eslint/no-explicit-any
  async setCapabilities(data: any) {
    // this.log('Fetched', data);
    const waits = FIELDS.map(async (f) => {
      let value = null;

      try {
        // eslint-disable-next-line prefer-destructuring
        value = data[f.circuit]['messages'][f.name]['fields'][f.field]['value'];
      } catch (e) {
        this.log('Could not read', f);
        return;
      }

      // number
      if (f.factor) {
        value *= f.factor;
      }

      // boolean
      if (f.compare) {
        // eslint-disable-next-line eqeqeq
        value = value == f.compare;
      }

      try {
        this.log('Mapping', f.circuit, f.name, f.field, 'to', f.target, 'with', value);
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        await this.setCapabilityValue(f.target, value);
      } catch (e) {
        this.log('Could not write', f.target, e);
      }
    });

    await Promise.all(waits);
  }

  async configurePolling() {
    const ip = this.getSetting('ip');
    const port = this.getSetting('port');

    const uniqueFields = FIELDS
      // map to url
      .map((f) => `http://${ip}:${port}/data/${f.circuit}/${f.name}?poll=1&exact=true`)
      // preserve only unique values
      .filter((v, i, a) => a.indexOf(v) === i);

    const waits = uniqueFields.map(async (u) => {
      try {
        this.log('Configuring', u);
        await axios.get(u);
      } catch (e) {
        this.log('Failed to query', u, e);
      }
    });

    await Promise.all(waits);
  }

  async fetchData() {
    const ip = this.getSetting('ip');
    const port = this.getSetting('port');

    if ((!ip || ip === '')) {
      this.log('Missing settings.');
      return;
    }

    try {
      const response = await axios.get(
        `http://${ip}:${port}/data`,
        {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        },
      );

      await this.setCapabilities(response.data);
    } catch (error) {
      this.error('Failed to fetch data:', error);
    }
  }

  onDeleted() {
    this.log('Device has been deleted');

    // Clear the interval when the device is deleted
    this.homey.clearInterval(this.pollingTask);
    this.homey.clearInterval(this.configureTask);
  }

};
