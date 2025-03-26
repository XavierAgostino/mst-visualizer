import React from 'react';
import './App.css';
import MSTVisualizer from './MSTVisualizer';
import { Analytics } from "@vercel/analytics/react"

function App() {
  return (
    <div className="App">
      <MSTVisualizer />
      <Analytics />
    </div>
  );
}

export default App;