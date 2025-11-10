import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft } from 'lucide-react';
import axios from 'axios';

const FindUsername = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);
    setLoading(true);

    try {
      const response = await axios.post('/api/auth/find-username', { email });
      setResult(response.data);
    } catch (err) {
      setError('입력하신 이메일로 가입된 계정을 찾을 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md border border-gray-200">
        <div className="mb-6">
          <Link to="/login" className="flex items-center text-gray-600 hover:text-gray-900 transition-colors mb-4">
            <ArrowLeft size={20} className="mr-2" />
            로그인으로 돌아가기
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">아이디 찾기</h1>
          <p className="text-gray-600 text-sm mt-2">
            가입 시 등록한 이메일을 입력하세요
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {result && (
          <div className="mb-4 p-4 bg-green-100 border border-green-300 text-green-800 rounded-lg">
            <p className="font-semibold mb-2">아이디를 찾았습니다:</p>
            <p className="text-lg font-bold">{result.username}</p>
            <p className="text-sm mt-2 text-gray-700">
              가입일: {new Date(result.createdAt).toLocaleDateString('ko-KR')}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              이메일
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="example@email.com"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:bg-gray-400"
          >
            {loading ? '검색 중...' : '아이디 찾기'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
          <Link to="/find-password" className="text-blue-600 hover:text-blue-700">
            비밀번호 찾기
          </Link>
          <span className="text-gray-400 mx-2">|</span>
          <Link to="/signup" className="text-blue-600 hover:text-blue-700">
            회원가입
          </Link>
        </div>
      </div>
    </div>
  );
};

export default FindUsername;
