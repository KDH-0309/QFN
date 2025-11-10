import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, User } from 'lucide-react';

const Header = ({ title }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* 로고 및 타이틀 */}
          <div className="flex items-center space-x-4">
            <img 
              src="/qfn-logo.png" 
              alt="QFN Logo" 
              className="w-12 h-12"
            />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  QuantaFolio Navigator
                </span>
              </h1>
              {title && <p className="text-sm text-gray-600">{title}</p>}
            </div>
          </div>

          {/* 사용자 정보 및 로그아웃 */}
          <div className="flex items-center space-x-4">
            {user && (
              <div className="flex items-center space-x-2 px-4 py-2 bg-gray-100 rounded-lg">
                <User size={18} className="text-gray-600" />
                <span className="text-sm font-medium text-gray-700">
                  {user.nickname || user.username}
                </span>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <LogOut size={18} />
              <span className="text-sm font-semibold">로그아웃</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
