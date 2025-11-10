import { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // 로그인 시간 체크 및 자동 로그아웃
  useEffect(() => {
    const loginTime = localStorage.getItem('loginTime');
    
    if (token && loginTime) {
      const elapsed = Date.now() - parseInt(loginTime);
      const oneHour = 3600000; // 1시간 = 3600000ms
      
      if (elapsed >= oneHour) {
        console.log('⏰ 로그인 시간이 1시간을 초과했습니다. 자동 로그아웃합니다.');
        alert('로그인 시간이 만료되었습니다. 다시 로그인해주세요.');
        logout();
        return;
      }
    }
  }, []);

  // Axios 기본 설정
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  // 1시간 자동 로그아웃 타이머 (페이지가 열려있을 때)
  useEffect(() => {
    if (!user) return;

    const loginTime = localStorage.getItem('loginTime');
    if (!loginTime) return;

    const elapsed = Date.now() - parseInt(loginTime);
    const oneHour = 3600000; // 1시간
    const remaining = oneHour - elapsed;

    // 이미 1시간이 지났으면 즉시 로그아웃
    if (remaining <= 0) {
      console.log('⏰ 로그인 시간이 만료되었습니다.');
      alert('로그인 시간이 만료되었습니다. 다시 로그인해주세요.');
      logout();
      return;
    }

    console.log(`⏰ 자동 로그아웃까지 남은 시간: ${Math.floor(remaining / 60000)}분`);
    
    // 남은 시간 후 자동 로그아웃
    const logoutTimer = setTimeout(() => {
      console.log('⏰ 1시간이 경과하여 자동 로그아웃됩니다.');
      alert('로그인 시간이 만료되었습니다. 다시 로그인해주세요.');
      logout();
    }, remaining);

    // 5분 전 경고 (남은 시간이 5분 이상일 때만)
    const fiveMinutes = 300000;
    const warningTime = remaining - fiveMinutes;
    let warningTimer = null;
    
    if (warningTime > 0) {
      warningTimer = setTimeout(() => {
        console.log('⚠️ 5분 후 자동 로그아웃됩니다.');
        alert('5분 후 자동으로 로그아웃됩니다.');
      }, warningTime);
    }

    return () => {
      clearTimeout(logoutTimer);
      if (warningTimer) clearTimeout(warningTimer);
      console.log('⏰ 자동 로그아웃 타이머 종료');
    };
  }, [user]);

  // Axios 인터셉터: 401 에러 시 자동 로그아웃
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401 && token) {
          console.error('🔒 토큰이 만료되었습니다. 자동 로그아웃합니다.');
          alert('로그인 세션이 만료되었습니다. 다시 로그인해주세요.');
          logout();
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, [token]);

  const fetchUser = async () => {
    try {
      const response = await axios.get('/api/auth/me');
      setUser(response.data);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    const response = await axios.post('/api/auth/login', { username, password });
    const { token: newToken, ...userData } = response.data;
    
    localStorage.setItem('token', newToken);
    localStorage.setItem('loginTime', Date.now().toString()); // 로그인 시간 저장
    setToken(newToken);
    setUser(userData);
    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    
    console.log('✅ 로그인 성공. 1시간 후 자동 로그아웃됩니다.');
    
    return response.data;
  };

  const signup = async (username, password, email, nickname) => {
    const response = await axios.post('/api/auth/signup', {
      username,
      password,
      email,
      nickname
    });
    const { token: newToken, ...userData } = response.data;
    
    localStorage.setItem('token', newToken);
    localStorage.setItem('loginTime', Date.now().toString()); // 회원가입 시간 저장
    setToken(newToken);
    setUser(userData);
    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    
    console.log('✅ 회원가입 성공. 1시간 후 자동 로그아웃됩니다.');
    
    return response.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('loginTime'); // 로그인 시간도 삭제
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
    console.log('👋 로그아웃 완료');
  };

  const value = {
    user,
    token,
    login,
    signup,
    logout,
    isAuthenticated: !!user,
    loading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
