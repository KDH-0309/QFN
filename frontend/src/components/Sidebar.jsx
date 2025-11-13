import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LayoutDashboard, TrendingUp, Info, User, LogOut, LogIn, AlertTriangle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const Sidebar = () => {
  const { t } = useTranslation();
  const { language, changeLanguage } = useLanguage();
  const location = useLocation();
  const { user, logout, isAuthenticated } = useAuth();

  const menuItems = [
    { id: 'portfolio', path: '/', label: t('portfolioOptimize'), icon: TrendingUp },
    { id: 'dashboard', path: '/dashboard', label: t('myPage'), icon: LayoutDashboard, requireAuth: true },
    { id: 'intro', path: '/intro', label: t('intro'), icon: Info },
    { id: 'disclaimer', path: '/disclaimer', label: t('disclaimer'), icon: AlertTriangle },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 text-white p-6 flex flex-col">
      <div className="mb-8">
        <img 
          src="/qfn-logo.png" 
          alt="QFN Logo" 
          className="w-24 h-24 mx-auto mb-3"
        />
        <h1 className="text-xl font-bold text-center bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          QuantaFolio Navigator
        </h1>
        <p className="text-xs text-slate-400 mt-1 text-center">{t('tagline')}</p>
      </div>
      
      <nav className="space-y-2 flex-1">
        {menuItems.map((item) => {
          // 로그인이 필요한 메뉴인데 로그인 안되어 있으면 스킵
          if (item.requireAuth && !isAuthenticated) {
            return null;
          }
          
          return (
            <Link
              key={item.id}
              to={item.path}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                location.pathname === item.path
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-6 border-t border-slate-800">
        <div className="flex gap-2 mb-4 justify-center">
          <button
            onClick={() => changeLanguage('ko')}
            className={`px-3 py-1 rounded font-semibold text-xs border ${language === 'ko' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-blue-600 border-blue-400'}`}
          >
            한국어
          </button>
          <button
            onClick={() => changeLanguage('en')}
            className={`px-3 py-1 rounded font-semibold text-xs border ${language === 'en' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-blue-600 border-blue-400'}`}
          >
            English
          </button>
        </div>
        {isAuthenticated ? (
          <>
            <div className="flex items-center gap-3 px-4 py-3 mb-2">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <User size={20} />
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="font-semibold truncate">{user?.nickname}</p>
                <p className="text-xs text-slate-400 truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="w-full flex items-center gap-2 px-4 py-2 text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
            >
              <LogOut size={18} />
              <span>{t('logout')}</span>
            </button>
          </>
        ) : (
          <Link
            to="/login"
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            <LogIn size={18} />
            <span>{t('login')}</span>
          </Link>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
