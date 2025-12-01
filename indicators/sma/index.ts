/**
 * SMA Indicator Module Exports
 */

export {
  metadata,
  defaultInputs,
  inputConfig,
  plotConfig,
  calculate,
  Moving_Average_SimpleIndicator as SMAIndicator,
  type Moving_Average_SimpleInputs as SMAInputs,
} from './sma';

export { calculateSMA, getSourceSeries } from './sma-calculation';
