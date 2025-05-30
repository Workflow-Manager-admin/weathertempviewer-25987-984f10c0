import React, { useEffect, useState, useCallback } from "react";

// PUBLIC_INTERFACE
/**
 * WeatherTempViewer
 * Fetches and displays the current temperature in both Centigrade and Fahrenheit units.
 * Allows users to refresh via a button. Uses Open-Meteo public weather API.
 * Minimal, readable layout with prominent temperature, colors per spec.
 */
function WeatherTempViewer() {
  // Use CSS variables for theme; fallback to hardcoded if missing
  const BRAND_PRIMARY =
    getComputedStyle(document.documentElement).getPropertyValue("--primary") || "#2196F3";
  const BRAND_SECONDARY =
    getComputedStyle(document.documentElement).getPropertyValue("--secondary") || "#FFFFFF";
  const BRAND_ACCENT =
    getComputedStyle(document.documentElement).getPropertyValue("--accent") || "#FF9800";

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

  // Style objects
  const boxStyle = {
    background: BRAND_PRIMARY,
    color: BRAND_SECONDARY,
    borderRadius: "14px",
    padding: "40px 32px",
    display: "flex",
    flexDirection: window.innerWidth > 640 ? "row" : "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "48px",
    boxShadow: "0 2px 18px 0 rgba(33,150,243,0.10)",
    minWidth: 320,
    maxWidth: 520,
    margin: "1rem auto"
  };
  const tempValueStyle = {
    fontSize: "3.5rem",
    fontWeight: 600,
    marginBottom: "0.25em",
    color: BRAND_SECONDARY,
    textShadow: "0 1px 6px rgba(33,150,243,0.15)",
    letterSpacing: "-2px"
  };
  const unitStyle = {
    fontSize: "1.4rem",
    color: BRAND_ACCENT,
    fontWeight: 600,
    marginLeft: "9px"
  };
  const descStyle = {
    marginTop: "18px",
    color: "rgba(255,255,255,0.88)",
    fontSize: "1.10rem",
    letterSpacing: ".06em",
    textAlign: "center",
    fontWeight: 400
  };
  const refreshBtnStyle = {
    marginTop: "28px",
    background: BRAND_ACCENT,
    color: BRAND_SECONDARY,
    border: 0,
    borderRadius: "6px",
    fontSize: "1rem",
    fontWeight: 600,
    padding: "12px 28px",
    cursor: "pointer",
    transition: "background 0.18s",
    boxShadow: "0 1px 7px 0 rgba(255,152,0,0.13)"
  };
  const errorStyle = {
    color: "#FF5252",
    fontWeight: 600,
    marginTop: "16px"
  };

  return (
    <section style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "300px" }}>
      <div style={boxStyle}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <span style={tempValueStyle}>
            {celsius !== null ? Math.round(celsius) : "--"}
            <span style={unitStyle}>°C</span>
          </span>
          <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "1rem" }}>Centigrade</span>
        </div>
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          borderLeft: window.innerWidth > 640 ? "2px solid " + BRAND_SECONDARY : "none",
          borderTop: window.innerWidth > 640 ? "none" : "2px solid " + BRAND_SECONDARY,
          paddingLeft: window.innerWidth > 640 ? "40px" : "0",
          marginTop: window.innerWidth > 640 ? "0" : "16px",
          paddingTop: window.innerWidth > 640 ? "0" : "16px"
        }}>
          <span style={tempValueStyle}>
            {fahrenheit !== null ? Math.round(fahrenheit) : "--"}
            <span style={unitStyle}>°F</span>
          </span>
          <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "1rem" }}>Fahrenheit</span>
        </div>
      </div>
      {cityName && (
        <div style={descStyle}>
          Weather for <span style={{ color: BRAND_ACCENT, fontWeight: 600 }}>{cityName}</span>, as of <span style={{ fontWeight: 500 }}>{new Date().toLocaleTimeString()}</span>
        </div>
      )}
      {errorMsg && <div style={errorStyle}>{errorMsg}</div>}
      <button
        style={refreshBtnStyle}
        disabled={loading}
        aria-label="Refresh temperature"
        onClick={fetchTemperature}
        data-testid="refresh-btn"
      >
        {loading ? "Refreshing..." : "Refresh"}
      </button>
      <div style={{ height: "18px" }} />
    </section>
  );
}

export default WeatherTempViewer;
