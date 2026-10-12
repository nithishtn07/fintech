import { useState } from 'react';
import { Sidebar, type NavTab } from './components/layout/Sidebar';
import { Dashboard } from './pages/Dashboard';

function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');

  return (
    <div className="flex min-h-screen bg-[#080c14] text-slate-100 font-sans antialiased selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Sidebar Navigation */}
      <Sidebar currentTab={currentTab} onSelectTab={setCurrentTab} />

      {/* Main Dashboard Content Area */}
      <Dashboard currentTab={currentTab} />
    </div>
  );
}

export default App;
