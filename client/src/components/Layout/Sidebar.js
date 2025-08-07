import React from 'react';
import { NavLink } from 'react-router-dom';

export default function Sidebar({ onLogout }) {
  return (
    <nav className="sidebar">
      <h2>CrimeBook</h2>
      <ul>
        <li><NavLink to="/dashboard">Dashboard</NavLink></li>
        <li><NavLink to="/map">Crime Map</NavLink></li>
        <li><NavLink to="/report">Report Crime</NavLink></li>
        <li><NavLink to="/profile">Profile</NavLink></li>
      </ul>
      <button className="logout" onClick={onLogout}>Log Out</button>
    </nav>
  );
}
