import { createElement } from '@nova/runtime';
import { signal } from '@nova/signals';
import { Editor } from '../../nova-ui/components/Editor';

export function EditorPage() {
  const content = signal('<h2>Welcome to Nova WYSIWYG Editor!</h2><p>This is a rich text editor built entirely using Nova\'s fine-grained reactivity system.</p><p>Features:</p><ul><li><b>Bold</b>, <i>Italic</i>, <u>Underline</u>, <del>Strikethrough</del> formatting</li><li>Custom Headings and paragraphs</li><li>Lists, Alignment options, and Link embedding</li><li>Full HTML raw source code editing</li></ul>');

  return (
    <div class="nova-ui-page">
      <h1 class="nova-ui-page-title">Text Editor</h1>
      <p class="nova-ui-page-desc">A premium, responsive, reactive Rich Text Editor (WYSIWYG).</p>

      <div class="nova-section">
        <h2 class="nova-section-title">Interactive WYSIWYG</h2>
        <div class="nova-demo-block" style={{ flexDirection: 'column', gap: '20px' }}>
          <Editor
            value={content}
            onChange={(val) => { content.value = val; }}
            placeholder="Type your amazing content here..."
            height="320px"
          />

          <div style={{
            background: 'var(--n-bg-hover)',
            border: '1px solid var(--n-border)',
            borderRadius: 'var(--n-border-r-lg)',
            padding: '16px',
            marginTop: '16px'
          }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', color: 'var(--n-text-1)' }}>Reactive Output (HTML Preview):</h3>
            <pre style={{
              margin: 0,
              fontSize: '12px',
              fontFamily: 'monospace',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
              color: 'var(--n-primary)',
              maxHeight: '150px',
              overflowY: 'auto'
            }}>{() => content.value}</pre>
          </div>
        </div>
      </div>

      <div class="nova-section">
        <h2 class="nova-section-title">Disabled State</h2>
        <div class="nova-demo-block">
          <Editor
            value="This editor is completely disabled and readonly."
            disabled={true}
            height="150px"
          />
        </div>
      </div>
    </div>
  );
}
