import './App.css';
import Home from './Components/HomePage/Home/Home';
import React from 'react';
import { AuthProvider } from './Components/context/AuthContext';

function App() {
  return (
      <AuthProvider>
        <div className="App">
          <Home />
        </div>
      </AuthProvider>
  );
}

export default App;