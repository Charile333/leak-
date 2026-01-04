import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import Dashboard from './pages/Dashboard';
import DomainMonitor from './pages/DomainMonitor';
import LeakQuery from './pages/LeakQuery';


function App() {
  return (
    <Router>
      <MainLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dns" element={<Dashboard />} />
          <Route path="/monitor" element={<DomainMonitor />} />
          <Route path="/leak-query" element={<LeakQuery />} />

          <Route path="/alerts" element={<div className="p-8 text-center text-gray-500">告警中心模块正在开发中...</div>} />
        </Routes>
      </MainLayout>
    </Router>
  );
}

export default App;
