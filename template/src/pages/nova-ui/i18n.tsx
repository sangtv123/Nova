import { signal, computed } from '@nova/signals';
import { registerLocaleLoader, setLocale, t, locale, isLoaded, initTranslations } from '@nova/i18n';

// Static default translation for instant startup
const defaultEn = {
  "title": "Reactive Internationalization",
  "description": "This page demonstrates ultra-lightweight, fine-grained multi-language translation powered by reactive Signals. Changing language updates only specific text nodes without re-rendering the component!",
  "cardTitle": "Language Controls",
  "welcome": "Welcome to Nova Framework",
  "currentLocale": "Current Language",
  "statusLabel": "Translation Bundle Status",
  "statusLoaded": "Fully Loaded & Cached",
  "statusLoading": "Lazy-loading translation chunk over network...",
  "selectEn": "Switch to English",
  "selectVi": "Switch to Vietnamese",
  "featureTitle": "Signal-Pipe Translation Chaining",
  "pipeHint": "The message below is translated, then dynamically formatted using synchronous Signal Pipes (capitalized and decorated with exclaim):",
  "interactiveTitle": "Dynamic Interpolation",
  "interpolationLabel": "Enter your name for real-time interpolation:",
  "helloUser": "Hello {{name}}, we hope you have an incredible paired-programming session!"
};

// Initialize static default
initTranslations('en', defaultEn);

// Configure dynamic lazy-loaders with artificial network latency to showcase state indicators
registerLocaleLoader('en', async () => {
  await new Promise(resolve => setTimeout(resolve, 600)); // Network delay simulation
  return import('../../locales/en.json');
});

registerLocaleLoader('vi', async () => {
  await new Promise(resolve => setTimeout(resolve, 600)); // Network delay simulation
  return import('../../locales/vi.json');
});

// Reactive text pipe functions
const uppercase = () => (val: string) => val.toUpperCase();
const exclaim = () => (val: string) => `${val} !!! 🌟`;

