/**
 * Create room page with world settings form
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createRoom, updateRoomSettings, generateWorld } from '../services/api';
import { useI18n } from '../i18n';
import { LanguageSelector } from '../components/ui/LanguageSelector';
import { Layout } from '../components/layout/Layout';
import type { WorldSettings, AdventureLength, Difficulty } from '../types/shared';

/**
 * Create room page component
 * @returns Create room UI
 */
export function CreateRoomPage() {
  const navigate = useNavigate();
  const { t, language } = useI18n();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<WorldSettings>({
    theme: 'High Fantasy',
    setting: 'Ancient Ruins',
    tone: 'Dark and Gritty',
    playerCount: 4,
    adventureLength: 'medium' as AdventureLength,
    difficulty: 'medium' as Difficulty,
  });

  const updateSetting = <K extends keyof WorldSettings>(key: K, value: WorldSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError(null);

      // 1. Create room
      const room = await createRoom();

      // 2. Update room settings
      await updateRoomSettings(room.id, settings);

      // 3. Generate world description
      await generateWorld(room.id, language);

      // 4. Navigate to room
      navigate(`/room/${room.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create room');
    } finally {
      setLoading(false);
    }
  };

  const OptionButton: React.FC<{ onClick: () => void; isActive: boolean; children: React.ReactNode }> = ({
    onClick,
    isActive,
    children,
  }) => (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 p-2 rounded-md text-sm transition-colors ${
        isActive
          ? 'bg-aurora-500 text-midnight-100 font-bold shadow-md'
          : 'bg-midnight-500/60 text-shadow-200 hover:bg-midnight-400/60'
      }`}
    >
      {children}
    </button>
  );

  return (
    <Layout showRoomInfo={false}>
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-2xl p-8 space-y-8 card relative">
          <div className="absolute top-4 right-4">
            <LanguageSelector />
          </div>
          
          <div className="text-center">
            <h1 className="text-4xl font-bold text-aurora-300 mb-2">{t('worldSettings.title')}</h1>
            <p className="text-shadow-200">{t('worldSettings.subtitle')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Story Settings */}
              <div className="space-y-4">
                <h3 className="text-lg text-aurora-300 font-semibold">{t('worldSettings.story')}</h3>

                <div>
                  <label className="block text-sm font-medium text-shadow-300 mb-1">{t('worldSettings.theme')}</label>
                  <input
                    type="text"
                    value={settings.theme}
                    onChange={(e) => updateSetting('theme', e.target.value)}
                    placeholder={t('worldSettings.themePlaceholder')}
                    className="input-style w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-shadow-300 mb-1">{t('worldSettings.setting')}</label>
                  <input
                    type="text"
                    value={settings.setting}
                    onChange={(e) => updateSetting('setting', e.target.value)}
                    placeholder={t('worldSettings.settingPlaceholder')}
                    className="input-style w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-shadow-300 mb-1">{t('worldSettings.tone')}</label>
                  <input
                    type="text"
                    value={settings.tone}
                    onChange={(e) => updateSetting('tone', e.target.value)}
                    placeholder={t('worldSettings.tonePlaceholder')}
                    className="input-style w-full"
                  />
                </div>
              </div>

              {/* Scope Settings */}
              <div className="space-y-4">
                <h3 className="text-lg text-aurora-300 font-semibold">{t('worldSettings.scope')}</h3>

                <div>
                  <label className="block text-sm font-medium text-shadow-300 mb-1">{t('worldSettings.playerCount')}</label>
                  <input
                    type="number"
                    min="1"
                    max="8"
                    value={settings.playerCount}
                    onChange={(e) => updateSetting('playerCount', parseInt(e.target.value, 10))}
                    className="input-style w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-shadow-300 mb-2">{t('worldSettings.adventureLength')}</label>
                  <div className="flex space-x-2">
                    <OptionButton
                      onClick={() => updateSetting('adventureLength', 'short')}
                      isActive={settings.adventureLength === 'short'}
                    >
                      {t('worldSettings.lengthShort')}
                    </OptionButton>
                    <OptionButton
                      onClick={() => updateSetting('adventureLength', 'medium')}
                      isActive={settings.adventureLength === 'medium'}
                    >
                      {t('worldSettings.lengthMedium')}
                    </OptionButton>
                    <OptionButton
                      onClick={() => updateSetting('adventureLength', 'epic')}
                      isActive={settings.adventureLength === 'epic'}
                    >
                      {t('worldSettings.lengthEpic')}
                    </OptionButton>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-shadow-300 mb-2">{t('worldSettings.difficulty')}</label>
                  <div className="flex space-x-2">
                    <OptionButton onClick={() => updateSetting('difficulty', 'easy')} isActive={settings.difficulty === 'easy'}>
                      {t('worldSettings.difficultyEasy')}
                    </OptionButton>
                    <OptionButton
                      onClick={() => updateSetting('difficulty', 'medium')}
                      isActive={settings.difficulty === 'medium'}
                    >
                      {t('worldSettings.difficultyMedium')}
                    </OptionButton>
                    <OptionButton onClick={() => updateSetting('difficulty', 'hard')} isActive={settings.difficulty === 'hard'}>
                      {t('worldSettings.difficultyHard')}
                    </OptionButton>
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-900/50 border border-red-500 rounded-lg">
                <p className="text-red-200 text-sm">{error}</p>
              </div>
            )}

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => navigate('/lobby')}
                disabled={loading}
                className="btn-secondary flex-1"
              >
                {t('worldSettings.cancel')}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex-1"
              >
                {loading ? t('worldSettings.creating') : t('worldSettings.create')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}

