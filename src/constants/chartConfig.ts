export const TIMEFRAMES = [
  // ✅ RESTORED SECONDS
  //{ label: '1S', value: '1s', locked: false },
  //{ label: '5S', value: '5s', locked: true },
  //{ label: '15S', value: '15s', locked: true },
  //{ label: '30S', value: '30s', locked: true },
  // Minutes/Hours
  { label: '1m', value: '1m', locked: false },
  { label: '5m', value: '5m', locked: false },
  { label: '15m', value: '15m', locked: false },
  { label: '1h', value: '1h', locked: false },
  { label: '4h', value: '4h', locked: false },
  { label: '1d', value: '1d', locked: false },
];

export const RANGES = [
  // ✅ ADDED 'bars' property to fix the zoom
  // 1H on 1m chart = 60 bars
  { label: '1H', resolution: '1m', bars: 60 },
  // 1D on 5m chart = (24 * 60) / 5 = ~288 bars
  { label: '1D', resolution: '5m', bars: 288 },
  // 7D on 1h chart = (7 * 24) = 168 bars
  { label: '7D', resolution: '1h', bars: 168 },
  // 1M on 4h chart = (30 * 6) = 180 bars
  { label: '1M', resolution: '4h', bars: 180 },
  // 3M on 4h chart = (90 * 6) = 540 bars
  { label: '3M', resolution: '4h', bars: 540 },
  // 6M on 1d chart = 180 bars
  { label: '6M', resolution: '1d', bars: 180 },
  // 1Y on 1d chart = 365 bars
  { label: '1Y', resolution: '1d', bars: 365 },
  // 5Y on 1d chart = ~1825 bars
  { label: '5Y', resolution: '1d', bars: 1825 },
];