import React from 'react';
import { Button } from '@heroui/react';
import { Icon } from '@iconify/react';
import { useTranslation } from 'react-i18next';

interface WelcomeViewProps {
  onEnterRooms: () => void;
}

export const WelcomeView: React.FC<WelcomeViewProps> = ({ onEnterRooms }) => {
  const { t } = useTranslation();

  return (
    <div className="h-full w-full overflow-y-auto">
      <div className="studio-home">
        <header className="studio-masthead">
          <span className="studio-eyebrow">{t('studioLabel')}</span>
          <span className="studio-wordmark">CoWorker House</span>
        </header>
        <section className="studio-hero">
          <div className="studio-hero-copy">
            <p className="studio-kicker">{t('studioKicker')}</p>
            <h2>{t('studioTitle')}</h2>
            <p className="studio-description">{t('studioDescription')}</p>
            <Button onPress={onEnterRooms} className="studio-create" endContent={<Icon icon="lucide:arrow-up-right" className="h-5 w-5" />}>
              {t('browseRooms')}
            </Button>
          </div>
          <div className="studio-art" aria-hidden="true">
            <div className="studio-orbit" />
            <div className="studio-art-tile studio-art-tile-chat"><Icon icon="lucide:messages-square" /></div>
            <div className="studio-art-tile studio-art-tile-code"><Icon icon="lucide:code-2" /></div>
            <div className="studio-art-spark">✳</div>
            <span className="studio-art-dot" />
          </div>
        </section>
        <div className="studio-empty">
          <span className="studio-empty-icon" aria-hidden="true"><Icon icon="lucide:door-open" /></span>
          <p>{t('welcomeDescription')}</p>
        </div>
      </div>
    </div>
  );
};
