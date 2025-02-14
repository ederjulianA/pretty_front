// src/App.js
import React, { useState, useEffect } from 'react';
import POS2 from './POS2';
import Login from './components/Login';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('pedidos_pretty_token');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);
  

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  return (
    <>
      {isAuthenticated ? <POS2 /> : <Login onLoginSuccess={handleLoginSuccess} />}
    </>
  );
}

export default App;
