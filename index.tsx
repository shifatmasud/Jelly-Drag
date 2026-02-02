
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider } from './Theme.tsx';
import { BreakpointProvider } from './hooks/useBreakpoint.tsx';
import Welcome from './components/Page/Welcome.tsx';

function App() {
  React.useEffect(() => {
    // Set a pure black background for the page.
    document.body.style.backgroundColor = '#000000';
  }, []);

  return (
      <Welcome />
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BreakpointProvider>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </BreakpointProvider>
  </React.StrictMode>
);
