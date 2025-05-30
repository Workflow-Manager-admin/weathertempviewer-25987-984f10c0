import React, { useEffect, useState, useCallback } from "react";

/**
 * WeatherTempViewer
 * Fetches and displays the current temperature in both Centigrade and Fahrenheit units.
 * Allows users to refresh via a button. Uses Open-Meteo public weather API.
 * Minimal, readable layout with prominent temperature, colors per spec.
 */
// PUBLIC_INTERFACE
function WeatherTempViewer() {
  const [celsius, setCelsius] = useState(null);
  const [fahrenheit, setFahrenheit] = useState(null);
  const [cityName, setCityName] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Convert Celsius to Fahrenheit
  function c2f(celsius) {
    return (celsius * 9) / 5 + 32;
  }

  // Fetch current temperature for user's location or fallback to London
  const fetchTemperature = useCallback(async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      let lat = 51.5072, lon = -0.1276, label = "London";
      // Try to use browser geolocation
      if ("geolocation" in navigator) {
        const locResult = await new Promise(res =>
          navigator.geolocation.getCurrentPosition(
            pos => res(pos),
            err => res(null),
            { timeout: 4000 }
          )
        );
        if (locResult && locResult.coords) {
          lat = locResult.coords.latitude;
          lon = locResult.coords.longitude;
          label = "Your Location";
        }
      }
      // Open-Meteo API returns Celsius by default
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;
      const resp = await fetch(url);
      if (!resp.ok) throw new Error("Network or API error");
      const data = await resp.json();
      if (data && data.current_weather && typeof data.current_weather.temperature === "number") {
        const cel = data.current_weather.temperature;
        setCelsius(cel);
        setFahrenheit(c2f(cel));
        setCityName(label);
      } else {
        setErrorMsg("Temperature data unavailable.");
      }
    } catch (err) {
      setErrorMsg("Could not fetch temperature. Please try again.");
    }
    setLoading(false);
  }, []);

  // On mount: fetch temperature
  useEffect(() => {
    fetchTemperature();
    // eslint-disable-next-line
  }, [fetchTemperature]);

  return (
    <section className="weather-temp-root-bg" style={{ width: "100%" }}>
      <div
        className="weather-temp-viewer-box"
        data-testid="weather-temp-box"
      >
        <div className="weather-temp-block weather-temp-block--c">
          <span className="weather-temp-value weather-temp-value--c">
            {celsius !== null ? Math.round(celsius) : "--"}
            <span className="weather-temp-unit weather-temp-unit--c">°C</span>
          </span>
          <span className="weather-temp-label weather-temp-label--c">Centigrade</span>
        </div>
        <div className="weather-temp-block weather-temp-block--f">
          <span className="weather-temp-value weather-temp-value--f">
            {fahrenheit !== null ? Math.round(fahrenheit) : "--"}
            <span className="weather-temp-unit weather-temp-unit--f">°F</span>
          </span>
          <span className="weather-temp-label weather-temp-label--f">Fahrenheit</span>
        </div>
      </div>
      {cityName && (
        <div className="weather-temp-desc">
          Weather for <span className="weather-temp-accent">{cityName}</span>, as of <span className="weather-temp-time">{new Date().toLocaleTimeString()}</span>
        </div>
      )}
      {errorMsg && <div className="weather-temp-error">{errorMsg}</div>}
      <button
        className="weather-temp-refresh-btn"
        disabled={loading}
        aria-label="Refresh temperature"
        onClick={fetchTemperature}
        data-testid="refresh-btn"
      >
        {loading ? "Refreshing..." : "Refresh"}
      </button>
      <div style={{ height: "18px" }} aria-hidden="true"/>
    </section>
  );
}

export default WeatherTempViewer;
