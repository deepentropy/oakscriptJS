import { createChart, ColorType, CandlestickSeries, LineSeries } from 'lightweight-charts';
import { calculateMovingAverage, MovingAverageOptions } from '../index.ts';

// Generate sample OHLC data
function generateSampleData(days: number = 200) {
	const data = [];
	const startDate = new Date(2024, 0, 1);
	let price = 100;

	for (let i = 0; i < days; i++) {
		const date = new Date(startDate);
		date.setDate(date.getDate() + i);

		// Random walk with trend
		const change = (Math.random() - 0.48) * 2;
		price += change;

		const high = price + Math.random() * 1.5;
		const low = price - Math.random() * 1.5;
		const open = low + Math.random() * (high - low);
		const close = low + Math.random() * (high - low);

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

// Initialize chart
const chartContainer = document.getElementById('chart')!;
const chart = createChart(chartContainer, {
	layout: {
		background: { type: ColorType.Solid, color: '#ffffff' },
		textColor: '#333',
	},
	width: chartContainer.clientWidth,
	height: 500,
	grid: {
		vertLines: { color: '#f0f0f0' },
		horzLines: { color: '#f0f0f0' },
	},
	timeScale: {
		timeVisible: true,
		secondsVisible: false,
	},
});

// Add candlestick series (v5 API)
const candlestickSeries = chart.addSeries(CandlestickSeries, {
	upColor: '#26a69a',
	downColor: '#ef5350',
	borderVisible: false,
	wickUpColor: '#26a69a',
	wickDownColor: '#ef5350',
});

// Generate and set data
const sampleData = generateSampleData(200);
candlestickSeries.setData(sampleData);

// Add MA line series (v5 API)
const maSeries = chart.addSeries(LineSeries, {
	color: '#2962FF',
	lineWidth: 2,
	priceLineVisible: false,
	lastValueVisible: true,
});

// Function to update MA
function updateMovingAverage() {
	const maType = (document.getElementById('maType') as HTMLSelectElement).value as 'SMA' | 'EMA' | 'WMA';
	const length = parseInt((document.getElementById('length') as HTMLInputElement).value);
	const source = (document.getElementById('source') as HTMLSelectElement).value as any;
	const offset = parseInt((document.getElementById('offset') as HTMLInputElement).value);
	const smoothingType = (document.getElementById('smoothingType') as HTMLSelectElement).value as any;
	const smoothingLength = parseInt((document.getElementById('smoothingLength') as HTMLInputElement).value);

	const options: MovingAverageOptions = {
		type: maType,
		length,
		source,
		offset: offset || undefined,
		smoothingType: smoothingType || undefined,
		smoothingLength: smoothingType ? smoothingLength : undefined,
	};

	// Calculate MA using OakScriptJS
	const maData = calculateMovingAverage(sampleData, options);

	// Filter out null values (Lightweight Charts v5 doesn't accept null)
	const filteredData = maData.filter(item => item.value !== null) as Array<{ time: any; value: number }>;

	// Update chart series
	maSeries.setData(filteredData);
}

// Initial calculation
updateMovingAverage();

// Add event listeners for controls
document.getElementById('maType')?.addEventListener('change', updateMovingAverage);
document.getElementById('length')?.addEventListener('input', updateMovingAverage);
document.getElementById('source')?.addEventListener('change', updateMovingAverage);
document.getElementById('offset')?.addEventListener('input', updateMovingAverage);
document.getElementById('smoothingType')?.addEventListener('change', updateMovingAverage);
document.getElementById('smoothingLength')?.addEventListener('input', updateMovingAverage);

// Handle window resize
window.addEventListener('resize', () => {
	chart.applyOptions({
		width: chartContainer.clientWidth,
	});
});

// Fit content
chart.timeScale().fitContent();
