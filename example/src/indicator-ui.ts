/**
 * Indicator UI Management
 * Handles indicator selection dropdown and dynamic input generation
 */

import type { Bar } from '@deepentropy/oakscriptjs';
import { ChartManager } from './chart';
import { indicatorRegistry, type IndicatorRegistryEntry, type InputConfig } from '../../indicators';

/**
 * Use the indicator registry from indicators/index.ts
 * Adding new indicators to the registry will automatically make them available in the UI
 */
const indicators: IndicatorRegistryEntry[] = indicatorRegistry;

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
    console.log('[IndicatorUI] selectIndicator:', indicatorId);
    
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
    console.log('[IndicatorUI] indicator found:', indicator);
    console.log('[IndicatorUI] inputConfig:', indicator?.inputConfig);
    console.log('[IndicatorUI] defaultInputs:', indicator?.defaultInputs);
    
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
  private renderInputs(indicator: IndicatorRegistryEntry, container: HTMLElement): void {
    // Handle inputConfig as either array or object
    const inputConfigArray = Array.isArray(indicator.inputConfig) ? indicator.inputConfig : [];
    console.log('[IndicatorUI] renderInputs - inputConfigArray:', inputConfigArray);
    
    const inputsHtml = inputConfigArray.map((input: any) => {
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
          // Default source options if not provided
          const sourceOptions = input.options || ['open', 'high', 'low', 'close', 'hl2', 'hlc3', 'ohlc4', 'hlcc4'];
          console.log('[IndicatorUI] source input options:', input.options);
          return `
            <div class="input-group">
              <label for="input-${input.id}">${input.title}:</label>
              <select id="input-${input.id}" data-input-id="${input.id}">
                ${sourceOptions.map((opt: any) =>
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
                  ${input.options.map((opt: any) =>
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
      const inputConfig = inputConfigArray.find((c: any) => c.id === inputId);

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
    console.log('[IndicatorUI] recalculate - bars count:', this.bars.length);
    console.log('[IndicatorUI] recalculate - currentInputs:', this.currentInputs);
    
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
      console.log('[IndicatorUI] recalculate - result:', result);
      console.log('[IndicatorUI] recalculate - result.plots:', result?.plots);
      console.log('[IndicatorUI] recalculate - plotConfig:', indicator?.plotConfig);
      
      // Log first few values of each plot for debugging
      if (result?.plots) {
        for (const [plotId, plotData] of Object.entries(result.plots)) {
          if (Array.isArray(plotData) && plotData.length > 0) {
            console.log(`[IndicatorUI] ${plotId} first 3 values:`, plotData.slice(0, 3));
          }
        }
      }

      // Clear previous plots
      this.chartManager.clearIndicators();

      // Add new plots
      for (const plotDef of indicator.plotConfig) {
        const plotData = result.plots[plotDef.id];
        console.log('[IndicatorUI] plotDef:', plotDef);
        console.log('[IndicatorUI] plotData:', plotData);
        console.log('[IndicatorUI] plotData length:', plotData?.length);
        
        if (plotData && plotData.length > 0) {
          this.chartManager.setIndicatorData(plotDef.id, plotData, {
            color: plotDef.color,
            lineWidth: plotDef.lineWidth,
            overlay: indicator.overlay, // Pass overlay setting for pane placement
          });
        }
      }
    } catch (error) {
      console.error('Error calculating indicator:', error);
    }
  }
}
