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

// ─── Component ─────────────────────────────────────────────────────────────

export function Table(props: TableProps) {
  // ── State signals ──
  const scrollTop    = signal(0);
  const sortKey      = signal('');
  const sortDir      = signal('');        // '' | 'asc' | 'desc'
  const selectedKeys = signal(new Set<string>());

  // ── Derived flags ──
  const isVirtual  = !!(props.virtual && props.scroll?.y && props.rowHeight);
  const bordered   = props.bordered   ? ' n-table--bordered' : '';
  const sizeClass  = props.size === 'small'  ? ' n-table--small'
                   : props.size === 'middle' ? ' n-table--middle' : '';
  const customClass = props.class ? ` ${props.class}` : '';
  const rowKeyField = props.rowKey ?? 'key';

  // ── Unique IDs ──
  const uid      = Math.random().toString(36).substring(2, 9);
  const bodyId   = `ntb-${uid}`;
  const headerId = `nth-${uid}`;

  // ── px helper ──
  function px(v: number | string | undefined): string {
    if (v === undefined) return '100%';
    return typeof v === 'number' ? `${v}px` : v;
  }

  // ── Total width ──
  const totalW = props.scroll?.x ? px(props.scroll.x) : '100%';

  // ── Sticky offsets ──
  const leftOff: Record<string, number>  = {};
  const rightOff: Record<string, number> = {};
  let curL = 0;
  for (const col of props.columns) {
    if (col.fixed === 'left') {
      leftOff[col.key] = curL;
      curL += typeof col.width === 'number' ? col.width : parseInt(String(col.width ?? 100), 10);
    }
  }
  let curR = 0;
  for (let i = props.columns.length - 1; i >= 0; i--) {
    const col = props.columns[i];
    if (col.fixed === 'right') {
      rightOff[col.key] = curR;
      curR += typeof col.width === 'number' ? col.width : parseInt(String(col.width ?? 100), 10);
    }
  }

  // ── Style builders ──
  function cellStyle(col: TableColumn, isHead: boolean): any {
    const s: any = {
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      textOverflow: 'ellipsis'
    };
    if (col.align) s.textAlign = col.align;
    if (col.fixed === 'left') {
      s.position = 'sticky';
      s.left = `${leftOff[col.key]}px`;
      s.zIndex = isHead ? 3 : 1;
      s.background = isHead ? 'var(--n-bg-layout)' : 'var(--n-bg-container)';
      s.boxShadow = '2px 0 6px rgba(0,0,0,.06)';
    } else if (col.fixed === 'right') {
      s.position = 'sticky';
      s.right = `${rightOff[col.key]}px`;
      s.zIndex = isHead ? 3 : 1;
      s.background = isHead ? 'var(--n-bg-layout)' : 'var(--n-bg-container)';
      s.boxShadow = '-2px 0 6px rgba(0,0,0,.06)';
    }
    return s;
  }

  // ── Sort helpers ──
  function sortedData(): any[] {
    const k = sortKey.value;
    const d = sortDir.value;
    if (!k || !d) return props.dataSource;
    return [...props.dataSource].sort((a, b) => {
      const av = a[k], bv = b[k];
      if (av == null) return 1;
      if (bv == null) return -1;
      const cmp = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv));
      return d === 'asc' ? cmp : -cmp;
    });
  }

  function onSortClick(colKey: string) {
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

  // ── Row key helper ──
  function rowKey(record: any): string {
    return String(record[rowKeyField] ?? '');
  }

  // ── Selection helpers ──
  function toggleRow(k: string) {
    const next = new Set(selectedKeys.value);
    if (next.has(k)) next.delete(k); else next.add(k);
    selectedKeys.value = next;
  }

  function toggleAll() {
    const data = sortedData();
    const keys = data.map(rowKey);
    const allSel = keys.length > 0 && keys.every(k => selectedKeys.value.has(k));
    const next = new Set(selectedKeys.value);
    if (allSel) { keys.forEach(k => next.delete(k)); }
    else        { keys.forEach(k => next.add(k)); }
    selectedKeys.value = next;
  }

  // ── Scroll event ──
  function handleScroll(e: Event) {
    const t = e.target as HTMLElement;
    if (isVirtual) scrollTop.value = t.scrollTop;
    if (props.scroll?.x) {
      const hEl = document.getElementById(headerId);
      if (hEl) hEl.scrollLeft = t.scrollLeft;
    }
  }

  // ── colgroup ──
  function colgroup() {
    return (
      <colgroup>
        {props.rowSelection && <col style={{ width: '40px', minWidth: '40px' }} />}
        {props.columns.map(col => {
          const w = col.width ? px(col.width) : undefined;
          return <col key={col.key} style={w ? { width: w, minWidth: w } : undefined} />;
        })}
      </colgroup>
    );
  }

  // ── thead row ──
  function theadRow() {
    return (
      <tr>
        {props.rowSelection && (() => {
          const data = sortedData();
          const keys = data.map(rowKey);
          const allChecked = keys.length > 0 && keys.every(k => selectedKeys.value.has(k));
          return (
            <th style={{ width: '40px', textAlign: 'center', padding: '0 8px' }}>
              <input type="checkbox" checked={allChecked} onChange={toggleAll} />
            </th>
          );
        })()}
        {props.columns.map(col => (
          <th
            key={col.key}
            class={`n-table-th${col.sortable ? ' n-table-th--sortable' : ''}`}
            style={cellStyle(col, true)}
            onClick={col.sortable ? () => onSortClick(col.key) : undefined}
          >
            <span class="n-table-th-inner">
              {col.title}
              {col.sortable && (
                <span class="n-table-sort-icon">
                  <span class={() => `n-table-sort-up${sortKey.value === col.key && sortDir.value === 'asc' ? ' n-table-sort-up--active' : ''}`}>▲</span>
                  <span class={() => `n-table-sort-dn${sortKey.value === col.key && sortDir.value === 'desc' ? ' n-table-sort-dn--active' : ''}`}>▼</span>
                </span>
              )}
            </span>
          </th>
        ))}
      </tr>
    );
  }

  // ── single data row ──
  function dataRow(record: any, realIndex: number, rowH?: number) {
    const rk = rowKey(record);
    const sel = props.rowSelection && selectedKeys.value.has(rk);
    const rs: any = rowH ? { height: `${rowH}px` } : {};
    return (
      <tr key={rk} class={`n-table-row${sel ? ' n-table-row--selected' : ''}`} style={rs}>
        {props.rowSelection && (
          <td class="n-table-cell" style={{ width: '40px', textAlign: 'center', padding: '0 8px' }}>
            <input type="checkbox" checked={sel} onChange={() => toggleRow(rk)} />
          </td>
        )}
        {props.columns.map(col => {
          const text    = col.dataIndex ? record[col.dataIndex] : undefined;
          const content = col.render ? col.render(text, record, realIndex) : text;
          return (
            <td key={col.key} class="n-table-cell" style={cellStyle(col, false)}>
              {content}
            </td>
          );
        })}
      </tr>
    );
  }

  // ── empty row ──
  function emptyRow() {
    const span = props.columns.length + (props.rowSelection ? 1 : 0);
    return (
      <tr>
        <td colspan={span} class="n-table-empty">
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
  }

  // ── Normal body ──
  function normalBody() {
    const bodyStyle = {
      maxHeight: props.scroll?.y ? px(props.scroll.y) : 'none',
      overflowY: props.scroll?.y ? 'auto' : 'visible',
      overflowX: props.scroll?.x ? 'auto' : 'hidden',
      position: 'relative'
    };
    const tblStyle = {
      tableLayout: 'fixed',
      marginBottom: '0px',
      width: totalW
    };

    return (
      <div id={bodyId} class="n-table-body" style={bodyStyle} onScroll={handleScroll}>
        <table class={`n-table${sizeClass}${bordered} n-table--striped`} style={tblStyle}>
          {colgroup()}
          <tbody class="n-table-tbody">
            {() => {
              const data = sortedData();
              if (data.length === 0) return emptyRow();
              return data.map((record, i) => dataRow(record, i));
            }}
          </tbody>
        </table>
      </div>
    );
  }

  // ── Virtual body ──
  function virtualBody() {
    const rowH     = props.rowHeight as number;
    const scrollY  = parseInt(String(props.scroll!.y), 10);

    const bodyStyle = {
      maxHeight: `${scrollY}px`,
      overflowY: 'auto',
      overflowX: props.scroll?.x ? 'auto' : 'hidden',
      position: 'relative'
    };
    const dummyStyle = () => ({
      height: `${sortedData().length * rowH}px`,
      width: props.scroll?.x ? totalW : '1px',
      pointerEvents: 'none'
    });
    const tblStyle = () => {
      const start   = Math.max(0, Math.floor(scrollTop.value / rowH) - 2);
      const offsetY = start * rowH;
      return {
        position: 'absolute',
        top: '0px',
        left: '0px',
        transform: `translateY(${offsetY}px)`,
        tableLayout: 'fixed',
        marginBottom: '0px',
        width: totalW,
      };
    };

    return (
      <div id={bodyId} class="n-table-body" style={bodyStyle} onScroll={handleScroll}>
        <div style={dummyStyle} />
        <table class={`n-table${sizeClass}${bordered} n-table--striped`} style={tblStyle}>
          {colgroup()}
          <tbody class="n-table-tbody">
            {() => {
              const data         = sortedData();
              const start        = Math.max(0, Math.floor(scrollTop.value / rowH) - 2);
              const visibleCount = Math.ceil(scrollY / rowH) + 4;
              const end          = Math.min(data.length, start + visibleCount);
              const slice        = data.slice(start, end);
              if (slice.length === 0) return emptyRow();
              return slice.map((record, i) => dataRow(record, start + i, rowH));
            }}
          </tbody>
        </table>
      </div>
    );
  }

  // ── Header ──
  function header() {
    if (props.showHeader === false) return null;
    const wrapStyle = {
      overflow: 'hidden',
      borderBottom: '1px solid var(--n-border)',
      background: 'var(--n-bg-layout)',
      scrollbarGutter: 'stable',
      paddingRight: props.scroll?.y ? '8px' : '0px', // Compensate for scrollbar offset
    };
    const tblStyle = {
      tableLayout: 'fixed',
      marginBottom: '0px',
      width: totalW
    };
    return (
      <div id={headerId} class="n-table-header" style={wrapStyle}>
        <table class={`n-table${sizeClass}${bordered}`} style={tblStyle}>
          {colgroup()}
          <thead class="n-table-thead">
            {theadRow()}
          </thead>
        </table>
      </div>
    );
  }

  // ── Root ──
  return (
    <div class={`n-table-wrapper${customClass}`} style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {props.loading && (
        <div class="n-table-loading-overlay">
          <div class="n-table-loading-spin" />
        </div>
      )}
      {header()}
      {isVirtual ? virtualBody() : normalBody()}
    </div>
  );
}
