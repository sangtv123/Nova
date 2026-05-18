import { signal } from '@nova/signals';
import { useMotion, motion, AnimatePresence } from '@nova/motion';

export function MotionPage() {
  // Test 1: Signal-driven scale and position
  const targetScale = signal(1, 'target-scale');
  const targetRotate = signal(0, 'target-rotate');
  const targetXY = signal({ x: 0, y: 0 }, 'target-xy');

  // Bind signals to GPU-accelerated transition engine
  const animatedScaleStyle = useMotion(targetScale, { duration: 0.25, ease: 'easeOut' });
  const animatedRotateStyle = useMotion(targetRotate, { duration: 0.35, ease: 'easeInOut' });
  const animatedXYStyle = useMotion(targetXY, { duration: 0.3, ease: 'easeOut' });

  // Test 2: Lifecycle mount/exit animations
  const showCard = signal(true, 'show-exit-card');
  const showModal = signal(false, 'show-exit-modal');

  return (
    <div class="nova-ui-page">
      <div class="nova-ui-page-header">
        <h1 class="nova-ui-page-title">🎬 Motion & Animations</h1>
        <p class="nova-ui-page-desc">
          Ultra-performant GPU-accelerated motion engine powered by Signals. 
          Enables 60FPS fluid animations with zero Virtual DOM overhead.
        </p>
      </div>

      {/* Grid of Demos */}
      <div style="display: flex; flex-direction: column; gap: 30px;">
        
        {/* Section 1: Signal-driven Animations */}
        <div class="n-card">
          <div class="n-card-header">
            <h3>⚡ Signal-driven Animations (useMotion)</h3>
          </div>
          <div class="n-card-body" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div>
              <p style="margin: 0 0 16px 0; color: var(--n-text-2)">
                Mutating standard signals triggers smooth mathematical interpolation. 
                DOM styling is patched directly at 60FPS.
              </p>
              
              {/* Sliders */}
              <div style="display: flex; flex-direction: column; gap: 14px;">
                <div>
                  <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 13px;">
                    <span>Scale: {() => targetScale.value.toFixed(2)}x</span>
                  </div>
                  <input 
                    type="range" 
                    min="0.5" 
                    max="1.8" 
                    step="0.05" 
                    value={() => targetScale.value} 
                    onInput={(e: any) => targetScale.value = parseFloat(e.target.value)}
                    style="width: 100%"
                  />
                </div>

                <div>
                  <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 13px;">
                    <span>Rotation: {() => targetRotate.value}°</span>
                  </div>
                  <input 
                    type="range" 
                    min="-180" 
                    max="180" 
                    step="5" 
                    value={() => targetRotate.value} 
                    onInput={(e: any) => targetRotate.value = parseInt(e.target.value, 10)}
                    style="width: 100%"
                  />
                </div>

                <div>
                  <label style="font-size: 13px; display: block; margin-bottom: 8px;">GPU Translation Coordinates (x, y):</label>
                  <div style="display: flex; gap: 8px;">
                    <button class="n-btn" onClick={() => targetXY.value = { x: -80, y: -20 }}>Move Top-Left</button>
                    <button class="n-btn" onClick={() => targetXY.value = { x: 80, y: 20 }}>Move Bottom-Right</button>
                    <button class="n-btn n-btn--dashed" onClick={() => targetXY.value = { x: 0, y: 0 }}>Reset Position</button>
                  </div>
                </div>
              </div>
            </div>

            {/* Viewport Box */}
            <div style="background: var(--n-bg-container); border: 1px solid var(--n-border); border-radius: 8px; height: 260px; display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden;">
              {/* Animated Target Element */}
              <div 
                style={() => {
                  const scale = animatedScaleStyle();
                  const rotate = animatedRotateStyle();
                  const xy = animatedXYStyle();
                  
                  // Combine styles together elegantly
                  return {
                    width: '80px',
                    height: '80px',
                    background: 'linear-gradient(135deg, var(--n-primary) 0%, #06b6d4 100%)',
                    borderRadius: '16px',
                    boxShadow: '0 10px 25px rgba(16, 185, 129, 0.3)',
                    transform: `${scale.transform || ''} ${rotate.transform || ''} ${xy.transform || ''}`,
                    willChange: 'transform'
                  };
                }}
              />
            </div>
          </div>
        </div>

        {/* Section 2: Lifecycle mount/exit transitions */}
        <div class="n-card">
          <div class="n-card-header">
            <h3>⏳ Lifecycle mount/exit transitions (AnimatePresence)</h3>
          </div>
          <div class="n-card-body" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div>
              <p style="margin: 0 0 16px 0; color: var(--n-text-2)">
                Exit animations usually pose a challenge in frontend frameworks because elements are deleted instantly. 
                Nova defer-removes nodes automatically until the exit transition completes!
              </p>
              
              <div style="display: flex; gap: 10px; margin-bottom: 20px;">
                <button class="n-btn n-btn--primary" onClick={() => showCard.value = !showCard.value}>
                  Toggle Alert Box
                </button>
                <button class="n-btn" onClick={() => showModal.value = true}>
                  Open Exit Modal
                </button>
              </div>

              <div style="font-size: 12px; color: var(--n-text-3)">
                👉 Expand the <strong>Signals</strong> or <strong>Islands</strong> tab in DevTools to watch DOM insertions and unmount cleanups happen in real-time as the exit timer ticks!
              </div>
            </div>

            {/* Sandbox Area */}
            <div style="background: var(--n-bg-container); border: 1px solid var(--n-border); border-radius: 8px; height: 260px; padding: 20px; display: flex; flex-direction: column; justify-content: center; position: relative;">
              
              <AnimatePresence>
                {() => showCard.value && (
                  <div 
                    ref={motion({
                      initial: { opacity: 0, scale: 0.8, y: -20 },
                      animate: { opacity: 1, scale: 1, y: 0 },
                      exit: { opacity: 0, scale: 0.8, y: 20 },
                      transition: { duration: 0.3, ease: 'ease-out' }
                    })}
                    class="n-alert n-alert--success"
                    style="margin: 0;"
                  >
                    <div class="n-alert-message">🎉 Hardware Accelerated Entrance & Exit!</div>
                    <div class="n-alert-description">I smoothly slide up on mount, and slide down on unmount.</div>
                  </div>
                )}
              </AnimatePresence>

            </div>
          </div>
        </div>

        {/* Modal Demo */}
        <AnimatePresence>
          {() => showModal.value && (
            <div 
              ref={motion({
                initial: { opacity: 0 },
                animate: { opacity: 1 },
                exit: { opacity: 0 },
                transition: { duration: 0.25 }
              })}
              style="position: fixed; inset: 0; z-index: 1000; background: rgba(0,0,0,0.65); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center;"
            >
              <div 
                ref={motion({
                  initial: { opacity: 0, scale: 0.85, y: 30 },
                  animate: { opacity: 1, scale: 1, y: 0 },
                  exit: { opacity: 0, scale: 0.85, y: 30 },
                  transition: { duration: 0.3, ease: 'ease-out' }
                })}
                style="background: var(--n-bg-elevated); border: 1px solid var(--n-border); border-radius: 12px; width: 90%; max-width: 400px; padding: 24px; box-shadow: 0 20px 40px rgba(0,0,0,0.3);"
              >
                <h3 style="margin: 0 0 10px 0; font-size: 1.2rem;">⏱️ Defer Unmount Exit Modal</h3>
                <p style="margin: 0 0 20px 0; color: var(--n-text-2); font-size: 13px; line-height: 1.4;">
                  This popup utilizes native hardware compositing to slide up. 
                  When you click close, the removal of the DOM nodes is delayed until the exit animation finishes.
                </p>
                <div style="display: flex; justify-content: flex-end; gap: 8px;">
                  <button class="n-btn" onClick={() => showModal.value = false}>Cancel</button>
                  <button class="n-btn n-btn--primary" onClick={() => showModal.value = false}>Acknowledge</button>
                </div>
              </div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
