import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowLeft, Key } from 'lucide-react';
import axios from 'axios';

const FindPassword = () => {
  const [step, setStep] = useState(1); // 1: 이메일 입력, 2: 인증코드 입력, 3: 새 비밀번호 설정
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetToken, setResetToken] = useState('');
  const navigate = useNavigate();

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('/api/auth/reset-password-request', { email });
      setResetToken(response.data.resetToken);
      setStep(2);
    } catch (err) {
      setError('입력하신 이메일로 가입된 계정을 찾을 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeVerification = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await axios.post('/api/auth/reset-password-verify', {
        resetToken,
        verificationCode
      });
      setStep(3);
    } catch (err) {
      setError('인증 코드가 올바르지 않습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    if (newPassword.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }

    setLoading(true);

    try {
      await axios.post('/api/auth/reset-password', {
        resetToken,
        verificationCode,
        newPassword
      });
      alert('비밀번호가 성공적으로 변경되었습니다.');
      navigate('/login');
    } catch (err) {
      setError('비밀번호 변경에 실패했습니다. 다시 시도해 주세요.');
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
          <h1 className="text-2xl font-bold text-gray-900">비밀번호 찾기</h1>
          <p className="text-gray-600 text-sm mt-2">
            {step === 1 && '가입 시 등록한 이메일을 입력하세요'}
            {step === 2 && '이메일로 전송된 인증 코드를 입력하세요'}
            {step === 3 && '새로운 비밀번호를 설정하세요'}
          </p>
        </div>

        {/* 진행 단계 표시 */}
        <div className="flex justify-between mb-6">
          <div className={`flex items-center ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full ${step >= 1 ? 'bg-blue-600' : 'bg-gray-300'} text-white flex items-center justify-center font-semibold`}>
              1
            </div>
            <span className="ml-2 text-xs">이메일</span>
          </div>
          <div className={`flex-1 h-0.5 mt-4 mx-2 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
          <div className={`flex items-center ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full ${step >= 2 ? 'bg-blue-600' : 'bg-gray-300'} text-white flex items-center justify-center font-semibold`}>
              2
            </div>
            <span className="ml-2 text-xs">인증</span>
          </div>
          <div className={`flex-1 h-0.5 mt-4 mx-2 ${step >= 3 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
          <div className={`flex items-center ${step >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full ${step >= 3 ? 'bg-blue-600' : 'bg-gray-300'} text-white flex items-center justify-center font-semibold`}>
              3
            </div>
            <span className="ml-2 text-xs">완료</span>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Step 1: 이메일 입력 */}
        {step === 1 && (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
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
              {loading ? '전송 중...' : '인증 코드 받기'}
            </button>
          </form>
        )}

        {/* Step 2: 인증 코드 입력 */}
        {step === 2 && (
          <form onSubmit={handleCodeVerification} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                인증 코드
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="6자리 인증 코드"
                  maxLength={6}
                  required
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {email}로 전송된 인증 코드를 입력하세요
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:bg-gray-400"
            >
              {loading ? '확인 중...' : '인증 확인'}
            </button>

            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-full text-gray-600 py-2 rounded-lg hover:bg-gray-100 transition-colors text-sm"
            >
              이메일 다시 입력
            </button>
          </form>
        )}

        {/* Step 3: 새 비밀번호 설정 */}
        {step === 3 && (
          <form onSubmit={handlePasswordReset} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                새 비밀번호
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="최소 6자 이상"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                비밀번호 확인
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="비밀번호 재입력"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:bg-gray-400"
            >
              {loading ? '변경 중...' : '비밀번호 변경'}
            </button>
          </form>
        )}

        <div className="mt-6 text-center text-sm">
          <Link to="/find-username" className="text-blue-600 hover:text-blue-700">
            아이디 찾기
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

export default FindPassword;
