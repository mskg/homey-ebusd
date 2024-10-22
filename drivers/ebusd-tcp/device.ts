'use strict';

import Homey from 'homey';
// import config from './driver.compose.json';
import { FIELDS } from './fields';
import { EBUSDProtocol } from '../../ebusd/EBUSDProtocol';

module.exports = class extends Homey.Device {

  pollingTask: NodeJS.Timeout | undefined;

  async onInit() {
    this.log('TCP Device has been initialized');

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

    /// flow
    this.homey.flow
      .getActionCard('set-ebusd_heating_mode-storage')
      .registerRunListener(
        async (args, _state) => this.runWithClient(
          async (client) => this.writeCapability(client, 'ebusd_heating_mode.storage', args.mode),
        ),
      );

    this.homey.flow
      .getActionCard('set-ebusd_heating_mode-heating_1')
      .registerRunListener(
        async (args, _state) => this.runWithClient(
          async (client) => this.writeCapability(client, 'ebusd_heating_mode.heating_1', args.mode),
        ),
      );

    this.homey.flow
      .getActionCard('set-target_temperature-storage')
      .registerRunListener(
        async (args, _state) => this.runWithClient(
          async (client) => client.write('430', 'HwcManualOPTempDesired', args.temperature),
        ),
      );

    this.homey.flow
      .getActionCard('set-target_temperature-heating_1')
      .registerRunListener(
        async (args, _state) => this.runWithClient(
          async (client) => client.write('430', 'Hc1ManualOPRoomTempDesired', args.temperature),
        ),
      );

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.driver.ready().then(this.startPolling.bind(this));
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

  async runWithClient(func: (client: EBUSDProtocol) => Promise<void>) {
    let client!: EBUSDProtocol;
    try {
      const hostname = this.getSetting('hostname');
      client = new EBUSDProtocol(hostname, undefined, this.homey);
      await func(client);
    } catch (error) {
      this.error('Client failure', error);
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
        // flow passes arguments as array
        const arg = value.constructor === Array ? value[0] : value;
        await this.writeCapability(client, capability, arg);
      } catch (e) {
        this.error('Could not write', capability, e);
      }
    });
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

  async fetchData() {
    await this.runWithClient(async (client) => {
      const waits = FIELDS.map(async (f) => {
        let value = await client.read(f.circuit, f.name, f.field);

        // number
        if (f.formula) {
          value = f.formula(value);
        }

        try {
          this.log('Mapping', f.target, 'to', f.circuit, f.field ? `${f.name} (${f.field})` : f.name, 'value', value);
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
