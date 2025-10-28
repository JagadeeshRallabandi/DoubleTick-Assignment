import React from 'react'
// Import the CustomerTable component which contains the main table logic
import CustomerTable from './components/CustomerTable'

// Import global CSS styles for layout, table, header, etc.
import './styles.css'

// Main App component
export default function App() {
  return (
    // Root wrapper for the entire application
    <div className="app-root">
      
      {/* Topbar / Header section */}
      <header className="topbar">
        <div className="topbar-inner">
          {/* Company / Assignment logo */}
          <img src="/Doubletick Logo.png" alt="DoubleTick" className="logo"  style={{ width: '180px', height: 'auto' }}  />
          
          {/* Assignment title / details */}
          <div className="title">
            DoubleTick Assignment - 
            <a href="mailto:rjagadeeshnit@gmail.com">rjagadeeshnit@gmail.com</a> - 
            <a href="https://jagadeeshrportfolio.vercel.app/" target="_blank" rel="noopener noreferrer">RALLABANDI JAGADEESH</a> - 
            NIT Andhra Pradesh 
            ( Please go through <a href="https://github.com/JagadeeshRallabandi/DoubleTick-Assignment" target="_blank" rel="noopener noreferrer">README.md</a>)
          </div>
        </div>
      </header>

      {/* Main content area */}
      <main className="container">
        {/* Customer table component */}
        <CustomerTable />
      </main>
    </div>
  )
}
