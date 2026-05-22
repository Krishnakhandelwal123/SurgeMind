// frontend/src/App.js
import React, { useState, useEffect } from "react";
import axios from "axios";

const API = "http://localhost:3001/api";

function App() {
  const [businesses, setBusinesses] = useState([]);
  const [selected, setSelected] = useState(null);
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(false);

  // load businesses when app starts
  useEffect(() => {
    axios.get(`${API}/businesses`)
      .then(res => setBusinesses(res.data));
  }, []);

  // Generate AI action plan for selected business
  async function generatePlan(business) {
    setSelected(business);
    setLoading(true);
    setAlert(null);
    const res = await axios.post(`${API}/generate-alert`, {
      businessId: business._id,
      city: business.city,
      language: business.language
    });
    setAlert(res.data);
    setLoading(false);
  }

  return (
    <div style={{ fontFamily: "Arial", padding: "2rem", maxWidth: "900px", margin: "0 auto" }}>
      <h1 style={{ color: "#6063ff" }}>⚡ SurgeMind Dashboard</h1>
      <p>FIFA World Cup 2026 – Fan Surge Alerts for Local Businesses</p>

      <h2>Select a Business</h2>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        {businesses.map(biz => (
          <div 
            key={biz._id}
            onClick={() => generatePlan(biz)}
            style={{ 
              padding: "1rem", 
              border: "2px solid #6063ff", 
              borderRadius: "8px", 
              cursor: "pointer",
              background: selected?._id === biz._id ? "#e6e6ff" : "white"
            }}
          >
            <strong>{biz.name}</strong>
            <div>{biz.type} • {biz.city}</div>
          </div>
        ))}
      </div>

      {loading && <p style={{ color: "#6063ff" }}>⚙️ SurgeMind is analyzing...</p>}

      {alert && (
        <div style={{ 
          marginTop: "2rem", 
          padding: "1.5rem", 
          background: "#f0f0ff", 
          borderRadius: "8px",
          border: "2px solid #00d28d"
        }}>
          <h3 style={{ color: "#00d28d" }}>✅ Action Plan for {selected.name}</h3>
          <p style={{ whiteSpace: "pre-wrap" }}>{alert.advice}</p>
          <p><strong>Surge Score:</strong> {alert.surgeScore}/10</p>
        </div>
      )}
    </div>
  );
}

export default App;