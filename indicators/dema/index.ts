/**
 * Double EMA (DEMA) Indicator Module Exports
 */

export {
  metadata,
  defaultInputs,
  inputConfig,
  plotConfig,
  calculate,
  Double_EMAIndicator as DEMAIndicator,
  type Double_EMAInputs as DEMAInputs,
} from './dema';

export { calculateDEMA } from './dema-calculation';
