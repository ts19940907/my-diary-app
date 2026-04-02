import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import Calendar from './components/Calendar';
// import './App.css'

function App() {

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <header className="text-center mb-10">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">
            Work Diary <span className="text-blue-600">v1.0</span>
          </h1>
          <p className="text-slate-500 mt-3 text-lg">
            日々の業務、課題、解決策をスマートに記録
          </p>
        </header>

        <main>
          <Calendar />
        </main>
        
        <footer className="mt-12 text-center text-slate-400 text-sm">
          &copy; 2026 Diary Tool - AWS SAP Study Project
        </footer>
      </div>
    </div>
  )
}

export default App
