import { createChart, ColorType, CandlestickSeries, LineSeries, AreaSeries } from 'lightweight-charts';
import { calculateCorrelation, CorrelationOptions } from '../index.ts';

// Generate sample OHLC data
function generateSampleData(days: number, startPrice: number, volatility: number, seed: number) {
	const data = [];
	const startDate = new Date(2024, 0, 1);
	let price = startPrice;

	// Simple seeded random
	let rng = seed;
	const random = () => {
		rng = (rng * 9301 + 49297) % 233280;
		return rng / 233280;
	};

	for (let i = 0; i < days; i++) {
		const date = new Date(startDate);
		date.setDate(date.getDate() + i);

		const change = (random() - 0.48) * volatility;
		price += change;

		const high = price + random() * 1.5;
		const low = price - random() * 1.5;
		const open = low + random() * (high - low);
		const close = low + random() * (high - low);

		data.push({
			time: Math.floor(date.getTime() / 1000) as any,
			open,
			high,
			low,
			close,
		});
	}

	return data;
}

// Generate two data series
const primaryData = generateSampleData(200, 100, 2, 12345);
const secondaryData = generateSampleData(200, 50, 1.5, 67890);

// Create chart 1 (Primary)
const chart1Container = document.getElementById('chart1')!;
const chart1 = createChart(chart1Container, {
	layout: {
		background: { type: ColorType.Solid, color: '#ffffff' },
		textColor: '#333',
	},
	width: chart1Container.clientWidth,
	height: 300,
	grid: {
		vertLines: { color: '#f0f0f0' },
		horzLines: { color: '#f0f0f0' },
	},
	timeScale: {
		timeVisible: true,
		secondsVisible: false,
	},
});

const candlestickSeries1 = chart1.addSeries(CandlestickSeries, {
	upColor: '#26a69a',
	downColor: '#ef5350',
	borderVisible: false,
	wickUpColor: '#26a69a',
	wickDownColor: '#ef5350',
});
candlestickSeries1.setData(primaryData);

// Create chart 2 (Secondary)
const chart2Container = document.getElementById('chart2')!;
const chart2 = createChart(chart2Container, {
	layout: {
		background: { type: ColorType.Solid, color: '#ffffff' },
		textColor: '#333',
	},
	width: chart2Container.clientWidth,
	height: 300,
	grid: {
		vertLines: { color: '#f0f0f0' },
		horzLines: { color: '#f0f0f0' },
	},
	timeScale: {
		timeVisible: true,
		secondsVisible: false,
	},
});

const candlestickSeries2 = chart2.addSeries(CandlestickSeries, {
	upColor: '#1976D2',
	downColor: '#F57C00',
	borderVisible: false,
	wickUpColor: '#1976D2',
	wickDownColor: '#F57C00',
});
candlestickSeries2.setData(secondaryData);

// Create correlation chart
const correlationChartContainer = document.getElementById('correlationChart')!;
const correlationChart = createChart(correlationChartContainer, {
	layout: {
		background: { type: ColorType.Solid, color: '#ffffff' },
		textColor: '#333',
	},
	width: correlationChartContainer.clientWidth,
	height: 200,
	grid: {
		vertLines: { color: '#f0f0f0' },
		horzLines: { color: '#f0f0f0' },
	},
	timeScale: {
		timeVisible: true,
		secondsVisible: false,
	},
});

const correlationSeries = correlationChart.addSeries(LineSeries, {
	color: '#7C4DFF',
	lineWidth: 2,
	priceLineVisible: true,
	lastValueVisible: true,
});

// Function to update correlation
function updateCorrelation() {
	const length = parseInt((document.getElementById('length') as HTMLInputElement).value);
	const primarySource = (document.getElementById('primarySource') as HTMLSelectElement).value as any;
	const secondarySource = (document.getElementById('secondarySource') as HTMLSelectElement).value as any;

	const options: CorrelationOptions = {
		length,
		primarySource,
		secondarySource,
	};

	// Calculate correlation using OakScriptJS
	const correlationData = calculateCorrelation(primaryData, secondaryData, options);

	// Filter out null values
	const filteredData = correlationData.filter(item => item.value !== null) as Array<{ time: any; value: number }>;

	// Update chart
	correlationSeries.setData(filteredData);
}

// Initial calculation
updateCorrelation();

// Add event listeners
document.getElementById('length')?.addEventListener('input', updateCorrelation);
document.getElementById('primarySource')?.addEventListener('change', updateCorrelation);
document.getElementById('secondarySource')?.addEventListener('change', updateCorrelation);

// Synchronize time scales
chart1.timeScale().subscribeVisibleLogicalRangeChange(timeRange => {
	correlationChart.timeScale().setVisibleLogicalRange(timeRange);
	chart2.timeScale().setVisibleLogicalRange(timeRange);
});

// Handle window resize
window.addEventListener('resize', () => {
	chart1.applyOptions({ width: chart1Container.clientWidth });
	chart2.applyOptions({ width: chart2Container.clientWidth });
	correlationChart.applyOptions({ width: correlationChartContainer.clientWidth });
});

// Fit content
chart1.timeScale().fitContent();
chart2.timeScale().fitContent();
correlationChart.timeScale().fitContent();
