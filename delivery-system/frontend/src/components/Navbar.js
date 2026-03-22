import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Navbar() {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="nav-brand">🚚 Delivery Monitor</div>
      <div className="nav-links">
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/route">AI Route</Link>
        <Link to="/reassign">Order Reassign</Link>
        <Link to="/worker">Worker Details</Link>
        <button onClick={logout} style={{background:'none',border:'none',cursor:'pointer',color:'inherit',fontSize:'inherit'}}>Logout</button>
      </div>
    </nav>
  );
}

export default Navbar;
