import { useState, useEffect } from 'react';
import './App.css';
import API from './api';

const initialDispensers = [
  { id: 1, location: 'College Hostel', light: 25, regular: 40, heavy: 18, disposal: 'Working' },
  { id: 2, location: 'College Library', light: 6, regular: 8, heavy: 4, disposal: 'Working' },
  { id: 3, location: 'Bus Stand', light: 0, regular: 12, heavy: 7, disposal: 'Maintenance' },
];

const padOptions = [
  ['light', 'Light Flow'],
  ['regular', 'Regular Flow'],
  ['heavy', 'Heavy Flow'],
];

function App() {
  const [dispensers, setDispensers] = useState(initialDispensers);
  const [page, setPage] = useState('Dashboard');
  const [selected, setSelected] = useState(1);
  const [pad, setPad] = useState('regular');
  const [otp, setOtp] = useState('');
  const [verified, setVerified] = useState(false);
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState([]);
  const [backendStatus, setBackendStatus] = useState('Checking...');
  const [busy, setBusy] = useState(false);

  const current = dispensers.find(
    (item) => Number(item.id) === Number(selected)
  );

  const total = dispensers.reduce(
    (sum, item) =>
      sum +
      Number(item.light || 0) +
      Number(item.regular || 0) +
      Number(item.heavy || 0),
    0
  );

  const low = dispensers.reduce(
    (sum, item) =>
      sum +
      [item.light, item.regular, item.heavy].filter(
        (quantity) => Number(quantity) >= 0 && Number(quantity) <= 8
      ).length,
    0
  );

  useEffect(() => {
    async function loadData() {
      try {
        const statusResponse = await API.get('/status');
        setBackendStatus(statusResponse.data.message || 'Connected');

        const inventoryResponse = await API.get('/dispensers');
        if (inventoryResponse.data.success && Array.isArray(inventoryResponse.data.dispensers)) {
          setDispensers(inventoryResponse.data.dispensers);
        }

        const historyResponse = await API.get('/history');
        if (historyResponse.data.success) {
          setHistory(historyResponse.data.history || []);
        }
      } catch (error) {
        console.error('Backend connection error:', error);
        setBackendStatus('Connection failed');
      }
    }

    loadData();
  }, []);

  async function refreshData() {
    try {
      const inventoryResponse = await API.get('/dispensers');
      if (inventoryResponse.data.success && Array.isArray(inventoryResponse.data.dispensers)) {
        setDispensers(inventoryResponse.data.dispensers);
      }

      const historyResponse = await API.get('/history');
      if (historyResponse.data.success) {
        setHistory(historyResponse.data.history || []);
      }
    } catch (error) {
      console.error('Refresh error:', error);
      throw error;
    }
  }

  function verifyOTP() {
    if (otp === '4721') {
      setVerified(true);
      setMessage('Demo OTP verified successfully!');
    } else {
      setVerified(false);
      setMessage('Incorrect OTP. Enter 4721 for this demo.');
    }
  }

  async function dispense() {
    if (!verified) {
      setMessage('Please verify the OTP first.');
      return;
    }

    if (!current || Number(current[pad]) <= 0) {
      setMessage('Out of stock. Select another pad type or location.');
      return;
    }

    try {
      setBusy(true);
      setMessage('Processing dispensing request...');

      const response = await API.post('/dispense', {
        dispenserId: selected,
        padType: pad,
        otp,
      });

      if (!response.data.success) {
        setMessage(response.data.message || 'Dispensing failed.');
        return;
      }

      await refreshData();
      setMessage(response.data.message || 'Pad dispensed successfully.');
      setOtp('');
      setVerified(false);
    } catch (error) {
      console.error('Dispensing error:', error);
      setMessage(
        error.response?.data?.message ||
          'Dispensing failed. Check your backend API.'
      );
    } finally {
      setBusy(false);
    }
  }

  async function restock(id, key) {
    try {
      setBusy(true);
      setMessage('Processing restock request...');

      const response = await API.post('/restock', {
        dispenserId: id,
        padType: key,
        quantity: 10,
      });

      if (!response.data.success) {
        setMessage(response.data.message || 'Restocking failed.');
        return;
      }

      await refreshData();
      setMessage(response.data.message || 'Restocking successful.');
    } catch (error) {
      console.error('Restocking error:', error);
      setMessage(
        error.response?.data?.message ||
          'Restocking failed. Check your backend API.'
      );
    } finally {
      setBusy(false);
    }
  }

  async function toggleDisposal(id) {
    const item = dispensers.find(
      (dispenser) => Number(dispenser.id) === Number(id)
    );

    if (!item) return;

    const newStatus =
      item.disposal === 'Working' ? 'Maintenance' : 'Working';

    try {
      setBusy(true);
      setMessage('Updating disposal status...');

      const response = await API.put('/disposal/' + id, {
        disposal: newStatus,
        status: newStatus,
      });

      if (!response.data.success) {
        setMessage(response.data.message || 'Status update failed.');
        return;
      }

      await refreshData();
      setMessage(response.data.message || 'Disposal status updated.');
    } catch (error) {
      console.error('Disposal update error:', error);
      setMessage(
        error.response?.data?.message ||
          'Could not update disposal status.'
      );
    } finally {
      setBusy(false);
    }
  }

  function navigateTo(nextPage) {
    setPage(nextPage);
    setMessage('');
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">✿</div>
          <div>
            <h2>SmartPad</h2>
            <p>Care. Comfort. Dignity.</p>
          </div>
        </div>

        <p className="menu-title">MAIN MENU</p>

        <nav className="nav">
          {[
            'Dashboard',
            'Dispense Pads',
            'Inventory',
            'Disposal System',
            'Activity Records',
          ].map((item) => (
            <button
              type="button"
              key={item}
              className={page === item ? 'active' : ''}
              onClick={() => navigateTo(item)}
            >
              <span>
                {item === 'Dashboard' && '▦'}
                {item === 'Dispense Pads' && '＋'}
                {item === 'Inventory' && '▤'}
                {item === 'Disposal System' && '♻'}
                {item === 'Activity Records' && '◷'}
              </span>
              <span>{item}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="status-dot" />
          <div>
            <strong>SmartPad System</strong>
            <p>Prototype v1.0</p>
          </div>
        </div>
      </aside>

      <main className="content">
        <header className="topbar">
          <div>
            <p className="breadcrumb">SmartPad / {page}</p>
            <h1>{page}</h1>
          </div>

          <div className="admin">
            <div className="avatar">A</div>
            <div>
              <strong>Administrator</strong>
              <p>System Manager</p>
            </div>
          </div>
        </header>

        <div className="backend-notice">Backend status: {backendStatus}</div>

        {message && (
          <div className="notice" role="status">
            {message}
          </div>
        )}

        {page === 'Dashboard' && (
          <>
            <section className="welcome">
              <div>
                <p className="eyebrow">SMART SANITARY CARE</p>
                <h2>Welcome to SmartPad Dashboard</h2>
                <p>
                  Monitor dispensers, manage inventory, and maintain a cleaner,
                  more accessible sanitary care system.
                </p>
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => navigateTo('Dispense Pads')}
                >
                  Dispense a Pad →
                </button>
              </div>
              <div className="welcome-icon">✿</div>
            </section>

            <section className="stats">
              <div className="stat">
                <p>Total Pads in Stock</p>
                <h2>{total}</h2>
                <span>Across all locations</span>
              </div>
              <div className="stat">
                <p>Dispenser Locations</p>
                <h2>{dispensers.length}</h2>
                <span>Registered locations</span>
              </div>
              <div className="stat">
                <p>Low Stock Alerts</p>
                <h2>{low}</h2>
                <span>Pad types needing attention</span>
              </div>
              <div className="stat">
                <p>Dispensing Records</p>
                <h2>{history.length}</h2>
                <span>Recorded activities</span>
              </div>
            </section>

            <section className="panel">
              <div className="panel-heading">
                <div>
                  <h3>Dispenser Overview</h3>
                  <p>Current inventory across registered locations</p>
                </div>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => navigateTo('Inventory')}
                >
                  Manage Inventory
                </button>
              </div>

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Location</th>
                      <th>Light</th>
                      <th>Regular</th>
                      <th>Heavy</th>
                      <th>Disposal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dispensers.map((item) => (
                      <tr key={item.id}>
                        <td>{item.location}</td>
                        <td>{item.light}</td>
                        <td>{item.regular}</td>
                        <td>{item.heavy}</td>
                        <td>
                          <span className={item.disposal === 'Working' ? 'badge success' : 'badge warning'}>
                            {item.disposal}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}

        {page === 'Dispense Pads' && (
          <section className="panel form-panel">
            <h2>Dispense a Sanitary Pad</h2>
            <p>Verify the demonstration OTP before dispensing.</p>

            <label htmlFor="location">Select Dispenser Location</label>
            <select
              id="location"
              value={selected}
              onChange={(event) => {
                setSelected(Number(event.target.value));
                setVerified(false);
                setOtp('');
                setMessage('');
              }}
            >
              {dispensers.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.location}
                </option>
              ))}
            </select>

            <label>Select Pad Type</label>
            <div className="pad-options">
              {padOptions.map(([value, label]) => (
                <button
                  type="button"
                  key={value}
                  className={pad === value ? 'pad-option selected' : 'pad-option'}
                  onClick={() => {
                    setPad(value);
                    setVerified(false);
                    setOtp('');
                    setMessage('');
                  }}
                >
                  <strong>{label}</strong>
                  <span>Available: {current ? current[value] : 0}</span>
                </button>
              ))}
            </div>

            <div className="otp-box">
              <h3>OTP Verification</h3>
              <p>Enter the demonstration OTP.</p>
              <input
                aria-label="Demo OTP"
                value={otp}
                onChange={(event) => {
                  setOtp(event.target.value);
                  setVerified(false);
                  setMessage('');
                }}
                placeholder="Enter OTP"
                maxLength={4}
                inputMode="numeric"
              />
              <p>Demo OTP: 4721 (no real SMS is sent)</p>
              <button
                type="button"
                className="primary-button"
                onClick={verifyOTP}
                disabled={busy}
              >
                Verify OTP
              </button>
              {verified && <p>OTP verified successfully.</p>}
            </div>

            <button
              type="button"
              className="primary-button dispense-button"
              onClick={dispense}
              disabled={busy}
            >
              {busy ? 'Please wait...' : 'Dispense Selected Pad'}
            </button>
          </section>
        )}

        {page === 'Inventory' && (
          <section className="panel">
            <h2>Inventory Management</h2>
            <p>Restock any pad category by 10 pads.</p>
            {dispensers.map((item) => (
              <div className="inventory-card" key={item.id}>
                <h3>{item.location}</h3>
                {padOptions.map(([key, label]) => (
                  <div className="inventory-row" key={key}>
                    <span>{label}</span>
                    <strong>{item[key]} pads</strong>
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => restock(item.id, key)}
                      disabled={busy}
                    >
                      Restock 10
                    </button>
                  </div>
                ))}
              </div>
            ))}
          </section>
        )}

        {page === 'Disposal System' && (
          <section className="panel">
            <h2>Disposal System Management</h2>
            <p>Monitor disposal units at registered locations.</p>
            {dispensers.map((item) => (
              <div className="inventory-row disposal-row" key={item.id}>
                <strong>{item.location}</strong>
                <span className={item.disposal === 'Working' ? 'badge success' : 'badge warning'}>
                  {item.disposal}
                </span>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => toggleDisposal(item.id)}
                  disabled={busy}
                >
                  Toggle Status
                </button>
              </div>
            ))}
          </section>
        )}

        {page === 'Activity Records' && (
          <section className="panel">
            <h2>Activity Records</h2>
            <p>Dispensing activity recorded by the backend.</p>
            {history.length === 0 ? (
              <div className="empty-state">
                <h3>No activity yet</h3>
                <p>Successful dispensing actions will appear here.</p>
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Location</th>
                      <th>Pad Type</th>
                      <th>Time</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((item, index) => (
                      <tr key={item.id ?? index}>
                        <td>{item.location || item.dispenserLocation || 'Unknown'}</td>
                        <td>{item.padType || item.pad || 'Unknown'}</td>
                        <td>{item.time || item.timestamp || 'Recorded'}</td>
                        <td>{item.status || 'Dispensed'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        <footer>
          <span>SmartPad · Smart Sanitary Care</span>
          <span>Agile Development &amp; DevOps Project</span>
        </footer>
      </main>
    </div>
  );
}

export default App;
