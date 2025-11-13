import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';

const Disclaimer = () => {
  const { t } = useTranslation();

  return (
    <div className="p-8 bg-background min-h-screen">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8 flex items-center gap-4">
          <AlertTriangle className="text-red-600" size={48} />
          <div>
            <h1 className="text-3xl font-bold text-foreground">{t('disclaimerTitle')}</h1>
            <p className="text-muted-foreground mt-2">{t('disclaimerSubtitle')}</p>
          </div>
        </div>

        {/* 면책조항 본문 */}
        <div className="bg-card rounded-xl shadow-md p-8 border border-border">
          <div className="prose prose-lg max-w-none">
            <div className="space-y-6 text-card-foreground leading-relaxed">
              <p className="font-semibold text-lg text-red-600">
                {t('disclaimerWarning')}
              </p>

              <div>
                <h3 className="font-bold text-xl mb-3">{t('disclaimerSection1Title')}</h3>
                <p>{t('disclaimerSection1Content')}</p>
              </div>

              <div>
                <h3 className="font-bold text-xl mb-3">{t('disclaimerSection2Title')}</h3>
                <p>{t('disclaimerSection2Content')}</p>
              </div>

              <div>
                <h3 className="font-bold text-xl mb-3">{t('disclaimerSection3Title')}</h3>
                <p>{t('disclaimerSection3Content')}</p>
              </div>

              <div>
                <h3 className="font-bold text-xl mb-3">{t('disclaimerSection4Title')}</h3>
                <p>{t('disclaimerSection4Content')}</p>
              </div>

              <div className="mt-8 p-6 bg-yellow-50 dark:bg-yellow-950 border-l-4 border-yellow-600 rounded">
                <p className="font-bold text-lg text-yellow-900 dark:text-yellow-100">
                  {t('disclaimerFinalNote')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 날짜 */}
        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>{t('disclaimerLastUpdated')}: 2025년 11월 13일</p>
        </div>
      </div>
    </div>
  );
};

export default Disclaimer;
