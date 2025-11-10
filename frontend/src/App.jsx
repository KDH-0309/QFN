import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import PortfolioOptimizer from './components/PortfolioOptimizer';
import ChatbotFloat from './components/ChatbotFloat';
import Settings from './components/Settings';
import Login from './components/Login';
import Signup from './components/Signup';
import FindUsername from './components/FindUsername';
import FindPassword from './components/FindPassword';
import './App.css';

// Layout with Sidebar
function MainLayout({ children }) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-background">
        {children}
      </main>
      <ChatbotFloat />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/find-username" element={<FindUsername />} />
          <Route path="/find-password" element={<FindPassword />} />
          
          {/* Protected routes with sidebar */}
          <Route path="/" element={
            <MainLayout>
              <PortfolioOptimizer />
            </MainLayout>
          } />
          <Route path="/dashboard" element={
            <MainLayout>
              <Dashboard />
            </MainLayout>
          } />
          <Route path="/settings" element={
            <MainLayout>
              <Settings />
            </MainLayout>
          } />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
