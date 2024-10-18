'use strict';

export type Config = {
  circuit: string;
  name: string;
  field?: string;
  target: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formula?: (v: any) => any;
}

// BAI
// https://github.com/john30/ebusd-configuration/blob/0d875e33573ff6545bba3577365cc0d8a16e798b/ebusd-2.1.x/de/vaillant/bai.308523.inc#L2

// 430
// https://github.com/john30/ebusd-configuration/blob/0d875e33573ff6545bba3577365cc0d8a16e798b/ebusd-2.1.x/de/vaillant/15.430.csv#L2

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const BOOLEAN = (v: any) => v === 'on';
const NUMBER = (v: any) => {
  if (typeof (v) === 'number') return v;
  return parseFloat(v);
};

export const FIELDS: Array<Config> = [
  {
    // ok
    circuit: '430',
    name: 'BMUFlowTempOrVF1',
    field: 'temp',
    target: 'measure_temperature.inlet',
    formula: NUMBER,
  },
  {
    // ok
    circuit: 'bai',
    name: 'ReturnTemp',
    field: 'temp',
    target: 'measure_temperature.outlet',
    formula: NUMBER,
  },
  {
    // ok
    circuit: '430',
    name: 'OutsideTemp',
    field: 'temp',
    target: 'measure_temperature.outdoor',
    formula: NUMBER,
  },
  {
    // ok
    circuit: '430',
    name: 'DisplayedHwcStorageTemp',
    target: 'measure_temperature.storage',
    formula: NUMBER,
  },
  {
    // ok
    circuit: '430',
    name: 'Hc1ActualFlowTempDesired',
    target: 'measure_temperature.target_inlet',
    formula: NUMBER,
  },
  {
    // ok
    circuit: '430',
    name: 'HwcActualTempDesired',
    target: 'target_temperature.storage',
    formula: NUMBER,
  },
  {
    // ok
    circuit: '430',
    name: 'HwcOPMode',
    target: 'ebusd_heating_mode.storage',
  },
  {
    // ok
    circuit: '430',
    name: 'ActualRoomTempDesiredHc1',
    field: 'temp',
    target: 'target_temperature.heating_1',
    formula: NUMBER,
  },
  {
    // ok
    circuit: '430',
    name: 'Hc1OPMode',
    target: 'ebusd_heating_mode.heating_1',
  },
  {
    // ok
    circuit: 'bai',
    name: 'Flame',
    target: 'ebusd_onoff.flame',
    formula: BOOLEAN,
  },
  {
    // ok
    circuit: '430',
    name: 'Hc1Pump',
    target: 'ebusd_onoff.heating_1_pump',
    formula: BOOLEAN,
  },
  {
    // ok
    circuit: 'bai',
    name: 'WaterPressure',
    field: 'press',
    target: 'measure_pressure.water',
    formula: (v) => NUMBER(v) * 1000,
  },
  {
    // ok
    circuit: '430',
    name: 'Hc1HeatCurve',
    field: 'curve',
    target: 'ebusd_heating_curve.heating_1',
    formula: NUMBER,
  },
  {
    // ok
    circuit: 'bai',
    name: 'RemainingBoilerblocktime',
    field: 'minutes0',
    target: 'ebusd_heating_blocktime',
    formula: (v) => `${v}m`,
  },
];
