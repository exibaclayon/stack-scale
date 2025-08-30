import React, {useState} from 'react';

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxDOQcr0ekHobImigjGZG3jenSowPgfXx-qISV6XLH5mbPHgyW9rM7OicACLjFx0JHs4A/exec';

function headerToKey(h) {
  return String(h || '').trim().toLowerCase().replace(/[^a-z0-9]+/g,'_');
}

export default function App() {
  const [view, setView] = useState('home');
  const [password, setPassword] = useState('');
  const [adminForm, setAdminForm] = useState({
    service_id: '',
    type_of_device: 'mobile',
    device_model: '',
    client_name: '',
    client_phone_number: '',
    date_of_visit: '',
    admin_representative: 'Admin A',
    acknowledgement_confirmation: false,
    admin_notes: '',
    service_price: '',
    service_price_breakdown: '',
    technical_representative: '',
    tech_notes: ''
  });
  const testFields = ['Physical','Power','WiFi','Camera','Operation','Screen','Charging','Audio','Ports'];
  const [tests, setTests] = useState(() => testFields.reduce((acc,f)=>{acc[headerToKey(f)] = false; return acc;}, {}));
  const [trackId, setTrackId] = useState('');
  const [trackResult, setTrackResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  function uiContainer(children) {
    return (
      <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#f7fbff',padding:'24px'}}>
        <div style={{width:480,background:'white',padding:24,borderRadius:8,boxShadow:'0 6px 20px rgba(15,23,42,0.06)'}}>
          {children}
        </div>
      </div>
    );
  }

  async function submitAdmin() {
    setLoading(true);
    setMessage('');
    try {
      const params = {};
      // map adminForm fields to keys that Apps Script expects
      params['service_id'] = adminForm.service_id;
      params['type_of_device'] = adminForm.type_of_device;
      params['device_model'] = adminForm.device_model;
      params['client_name'] = adminForm.client_name;
      params['client_phone_number'] = adminForm.client_phone_number;
      params['date_of_visit'] = adminForm.date_of_visit;
      params['admin_representative'] = adminForm.admin_representative;
      params['technical_representative'] = adminForm.technical_representative;
      params['admin_notes'] = adminForm.admin_notes;
      params['acknowledgement_confirmation'] = adminForm.acknowledgement_confirmation ? 'TRUE' : '';
      params['service_price'] = adminForm.service_price;
      params['service_price_breakdown'] = adminForm.service_price_breakdown;
      params['tech_notes'] = adminForm.tech_notes;
      // tests
      Object.keys(tests).forEach(k=>{ params[k] = tests[k] ? 'TRUE' : ''; });
      // admin password
      params['adminPassword'] = password;

      const body = new URLSearchParams(params);
      const res = await fetch(SCRIPT_URL, {method:'POST', body});
      const json = await res.json();
      if (json && json.success) {
        setMessage('Record submitted — status set to active by default.');
        setAdminForm(prev => ({...prev, service_id: ''}));
        setTests(testFields.reduce((acc,f)=>{acc[headerToKey(f)] = false; return acc;}, {}));
      } else {
        setMessage('Error: ' + (json.error || 'unknown'));
      }
    } catch (err) {
      console.error(err);
      setMessage('Network or server error');
    }
    setLoading(false);
  }

  async function handleTrack() {
    setLoading(true);
    setTrackResult(null);
    try {
      const url = SCRIPT_URL + '?serviceId=' + encodeURIComponent(trackId);
      const res = await fetch(url);
      const json = await res.json();
      if (json && json.success) {
        setTrackResult(json.record);
      } else {
        setMessage('Not found');
      }
    } catch (err) {
      setMessage('Network error');
    }
    setLoading(false);
  }

  // Views
  if (view === 'home') return uiContainer(
    <div>
      <h2 style={{margin:0,color:'#0b5fff'}}>Stack&Scale — Repair Tracking</h2>
      <p style={{color:'#334155'}}>Choose an option: Client - Tracking, Admin - Form</p>
      <div style={{display:'flex',gap:12,marginTop:16}}>
        <button onClick={()=>setView('tracking')} style={{flex:1,padding:'10px 12px',borderRadius:6,border:'1px solid #0b5fff',background:'white',color:'#0b5fff'}}>Tracking</button>
        <button onClick={()=>setView('adminLogin')} style={{flex:1,padding:'10px 12px',borderRadius:6,border:'none',background:'#0b5fff',color:'white'}}>Admin (Form)</button>
      </div>
    </div>
  );

  if (view === 'tracking') return uiContainer(
    <div>
      <h2 style={{margin:0,color:'#0b5fff'}}>Track your device</h2>
      <p style={{color:'#475569'}}>Enter your Service ID</p>
      <input value={trackId} onChange={e=>setTrackId(e.target.value)} placeholder="Service ID" style={{width:'100%',padding:10,borderRadius:6,border:'1px solid #e2e8f0'}} />
      <div style={{display:'flex',gap:12,marginTop:16}}>
        <button onClick={handleTrack} style={{flex:1,padding:'10px',borderRadius:6,border:'none',background:'#0b5fff',color:'white'}}>Submit</button>
        <button onClick={()=>{setView('home');setMessage('');}} style={{flex:1,padding:'10px',borderRadius:6,border:'1px solid #c7d2fe',background:'white',color:'#0b5fff'}}>Back</button>
      </div>

      {loading && <p style={{marginTop:12}}>Loading…</p>}
      {trackResult && (
        <div style={{marginTop:16,padding:12,border:'1px solid #e6eefc',borderRadius:6}}>
          <div><strong>Service ID:</strong> {trackResult.service_id}</div>
          <div><strong>Status:</strong> {trackResult.status}</div>
          <div><strong>Date of Visit:</strong> {trackResult.date_of_visit}</div>
          <div><strong>Target Completion Date:</strong> {trackResult.target_date}</div>
          <div><strong>Customer Name:</strong> {trackResult.client_name}</div>
          <div><strong>Device Model:</strong> {trackResult.device_model}</div>
          <div><strong>Service Price:</strong> {trackResult.service_price}</div>
        </div>
      )}
      {message && <p style={{color:'red',marginTop:12}}>{message}</p>}
    </div>
  );

  if (view === 'adminLogin') return uiContainer(
    <div>
      <h2 style={{margin:0,color:'#0b5fff'}}>Admin login</h2>
      <p style={{color:'#475569'}}>Enter admin password to access the form</p>
      <input value={password} onChange={e=>setPassword(e.target.value)} type="password" placeholder="password" style={{width:'100%',padding:10,borderRadius:6,border:'1px solid #e2e8f0'}} />
      <div style={{display:'flex',gap:12,marginTop:16}}>
        <button onClick={()=>{ if (!password) { setMessage('Enter password'); return; } setView('adminForm'); setMessage(''); }} style={{flex:1,padding:'10px',borderRadius:6,border:'none',background:'#0b5fff',color:'white'}}>Enter</button>
        <button onClick={()=>setView('home')} style={{flex:1,padding:'10px',borderRadius:6,border:'1px solid #c7d2fe',background:'white',color:'#0b5fff'}}>Back</button>
      </div>
      {message && <p style={{color:'red',marginTop:12}}>{message}</p>}
    </div>
  );

  if (view === 'adminForm') return uiContainer(
    <div>
      <h2 style={{margin:0,color:'#0b5fff'}}>Admin Form</h2>
      <p style={{color:'#475569'}}>Add a new service record (status will default to <em>active</em>)</p>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
        <input placeholder="Service ID" value={adminForm.service_id} onChange={e=>setAdminForm({...adminForm, service_id: e.target.value})} style={{padding:8,borderRadius:6,border:'1px solid #e2e8f0'}} />
        <select value={adminForm.type_of_device} onChange={e=>setAdminForm({...adminForm, type_of_device: e.target.value})} style={{padding:8,borderRadius:6,border:'1px solid #e2e8f0'}}>
          <option value="mobile">Mobile</option>
          <option value="laptop">Laptop</option>
          <option value="drone">Drone</option>
          <option value="tablet">Tablet</option>
        </select>
        <input placeholder="Device Model" value={adminForm.device_model} onChange={e=>setAdminForm({...adminForm, device_model: e.target.value})} style={{padding:8,borderRadius:6,border:'1px solid #e2e8f0'}} />
        <input placeholder="Client Name" value={adminForm.client_name} onChange={e=>setAdminForm({...adminForm, client_name: e.target.value})} style={{padding:8,borderRadius:6,border:'1px solid #e2e8f0'}} />
        <input placeholder="Client Phone Number" value={adminForm.client_phone_number} onChange={e=>setAdminForm({...adminForm, client_phone_number: e.target.value})} style={{padding:8,borderRadius:6,border:'1px solid #e2e8f0'}} />
        <input type="date" placeholder="Date of Visit" value={adminForm.date_of_visit} onChange={e=>setAdminForm({...adminForm, date_of_visit: e.target.value})} style={{padding:8,borderRadius:6,border:'1px solid #e2e8f0'}} />
        <select value={adminForm.admin_representative} onChange={e=>setAdminForm({...adminForm, admin_representative: e.target.value})} style={{padding:8,borderRadius:6,border:'1px solid #e2e8f0'}}>
          <option>Admin A</option>
          <option>Admin B</option>
        </select>
      </div>

      <div style={{marginTop:12}}>
        <strong>Initial tests</strong>
        <div style={{display:'flex',flexWrap:'wrap',gap:8,marginTop:8}}>
          {testFields.map(f => {
            const k = headerToKey(f);
            return (
              <label key={k} style={{display:'flex',alignItems:'center',gap:6}}>
                <input type="checkbox" checked={!!tests[k]} onChange={e=>setTests({...tests, [k]: e.target.checked})} />
                <span style={{fontSize:13}}>{f}</span>
              </label>
            );
          })}
        </div>
      </div>

      <div style={{marginTop:12}}>
        <textarea placeholder="Admin notes" value={adminForm.admin_notes} onChange={e=>setAdminForm({...adminForm, admin_notes: e.target.value})} style={{width:'100%',padding:8,borderRadius:6,border:'1px solid #e2e8f0',minHeight:80}} />
      </div>

      <div style={{marginTop:8,display:'flex',alignItems:'center',gap:8}}>
        <input type="checkbox" checked={adminForm.acknowledgement_confirmation} onChange={e=>setAdminForm({...adminForm, acknowledgement_confirmation: e.target.checked})} />
        <label>This device has been tested</label>
      </div>

      <div style={{display:'flex',gap:8,marginTop:12}}>
        <button onClick={submitAdmin} disabled={loading} style={{flex:1,padding:'10px',borderRadius:6,border:'none',background:'#0b5fff',color:'white'}}>Submit</button>
        <button onClick={()=>setView('home')} style={{flex:1,padding:'10px',borderRadius:6,border:'1px solid #c7d2fe',background:'white',color:'#0b5fff'}}>Close</button>
      </div>

      {message && <p style={{marginTop:12}}>{message}</p>}
    </div>
  );

  return uiContainer(<div>Unknown view</div>);
}