'use strict';

import Homey from 'homey';
import axios from 'axios';
import config from './driver.compose.json';

module.exports = class extends Homey.Device {

  pollingTask: NodeJS.Timeout | undefined;

  async onInit() {
    this.log('HTTP Device has been initialized');

    // during debug
    await Promise.all(
      config.capabilities.map((c: string) => this.addCapability(c)),
    );

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

    const refreshInterval = this.getSetting('interval') < 10
      ? 10 // refresh interval in seconds minimum 10
      : this.getSetting('interval');

    this.log('Interval is', refreshInterval);

    await this.fetchData();

    // Set up a new interval
    this.pollingTask = this.homey.setInterval(this.fetchData.bind(this), refreshInterval * 1000);
  }

  // eslint-disable-next-line no-empty-function
  async setCapabilities(data: any) {
    this.log('Fetched', data);

    await Promise.all([
      this.setCapabilityValue('measure_temperature.inlet', data.bai.messages.Status01.fields['0'].value),
      this.setCapabilityValue('measure_temperature.outlet', data.bai.messages.Status01.fields['1'].value),
      this.setCapabilityValue('measure_temperature.outdoor', data.bai.messages.Status01.fields['2'].value),
      this.setCapabilityValue('measure_temperature.storage', data.bai.messages.Status01.fields['4'].value),

      this.setCapabilityValue('target_temperature.inlet', data['430'].messages.Hc1ActualFlowTempDesired.fields.temp1.value),

      this.setCapabilityValue('target_temperature.storage', data.bai.messages.Status02.fields['1'].value),
      this.setCapabilityValue('thermostat_mode.storage', data['430'].messages.HwcOPMode.fields['0'].value),

      this.setCapabilityValue('target_temperature.heating_1', data['430'].messages.ActualRoomTempDesiredHc1.fields.temp.value),
      this.setCapabilityValue('thermostat_mode.heating_1', data['430'].messages.Hc1OPMode.fields['0'].value),

      this.setCapabilityValue('onoff.flame', data.bai.messages.Flame.fields['0'].value === 'on'),
      this.setCapabilityValue('onoff.heating_1_pump', data.bai.messages.StatusCirPump.fields['0'].value === 'on'),

      this.setCapabilityValue('measure_pressure.water', data.bai.messages.WaterPressure.fields.press.value * 1000),
      this.setCapabilityValue('ebusd_heating_curve.heating_1', data['430'].messages.Hc1HeatCurve.fields.curve.value),
    ]);
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
    } catch (error: any) {
      this.error('Failed to fetch data:', error);
    }
  }

  onDeleted() {
    this.log('Device has been deleted');

    // Clear the interval when the device is deleted
    this.homey.clearInterval(this.pollingTask);
  }

};
