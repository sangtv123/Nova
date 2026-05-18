import { signal } from '@nova/signals';
import { Tag }    from '../../nova-ui/components/Tag';
import { Button } from '../../nova-ui/components/Button';
import { Table, TableColumn } from '../../nova-ui/components/Table';

// ─── Shared columns ────────────────────────────────────────────────────────

const baseColumns: TableColumn[] = [
  { key: 'name',     title: 'Name',      dataIndex: 'name',     width: 180, fixed: 'left', sortable: true },
  { key: 'age',      title: 'Age',       dataIndex: 'age',      width: 80,  align: 'center', sortable: true },
  { key: 'avatar',   title: 'Avatar',    dataIndex: 'avatar',   width: 80,  align: 'center',
    render: (url: string, record: any) => (
      <img
        src={url}
        alt={record.name}
        style={{
          width: '40px', height: '40px',
          borderRadius: '50%',
          objectFit: 'cover',
          display: 'block',
          margin: '0 auto',
        }}
        loading="lazy"
      />
    )
  },
  { key: 'role',     title: 'Role',      dataIndex: 'role',     width: 130,
    render: (r: string) => <Tag>{r}</Tag> },
  { key: 'address1', title: 'Address 1', dataIndex: 'address1', width: 220 },
  { key: 'address2', title: 'Address 2', dataIndex: 'address2', width: 200 },
  { key: 'address3', title: 'Address 3', dataIndex: 'address3', width: 180 },
  { key: 'status',   title: 'Status',    dataIndex: 'status',   width: 120, align: 'center',
    render: (s: string) => <Tag type={s === 'Active' ? 'success' : s === 'Inactive' ? 'error' : 'warning'}>{s}</Tag> },
  {
    key: 'action', title: 'Action', width: 140, fixed: 'right', align: 'center',
    render: (_: any, record: any) => (
      <div style="display:flex;gap:6px;justify-content:center;">
        <Button type="link"  size="small" onClick={() => alert(`Edit: ${record.name}`)}>Edit</Button>
        <Button type="text"  size="small" danger onClick={() => alert(`Delete: ${record.name}?`)}>Delete</Button>
      </div>
    )
  }
];

const simpleColumns: TableColumn[] = [
  { key: 'name',   title: 'Name',    dataIndex: 'name',   width: 200, sortable: true },
  { key: 'age',    title: 'Age',     dataIndex: 'age',    width: 80,  align: 'center', sortable: true },
  { key: 'role',   title: 'Role',    dataIndex: 'role',   width: 130,
    render: (r: string) => <Tag>{r}</Tag> },
  { key: 'status', title: 'Status',  dataIndex: 'status', width: 120, align: 'center',
    render: (s: string) => <Tag type={s === 'Active' ? 'success' : s === 'Inactive' ? 'error' : 'warning'}>{s}</Tag> },
  { key: 'address', title: 'Address', dataIndex: 'address1' },
];

// ─── Data ──────────────────────────────────────────────────────────────────

const tableData = [
  { key: '1', name: 'John Brown',   age: 32, role: 'Admin',  status: 'Active',   address1: 'New York No. 1 Lake Park',  address2: 'Building A', address3: 'Floor 5'  },
  { key: '2', name: 'Jane Smith',   age: 28, role: 'Editor', status: 'Active',   address1: 'London No. 1 Lake Park',    address2: 'Building B', address3: 'Floor 2'  },
  { key: '3', name: 'Bob Johnson',  age: 45, role: 'Viewer', status: 'Inactive', address1: 'Sydney No. 1 Lake Park',    address2: 'Building C', address3: 'Floor 10' },
  { key: '4', name: 'Alice Wang',   age: 23, role: 'Admin',  status: 'Active',   address1: 'Tokyo No. 1 Lake Park',     address2: 'Building D', address3: 'Floor 1'  },
  { key: '5', name: 'Tom Davis',    age: 37, role: 'Editor', status: 'Pending',  address1: 'Paris No. 1 Lake Park',     address2: 'Building E', address3: 'Floor 3'  },
  { key: '6', name: 'Charlie Lee',  age: 41, role: 'Admin',  status: 'Active',   address1: 'Berlin No. 1 Lake Park',    address2: 'Building F', address3: 'Floor 7'  },
  { key: '7', name: 'Diana Prince', age: 29, role: 'Viewer', status: 'Active',   address1: 'Madrid No. 1 Lake Park',    address2: 'Building G', address3: 'Floor 8'  },
];

