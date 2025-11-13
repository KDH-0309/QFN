import React from 'react';
import { useTranslation } from 'react-i18next';

export default function Intro() {
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language; // 'ko' or 'en'

  // 유튜브 링크 (사용자 제공: 임베드 URL)
  const youtubeLinks = {
    ko: 'https://www.youtube.com/embed/l7D63aB7OFA?si=GR575cZfPM68VdJ-',
    en: 'https://www.youtube.com/embed/Z8DIF283eC4?si=VjtJbvz_EyjU620o'
  };

  const currentYoutubeLink = currentLanguage === 'ko' ? youtubeLinks.ko : youtubeLinks.en;

  const toEmbedUrl = (url) => {
    try {
      const u = new URL(url);
      // 이미 /embed/ 형식이면 호스트만 nocookie로 교체하여 반환
      if (u.pathname.startsWith('/embed/')) {
        const query = u.search ? `${u.search}&rel=0&modestbranding=1` : '?rel=0&modestbranding=1';
        return `https://www.youtube-nocookie.com${u.pathname}${query}`;
      }
      // youtu.be/<id> 또는 watch?v=<id> 처리
      let id = '';
      if (u.hostname.includes('youtu.be')) {
        id = u.pathname.replace('/', '');
      } else {
        id = u.searchParams.get('v') || '';
      }
      if (!id) return '';
      return `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1`;
    } catch (e) {
      return '';
    }
  };
  const embedUrl = toEmbedUrl(currentYoutubeLink);

  // 백테스트 이미지 경로 후보
  const candidateNames = [
    'final_portfolio_value_comparison.png',
    'investment_period_performance_3mo.png',
    'training_period_performance_3mo.png',
  ];
  const candidatePaths = candidateNames.flatMap((name) => [
    `/docs/backtest/${name}`,
    `/${name}`,
    `/backtest/${name}`,
  ]);

  const [imgSrc, setImgSrc] = React.useState(candidatePaths[0]);
  const [imgIndex, setImgIndex] = React.useState(0);

  const handleImageError = () => {
    if (imgIndex < candidatePaths.length - 1) {
      const nextIndex = imgIndex + 1;
      setImgIndex(nextIndex);
      setImgSrc(candidatePaths[nextIndex]);
    }
  };

  return (
    <div className="p-8 bg-background min-h-screen">
      <h1 className="text-3xl font-bold text-foreground mb-2">{t('introTitle')}</h1>
      <p className="text-muted-foreground mb-8">{t('introSubtitle')}</p>

      {/* 유튜브 영상 섹션 */}
      <div className="mb-12 bg-card rounded-xl border border-border p-6">
        <h2 className="text-2xl font-bold text-card-foreground mb-4">{t('videoIntroTitle')}</h2>
        <div className="aspect-video w-full max-w-4xl mx-auto">
          <iframe
            width="100%"
            height="100%"
            src={embedUrl}
            title={t('videoIntroTitle')}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
            className="rounded-lg"
          ></iframe>
        </div>
      </div>

      {/* 백테스트 결과 섹션 */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h2 className="text-2xl font-bold text-card-foreground mb-6">{t('backtestResultsTitle')}</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* 왼쪽: 이미지 */}
          <div className="bg-muted rounded-lg border border-border p-4">
            <img 
              src={imgSrc} 
              alt={t('backtestResultsTitle')}
              className="w-full h-auto rounded"
              onError={handleImageError}
            />
          </div>

          {/* 오른쪽: 설명 */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-card-foreground">
              {currentLanguage === 'ko' ? '3개월 투자 후 포트폴리오 가치 비교' : 'Portfolio Value Comparison After 3 Months Investment'}
            </h3>
            
            <div className="prose prose-sm max-w-none text-card-foreground">
              {currentLanguage === 'ko' ? (
                <>
                  <p className="leading-relaxed">
                    이 차트는 <strong>MPT + QAOA 하이브리드 최적화</strong>를 사용한 포트폴리오와 동일 가중치(Equal Weight) 포트폴리오의 3개월 투자 성과를 비교한 결과입니다.
                  </p>
                  
                  <h4 className="font-bold mt-4 mb-2">주요 성과</h4>
                  <ul className="list-disc pl-5 space-y-2">
                    <li><strong>평균 추가 수익: $933 (+23.0%)</strong></li>
                    <li>초기 투자금: $10,000</li>
                    <li>6개 다른 학습 기간(6개월~5년)에서 일관되게 우수한 성과</li>
                  </ul>

                  <h4 className="font-bold mt-4 mb-2">핵심 특징</h4>
                  <ul className="list-disc pl-5 space-y-2">
                    <li><strong>양자 알고리즘(QAOA):</strong> 복잡한 최적화 문제를 효율적으로 해결</li>
                    <li><strong>현대 포트폴리오 이론(MPT):</strong> 위험 대비 수익 극대화</li>
                    <li><strong>실시간 데이터:</strong> 실제 주식 시장 데이터 기반 백테스트</li>
                  </ul>

                  <p className="mt-4 text-sm text-muted-foreground">
                    * 과거 성과가 미래 수익을 보장하지 않습니다. 투자 전 반드시 면책조항을 확인하세요.
                  </p>
                </>
              ) : (
                <>
                  <p className="leading-relaxed">
                    This chart compares the 3-month investment performance between portfolios optimized using <strong>MPT + QAOA Hybrid</strong> and Equal Weight portfolios.
                  </p>
                  
                  <h4 className="font-bold mt-4 mb-2">Key Performance</h4>
                  <ul className="list-disc pl-5 space-y-2">
                    <li><strong>Average Additional Return: $933 (+23.0%)</strong></li>
                    <li>Initial Investment: $10,000</li>
                    <li>Consistent outperformance across 6 different training periods (6mo~5yr)</li>
                  </ul>

                  <h4 className="font-bold mt-4 mb-2">Core Features</h4>
                  <ul className="list-disc pl-5 space-y-2">
                    <li><strong>Quantum Algorithm (QAOA):</strong> Efficiently solves complex optimization problems</li>
                    <li><strong>Modern Portfolio Theory (MPT):</strong> Maximizes risk-adjusted returns</li>
                    <li><strong>Real-time Data:</strong> Backtested with actual stock market data</li>
                  </ul>

                  <p className="mt-4 text-sm text-muted-foreground">
                    * Past performance does not guarantee future returns. Please review the disclaimer before investing.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
