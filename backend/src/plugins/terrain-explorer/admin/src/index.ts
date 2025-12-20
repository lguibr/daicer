import MapTrigger from './components/MapTrigger';
import { PluginIcon } from './components/PluginIcon';
import { Initializer } from './components/Initializer';
import { PLUGIN_ID } from './pluginId';

export default {
  register(app: any) {
    console.log('[TerrainExplorer] Registering plugin...');
    app.addMenuLink({
      to: `plugins/${PLUGIN_ID}`,
      icon: PluginIcon,
      intlLabel: {
        id: `${PLUGIN_ID}.plugin.name`,
        defaultMessage: PLUGIN_ID,
      },
      Component: async () => {
        const { App } = await import('./pages/App');

        return App;
      },
    });

    app.registerPlugin({
      id: PLUGIN_ID,
      initializer: Initializer,
      isReady: false,
      name: PLUGIN_ID,
    });
    console.log('[TerrainExplorer] Plugin registered.');
  },

  bootstrap(app: any) {
    console.log('[TerrainExplorer] Bootstrapping...');
    try {
      app.getPlugin('content-manager').injectComponent('editView', 'right-links', {
        name: 'terrain-explorer-trigger',
        Component: MapTrigger,
      });
      console.log('[TerrainExplorer] Component injected into editView right-links.');
    } catch (e) {
      console.error('[TerrainExplorer] Injection failed:', e);
    }
  },

  async registerTrads({ locales }: { locales: string[] }) {
    return Promise.all(
      locales.map(async (locale) => {
        try {
          const { default: data } = await import(`./translations/${locale}.json`);

          return { data, locale };
        } catch {
          return { data: {}, locale };
        }
      })
    );
  },
};