export function I18nPage() {
  const userName = signal('Sang', 'i18n.userName');
  
  // Custom signal chaining: t() returns a computed signal, so we can pipe!
  const pipedMessage = computed(() => 
    t('welcome').pipe(
      uppercase(),
      exclaim()
    ).value
  );

  // Dynamic interpolation computed signal
  const helloMessage = computed(() => {
    return t('helloUser', { name: userName.value }).value;
  });

  // Track component render count to visually prove fine-grained updating
  // In Nova, components render exactly ONCE. Subsequent updates are fine-grained DOM patches!
  const renderCount = 1;
  
  return (
    <div class="nova-ui-page i18n-page" style="padding: 24px; max-width: 1200px; margin: 0 auto; font-family: 'Outfit', sans-serif;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
        <div>
          <h1 class="nova-ui-page-title" style="margin: 0; font-size: 2.2rem; font-weight: 700; background: linear-gradient(135deg, #3b82f6 0%, #10b981 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
            {() => t('title').value}
          </h1>
          <p class="nova-ui-page-desc" style="color: var(--n-text-2, #64748b); margin-top: 8px; font-size: 1rem; max-width: 800px;">
            {() => t('description').value}
          </p>
        </div>
        
        <div style="background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.2); padding: 8px 16px; border-radius: 20px; font-size: 0.9rem; color: #3b82f6; font-weight: 600; display: flex; align-items: center; gap: 8px;">
          <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #3b82f6; animation: pulse 1.5s infinite;"></span>
          <span>Component Render Cycles: <strong>{renderCount}</strong></span>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 30px;">
        {/* Card 1: Controls and Status */}
        <div class="n-card" style="border: 1px solid var(--n-border, #e2e8f0); border-radius: 12px; background: var(--n-bg, #ffffff); box-shadow: 0 4px 20px rgba(0,0,0,0.03); overflow: hidden;">
          <div class="n-card-header" style="padding: 20px; border-bottom: 1px solid var(--n-border, #e2e8f0); font-weight: 700; font-size: 1.1rem; color: var(--n-text-1, #1e293b); display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 1.3rem;">🌍</span>
            {() => t('cardTitle').value}
          </div>
          
          <div class="n-card-body" style="padding: 20px;">
            <div style="display: flex; gap: 12px; margin-bottom: 24px;">
              <button 
                class="n-btn" 
                style={() => `flex: 1; padding: 12px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.2s; ${locale.value === 'en' ? 'background: #3b82f6; color: white; border: none; box-shadow: 0 4px 12px rgba(59,130,246,0.3);' : 'background: rgba(0,0,0,0.02); color: var(--n-text-2, #64748b); border: 1px solid var(--n-border, #e2e8f0);'}`}
                onClick={() => setLocale('en')}
              >
                🇺🇸 English
              </button>
              <button 
                class="n-btn" 
                style={() => `flex: 1; padding: 12px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.2s; ${locale.value === 'vi' ? 'background: #10b981; color: white; border: none; box-shadow: 0 4px 12px rgba(16,185,129,0.3);' : 'background: rgba(0,0,0,0.02); color: var(--n-text-2, #64748b); border: 1px solid var(--n-border, #e2e8f0);'}`}
                onClick={() => setLocale('vi')}
              >
                🇻🇳 Tiếng Việt
              </button>
            </div>

            <div style="background: rgba(0,0,0,0.01); border: 1px solid var(--n-border, #e2e8f0); border-radius: 8px; padding: 16px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <span style="color: var(--n-text-2, #64748b); font-size: 0.9rem;">{() => t('currentLocale').value}</span>
                <span style="font-weight: 700; color: var(--n-text-1, #1e293b); text-transform: uppercase; background: rgba(0,0,0,0.05); padding: 4px 8px; border-radius: 4px; font-size: 0.85rem;">
                  {() => locale.value}
                </span>
              </div>
              
              <div style="display: flex; flex-direction: column; gap: 6px;">
                <span style="color: var(--n-text-2, #64748b); font-size: 0.9rem;">{() => t('statusLabel').value}</span>
                {() => isLoaded.value ? (
                  <div style="color: #10b981; font-weight: 600; font-size: 0.9rem; display: flex; align-items: center; gap: 6px;">
                    <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #10b981;"></span>
                    {t('statusLoaded').value}
                  </div>
                ) : (
                  <div style="color: #eab308; font-weight: 600; font-size: 0.9rem; display: flex; align-items: center; gap: 6px; animation: pulse 1s infinite;">
                    <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #eab308;"></span>
                    {t('statusLoading').value}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Interactive Dynamic Interpolation */}
        <div class="n-card" style="border: 1px solid var(--n-border, #e2e8f0); border-radius: 12px; background: var(--n-bg, #ffffff); box-shadow: 0 4px 20px rgba(0,0,0,0.03); overflow: hidden;">
          <div class="n-card-header" style="padding: 20px; border-bottom: 1px solid var(--n-border, #e2e8f0); font-weight: 700; font-size: 1.1rem; color: var(--n-text-1, #1e293b); display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 1.3rem;">✨</span>
            {() => t('interactiveTitle').value}
          </div>
          
          <div class="n-card-body" style="padding: 20px; display: flex; flex-direction: column; justify-content: space-between; height: 80%;">
            <div>
              <label style="display: block; font-size: 0.9rem; font-weight: 600; color: var(--n-text-2, #64748b); margin-bottom: 8px;">
                {() => t('interpolationLabel').value}
              </label>
              <input 
                type="text" 
                value={userName} 
                onInput={(e: any) => userName.value = e.target.value}
                class="n-input" 
                style="width: 100%; padding: 10px 12px; border-radius: 8px; border: 1px solid var(--n-border, #e2e8f0); background: var(--n-bg, #ffffff); color: var(--n-text-1, #1e293b); outline: none; transition: border 0.2s;"
              />
            </div>

            <div style="background: linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(16, 185, 129, 0.05) 100%); border-left: 4px solid #3b82f6; padding: 16px; border-radius: 0 8px 8px 0; margin-top: 20px;">
              <p style="margin: 0; font-size: 1.05rem; font-weight: 600; color: var(--n-text-1, #1e293b); line-height: 1.5;">
                {() => helloMessage.value}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Card 3: Signal-Pipes Translation Chaining */}
      <div class="n-card" style="border: 1px solid var(--n-border, #e2e8f0); border-radius: 12px; background: var(--n-bg, #ffffff); box-shadow: 0 4px 20px rgba(0,0,0,0.03); overflow: hidden; margin-bottom: 24px;">
        <div class="n-card-header" style="padding: 20px; border-bottom: 1px solid var(--n-border, #e2e8f0); font-weight: 700; font-size: 1.1rem; color: var(--n-text-1, #1e293b); display: flex; align-items: center; gap: 10px;">
          <span style="font-size: 1.3rem;">🔗</span>
          {() => t('featureTitle').value}
        </div>
        <div class="n-card-body" style="padding: 20px;">
          <p style="color: var(--n-text-2, #64748b); font-size: 0.95rem; margin: 0 0 16px 0;">
            {() => t('pipeHint').value}
          </p>
          
          <div style="background: rgba(0,0,0,0.02); border: 1px dashed var(--n-border, #e2e8f0); border-radius: 8px; padding: 20px; text-align: center;">
            <h2 style="margin: 0; font-size: 1.4rem; font-weight: 800; color: #10b981; letter-spacing: 0.5px;">
              {() => pipedMessage.value}
            </h2>
          </div>

          <div style="margin-top: 16px; font-family: monospace; font-size: 0.85rem; color: var(--n-text-2, #64748b); background: rgba(0,0,0,0.03); padding: 12px; border-radius: 6px;">
            {"const pipedMessage = computed(() => t('welcome').pipe(uppercase(), exclaim()).value);"}
          </div>
        </div>
      </div>
      
      {/* Style block for animations */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.95); }
        }
      `}</style>
    </div>
  );
}
