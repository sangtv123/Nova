import { signal } from '@nova/signals';

// ─── Types ─────────────────────────────────────────────────────────────────

export interface TableColumn {
  title: any;
  dataIndex?: string;
  key: string;
  width?: number | string;
  fixed?: 'left' | 'right';
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  ellipsis?: boolean;
  render?: (text: any, record: any, index: number) => any;
}

export interface TableProps {
  columns: TableColumn[];
  dataSource: any[];
  scroll?: { x?: number | string; y?: number | string };
  virtual?: boolean;
  rowHeight?: number;
  loading?: boolean;
  rowSelection?: boolean;
  size?: 'default' | 'middle' | 'small';
  bordered?: boolean;
  showHeader?: boolean;
  emptyText?: string;
  rowKey?: string;
  class?: string;
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function px(v: number | string | undefined, fallback = '100px'): string {
  if (v === undefined) return fallback;
  if (typeof v === 'number') return `${v}px`;
  return v;
}

// ─── Component ─────────────────────────────────────────────────────────────

export function Table(props: TableProps) {
  const customClass = props.class ? ` ${props.class}` : '';
  const bordered   = props.bordered ? ' n-table--bordered' : '';
  const sizeClass  = props.size === 'small' ? ' n-table--small' : props.size === 'middle' ? ' n-table--middle' : '';
  const isVirtual  = !!(props.virtual && props.scroll?.y && props.rowHeight);

  // ── Signals ──
  const scrollTop    = signal(0);
  const sortKey      = signal('');
  const sortDir      = signal<'asc' | 'desc' | ''>('');
  const selectedKeys = signal<Set<string>>(new Set());

  // ── Unique IDs ──
  const uid      = Math.random().toString(36).substring(2, 9);
  const bodyId   = `n-table-body-${uid}`;
  const headerId = `n-table-header-${uid}`;

  // ── Sticky offsets ──
  let leftOffsets:  Record<string, number> = {};
  let rightOffsets: Record<string, number> = {};

  let curLeft = 0;
  for (const col of props.columns) {
    if (col.fixed === 'left') {
      leftOffsets[col.key] = curLeft;
      curLeft += typeof col.width === 'number' ? col.width : parseInt(String(col.width ?? 100), 10);
    }
  }
  let curRight = 0;
  for (let i = props.columns.length - 1; i >= 0; i--) {
    const col = props.columns[i];
    if (col.fixed === 'right') {
      rightOffsets[col.key] = curRight;
      curRight += typeof col.width === 'number' ? col.width : parseInt(String(col.width ?? 100), 10);
    }
  }

  // ── getFixedStyle → pure string ──
  function getFixedStyle(col: TableColumn, isHeader: boolean): string {
    if (col.fixed === 'left') {
      const bg  = isHeader ? 'var(--n-bg-layout)' : 'var(--n-bg-container)';
      const z   = isHeader ? 3 : 1;
      return `position:sticky;left:${leftOffsets[col.key]}px;z-index:${z};background:${bg};box-shadow:2px 0 6px rgba(0,0,0,.06);`;
    }
    if (col.fixed === 'right') {
      const bg  = isHeader ? 'var(--n-bg-layout)' : 'var(--n-bg-container)';
      const z   = isHeader ? 3 : 1;
      return `position:sticky;right:${rightOffsets[col.key]}px;z-index:${z};background:${bg};box-shadow:-2px 0 6px rgba(0,0,0,.06);`;
    }
    return '';
  }

  // ── getCellStyle → pure string ──
  function getCellStyle(col: TableColumn, isHeader: boolean, extra = ''): string {
    const align  = col.align ? `text-align:${col.align};` : '';
    const fixed  = getFixedStyle(col, isHeader);
    const ell    = col.ellipsis ? 'overflow:hidden;white-space:nowrap;text-overflow:ellipsis;' : '';
    return `${align}${fixed}${ell}${extra}`;
  }

  // ── Sort helpers ──
  function getSortedData(data: any[]): any[] {
    const k = sortKey.value;
    const d = sortDir.value;
    if (!k || !d) return data;
    return [...data].sort((a, b) => {
      const av = a[k]; const bv = b[k];
      if (av == null) return 1;
      if (bv == null) return -1;
      const cmp = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv));
      return d === 'asc' ? cmp : -cmp;
    });
  }

  function toggleSort(colKey: string) {
    if (sortKey.value !== colKey) {
      sortKey.value = colKey;
      sortDir.value = 'asc';
    } else if (sortDir.value === 'asc') {
      sortDir.value = 'desc';
    } else {
      sortKey.value = '';
      sortDir.value = '';
    }
  }

  // ── Row selection helpers ──
  const rowKeyField = props.rowKey ?? 'key';
  function getRowKey(record: any): string {
    return String(record[rowKeyField] ?? '');
  }

  function toggleRow(key: string) {
    const next = new Set(selectedKeys.value);
    if (next.has(key)) next.delete(key); else next.add(key);
    selectedKeys.value = next;
  }

  function toggleAll(data: any[]) {
    const allKeys = data.map(getRowKey);
    const allSelected = allKeys.every(k => selectedKeys.value.has(k));
    if (allSelected) {
      const next = new Set(selectedKeys.value);
      allKeys.forEach(k => next.delete(k));
      selectedKeys.value = next;
    } else {
      const next = new Set(selectedKeys.value);
      allKeys.forEach(k => next.add(k));
      selectedKeys.value = next;
    }
  }

  // ── Scroll sync ──
  if (typeof window !== 'undefined') {
    setTimeout(() => {
      const bodyEl = document.getElementById(bodyId);
      if (!bodyEl) return;
      bodyEl.onscroll = (e) => {
        const target = e.target as HTMLElement;
        if (isVirtual) scrollTop.value = target.scrollTop;
        if (props.scroll?.x) {
          const headerEl = document.getElementById(headerId);
          if (headerEl) headerEl.scrollLeft = target.scrollLeft;
        }
      };
    }, 100);
  }

  // ── widths ──
  const totalW = props.scroll?.x ? px(props.scroll.x) : '100%';

  // ── colgroup ──
  const renderColgroup = () => (
    <colgroup>
      {props.rowSelection && <col style="width:40px;" />}
      {props.columns.map(col => (
        <col key={col.key} style={col.width ? `width:${px(col.width)};` : ''} />
      ))}
    </colgroup>
  );

  // ── Sort icon ──
  const SortIcon = ({ colKey }: { colKey: string }) => (
    <span class="n-table-sort-icon">
      <span class={`n-table-sort-up${sortKey.value === colKey && sortDir.value === 'asc' ? ' n-table-sort-up--active' : ''}`}>▲</span>
      <span class={`n-table-sort-dn${sortKey.value === colKey && sortDir.value === 'desc' ? ' n-table-sort-dn--active' : ''}`}>▼</span>
    </span>
  );

  // ── renderHeader ──
  const renderHeader = () => {
    if (props.showHeader === false) return null;
    const headerWrapStyle = `overflow:hidden;border-bottom:1px solid var(--n-border);background:var(--n-bg-layout);`;
    const headerTableStyle = `table-layout:fixed;margin-bottom:0;width:${totalW};`;

    return (
      <div id={headerId} class="n-table-header" style={headerWrapStyle}>
        <table class={`n-table${sizeClass}${bordered}`} style={headerTableStyle}>
          {renderColgroup()}
          <thead class="n-table-thead">
            <tr>
              {props.rowSelection && (() => {
                const data = getSortedData(props.dataSource);
                const allKeys = data.map(getRowKey);
                const allChecked = allKeys.length > 0 && allKeys.every(k => selectedKeys.value.has(k));
                const indeterminate = !allChecked && allKeys.some(k => selectedKeys.value.has(k));
                return (
                  <th style="width:40px;text-align:center;padding:0;">
                    <input
                      type="checkbox"
                      checked={allChecked}
                      ref={(el: HTMLInputElement) => { if (el) el.indeterminate = indeterminate; }}
                      onChange={() => toggleAll(data)}
                    />
                  </th>
                );
              })()}
              {props.columns.map(col => {
                const sortable = col.sortable;
                const thStyle = getCellStyle(col, true);
                return (
                  <th
                    key={col.key}
                    class={`n-table-th${sortable ? ' n-table-th--sortable' : ''}`}
                    style={thStyle}
                    onClick={sortable ? () => toggleSort(col.key) : undefined}
                  >
                    <span class="n-table-th-inner">
                      {col.title}
                      {sortable && <SortIcon colKey={col.key} />}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
        </table>
      </div>
    );
  };

  // ── renderRow ──
  function renderRow(record: any, realIndex: number, heightStyle = '') {
    const rk = getRowKey(record);
    const isSelected = props.rowSelection && selectedKeys.value.has(rk);
    const trClass = `n-table-row${isSelected ? ' n-table-row--selected' : ''}`;
    return (
      <tr key={rk} class={trClass} style={heightStyle}>
        {props.rowSelection && (
          <td class="n-table-cell" style="width:40px;text-align:center;padding:0;">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => toggleRow(rk)}
            />
          </td>
        )}
        {props.columns.map(col => {
          const text    = col.dataIndex ? record[col.dataIndex] : undefined;
          const content = col.render ? col.render(text, record, realIndex) : text;
          const tdStyle = getCellStyle(col, false, 'overflow:hidden;white-space:nowrap;text-overflow:ellipsis;');
          return (
            <td key={col.key} class="n-table-cell" style={tdStyle}>
              {content}
            </td>
          );
        })}
      </tr>
    );
  }

  // ── renderEmpty ──
  const renderEmpty = () => (
    <tr>
      <td
        colspan={props.columns.length + (props.rowSelection ? 1 : 0)}
        class="n-table-empty"
      >
        <div class="n-table-empty-inner">
          <svg width="64" height="41" viewBox="0 0 64 41" xmlns="http://www.w3.org/2000/svg">
            <g transform="translate(0 1)" fill="none" fill-rule="evenodd">
              <ellipse fill="#f5f5f5" cx="32" cy="33" rx="32" ry="7"/>
              <g fill-rule="nonzero" stroke="#d9d9d9">
                <path d="M55 12.76L44.854 1.258C44.367.474 43.656 0 42.907 0H21.093c-.749 0-1.46.474-1.947 1.257L9 12.761V22h46v-9.24z"/>
                <path d="M41.613 15.931c0-1.605.994-2.93 2.227-2.931H55v18.137C55 33.26 53.68 35 52.05 35h-40.1C10.32 35 9 33.259 9 31.137V13h11.16c1.233 0 2.227 1.323 2.227 2.928v.022c0 1.605 1.005 2.901 2.237 2.901h14.752c1.232 0 2.237-1.308 2.237-2.913v-.007z" fill="#fafafa"/>
              </g>
            </g>
          </svg>
          <p>{props.emptyText ?? 'No Data'}</p>
        </div>
      </td>
    </tr>
  );

  // ── renderBody (virtual) ──
  const renderVirtualBody = () => {
    const rowH     = props.rowHeight as number;
    const sortedData = getSortedData(props.dataSource);
    const totalHeight = sortedData.length * rowH;
    const scrollY     = parseInt(String(props.scroll!.y), 10);

    const bodyStyle  = `max-height:${scrollY}px;overflow-y:auto;overflow-x:${props.scroll?.x ? 'auto' : 'hidden'};position:relative;`;
    const dummyStyle = `height:${totalHeight}px;width:${props.scroll?.x ? px(props.scroll.x) : '1px'};pointer-events:none;`;

    return (
      <div id={bodyId} class="n-table-body" style={bodyStyle}>
        <div style={dummyStyle} />
        <table
          class={`n-table${sizeClass}${bordered} n-table--striped`}
          style={() => {
            const start  = Math.max(0, Math.floor(scrollTop.value / rowH) - 2);
            const offsetY = start * rowH;
            return `position:absolute;top:0;left:0;transform:translateY(${offsetY}px);table-layout:fixed;margin-bottom:0;width:${totalW};`;
          }}
        >
          {renderColgroup()}
          <tbody class="n-table-tbody">
            {() => {
              const start       = Math.max(0, Math.floor(scrollTop.value / rowH) - 2);
              const visibleCount = Math.ceil(scrollY / rowH) + 4;
              const end          = Math.min(sortedData.length, start + visibleCount);
              const slice        = sortedData.slice(start, end);
              if (slice.length === 0) return renderEmpty();
              return slice.map((record, i) => renderRow(record, start + i, `height:${rowH}px;`));
            }}
          </tbody>
        </table>
      </div>
    );
  };

  // ── renderBody (normal) ──
  const renderNormalBody = () => {
    const sortedData = getSortedData(props.dataSource);
    const bodyStyle  = `max-height:${props.scroll?.y ? px(props.scroll.y) : 'none'};overflow-y:${props.scroll?.y ? 'auto' : 'visible'};overflow-x:${props.scroll?.x ? 'auto' : 'hidden'};`;
    const tableStyle = `table-layout:fixed;${props.scroll?.x ? `width:${px(props.scroll.x)};` : 'width:100%;'}`;

    return (
      <div id={bodyId} class="n-table-body" style={bodyStyle}>
        <table class={`n-table${sizeClass}${bordered} n-table--striped`} style={tableStyle}>
          {renderColgroup()}
          <tbody class="n-table-tbody">
            {sortedData.length === 0
              ? renderEmpty()
              : sortedData.map((record, i) => renderRow(record, i))
            }
          </tbody>
        </table>
      </div>
    );
  };

  // ── Loading overlay ──
  const renderLoading = () => (
    <div class="n-table-loading-overlay">
      <div class="n-table-loading-spin" />
    </div>
  );

  // ── Root ──
  const wrapClass = `n-table-wrapper${customClass}`;
  const wrapStyle = 'display:flex;flex-direction:column;position:relative;';

  return (
    <div class={wrapClass} style={wrapStyle}>
      {props.loading && renderLoading()}
      {renderHeader()}
      {isVirtual ? renderVirtualBody() : renderNormalBody()}
    </div>
  );
}
