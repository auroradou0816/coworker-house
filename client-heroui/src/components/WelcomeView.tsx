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
    <div className="h-full w-full overflow-y-auto bg-background px-5 py-10 sm:px-10 lg:px-14">
      <div className="mx-auto flex min-h-full w-full max-w-5xl flex-col justify-center gap-10">
        <div className="flex items-center gap-3 text-muted-foreground">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-700/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300">
            <Icon icon="lucide:terminal-square" className="h-5 w-5" />
          </span>
          <span className="font-mono text-sm tracking-wide">CoWorker House / {t('codeAgentWorkspace')}</span>
        </div>
        <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <h2 className="max-w-xl text-4xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl">{t('welcomeMessage')}</h2>
            <p className="mt-5 max-w-md text-base leading-7 text-muted-foreground">{t('welcomeDescription')}</p>
            <Button
              color="secondary"
              onPress={onEnterRooms}
              endContent={<Icon icon="lucide:arrow-right" className="h-4 w-4" />}
              className="mt-8 min-h-12 rounded-xl px-6 font-semibold"
            >
              {t('browseRooms')}
            </Button>
          </div>
          <div aria-hidden="true" className="overflow-hidden rounded-2xl border border-divider bg-content1 shadow-xl shadow-black/10">
            <div className="flex items-center gap-2 border-b border-divider px-5 py-4">
              <span className="h-2 w-2 rounded-full bg-slate-500" />
              <span className="h-2 w-2 rounded-full bg-slate-500" />
              <span className="h-2 w-2 rounded-full bg-cyan-500" />
              <span className="ml-auto font-mono text-xs text-muted-foreground">{t('codeAgentWorkspace')}</span>
            </div>
            <div className="space-y-4 p-6 font-mono text-sm leading-7 sm:p-8">
              <p className="text-muted-foreground">{'// CoWorker House'}</p>
              <p className="text-cyan-700 dark:text-cyan-300">const workspace = {'{'}</p>
              <p className="pl-5 text-foreground">people: <span className="text-cyan-700 dark:text-cyan-200">{JSON.stringify(t('chatRooms'))}</span>,</p>
              <p className="pl-5 text-foreground">ideas: <span className="text-cyan-700 dark:text-cyan-200">{JSON.stringify(t('codeAgentWorkspace'))}</span>,</p>
              <p className="pl-5 text-foreground">agents: <span className="text-cyan-700 dark:text-cyan-200">{JSON.stringify(t('codeAgentMode'))}</span></p>
              <p className="text-cyan-700 dark:text-cyan-300">{'};'}</p>
              <div className="border-t border-divider pt-4 text-muted-foreground"><span className="mr-3 text-cyan-700 dark:text-cyan-300">❯</span> _</div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 border-t border-divider pt-6 sm:grid-cols-3">
          {[
            { icon: 'lucide:messages-square', label: 'chatRooms' },
            { icon: 'lucide:code-2', label: 'codeAgentWorkspace' },
            { icon: 'lucide:terminal', label: 'personalComputerTab_Terminal' },
          ].map(({ icon, label }, index) => (
            <div key={label} className="flex items-center gap-3 rounded-xl border border-divider bg-content1 px-4 py-4">
              <Icon icon={icon} className="h-5 w-5 shrink-0 text-cyan-700 dark:text-cyan-300" />
              <span className="text-sm font-medium text-foreground">{t(label)}</span>
              <span className="ml-auto font-mono text-xs text-muted-foreground">0{index + 1}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
