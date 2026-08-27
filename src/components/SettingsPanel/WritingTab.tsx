import { MessageSquare, Zap, HardDrive } from 'lucide-react';
import type { SystemSettings } from '../../kernel/instances';
import { useTranslation } from '../../i18n/useTranslation';
import { sectionTitleLarge, settingSelect } from '../../styles/common';
import { SettingRow, Toggle } from './settings-shared';

interface WritingTabProps {
  settings: SystemSettings;
  updateSetting: (key: keyof SystemSettings, val: boolean | string | number) => void;
}

const WritingTab: React.FC<WritingTabProps> = ({ settings, updateSetting }) => {
  const { t } = useTranslation();

  return (
    <>
      <div style={sectionTitleLarge}>{t('settings.interaction')}</div>
      <SettingRow icon={<MessageSquare size={20} aria-hidden="true" />} title={t('settings.chat_strategy')} description={t('settings.chat_strategy_desc')}>
        <select
          value={settings.defaultMode}
          onChange={(e) => updateSetting('defaultMode', e.target.value as 'broadcast' | 'single' | 'smart')}
          style={settingSelect}
          aria-label={t('settings.chat_strategy_aria')}
        >
          <option value="smart">{t('settings.strategy_auto')}</option>
          <option value="broadcast">{t('settings.strategy_swarm')}</option>
          <option value="single">{t('settings.strategy_fixed')}</option>
        </select>
      </SettingRow>
      <SettingRow icon={<Zap size={20} aria-hidden="true" />} title={t('settings.streaming')} description={t('settings.streaming_desc')}>
        <Toggle checked={settings.streamingEnabled} onChange={(v) => updateSetting('streamingEnabled', v)} accent="#10b981" />
      </SettingRow>
      <SettingRow icon={<HardDrive size={20} aria-hidden="true" />} title={t('settings.history')} description={t('settings.history_desc')}>
        <Toggle checked={settings.historyPersistence} onChange={(v) => updateSetting('historyPersistence', v)} accent="#a855f7" />
      </SettingRow>
    </>
  );
};

export default WritingTab;
