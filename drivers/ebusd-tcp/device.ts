'use strict';

import Homey from 'homey';
// import config from './driver.compose.json';
import { FIELDS } from './fields';
import { EBUSDProtocol } from '../../ebusd/EBUSDProtocol';

module.exports = class extends Homey.Device {

  pollingTask: NodeJS.Timeout | undefined;

  async onInit() {
    this.log('TCP Device has been initialized');

    await this.addCapability("ebusd_onoff.water");
    await this.addCapability("ebusd_hotwater_flow");

    this.registerCapabilityListener(
      'ebusd_heating_curve.heating_1',
      this.createDefaultWriteFunction('ebusd_heating_curve.heating_1'),
    );

    this.registerCapabilityListener(
      'target_temperature.heating_1',
      async (value) => this.runWithClient(async (client) => {
        try {
          await this.writeCapability(client, 'ebusd_heating_mode.heating_1', 'manual');
          await client.write('430', 'Hc1ManualOPRoomTempDesired', value);
        } catch (e) {
          this.error('Could not write', 'target_temperature.heating_1', e);
        }
      }),
    );

    this.registerCapabilityListener(
      'target_temperature.storage',
      async (value) => this.runWithClient(async (client) => {
        try {
          await this.writeCapability(client, 'ebusd_heating_mode.storage', 'manual');
          await client.write('430', 'HwcManualOPTempDesired', value);
        } catch (e) {
          this.error('Could not write', 'target_temperature.storage', e);
        }
      }),
    );

    this.registerCapabilityListener(
      'ebusd_heating_mode.heating_1',
      this.createDefaultWriteFunction('ebusd_heating_curve.heating_1'),
    );

    this.registerCapabilityListener(
      'ebusd_heating_mode.storage',
      this.createDefaultWriteFunction('ebusd_heating_mode.storage'),
    );

    await this.startPolling();
  }

  async onAdded() {
    this.log('TCP Device has been added');
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
    this.log('TCP Device settings where changed');
    await this.startPolling();
  }

  async startPolling() {
    // Clear any existing intervals
    if (this.pollingTask) this.homey.clearInterval(this.pollingTask);

    const refreshInterval = this.getSetting('interval') < 10
      ? 10 // refresh interval in seconds minimum 10
      : this.getSetting('interval');

    this.log('Interval is', refreshInterval);

    // Set up a new interval
    this.pollingTask = this.homey.setInterval(this.fetchData.bind(this), refreshInterval * 1000);

    await this.fetchData();
  }

  async runWithClient(func: (client: EBUSDProtocol) => Promise<void>) {
    let client!: EBUSDProtocol;
    try {
      const hostname = this.getSetting('hostname');
      client = new EBUSDProtocol(hostname);
      await func(client);
      client.close();
    } catch (error) {
      this.error('Failed to fetch data:', error);
    } finally {
      client.close();
    }
  }

  async writeCapability<T extends string | number>(client: EBUSDProtocol, capability: string, value: T) {
    const config = FIELDS.find((c) => c.target === capability);
    if (!config) {
      this.error('Could not find field', capability);
      return;
    }

    this.log('Writing', capability, value);
    await client.write(config.circuit, config.name, value);
  }

  createDefaultWriteFunction<T extends string | number>(capability: string) {
    return async (value: T) => this.runWithClient(async (client) => {
      try {
        await this.writeCapability(client, capability, value);
      } catch (e) {
        this.error('Could not write', capability, e);
      }
    });
  }

  async fetchData() {
    await this.runWithClient(async (client) => {
      const waits = FIELDS.map(async (f) => {
        let value = await client.read(f.circuit, f.name, f.field);

        // number
        if (f.formula) {
          value = f.formula(value);
        }

        try {
          this.log('Mapping', f.circuit, f.name, f.field, 'to', f.target, 'with', value);
          await this.setCapabilityValue(f.target, value);
        } catch (e) {
          this.error('Could not set', f.target, e);
        }
      });

      await Promise.all(waits);
    });
  }

  onDeleted() {
    this.log('Device has been deleted');

    // Clear the interval when the device is deleted
    this.homey.clearInterval(this.pollingTask);
  }

};
