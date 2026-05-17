import { signal } from '@nova/signals';
import { registerIsland } from '@nova/islands';
import { 
  uppercase, 
  lowercase, 
  titlecase, 
  slice, 
  currency, 
  date, 
  decimal, 
  percent, 
  keyvalue, 
  async, 
  defaultVal,
  reverse,
  truncate
} from '@nova/signals';
import { mask } from '../pipes/mask';
import { exclaim } from '../pipes/exclaim';

export function PipesDemoIsland() {
  const textInput = signal('hello nova framework');
  const sensitiveInput = signal('0987654321');
  const priceInput = signal(1234.56);
  const timeInput = signal(new Date());
  
  const decimalInput = signal(12345.6789);
  const percentInput = signal(0.8765);
  const infoObject = signal({ name: 'Nova Framework', version: '1.0.0', reactive: 'Signals' });
  const asyncDataPromise = signal<Promise<string> | null>(null);

  // Using our newly implemented .pipe() method directly on Signals!
  // This automatically returns a derived Computed signal that updates reactively.
  const uppercaseText = textInput.pipe(uppercase);
  const lowercaseText = textInput.pipe(lowercase);
  const titleCaseText = textInput.pipe(titlecase);
  const slicedText = textInput.pipe(slice(0, 10));
  const reversedText = textInput.pipe(reverse);
  const truncatedText = textInput.pipe(truncate(8, '...'));
  const exclaimText = textInput.pipe(exclaim('🔥 (Manual Custom Arg!)'));
  const maskedSensitive = sensitiveInput.pipe(mask(3, 3, '*'));
  
  const formattedPrice = priceInput.pipe(currency('$', 2));
  const formattedDate = timeInput.pipe(date('YYYY-MM-DD HH:mm:ss'));
  
  const formattedDecimal = decimalInput.pipe(decimal('1.2-3'));
  const formattedPercent = percentInput.pipe(percent('1.1-2'));
  const keyValuePairs = infoObject.pipe(keyvalue);
  const resolvedAsyncData = asyncDataPromise.pipe(async(), defaultVal('⏳ Fetching async data (2s delay)...'));

  const triggerAsyncFetch = () => {
    asyncDataPromise.value = new Promise<string>((resolve) => {
      setTimeout(() => {
        resolve(`🚀 Nova Signals resolved successfully at ${new Date().toLocaleTimeString()}!`);
      }, 2000);
    });
  };

  // Trigger once on load
  triggerAsyncFetch();

  return (
    <div class="interactive-island pipes-demo-island" data-island="pipes-demo" style="margin-top: 2rem;">
      <h3>⚡ Signal Pipes Demo</h3>
      <p class="island-desc">Experience 100% type-safe, reactive pipeline transformations built directly into Nova Signals.</p>

      <div style="display: flex; flex-direction: column; gap: 1.5rem; margin-top: 1.5rem;">
        
        {/* Text transformation demonstration */}
        <div class="demo-group" style="background: rgba(255, 255, 255, 0.05); padding: 1rem; border-radius: 8px;">
          <label style="display: block; font-weight: bold; margin-bottom: 0.5rem; color: var(--accent-light);">
            Text Transformations (uppercase / lowercase / titlecase / slice):
          </label>
          <input 
            type="text" 
            value={() => textInput.value} 
            onInput={(e: InputEvent) => textInput.value = (e.target as HTMLInputElement).value}
            style="width: 100%; padding: 0.5rem; background: rgba(0, 0, 0, 0.2); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 4px; color: #fff; margin-bottom: 0.5rem;"
          />
          <div style="font-size: 0.95rem; line-height: 1.6;">
            <div><strong>Original:</strong> {() => textInput.value}</div>
            <div><strong>Uppercase Pipe:</strong> <span style="color: #10B981;">{uppercaseText}</span></div>
            <div><strong>Lowercase Pipe:</strong> <span style="color: #3B82F6;">{lowercaseText}</span></div>
            <div><strong>Titlecase Pipe:</strong> <span style="color: #FBBF24;">{titleCaseText}</span></div>
            <div><strong>Slice Pipe (0-10):</strong> <span style="color: #F472B6;">{slicedText}</span></div>
            <div><strong>Reverse Pipe (Custom!):</strong> <span style="color: #A78BFA;">{reversedText}</span></div>
            <div><strong>Truncate Pipe (Custom! 8 char):</strong> <span style="color: #F472B6;">{truncatedText}</span></div>
            <div><strong>Exclaim Pipe (Custom user pipe with args!):</strong> <span style="color: #10B981;">{exclaimText}</span></div>
          </div>
        </div>

        {/* Sensitive Data Masking demonstration (Custom mask pipe) */}
        <div class="demo-group" style="background: rgba(255, 255, 255, 0.05); padding: 1rem; border-radius: 8px;">
          <label style="display: block; font-weight: bold; margin-bottom: 0.5rem; color: var(--accent-light);">
            Sensitive Data Masking (Custom mask pipe):
          </label>
          <input 
            type="text" 
            value={() => sensitiveInput.value} 
            onInput={(e: InputEvent) => sensitiveInput.value = (e.target as HTMLInputElement).value}
            style="width: 100%; padding: 0.5rem; background: rgba(0, 0, 0, 0.2); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 4px; color: #fff; margin-bottom: 0.5rem;"
          />
          <div style="font-size: 0.95rem; line-height: 1.6;">
            <div><strong>Original:</strong> {() => sensitiveInput.value}</div>
            <div><strong>Masked Pipe (keep 3 left, 3 right, with '*'):</strong> <span style="color: #F87171; font-weight: bold;">{maskedSensitive}</span></div>
          </div>
        </div>

        {/* Currency formatting demonstration */}
        <div class="demo-group" style="background: rgba(255, 255, 255, 0.05); padding: 1rem; border-radius: 8px;">
          <label style="display: block; font-weight: bold; margin-bottom: 0.5rem; color: var(--accent-light);">
            Currency Formatting (currency pipe):
          </label>
          <input 
            type="number" 
            step="0.01"
            value={() => String(priceInput.value)} 
            onInput={(e: InputEvent) => priceInput.value = Number((e.target as HTMLInputElement).value)}
            style="width: 100%; padding: 0.5rem; background: rgba(0, 0, 0, 0.2); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 4px; color: #fff; margin-bottom: 0.5rem;"
          />
          <div style="font-size: 0.95rem;">
            <div><strong>Formatted Currency:</strong> <span style="color: #F59E0B; font-weight: bold;">{formattedPrice}</span></div>
          </div>
        </div>

        {/* Decimal formatting demonstration */}
        <div class="demo-group" style="background: rgba(255, 255, 255, 0.05); padding: 1rem; border-radius: 8px;">
          <label style="display: block; font-weight: bold; margin-bottom: 0.5rem; color: var(--accent-light);">
            Decimal Formatting (decimal pipe - '1.2-3'):
          </label>
          <input 
            type="number" 
            step="0.0001"
            value={() => String(decimalInput.value)} 
            onInput={(e: InputEvent) => decimalInput.value = Number((e.target as HTMLInputElement).value)}
            style="width: 100%; padding: 0.5rem; background: rgba(0, 0, 0, 0.2); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 4px; color: #fff; margin-bottom: 0.5rem;"
          />
          <div style="font-size: 0.95rem;">
            <div><strong>Formatted Decimal:</strong> <span style="color: #34D399; font-weight: bold;">{formattedDecimal}</span></div>
          </div>
        </div>

        {/* Percent formatting demonstration */}
        <div class="demo-group" style="background: rgba(255, 255, 255, 0.05); padding: 1rem; border-radius: 8px;">
          <label style="display: block; font-weight: bold; margin-bottom: 0.5rem; color: var(--accent-light);">
            Percent Formatting (percent pipe - '1.1-2'):
          </label>
          <input 
            type="number" 
            step="0.0001"
            value={() => String(percentInput.value)} 
            onInput={(e: InputEvent) => percentInput.value = Number((e.target as HTMLInputElement).value)}
            style="width: 100%; padding: 0.5rem; background: rgba(0, 0, 0, 0.2); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 4px; color: #fff; margin-bottom: 0.5rem;"
          />
          <div style="font-size: 0.95rem;">
            <div><strong>Formatted Percent:</strong> <span style="color: #60A5FA; font-weight: bold;">{formattedPercent}</span></div>
          </div>
        </div>

        {/* KeyValue formatting demonstration */}
        <div class="demo-group" style="background: rgba(255, 255, 255, 0.05); padding: 1rem; border-radius: 8px;">
          <label style="display: block; font-weight: bold; margin-bottom: 0.5rem; color: var(--accent-light);">
            Object keyvalue Transformation (keyvalue pipe):
          </label>
          <div style="display: flex; gap: 0.5rem; margin-bottom: 0.5rem;">
            <input 
              type="text" 
              placeholder="Framework Name"
              value={() => infoObject.value.name}
              onInput={(e: InputEvent) => infoObject.value = { ...infoObject.value, name: (e.target as HTMLInputElement).value }}
              style="flex: 1; padding: 0.5rem; background: rgba(0, 0, 0, 0.2); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 4px; color: #fff;"
            />
            <input 
              type="text" 
              placeholder="Version"
              value={() => infoObject.value.version}
              onInput={(e: InputEvent) => infoObject.value = { ...infoObject.value, version: (e.target as HTMLInputElement).value }}
              style="width: 100px; padding: 0.5rem; background: rgba(0, 0, 0, 0.2); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 4px; color: #fff;"
            />
          </div>
          <div style="font-size: 0.95rem; line-height: 1.6; background: rgba(0,0,0,0.15); padding: 0.75rem; border-radius: 6px;">
            <strong>Transformed Pairs:</strong>
            <div style="margin-top: 0.25rem;">
              {() => keyValuePairs.value.map(pair => (
                <div key={pair.key}>
                  <span style="color: #A78BFA; font-weight: 500;">{pair.key}:</span> <span style="color: #E9D5FF;">{String(pair.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Date formatting demonstration */}
        <div class="demo-group" style="background: rgba(255, 255, 255, 0.05); padding: 1rem; border-radius: 8px;">
          <label style="display: block; font-weight: bold; margin-bottom: 0.5rem; color: var(--accent-light);">
            Date / Timestamp Formatting (date pipe):
          </label>
          <div style="display: flex; gap: 1rem; align-items: center; margin-bottom: 0.5rem;">
            <button 
              class="btn primary" 
              onClick={() => timeInput.value = new Date()}
              style="padding: 0.4rem 1rem; border: none; background: #6366F1; color: white; border-radius: 4px; cursor: pointer;"
            >
              Update Time ↺
            </button>
          </div>
          <div style="font-size: 0.95rem;">
            <div><strong>Raw Date String:</strong> {() => String(timeInput.value)}</div>
            <div><strong>Formatted Date Pipe:</strong> <span style="color: #A855F7; font-weight: bold;">{formattedDate}</span></div>
          </div>
        </div>

        {/* Async Pipe demonstration */}
        <div class="demo-group" style="background: rgba(255, 255, 255, 0.05); padding: 1rem; border-radius: 8px;">
          <label style="display: block; font-weight: bold; margin-bottom: 0.5rem; color: var(--accent-light);">
            Async Pipe & Pipe Chaining (async + defaultVal):
          </label>
          <div style="display: flex; gap: 1rem; align-items: center; margin-bottom: 0.5rem;">
            <button 
              class="btn primary" 
              onClick={triggerAsyncFetch}
              style="padding: 0.4rem 1rem; border: none; background: #EC4899; color: white; border-radius: 4px; cursor: pointer;"
            >
              Trigger Async Promise ⚡
            </button>
          </div>
          <div style="font-size: 0.95rem;">
            <div><strong>Async Pipe Output:</strong> <span style="color: #F472B6; font-weight: bold;">{resolvedAsyncData}</span></div>
          </div>
        </div>

        {/* Compiler-transformed Angular-style Template Pipes */}
        <div class="demo-group" style="background: rgba(255, 255, 255, 0.05); padding: 1rem; border-radius: 8px; border: 1px dashed rgba(236, 72, 153, 0.3);">
          <label style="display: block; font-weight: bold; margin-bottom: 0.5rem; color: #EC4899;">
            🔥 Angular-style Template Pipe Syntax (Compiler Preprocessed!):
          </label>
          <p style="font-size: 0.85rem; color: #9CA3AF; margin-bottom: 0.75rem; line-height: 1.4;">
            Write standard Angular-like pipe syntax <code>{"{ signal | pipeName:arg1 }"}</code> directly in your JSX! The Nova compiler automatically pre-processes these at compile time into reactive signal pipe chains.
          </p>
          <div style="font-size: 0.95rem; line-height: 1.8;">
            <div><strong>Original Input:</strong> {() => textInput.value}</div>
            <div><strong>Direct Uppercase:</strong> <span style="color: #10B981; font-weight: bold;">{textInput.pipe(uppercase)}</span></div>
            <div><strong>Direct Titlecase:</strong> <span style="color: #FBBF24; font-weight: bold;">{textInput.pipe(titlecase)}</span></div>
            <div><strong>Direct Slice (0-10):</strong> <span style="color: #F472B6; font-weight: bold;">{textInput.pipe(slice(0, 10))}</span></div>
            <div><strong>Direct Currency:</strong> <span style="color: #F59E0B; font-weight: bold;">{priceInput.pipe(currency('$', 2))}</span></div>
            <div><strong>Direct Decimal (1.2-3):</strong> <span style="color: #34D399; font-weight: bold;">{decimalInput.pipe(decimal('1.2-3'))}</span></div>
            <div><strong>Direct Percent (1.1-2):</strong> <span style="color: #60A5FA; font-weight: bold;">{percentInput.pipe(percent('1.1-2'))}</span></div>
            <div><strong>Direct Reverse (Preprocessed Custom!):</strong> <span style="color: #A78BFA; font-weight: bold;">{textInput.pipe(reverse)}</span></div>
            <div><strong>Direct Truncate (Preprocessed Custom!):</strong> <span style="color: #FBBF24; font-weight: bold;">{textInput.pipe(truncate(8, '...'))}</span></div>
            
            <div style="border-top: 1px solid rgba(255,255,255,0.1); margin-top: 0.75rem; padding-top: 0.75rem;">
              <span style="font-weight: bold; color: var(--accent-light); display: block; margin-bottom: 0.25rem;">
                Local Custom Pipes (via Signal .pipe):
              </span>
              <div><strong>Local Exclaim (no args):</strong> <span style="color: #EC4899; font-weight: bold;">{textInput.pipe(exclaim())}</span></div>
              <div><strong>Local Exclaim (parametrized):</strong> <span style="color: #F59E0B; font-weight: bold;">{textInput.pipe(exclaim('✨ Rocket 🚀'))}</span></div>
              <div><strong>Local Mask (keep 3, '*'):</strong> <span style="color: #F87171; font-weight: bold;">{sensitiveInput.pipe(mask(3, 3, '*'))}</span></div>
              <div><strong>Local Mask (keep 4, '#'):</strong> <span style="color: #FBBF24; font-weight: bold;">{sensitiveInput.pipe(mask(4, 4, '#'))}</span></div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// Register island for client-side hydration
registerIsland('pipes-demo', PipesDemoIsland);
