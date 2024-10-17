'use strict';

export type Config = {
  circuit: string;
  name: string;
  field: string;
  target: string;
  factor?: number;
  compare?: string;
}

// BAI
// https://github.com/john30/ebusd-configuration/blob/0d875e33573ff6545bba3577365cc0d8a16e798b/ebusd-2.1.x/de/vaillant/bai.308523.inc#L2

// 430
// https://github.com/john30/ebusd-configuration/blob/0d875e33573ff6545bba3577365cc0d8a16e798b/ebusd-2.1.x/de/vaillant/15.430.csv#L2

export const FIELDS: Array<Config> = [
  {
    circuit: 'bai',
    name: 'FlowTemp',
    field: 'temp',
    target: 'measure_temperature.inlet',
  },
  {
    circuit: 'bai',
    name: 'ReturnTemp',
    field: 'temp',
    target: 'measure_temperature.outlet',
  },
  {
    circuit: 'bai',
    name: 'OutdoorstempSensor',
    field: 'temp',
    target: 'measure_temperature.outdoor',
  },
  {
    circuit: 'bai',
    name: 'Status01',
    field: '4',
    target: 'measure_temperature.storage',
  },
  {
    circuit: 'bai',
    name: 'ExtFlowTempDesiredMin',
    field: 'temp',
    target: 'target_temperature.inlet',
  },
  {
    circuit: 'bai',
    name: 'Status02',
    field: '1',
    target: 'target_temperature.storage',
  },
  {
    circuit: '430',
    name: 'HwcOPMode',
    field: '0',
    target: 'thermostat_mode.storage',
  },
  {
    circuit: '430',
    name: 'ActualRoomTempDesiredHc1',
    field: 'temp',
    target: 'target_temperature.heating_1',
  },
  {
    circuit: '430',
    name: 'Hc1OPMode',
    field: '0',
    target: 'thermostat_mode.heating_1',
  },
  {
    circuit: 'bai',
    name: 'Flame',
    field: '0',
    target: 'onoff.flame',
    compare: 'on',
  },
  {
    circuit: 'bai',
    name: 'StatusCirPump',
    field: '0',
    target: 'onoff.heating_1_pump',
    compare: 'on',
  },
  {
    circuit: 'bai',
    name: 'WaterPressure',
    field: 'press',
    target: 'measure_pressure.water',
    factor: 1000,
  },
  {
    circuit: '430',
    name: 'Hc1HeatCurve',
    field: 'curve',
    target: 'ebusd_heating_curve.heating_1',
  },
];
