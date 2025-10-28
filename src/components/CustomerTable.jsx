import React, { useRef, useState, useEffect, useCallback } from 'react'

// Constants
const TOTAL = 1_000_000          // Total number of customers
const ROW_HEIGHT = 64            // Height of each row in pixels
const VIEWPORT_HEIGHT = 640      // Height of the scroll viewport
const BUFFER = 8                 // Extra rows to render above and below viewport

// Deterministic pseudo-random generator for consistent scores/avatars
function seededRandom(i) {
  let x = i + 0x9e3779b9
  x ^= x << 13
  x ^= x >>> 17
  x ^= x << 5
  return Math.abs(x) / 0xffffffff
}

// Generate a single customer object based on index
function generateCustomer(i) {
  const id = i + 1
  const firstNames = ['Ava', 'Liam', 'Noah', 'Emma', 'Olivia', 'Mason', 'Sophia', 'Isabella', 'Lucas', 'Mia', 'Ethan', 'Amelia', 'Harper', 'James', 'Benjamin', 'Charlotte', 'Elijah', 'Evelyn', 'Logan', 'Jack']
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson']
  
  // Deterministic name based on index
  const f = firstNames[i % firstNames.length]
  const l = lastNames[Math.floor(i / firstNames.length) % lastNames.length]
  const name = `${f} ${l}`
  
  // Phone and email
  const phone = `+91 ${String(9000000000 + (i % 1000000000)).slice(-10)}`
  const email = `${f.toLowerCase()}.${l.toLowerCase()}${id % 100}@example.com`
  
  // Score 0-99
  const score = Math.floor(seededRandom(i) * 100)
  
  // Last message date (daysAgo from today)
  const daysAgo = i % 365
  const lastMessageAt = new Date(Date.now() - daysAgo * 24 * 3600 * 1000).toLocaleString()
  
  const addedBy = `Kartikey Mishra`
  //for  Static  Avatar same avatar for all users
  // const avatar = /src/assets/test_avatar.png

  // Avatar (placeholder random avatar URL)
  const avatar = `https://avatar.iran.liara.run/public/${(id % 100) + 1}`

  return { id, name, phone, email, score, lastMessageAt, addedBy, avatar }
}

// Create a Web Worker blob for offloading search/sort
function createSearchWorkerBlob() {
  const code = `
self.onmessage = function(e){
  const {type, total, query, fields, sortField, sortDir} = e.data

  function seededRandom(i){
    let x = i + 0x9e3779b9
    x ^= x << 13
    x ^= x >>> 17
    x ^= x << 5
    return Math.abs(x)/0xffffffff
  }

  function generate(i){
    const id = i+1
    const first = ['Ava','Liam','Noah','Emma','Olivia','Mason','Sophia','Isabella','Lucas','Mia','Ethan','Amelia','Harper','James','Benjamin','Charlotte','Elijah','Evelyn','Logan','Jack'][i % 20]
    const last = ['Smith','Johnson','Williams','Brown','Jones','Garcia','Miller','Davis','Rodriguez','Martinez','Hernandez','Lopez','Gonzalez','Wilson','Anderson'][Math.floor(i/20) % 15]
    const name = first + ' ' + last
    const phone = '+91 ' + String(9000000000 + (i % 1000000000)).slice(-10)
    const email = first.toLowerCase() + '.' + last.toLowerCase() + (id%100) + '@example.com'
    const score = Math.floor(seededRandom(i) * 100)
    const daysAgo = i % 365
    const lastMessageAt = new Date(Date.now() - daysAgo * 24 * 3600 * 1000).toISOString()
    const addedBy = 'Kartikey Mishra'
    return {id,name,phone,email,score,lastMessageAt,addedBy}
  }

  if(type==='search'){
    const q=query.trim().toLowerCase()
    if(q===''){ self.postMessage({type:'result',indices:null}); return }
    const matches=[]
    for(let i=0;i<total;i++){
      const g=generate(i)
      if(fields.some(f=>String(g[f]).toLowerCase().includes(q))) matches.push(i)
      if(matches.length>=200000) break
    }
    self.postMessage({type:'result',indices:matches})
  } else if(type==='sort'){
    const arr=Array.from({length:total},(_,i)=>i)
    arr.sort((a,b)=>{
      const A=generate(a)[sortField]
      const B=generate(b)[sortField]
      if(A<B) return sortDir==='asc'?-1:1
      if(A>B) return sortDir==='asc'?1:-1
      return 0
    })
    self.postMessage({type:'sorted',indices:arr})
  }
}`
  return new Blob([code], { type: 'application/javascript' })
}

