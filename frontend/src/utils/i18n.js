import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  ko: {
    translation: {
      "appTitle": "AI 주식 포트폴리오 최적화",
      "appSubtitle": "양자 컴퓨팅을 활용한 포트폴리오 최적화",
      "dashboard": "대시보드",
      "portfolio": "포트폴리오",
      "chatbot": "AI 어시스턴트",
      "settings": "설정",
      "stockSearch": "주식 검색",
      "addStock": "주식 추가",
      "optimize": "최적화",
      "expectedReturn": "예상 수익률",
      "expectedRisk": "예상 위험도",
      "sharpeRatio": "샤프 비율",
      "allocation": "자산 배분",
      "askQuestion": "질문을 입력하세요...",
      "send": "전송",
      "language": "언어",
      "theme": "테마",
      "about": "정보"
    }
  },
  en: {
    translation: {
      "appTitle": "AI Stock Portfolio Optimizer",
      "appSubtitle": "Portfolio Optimization using Quantum Computing",
      "dashboard": "Dashboard",
      "portfolio": "Portfolio",
      "chatbot": "AI Assistant",
      "settings": "Settings",
      "stockSearch": "Stock Search",
      "addStock": "Add Stock",
      "optimize": "Optimize",
      "expectedReturn": "Expected Return",
      "expectedRisk": "Expected Risk",
      "sharpeRatio": "Sharpe Ratio",
      "allocation": "Allocation",
      "askQuestion": "Ask a question...",
      "send": "Send",
      "language": "Language",
      "theme": "Theme",
      "about": "About"
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'ko',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
