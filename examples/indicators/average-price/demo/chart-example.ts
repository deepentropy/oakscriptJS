import { createChart, ColorType, CandlestickSeries, LineSeries } from 'lightweight-charts';
import { calculateAveragePrice, AveragePriceOptions } from '../index.ts';

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

// Add candlestick series
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

// Add average price line series
const avgPriceSeries = chart.addSeries(LineSeries, {
	color: '#FF6D00',
	lineWidth: 2,
	priceLineVisible: false,
	lastValueVisible: true,
});

// Function to update average price
function updateAveragePrice() {
	const offset = parseInt((document.getElementById('offset') as HTMLInputElement).value);

	const options: AveragePriceOptions = {
		offset: offset || undefined,
	};

	// Calculate average price using OakScriptJS
	const avgPriceData = calculateAveragePrice(sampleData, options);

	// Filter out null values (Lightweight Charts v5 doesn't accept null)
	const filteredData = avgPriceData.filter(item => item.value !== null) as Array<{ time: any; value: number }>;

	// Update chart series
	avgPriceSeries.setData(filteredData);
}

// Initial calculation
updateAveragePrice();

// Add event listener for offset control
document.getElementById('offset')?.addEventListener('input', updateAveragePrice);

// Handle window resize
window.addEventListener('resize', () => {
	chart.applyOptions({
		width: chartContainer.clientWidth,
	});
});

// Fit content
chart.timeScale().fitContent();
