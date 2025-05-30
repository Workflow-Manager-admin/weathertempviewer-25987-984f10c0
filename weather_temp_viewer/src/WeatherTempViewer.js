import React, { useEffect, useState } from "react";

// Color constants for the component, as per provided specification
const BRAND_PRIMARY = "#2196F3";
const BRAND_SECONDARY = "#FFFFFF";
const BRAND_ACCENT = "#FF9800";

/**
 * Convert Kelvin to Celsius.
 * @param {number} kelvin
 * @returns {number}
 */
function k2c(kelvin) {
  return kelvin - 273.15;
}

/**
 * Convert Celsius to Fahrenheit.
 * @param {number} celsius
 * @returns {number}
 */
function c2f(celsius) {
  return (celsius * 9) / 5 + 32;
}

// PUBLIC_INTERFACE
/**
 * Main Container for WeatherTempViewer.
 * Fetches and displays the current real-time temperature in Centigrade and Fahrenheit.
 * Includes Refresh support and uses specified color and layout.
 */
function WeatherTempViewer() {
  const [celsius, setCelsius] = useState(null);
  const [fahrenheit, setFahrenheit] = useState(null);
  const [cityName, setCityName] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  /**
   * Fetch current weather data for a given location.
   * Uses Open-Meteo API for open, no-auth weather data.
   * For demo: fetch temperature for user's coordinates (or fallback to London).
   */
  const fetchTemperature = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      let lat = 51.5072, lon = -0.1276, label = "London";
      // Try to get browser geolocation:
      if ("geolocation" in navigator) {
        const locResult = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => resolve(pos),
            (err) => resolve(null),
            { timeout: 4000 }
          );
        });
        if (locResult && locResult.coords) {
          lat = locResult.coords.latitude;
          lon = locResult.coords.longitude;
          label = "Your Location";
        }
      }
      // Open-Meteo API: https://open-meteo.com/
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Network response was not ok");
      const data = await res.json();
      if (data && data.current_weather && typeof data.current_weather.temperature === "number") {
        const cel = data.current_weather.temperature; // already Celsius
        setCelsius(cel);
        setFahrenheit(c2f(cel));
        setCityName(label);
      } else {
        setErrorMsg("Failed to retrieve temperature data.");
      }
    } catch (e) {
      setErrorMsg("Unable to fetch temperature. Please try again.");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTemperature();
    // Only on mount.
    // eslint-disable-next-line
  }, []);

  // Styles for the component
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
    <section style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={boxStyle}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <span style={tempValueStyle}>
            {celsius !== null ? Math.round(celsius) : "--"}
            <span style={unitStyle}>°C</span>
          </span>
          <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "1rem" }}>Centigrade</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", borderLeft: window.innerWidth > 640 ? "2px solid " + BRAND_SECONDARY : "none", borderTop: window.innerWidth > 640 ? "none" : "2px solid " + BRAND_SECONDARY, paddingLeft: window.innerWidth > 640 ? "40px" : "0", marginTop: window.innerWidth > 640 ? "0" : "16px", paddingTop: window.innerWidth > 640 ? "0" : "16px" }}>
          <span style={tempValueStyle}>
            {fahrenheit !== null ? Math.round(fahrenheit) : "--"}
            <span style={unitStyle}>°F</span>
          </span>
          <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "1rem" }}>Fahrenheit</span>
        </div>
      </div>
      {cityName && (
        <div style={descStyle}>
          Weather for <span style={{color:BRAND_ACCENT, fontWeight:600}}>{cityName}</span>, as of <span style={{fontWeight:500}}>{new Date().toLocaleTimeString()}</span>
        </div>
      )}
      {errorMsg && <div style={errorStyle}>{errorMsg}</div>}
      <button
        style={refreshBtnStyle}
        disabled={loading}
        aria-label="Refresh temperature"
        onClick={fetchTemperature}
      >
        {loading ? "Refreshing..." : "Refresh"}
      </button>
      <div style={{ height: "18px" }} />
    </section>
  );
}

export default WeatherTempViewer;
