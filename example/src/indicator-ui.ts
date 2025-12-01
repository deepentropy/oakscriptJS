/**
 * Indicator UI Management
 * Handles indicator selection dropdown and dynamic input generation
 */

import type { Bar } from '@deepentropy/oakscriptjs';
import { ChartManager } from './chart';
import * as smaIndicator from '../indicators/sma';

/**
 * Input configuration type
 */
interface InputConfig {
  id: string;
  type: 'int' | 'float' | 'bool' | 'source' | 'string';
  title: string;
  defval: number | string | boolean;
  min?: number;
  max?: number;
  step?: number;
  options?: string[];
}

/**
 * Indicator definition
 */
interface IndicatorDefinition {
  id: string;
  name: string;
  metadata: {
    title: string;
    shortTitle: string;
    overlay: boolean;
  };
  inputConfig: InputConfig[];
  plotConfig: Array<{
    id: string;
    title: string;
    color: string;
    lineWidth?: number;
  }>;
  calculate: (bars: Bar[], inputs: Record<string, unknown>) => {
    plots: Record<string, Array<{ time: number; value: number }>>;
  };
  defaultInputs: Record<string, unknown>;
}

/**
 * Registry of available indicators
 */
const indicators: IndicatorDefinition[] = [
  {
    id: 'sma',
    name: 'Simple Moving Average (SMA)',
    metadata: smaIndicator.metadata,
    inputConfig: smaIndicator.inputConfig,
    plotConfig: smaIndicator.plotConfig,
    calculate: smaIndicator.calculate,
    defaultInputs: { ...smaIndicator.defaultInputs },
  },
];

/**
 * Indicator UI Manager class
 */
export class IndicatorUI {
  private bars: Bar[] = [];
  private chartManager: ChartManager;
  private container: HTMLElement;
  private currentIndicatorId: string | null = null;
  private currentInputs: Record<string, unknown> = {};

  constructor(container: HTMLElement, chartManager: ChartManager) {
    this.container = container;
    this.chartManager = chartManager;
    this.render();
  }

  /**
   * Set bar data for calculations
   */
  setData(bars: Bar[]): void {
    this.bars = bars;
    this.recalculate();
  }

  /**
   * Render the UI
   */
  private render(): void {
    this.container.innerHTML = `
      <div class="indicator-panel">
        <h3>Indicators</h3>
        <div class="indicator-select-container">
          <label for="indicator-select">Select Indicator:</label>
          <select id="indicator-select">
            <option value="">-- None --</option>
            ${indicators.map(ind => `<option value="${ind.id}">${ind.name}</option>`).join('')}
          </select>
        </div>
        <div id="indicator-inputs" class="indicator-inputs"></div>
      </div>
    `;

    // Add event listener for indicator selection
    const select = this.container.querySelector('#indicator-select') as HTMLSelectElement;
    select.addEventListener('change', () => {
      this.selectIndicator(select.value || null);
    });
  }

  /**
   * Select an indicator
   */
  private selectIndicator(indicatorId: string | null): void {
    // Clear previous indicator
    this.chartManager.clearIndicators();
    this.currentIndicatorId = indicatorId;
    this.currentInputs = {};

    const inputsContainer = this.container.querySelector('#indicator-inputs') as HTMLElement;

    if (!indicatorId) {
      inputsContainer.innerHTML = '';
      return;
    }

    const indicator = indicators.find(ind => ind.id === indicatorId);
    if (!indicator) {
      inputsContainer.innerHTML = '';
      return;
    }

    // Set default inputs
    this.currentInputs = { ...indicator.defaultInputs };

    // Render inputs
    this.renderInputs(indicator, inputsContainer);

    // Calculate and display
    this.recalculate();
  }

