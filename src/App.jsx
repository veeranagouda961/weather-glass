import { useState } from 'react'
import './App.css'

const API_BASE = 'https://api.weatherstack.com'
const API_KEY = import.meta.env.VITE_WEATHERSTACK_API_KEY

function App() {
  const [activeTab, setActiveTab] = useState('current')
  const [location, setLocation] = useState('New York')
  const [historicalDate, setHistoricalDate] = useState('2019-09-07')
  const [marineDate, setMarineDate] = useState('2019-09-07')
  const [units, setUnits] = useState('m')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [weatherResult, setWeatherResult] = useState(null)

  const handleFetch = async (type) => {
    if (!API_KEY) {
      setError(
        'Missing API key. Please add VITE_WEATHERSTACK_API_KEY to a .env.local file.'
      )
      return
    }

    if (!location.trim()) {
      setError('Please enter a location.')
      return
    }

    setLoading(true)
    setError(null)
    setWeatherResult(null)

    try {
      const params = new URLSearchParams({
        access_key: API_KEY,
        query: location.trim(),
        units,
      })

      let endpoint = '/current'

      if (type === 'historical') {
        if (!historicalDate) {
          throw new Error('Please choose a historical date.')
        }
        endpoint = '/historical'
        params.set('historical_date', historicalDate)
        params.set('hourly', '1')
      } else if (type === 'marine') {
        if (!marineDate) {
          throw new Error('Please choose a marine date.')
        }
        endpoint = '/historical'
        params.set('historical_date', marineDate)
        params.set('hourly', '1')
        params.set('tide', '1')
      } else {
        endpoint = '/current'
      }

      const url = `${API_BASE}${endpoint}?${params.toString()}`
      const response = await fetch(url)
      const data = await response.json()

      if (data.error) {
        throw new Error(data.error.info || 'API request failed.')
      }

      setWeatherResult({ type, data })
    } catch (err) {
      setError(err.message || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  const current = weatherResult?.data?.current
  const locationInfo = weatherResult?.data?.location
  const historicalBlock =
    weatherResult?.type !== 'current' && weatherResult?.data?.historical

  const firstHistoricalEntry = historicalBlock
    ? weatherResult.data.historical[Object.keys(weatherResult.data.historical)[0]]
    : null

  const marineTides =
    weatherResult?.type === 'marine' && firstHistoricalEntry
      ? firstHistoricalEntry.tides || firstHistoricalEntry.tide
      : null

  return (
    <div className="app-shell">
      <div className="background-gradient" />
      <div className="glass-card">
        <header className="header">
          <div>
            <h1 className="title">Weather Glass</h1>
            <p className="subtitle">
              Real-time, historical &amp; marine weather.
            </p>
          </div>
          <div className="badge">weatherstack</div>
        </header>

        <div className="tabs">
          <button
            className={`tab ${activeTab === 'current' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('current')}
          >
            Current
          </button>
          <button
            className={`tab ${activeTab === 'historical' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('historical')}
          >
            Historical
          </button>
          <button
            className={`tab ${activeTab === 'marine' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('marine')}
          >
            Marine
          </button>
        </div>

        <section className="controls">
          <div className="field">
            <label>Location</label>
            <input
              type="text"
              placeholder="City, ZIP, coordinates, or IP"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          {activeTab === 'historical' && (
            <div className="field">
              <label>Historical date</label>
              <input
                type="date"
                value={historicalDate}
                onChange={(e) => setHistoricalDate(e.target.value)}
              />
            </div>
          )}

          {activeTab === 'marine' && (
            <div className="field">
              <label>Marine date</label>
              <input
                type="date"
                value={marineDate}
                onChange={(e) => setMarineDate(e.target.value)}
              />
            </div>
          )}

          <div className="field">
            <label>Units</label>
            <select value={units} onChange={(e) => setUnits(e.target.value)}>
              <option value="m">Metric (°C)</option>
              <option value="f">Imperial (°F)</option>
              <option value="s">Scientific (K)</option>
            </select>
          </div>

          <button
            className="primary-button"
            onClick={() => handleFetch(activeTab)}
            disabled={loading}
          >
            {loading ? 'Fetching...' : 'Fetch Weather'}
          </button>
        </section>

        {error && <div className="error-banner">{error}</div>}

        <section className="content-grid">
          <div className="panel main-panel">
            {!weatherResult && !error && (
              <p className="muted">
                Choose a mode, enter a location, and click{' '}
                <span className="highlight">Fetch Weather</span> to begin.
              </p>
            )}

            {weatherResult && (
              <>
                {locationInfo && (
                  <div className="location-header">
                    <div>
                      <h2>
                        {locationInfo.name}, {locationInfo.country}
                      </h2>
                      <p className="location-meta">
                        {locationInfo.region} · Timezone: {locationInfo.timezone_id}
                      </p>
                    </div>
                    <div className="localtime">
                      <span className="label">Local time</span>
                      <span className="value">{locationInfo.localtime}</span>
                    </div>
                  </div>
                )}

                {weatherResult.type === 'current' && current && (
                  <div className="current-grid">
                    <div className="current-main">
                      <div className="current-temp">
                        <span className="temp-value">{current.temperature}°</span>
                        <div className="temp-meta">
                          <span className="description">
                            {current.weather_descriptions?.[0]}
                          </span>
                          <span className="feelslike">
                            Feels like {current.feelslike}°
                          </span>
                        </div>
                        {current.weather_icons?.[0] && (
                          <img
                            src={current.weather_icons[0]}
                            alt={current.weather_descriptions?.[0] || 'Weather icon'}
                            className="weather-icon"
                          />
                        )}
                      </div>
                    </div>
                    <div className="current-details">
                      <div className="detail-row">
                        <span>Humidity</span>
                        <span>{current.humidity}%</span>
                      </div>
                      <div className="detail-row">
                        <span>Wind</span>
                        <span>
                          {current.wind_speed} {units === 'm' ? 'km/h' : 'mph'} ·{' '}
                          {current.wind_dir}
                        </span>
                      </div>
                      <div className="detail-row">
                        <span>Pressure</span>
                        <span>{current.pressure} mb</span>
                      </div>
                      <div className="detail-row">
                        <span>Visibility</span>
                        <span>
                          {current.visibility} {units === 'm' ? 'km' : 'mi'}
                        </span>
                      </div>
                      <div className="detail-row">
                        <span>UV Index</span>
                        <span>{current.uv_index}</span>
                      </div>
                      <div className="detail-row">
                        <span>Cloud cover</span>
                        <span>{current.cloudcover}%</span>
                      </div>
                    </div>
                  </div>
                )}

                {weatherResult.type === 'historical' && firstHistoricalEntry && (
                  <div className="historical-section">
                    <h3>Historical summary for {firstHistoricalEntry.date}</h3>
                    <div className="historical-summary">
                      <div>
                        <span className="label">Avg temp</span>
                        <span className="value">
                          {firstHistoricalEntry.avgtemp}°
                        </span>
                      </div>
                      <div>
                        <span className="label">Min / Max</span>
                        <span className="value">
                          {firstHistoricalEntry.mintemp}° /{' '}
                          {firstHistoricalEntry.maxtemp}°
                        </span>
                      </div>
                      <div>
                        <span className="label">Sun hours</span>
                        <span className="value">{firstHistoricalEntry.sunhour}</span>
                      </div>
                      <div>
                        <span className="label">UV index</span>
                        <span className="value">{firstHistoricalEntry.uv_index}</span>
                      </div>
                    </div>

                    {Array.isArray(firstHistoricalEntry.hourly) && (
                      <div className="historical-hourly">
                        {firstHistoricalEntry.hourly.slice(0, 6).map((h) => (
                          <div key={h.time} className="hour-chip">
                            <span className="time">
                              {String(h.time).padStart(4, '0').replace(/(\d{2})$/, ':$1')}
                            </span>
                            <span className="temp">{h.temperature}°</span>
                            <span className="desc">
                              {h.weather_descriptions?.[0]}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {weatherResult.type === 'marine' && (
                  <div className="historical-section">
                    <h3>Marine conditions (based on historical data)</h3>
                    {marineTides ? (
                      <div className="marine-tides">
                        {Array.isArray(marineTides) ? (
                          marineTides.slice(0, 4).map((tide, idx) => (
                            <div key={idx} className="tide-card">
                              <div className="label">Tide {idx + 1}</div>
                              <pre className="tide-json">
                                {JSON.stringify(tide, null, 2)}
                              </pre>
                            </div>
                          ))
                        ) : (
                          <pre className="tide-json">
                            {JSON.stringify(marineTides, null, 2)}
                          </pre>
                        )}
                      </div>
                    ) : (
                      <p className="muted small">
                        Marine-specific tide data was not returned for this location or
                        plan. Showing general historical information instead.
                      </p>
                    )}

                    {firstHistoricalEntry && (
                      <div className="historical-summary compact">
                        <div>
                          <span className="label">Avg temp</span>
                          <span className="value">
                            {firstHistoricalEntry.avgtemp}°
                          </span>
                        </div>
                        <div>
                          <span className="label">Wind (sample)</span>
                          <span className="value">
                            {firstHistoricalEntry.hourly?.[0]?.wind_speed} ·{' '}
                            {firstHistoricalEntry.hourly?.[0]?.wind_dir}
                          </span>
                        </div>
                        <div>
                          <span className="label">Wave / sea data</span>
                          <span className="value">
                            Check tide block above (depends on plan).
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

export default App
