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
          <img src="/Doubletick Logo.png" alt="DoubleTick" className="logo" />
          
          {/* Assignment title / details */}
          <div className="title">
            DoubleTick Assignment - rjagadeeshnit@gmail.com
            - RALLABANDI JAGADEESH - NIT Andhra Pradesh (Please go through README.md file) 
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
