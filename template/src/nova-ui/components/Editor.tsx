import { createElement } from '@nova/runtime';
import { signal, domEffect } from '@nova/signals';
import { NovaFormElementProps, SignalOrValue } from '../core/types';
import { classNames, resolveSignal } from '../core/utils';
import { useId } from '../hooks/useId';

export interface EditorProps extends NovaFormElementProps<string> {
  placeholder?: string;
  height?: number | string;
}

export function Editor(props: EditorProps) {
  const id = props.id || useId('n-editor');
  const contentId = `${id}-content`;
  const textareaId = `${id}-textarea`;

  const isHtmlMode = signal(false);
  const wordCount = signal(0);
  const charCount = signal(0);

  const getDisabled = () => resolveSignal(props.disabled) ?? false;
  const getValue = () => resolveSignal(props.value) ?? props.defaultValue ?? '';

  const getEditorEl = () => document.getElementById(contentId) as HTMLDivElement | null;
  const getTextareaEl = () => document.getElementById(textareaId) as HTMLTextAreaElement | null;

  // Execute text commands
  const execCmd = (command: string, value: string = '') => {
    if (getDisabled()) return;
    document.execCommand(command, false, value);
    updateCounts();
    triggerChange();
  };

  const updateCounts = () => {
    const editor = getEditorEl();
    const text = editor ? editor.innerText : '';
    charCount.value = text.length;
    wordCount.value = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
  };

  const triggerChange = () => {
    if (props.onChange) {
      const editor = getEditorEl();
      const textarea = getTextareaEl();
      const val = isHtmlMode.value ? (textarea?.value || '') : (editor?.innerHTML || '');
      props.onChange(val);
    }
  };

  const handleInput = () => {
    updateCounts();
    triggerChange();
  };

  const handleToggleHtml = () => {
    const editor = getEditorEl();
    const textarea = getTextareaEl();
    if (!editor || !textarea) return;

    if (isHtmlMode.value) {
      // Switching from HTML view to Visual view
      editor.innerHTML = textarea.value;
    } else {
      // Switching from Visual view to HTML view
      textarea.value = editor.innerHTML;
    }
    isHtmlMode.value = !isHtmlMode.value;
  };

  const preventFocusLoss = (e: MouseEvent) => {
    e.preventDefault();
  };

  const handleLink = () => {
    const selection = window.getSelection();
    const range = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
    const url = prompt('Enter the link URL:');
    if (url) {
      if (range && selection) {
        selection.removeAllRanges();
        selection.addRange(range);
      }
      execCmd('createLink', url);
    }
  };

  if (typeof window !== 'undefined') {
    domEffect(() => {
      // Set initial value
      const initialVal = getValue();
      const editor = getEditorEl();
      if (editor && editor.innerHTML !== initialVal) {
        editor.innerHTML = initialVal;
        updateCounts();
      }
    });
  }

  const editorStyle = {
    height: typeof props.height === 'number' ? props.height + 'px' : props.height || '250px',
    overflowY: 'auto'
  };

  const classes = classNames(
    'n-editor',
    props.class,
    () => getDisabled() ? 'n-editor--disabled' : '',
    () => isHtmlMode.value ? 'n-editor--html-mode' : ''
  );

  return (
    <div id={id} class={classes} style={props.style}>
      {/* Toolbar */}
      <div class="n-editor-toolbar" role="toolbar" aria-label="Text Formatting">
        <button type="button" class="n-editor-btn" onMouseDown={preventFocusLoss} onClick={() => execCmd('bold')} title="Bold">
          <b style={{ pointerEvents: 'none' }}>B</b>
        </button>
        <button type="button" class="n-editor-btn" onMouseDown={preventFocusLoss} onClick={() => execCmd('italic')} title="Italic">
          <i style={{ pointerEvents: 'none' }}>I</i>
        </button>
        <button type="button" class="n-editor-btn" onMouseDown={preventFocusLoss} onClick={() => execCmd('underline')} title="Underline">
          <u style={{ pointerEvents: 'none' }}>U</u>
        </button>
        <button type="button" class="n-editor-btn" onMouseDown={preventFocusLoss} onClick={() => execCmd('strikeThrough')} title="Strikethrough">
          <del style={{ pointerEvents: 'none' }}>S</del>
        </button>
        
        <span class="n-editor-divider"></span>
        
        <button type="button" class="n-editor-btn" onMouseDown={preventFocusLoss} onClick={() => execCmd('formatBlock', '<h1>')} title="Heading 1">H1</button>
        <button type="button" class="n-editor-btn" onMouseDown={preventFocusLoss} onClick={() => execCmd('formatBlock', '<h2>')} title="Heading 2">H2</button>
        <button type="button" class="n-editor-btn" onMouseDown={preventFocusLoss} onClick={() => execCmd('formatBlock', '<p>')} title="Paragraph">P</button>
        
        <span class="n-editor-divider"></span>
 
        <button type="button" class="n-editor-btn" onMouseDown={preventFocusLoss} onClick={() => execCmd('justifyLeft')} title="Align Left">Left</button>
        <button type="button" class="n-editor-btn" onMouseDown={preventFocusLoss} onClick={() => execCmd('justifyCenter')} title="Align Center">Center</button>
        <button type="button" class="n-editor-btn" onMouseDown={preventFocusLoss} onClick={() => execCmd('justifyRight')} title="Align Right">Right</button>
 
        <span class="n-editor-divider"></span>
 
        <button type="button" class="n-editor-btn" onMouseDown={preventFocusLoss} onClick={() => execCmd('insertUnorderedList')} title="Bullet List">● List</button>
        <button type="button" class="n-editor-btn" onMouseDown={preventFocusLoss} onClick={() => execCmd('insertOrderedList')} title="Numbered List">1. List</button>
        
        <span class="n-editor-divider"></span>
 
        <button type="button" class="n-editor-btn" onMouseDown={preventFocusLoss} onClick={handleLink} title="Insert Link">🔗 Link</button>
        <button type="button" class="n-editor-btn" onMouseDown={preventFocusLoss} onClick={() => execCmd('removeFormat')} title="Clear Formatting">🧹 Clear</button>
        
        <span class="n-editor-divider"></span>
 
        <button type="button" class="n-editor-btn n-editor-btn--code" onMouseDown={preventFocusLoss} onClick={handleToggleHtml} title="Toggle HTML/Visual Source">
          {() => isHtmlMode.value ? 'Visual 👁️' : 'HTML 💻'}
        </button>
      </div>

      {/* Editor Content Area */}
      <div class="n-editor-container" style={editorStyle}>
        <div
          id={contentId}
          class="n-editor-content"
          contenteditable={() => !getDisabled()}
          onInput={handleInput}
          placeholder={props.placeholder || 'Start typing here...'}
          style={() => isHtmlMode.value ? { display: 'none' } : { display: 'block', minHeight: '100%', padding: '12px', outline: 'none' }}
        ></div>
        
        <textarea
          id={textareaId}
          class="n-editor-textarea"
          onInput={handleInput}
          style={() => isHtmlMode.value ? {
            display: 'block',
            width: '100%',
            height: '100%',
            border: 'none',
            outline: 'none',
            padding: '12px',
            fontFamily: 'monospace',
            resize: 'none',
            background: 'transparent',
            color: 'inherit'
          } : { display: 'none' }}
        ></textarea>
      </div>

      {/* Status Bar */}
      <div class="n-editor-statusbar">
        <span class="n-editor-count">Words: {() => wordCount.value}</span>
        <span class="n-editor-count" style={{ marginLeft: '16px' }}>Characters: {() => charCount.value}</span>
      </div>
    </div>
  );
}
