import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Create root and render App component
//const root = ReactDOM.createRoot(document.getElementById('root'));
//root.render(
  //<React.StrictMode>
    //<App />
  //</React.StrictMode>
//);

// To this:
ReactDOM.createRoot(document.getElementById('root')).render(<App />);