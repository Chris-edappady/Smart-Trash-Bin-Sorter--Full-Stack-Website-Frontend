const BASE_URL = 'http://localhost:3000';

// Fetch latest reading
async function getLatestReadings() {
  try {
    const response = await fetch(`${BASE_URL}/readings/latest`);
    if (!response.ok) throw new Error('Failed to fetch latest readings');
    return await response.json();
  } catch (error) {
    console.error('getLatestReadings error:', error);
    return null;
  }
}

// Fetch readings history for the line chart
async function getReadingsHistory(limit = 200) {
  try {
    const response = await fetch(`${BASE_URL}/readings/history?limit=${encodeURIComponent(limit)}`);
    if (!response.ok) throw new Error('Failed to fetch readings history');
    return await response.json();
  } catch (error) {
    console.error('getReadingsHistory error:', error);
    return [];
  }
}

// Fetch daily totals for the stacked bar chart
async function getDailyTotals(days = 7) {
  try {
    const response = await fetch(`${BASE_URL}/readings/daily-totals?days=${encodeURIComponent(days)}`);
    if (!response.ok) throw new Error('Failed to fetch daily totals');
    return await response.json();
  } catch (error) {
    console.error('getDailyTotals error:', error);
    return [];
  }
}

// Fetch most recent events for the activity table
async function getRecentEvents(limit = 20) {
  try {
    const response = await fetch(`${BASE_URL}/readings/recent?limit=${encodeURIComponent(limit)}`);
    if (!response.ok) throw new Error('Failed to fetch recent events');
    return await response.json();
  } catch (error) {
    console.error('getRecentEvents error:', error);
    return [];
  }
}

// Fetch item counts for the donut chart and category cards
async function getReadingCounts() {
  try {
    const response = await fetch(`${BASE_URL}/readings/counts`);
    if (!response.ok) throw new Error('Failed to fetch reading counts');
    return await response.json();
  } catch (error) {
    console.error('getReadingCounts error:', error);
    return { paper: 0, plastic: 0, metal: 0, general: 0 };
  }
}