// Main component
export default function CustomerTable() {
  const containerRef = useRef(null)   // Reference to scroll container
  const [scrollTop, setScrollTop] = useState(0)  // Scroll position
  const [visibleStart, setVisibleStart] = useState(0)
  const [visibleEnd, setVisibleEnd] = useState(0)
  const [query, setQuery] = useState('')           // Search input
  const [debouncedQuery, setDebouncedQuery] = useState('')  // Debounced input
  const [sortField, setSortField] = useState(null)
  const [sortDir, setSortDir] = useState('asc')
  const [matchedIndices, setMatchedIndices] = useState(null) // Result indices
  const workerRef = useRef(null)   // Web worker
  const [isSearching, setIsSearching] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)  // Dummy filter dropdown

  // Initialize web worker
  useEffect(() => {
    const blob = createSearchWorkerBlob()
    const url = URL.createObjectURL(blob)
    const w = new Worker(url)
    workerRef.current = w

    w.onmessage = (e) => {
      const d = e.data
      if (d.type === 'result' || d.type === 'sorted') {
        setMatchedIndices(d.indices)
        setIsSearching(false)
        if (containerRef.current) containerRef.current.scrollTop = 0
      }
    }
    return () => { w.terminate(); URL.revokeObjectURL(url) }
  }, [])

  // Debounce search input 250ms
  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(query), 250)
    return () => clearTimeout(id)
  }, [query])

  // Trigger search in worker when debounced query changes
  useEffect(() => {
    if (workerRef.current) {
      setIsSearching(true)
      workerRef.current.postMessage({
        type: 'search',
        total: TOTAL,
        query: debouncedQuery,
        fields: ['name','email','phone']
      })
    }
  }, [debouncedQuery])

  // Total length of the list (filtered or full)
  const listLength = matchedIndices ? matchedIndices.length : TOTAL

  // Scroll handler: calculate visible row range
  const onScroll = useCallback((e) => {
    const top = e.target.scrollTop
    setScrollTop(top)
    const start = Math.max(0, Math.floor(top / ROW_HEIGHT) - BUFFER)
    const visibleCount = Math.ceil(VIEWPORT_HEIGHT / ROW_HEIGHT) + BUFFER * 2
    setVisibleStart(start)
    setVisibleEnd(start + visibleCount)
  }, [])

  // Update visible rows when scrollTop changes
  useEffect(() => {
    const start = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - BUFFER)
    const visibleCount = Math.ceil(VIEWPORT_HEIGHT / ROW_HEIGHT) + BUFFER * 2
    setVisibleStart(start)
    setVisibleEnd(start + visibleCount)
  }, [scrollTop])

  // Map visible position to actual customer index (filtered or full)
  function getIndexAt(pos) {
    if (matchedIndices) return matchedIndices[pos]
    return pos
  }

  // Sort handler
  const handleSort = (field) => {
    const dir = (sortField === field && sortDir === 'asc') ? 'desc' : 'asc'
    setSortField(field); setSortDir(dir); setIsSearching(true)
    workerRef.current.postMessage({ type: 'sort', total: TOTAL, sortField: field, sortDir: dir })
  }

  // Generate rows for visible range
  const rows = []
  const start = Math.max(0, visibleStart)
  const end = Math.min(listLength, visibleEnd)
  for (let i = start; i < end; i++) {
    const idx = getIndexAt(i)
    const c = generateCustomer(idx)
    rows.push({ pos: i, data: c })
  }

  // Render table header cell
  function header(label, field, width) {
    return (
      <th style={{ width }} onClick={() => handleSort(field)} className="clickable">
        <div className="th-inner">
          {label} {sortField === field ? (sortDir==='asc' ? '▲' : '▼') : ''}
        </div>
      </th>
    )
  }

  // JSX render
  return (
    <div className="card">

      {/* Header with title, search, and dummy filters */}
      <div className="customers-header">
        <div className="customers-header-left">
          <h2>All Customers <span className="badge">1230</span></h2>
        </div>

        <div className="customers-header-right">
          {/* Search input */}
          <div className="search">
            <img src="/src/assets/test_Search-3.svg" alt="search" />
            <input placeholder="Search Customers" value={query} onChange={e=>setQuery(e.target.value)} />
          </div>

          {/* Dummy filter dropdown */}
          <div className="filters">
            <button className="filter-btn" onClick={() => setFiltersOpen(s => !s)}>
              <img src="/src/assets/test_Filter.svg" alt="filter" /> Add Filters
            </button>
            {filtersOpen && (
              <div className="dropdown-content">
                <a href="#">Filter 1</a>
                <a href="#">Filter 2</a>
                <a href="#">Filter 3</a>
                <a href="#">Filter 4</a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Scrollable viewport */}
      <div className="viewport" ref={containerRef} onScroll={onScroll} style={{ height: VIEWPORT_HEIGHT }}>
        <div style={{ height: listLength * ROW_HEIGHT, position: 'relative' }}>
          <table className="customers-table" style={{ position: 'absolute', top: start * ROW_HEIGHT, left:0, width:'100%' }}>
            <thead className="sticky">
              <tr>
                <th style={{ width: 48 }}><input type="checkbox" /></th>
                {header('Customer','name','320px')}
                {header('Score','score','80px')}
                {header('Email','email','300px')}
                {header('Last message sent at','lastMessageAt','220px')}
                {header('Added by','addedBy','160px')}
              </tr>
            </thead>
            <tbody>
              {rows.map(r=>(
                <tr key={r.data.id} className="row">
                  <td><input type="checkbox" /></td>
                  <td className="name-cell">
                    <img className="avatar" src={r.data.avatar} alt="" />
                    <div className="name-block">
                      <div className="name">{r.data.name}</div>
                      <div className="muted small">{r.data.phone}</div>
                    </div>
                  </td>
                  <td>{r.data.score}</td>
                  <td className="muted small">{r.data.email}</td>
                  <td className="muted small">{r.data.lastMessageAt}</td>
                  <td className="muted small added-by-cell" style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                    <img 
                      src="/src/assets/test_user-3 3.svg" 
                      alt="added by avatar" 
                      style={{ width: 18, height: 18, borderRadius: '50%' }} 
                    />
                    {r.data.addedBy}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer showing status */}
      <div className="card-footer">
        {isSearching ? 'Working...' : `Showing ${matchedIndices ? matchedIndices.length : TOTAL} rows`}
      </div>
    </div>
  )
}