const virtualData = Array.from({ length: 10000 }).map((_, i) => ({
  key: String(i),
  name: `User ${i + 1}`,
  age: 20 + (i % 40),
  role: i % 3 === 0 ? 'Admin' : i % 3 === 1 ? 'Editor' : 'Viewer',
  status: i % 4 === 0 ? 'Inactive' : i % 4 === 3 ? 'Pending' : 'Active',
  address1: `City ${i % 100} No. ${i % 10 + 1} Lake Park`,
  address2: `Building ${String.fromCharCode(65 + (i % 26))}`,
  address3: `Floor ${i % 20 + 1}`,
  // Deterministic avatar — same seed = same image, no network flood
  avatar: `https://picsum.photos/seed/user${i % 200}/40/40`,
}));

// ─── Page ──────────────────────────────────────────────────────────────────

export function TablePage() {
  const isLoading = signal(false);

  function simulateLoad() {
    isLoading.value = true;
    setTimeout(() => { isLoading.value = false; }, 2000);
  }

  return (
    <div class="nova-ui-page">
      <h1 class="nova-ui-page-title">Table</h1>
      <p class="nova-ui-page-desc">
        A powerful data grid supporting fixed columns, column sorting, row selection, loading state,
        empty state, and high-performance virtual scrolling for massive datasets.
      </p>

      {/* ── 1. Basic ─────────────────────────────────────────────────── */}
      <div class="nova-section">
        <h2 class="nova-section-title">Basic Table</h2>
        <div class="nova-demo-block">
          <div class="nova-demo-block-preview nova-demo-block-preview--vertical" style="width:100%;padding:0;">
            <Table columns={simpleColumns} dataSource={tableData} />
          </div>
          <div class="nova-demo-block-meta">
            <span class="nova-demo-block-meta-title">
              Simple table without scroll. Click column header with ▲▼ icon to sort.
            </span>
          </div>
        </div>
      </div>

      {/* ── 2. Fixed columns + scroll ─────────────────────────────────── */}
      <div class="nova-section">
        <h2 class="nova-section-title">Fixed Columns &amp; Scroll</h2>
        <div class="nova-demo-block">
          <div class="nova-demo-block-preview nova-demo-block-preview--vertical" style="width:100%;padding:0;">
            <Table
              columns={baseColumns}
              dataSource={tableData}
              scroll={{ x: 1350, y: 260 }}
            />
          </div>
          <div class="nova-demo-block-meta">
            <span class="nova-demo-block-meta-title">
              Fixed header, sticky <code>left</code>/<code>right</code> columns with shadow, horizontal + vertical scroll sync.
            </span>
          </div>
        </div>
      </div>

      {/* ── 3. Row Selection ──────────────────────────────────────────── */}
      <div class="nova-section">
        <h2 class="nova-section-title">Row Selection</h2>
        <div class="nova-demo-block">
          <div class="nova-demo-block-preview nova-demo-block-preview--vertical" style="width:100%;padding:0;">
            <Table
              columns={simpleColumns}
              dataSource={tableData}
              rowSelection={true}
            />
          </div>
          <div class="nova-demo-block-meta">
            <span class="nova-demo-block-meta-title">
              Checkbox per row. Header checkbox selects / deselects all.
            </span>
          </div>
        </div>
      </div>

      {/* ── 4. Sizes ─────────────────────────────────────────────────── */}
      <div class="nova-section">
        <h2 class="nova-section-title">Size Variants</h2>
        <div class="nova-demo-block">
          <div class="nova-demo-block-preview nova-demo-block-preview--vertical" style="width:100%;padding:24px;gap:20px;display:flex;flex-direction:column;">
            <div>
              <p style="margin:0 0 8px;color:var(--n-text-2);font-size:var(--n-fs-sm);font-weight:600;letter-spacing:.06em;">DEFAULT</p>
              <Table columns={simpleColumns} dataSource={tableData.slice(0, 3)} />
            </div>
            <div>
              <p style="margin:0 0 8px;color:var(--n-text-2);font-size:var(--n-fs-sm);font-weight:600;letter-spacing:.06em;">MIDDLE</p>
              <Table columns={simpleColumns} dataSource={tableData.slice(0, 3)} size="middle" />
            </div>
            <div>
              <p style="margin:0 0 8px;color:var(--n-text-2);font-size:var(--n-fs-sm);font-weight:600;letter-spacing:.06em;">SMALL</p>
              <Table columns={simpleColumns} dataSource={tableData.slice(0, 3)} size="small" />
            </div>
          </div>
          <div class="nova-demo-block-meta">
            <span class="nova-demo-block-meta-title">
              Three density levels: <code>default</code>, <code>middle</code>, <code>small</code>.
            </span>
          </div>
        </div>
      </div>

      {/* ── 5. Bordered ──────────────────────────────────────────────── */}
      <div class="nova-section">
        <h2 class="nova-section-title">Bordered</h2>
        <div class="nova-demo-block">
          <div class="nova-demo-block-preview nova-demo-block-preview--vertical" style="width:100%;padding:0;">
            <Table
              columns={simpleColumns}
              dataSource={tableData.slice(0, 4)}
              bordered={true}
            />
          </div>
          <div class="nova-demo-block-meta">
            <span class="nova-demo-block-meta-title">
              All cells get a visible border with <code>bordered</code> prop.
            </span>
          </div>
        </div>
      </div>

      {/* ── 6. Loading ───────────────────────────────────────────────── */}
      <div class="nova-section">
        <h2 class="nova-section-title">Loading State</h2>
        <div class="nova-demo-block">
          <div class="nova-demo-block-preview nova-demo-block-preview--vertical" style="width:100%;padding:16px;gap:12px;display:flex;flex-direction:column;align-items:flex-start;">
            <Button type="primary" onClick={simulateLoad}>Reload (2 s)</Button>
            <div style="width:100%;">
              <Table
                columns={simpleColumns}
                dataSource={tableData}
                loading={() => isLoading.value}
              />
            </div>
          </div>
          <div class="nova-demo-block-meta">
            <span class="nova-demo-block-meta-title">
              Pass <code>loading</code> prop (boolean or signal getter) to overlay a spinner.
            </span>
          </div>
        </div>
      </div>

      {/* ── 7. Empty ─────────────────────────────────────────────────── */}
      <div class="nova-section">
        <h2 class="nova-section-title">Empty State</h2>
        <div class="nova-demo-block">
          <div class="nova-demo-block-preview nova-demo-block-preview--vertical" style="width:100%;padding:0;">
            <Table
              columns={simpleColumns}
              dataSource={[]}
              emptyText="No matching records found"
            />
          </div>
          <div class="nova-demo-block-meta">
            <span class="nova-demo-block-meta-title">
              Empty <code>dataSource</code> shows a friendly placeholder icon with custom text.
            </span>
          </div>
        </div>
      </div>

      {/* ── 8. Virtual scroll ────────────────────────────────────────── */}
      <div class="nova-section">
        <h2 class="nova-section-title">Virtual Scroll — 10,000 Rows</h2>
        <div class="nova-demo-block">
          <div class="nova-demo-block-preview nova-demo-block-preview--vertical" style="width:100%;padding:0;">
            <Table
              columns={baseColumns}
              dataSource={virtualData}
              scroll={{ x: 1300, y: 380 }}
              virtual={true}
              rowHeight={60}
            />
            <div class="n-table-pagination" style="border-top:1px solid var(--n-border);">
              <span style="color:var(--n-text-2);font-size:var(--n-fs-sm);">Total 10,000 items</span>
              <div class="n-pagination">
                <div class="n-pagination-item n-pagination-item--prev">‹</div>
                <div class="n-pagination-item n-pagination-item--active">1</div>
                <div class="n-pagination-item">2</div>
                <div class="n-pagination-item">3</div>
                <div class="n-pagination-item n-pagination-item--ellipsis">…</div>
                <div class="n-pagination-item">100</div>
                <div class="n-pagination-item n-pagination-item--next">›</div>
              </div>
            </div>
          </div>
          <div class="nova-demo-block-meta">
            <span class="nova-demo-block-meta-title">
              60 fps virtual scrolling — only visible rows render in the DOM. Supports sorting + fixed columns.
            </span>
          </div>
        </div>
      </div>

      {/* ── API Table ────────────────────────────────────────────────── */}
      <table class="nova-api-table">
        <thead>
          <tr><th>Prop</th><th>Description</th><th>Type</th><th>Default</th></tr>
        </thead>
        <tbody>
          <tr><td><code>columns</code></td><td>Column definitions</td><td><code>TableColumn[]</code></td><td>—</td></tr>
          <tr><td><code>dataSource</code></td><td>Table data array</td><td><code>any[]</code></td><td>—</td></tr>
          <tr><td><code>scroll</code></td><td>Scroll config</td><td><code>{'{ x?, y? }'}</code></td><td>—</td></tr>
          <tr><td><code>virtual</code></td><td>Enable virtual scrolling</td><td><code>boolean</code></td><td><code>false</code></td></tr>
          <tr><td><code>rowHeight</code></td><td>Fixed row height (px) for virtual mode</td><td><code>number</code></td><td>—</td></tr>
          <tr><td><code>loading</code></td><td>Show loading overlay</td><td><code>boolean</code></td><td><code>false</code></td></tr>
          <tr><td><code>rowSelection</code></td><td>Enable row checkboxes</td><td><code>boolean</code></td><td><code>false</code></td></tr>
          <tr><td><code>size</code></td><td>Row density</td><td><code>'default' | 'middle' | 'small'</code></td><td><code>'default'</code></td></tr>
          <tr><td><code>bordered</code></td><td>Show cell borders</td><td><code>boolean</code></td><td><code>false</code></td></tr>
          <tr><td><code>emptyText</code></td><td>Custom empty text</td><td><code>string</code></td><td><code>'No Data'</code></td></tr>
        </tbody>
      </table>
    </div>
  );
}
