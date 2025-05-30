import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import WeatherTempViewer from './WeatherTempViewer';

// Utility to mock geolocation API
const mockGeolocationSuccess = (lat = 33.1, lon = -117.3) => {
  const getCurrentPosition = jest.fn(success =>
    success({
      coords: {
        latitude: lat,
        longitude: lon,
      },
    })
  );
  global.navigator.geolocation = { getCurrentPosition };
  return getCurrentPosition;
};

const mockGeolocationFailure = () => {
  const getCurrentPosition = jest.fn((success, error) => error({ code: 1 }));
  global.navigator.geolocation = { getCurrentPosition };
  return getCurrentPosition;
};

// Utility to mock fetch
function mockFetch(responseData, ok = true, delay = 0) {
  return jest.spyOn(global, 'fetch').mockImplementation(() =>
    new Promise(resolve =>
      setTimeout(() => {
        resolve({
          ok,
          json: () => Promise.resolve(responseData),
        });
      }, delay)
    )
  );
}

function mockFetchFailure() {
  return jest.spyOn(global, 'fetch').mockImplementation(() =>
    Promise.resolve({
      ok: false,
      json: () => Promise.resolve({}),
    })
  );
}

describe('WeatherTempViewer', () => {
  afterEach(() => {
    jest.clearAllMocks();
    // Clean up geolocation so it does not leak between tests
    delete global.navigator.geolocation;
  });

  it('Renders initial UI with loading indicator for both temperature units', async () => {
    // Loading state should be observed at first render
    mockFetch({ current_weather: { temperature: 21 } }, true, 300); // Introduce small delay for loading state
    render(<WeatherTempViewer />);
    // Both temp displays show "--" as initial fallback
    expect(screen.getByText('--°C')).toBeInTheDocument();
    expect(screen.getByText('--°F')).toBeInTheDocument();

    // Button should show loading text while loading
    expect(screen.getByRole('button', { name: /refresh/i })).toHaveTextContent(/refresh/i);
    // After loading, expect actual values
    await waitFor(() =>
      expect(screen.queryByText('--°C')).not.toBeInTheDocument()
    );
  });

  it('Fetches and displays temperature data in Centigrade and Fahrenheit', async () => {
    mockFetch({ current_weather: { temperature: 23 } }, true);
    render(<WeatherTempViewer />);
    // After fetch, expect both units rendered with numbers
    expect(await screen.findByText('23°C')).toBeInTheDocument();
    expect(await screen.findByText('73°F')).toBeInTheDocument(); // 23C -> 73F
    expect(screen.getByText(/Centigrade/i)).toBeInTheDocument();
    expect(screen.getByText(/Fahrenheit/i)).toBeInTheDocument();
    // Weather description should show a city name
    expect(screen.getByText(/Weather for/)).toBeInTheDocument();
  });

  it('Displays error message if the fetch fails', async () => {
    mockFetchFailure();
    render(<WeatherTempViewer />);
    expect(await screen.findByText(/could not fetch temperature/i)).toBeInTheDocument();
    // "--°C" and "--°F" should remain visible
    expect(screen.getByText('--°C')).toBeInTheDocument();
    expect(screen.getByText('--°F')).toBeInTheDocument();
  });

  it('Refresh button triggers data re-fetch and updates UI', async () => {
    // 1st fetch: 19C
    let fetchMock = mockFetch({ current_weather: { temperature: 19 } }, true);
    render(<WeatherTempViewer />);
    expect(await screen.findByText('19°C')).toBeInTheDocument();
    expect(screen.getByText('66°F')).toBeInTheDocument();

    // Update fetch to new value for refresh (27C)
    fetchMock.mockRestore();
    fetchMock = mockFetch({ current_weather: { temperature: 27 } }, true);

    // Click refresh button
    const refreshBtn = screen.getByRole('button', { name: /refresh/i });
    fireEvent.click(refreshBtn);

    // Wait for "Refreshing..." during new fetch
    expect(refreshBtn).toHaveTextContent(/refreshing/i);

    // Wait for updated value in DOM
    expect(await screen.findByText('27°C')).toBeInTheDocument();
    expect(screen.getByText('81°F')).toBeInTheDocument();
    fetchMock.mockRestore();
  });

  it('Handles geolocation gracefully and displays custom city label', async () => {
    // Mock geolocation available
    mockGeolocationSuccess(48.85, 2.35);
    mockFetch({ current_weather: { temperature: 10 } }, true);
    render(<WeatherTempViewer />);
    // Wait for temperature and correct UI
    expect(await screen.findByText('10°C')).toBeInTheDocument();
    expect(screen.getByText(/Your Location/i)).toBeInTheDocument();
  });

  it('Shows loading indicator when refreshing', async () => {
    // Test that button text changes to "Refreshing..." during fetch
    mockFetch({ current_weather: { temperature: 22 } }, true);
    render(<WeatherTempViewer />);
    expect(await screen.findByText('22°C')).toBeInTheDocument();

    // Simulate a slower fetch when refreshing
    jest.clearAllMocks();
    mockFetch({ current_weather: { temperature: 17 } }, true, 300);
    // Click refresh and check button says "Refreshing..."
    const btn = screen.getByRole('button', { name: /refresh/i });
    fireEvent.click(btn);
    expect(btn).toHaveTextContent(/refreshing/i);

    // After it completes, new temperature is shown
    expect(await screen.findByText('17°C')).toBeInTheDocument();
  });

  it('Displays alternative error if temperature data is unavailable in API response', async () => {
    mockFetch({ current_weather: {} }, true);
    render(<WeatherTempViewer />);
    expect(await screen.findByText(/temperature data unavailable/i)).toBeInTheDocument();
  });

  it('Disables the Refresh button when loading', async () => {
    // Simulate slow fetch
    mockFetch({ current_weather: { temperature: 25 } }, true, 200);
    render(<WeatherTempViewer />);
    const btn = screen.getByRole('button', { name: /refresh/i });
    fireEvent.click(btn);

    // While loading, button should be disabled
    expect(btn).toBeDisabled();

    // After, it should be enabled again
    await waitFor(() => expect(btn).not.toBeDisabled());
  });
});
