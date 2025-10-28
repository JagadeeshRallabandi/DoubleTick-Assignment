
// Import createRoot from React 18+ for rendering the app
import { createRoot } from 'react-dom/client'

// Import the main App component (your Customers List UI)
import App from './App'

// Import global styles
import './styles.css'

// Select the root div in index.html and render the React app
createRoot(document.getElementById('root')).render(
  // Render the App component inside the root
  <App />
)
