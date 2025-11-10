import { useTranslation } from 'react-i18next';
import { useLanguage } from '../contexts/LanguageContext';
import { Globe, Info } from 'lucide-react';

const Settings = () => {
  const { t } = useTranslation();
  const { language, changeLanguage } = useLanguage();

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{t('settings')}</h1>
        <p className="text-gray-600 mt-2">애플리케이션 설정을 관리하세요</p>
      </div>

      <div className="space-y-6">
        {/* 언어 설정 */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <Globe className="mr-2" size={20} />
            {t('language')}
          </h2>
          <div className="space-y-3">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="radio"
                name="language"
                value="ko"
                checked={language === 'ko'}
                onChange={() => changeLanguage('ko')}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-gray-700">한국어</span>
            </label>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="radio"
                name="language"
                value="en"
                checked={language === 'en'}
                onChange={() => changeLanguage('en')}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-gray-700">English</span>
            </label>
          </div>
        </div>

        {/* 정보 */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <Info className="mr-2" size={20} />
            {t('about')}
          </h2>
          <div className="space-y-3 text-gray-700">
            <p>
              <strong>애플리케이션:</strong> Stock Portfolio Optimizer
            </p>
            <p>
              <strong>버전:</strong> 1.0.0
            </p>
            <p>
              <strong>설명:</strong> 양자 컴퓨팅(Qiskit)을 활용한 AI 포트폴리오 최적화
              도구
            </p>
            <p className="mt-4 text-sm text-gray-600">
              본 애플리케이션은 주식 포트폴리오를 최적화하여 리스크와 수익률을
              분석합니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