  /**
   * Render input controls for an indicator
   */
  private renderInputs(indicator: IndicatorDefinition, container: HTMLElement): void {
    const inputsHtml = indicator.inputConfig.map(input => {
      const value = this.currentInputs[input.id] ?? input.defval;

      switch (input.type) {
        case 'int':
        case 'float':
          return `
            <div class="input-group">
              <label for="input-${input.id}">${input.title}:</label>
              <input
                type="number"
                id="input-${input.id}"
                data-input-id="${input.id}"
                value="${value}"
                min="${input.min ?? ''}"
                max="${input.max ?? ''}"
                step="${input.step ?? (input.type === 'float' ? 0.1 : 1)}"
              />
            </div>
          `;

        case 'source':
          return `
            <div class="input-group">
              <label for="input-${input.id}">${input.title}:</label>
              <select id="input-${input.id}" data-input-id="${input.id}">
                ${(input.options || []).map(opt =>
                  `<option value="${opt}" ${opt === value ? 'selected' : ''}>${opt}</option>`
                ).join('')}
              </select>
            </div>
          `;

        case 'bool':
          return `
            <div class="input-group">
              <label for="input-${input.id}">${input.title}:</label>
              <input
                type="checkbox"
                id="input-${input.id}"
                data-input-id="${input.id}"
                ${value ? 'checked' : ''}
              />
            </div>
          `;

        case 'string':
          if (input.options) {
            return `
              <div class="input-group">
                <label for="input-${input.id}">${input.title}:</label>
                <select id="input-${input.id}" data-input-id="${input.id}">
                  ${input.options.map(opt =>
                    `<option value="${opt}" ${opt === value ? 'selected' : ''}>${opt}</option>`
                  ).join('')}
                </select>
              </div>
            `;
          }
          return `
            <div class="input-group">
              <label for="input-${input.id}">${input.title}:</label>
              <input
                type="text"
                id="input-${input.id}"
                data-input-id="${input.id}"
                value="${value}"
              />
            </div>
          `;

        default:
          return '';
      }
    }).join('');

    container.innerHTML = `
      <h4>${indicator.metadata.title} Settings</h4>
      ${inputsHtml}
    `;

    // Add event listeners
    container.querySelectorAll('[data-input-id]').forEach(element => {
      const inputId = element.getAttribute('data-input-id')!;
      const inputConfig = indicator.inputConfig.find(c => c.id === inputId);

      if (element.tagName === 'SELECT') {
        element.addEventListener('change', (e) => {
          const target = e.target as HTMLSelectElement;
          this.currentInputs[inputId] = target.value;
          this.recalculate();
        });
      } else if (element.tagName === 'INPUT') {
        const inputEl = element as HTMLInputElement;
        if (inputEl.type === 'checkbox') {
          element.addEventListener('change', () => {
            this.currentInputs[inputId] = inputEl.checked;
            this.recalculate();
          });
        } else if (inputEl.type === 'number') {
          element.addEventListener('input', () => {
            const value = inputConfig?.type === 'int'
              ? parseInt(inputEl.value, 10)
              : parseFloat(inputEl.value);
            if (!isNaN(value)) {
              this.currentInputs[inputId] = value;
              this.recalculate();
            }
          });
        } else {
          element.addEventListener('input', () => {
            this.currentInputs[inputId] = inputEl.value;
            this.recalculate();
          });
        }
      }
    });
  }

  /**
   * Recalculate and update the indicator display
   */
  private recalculate(): void {
    if (!this.currentIndicatorId || this.bars.length === 0) {
      return;
    }

    const indicator = indicators.find(ind => ind.id === this.currentIndicatorId);
    if (!indicator) {
      return;
    }

    try {
      // Calculate indicator
      const result = indicator.calculate(this.bars, this.currentInputs);

      // Clear previous plots
      this.chartManager.clearIndicators();

      // Add new plots
      for (const plotDef of indicator.plotConfig) {
        const plotData = result.plots[plotDef.id];
        if (plotData && plotData.length > 0) {
          this.chartManager.setIndicatorData(plotDef.id, plotData, {
            color: plotDef.color,
            lineWidth: plotDef.lineWidth,
          });
        }
      }
    } catch (error) {
      console.error('Error calculating indicator:', error);
    }
  }
}
