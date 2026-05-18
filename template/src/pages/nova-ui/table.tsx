import { signal } from '@nova/signals';
import { Tag }    from '../../nova-ui/components/Tag';
import { Button } from '../../nova-ui/components/Button';
import { Table, TableColumn } from '../../nova-ui/components/Table';

// ─── Shared columns ────────────────────────────────────────────────────────

const baseColumns: TableColumn[] = [
  { key: 'name',     title: 'Name',      dataIndex: 'name',     width: 180, fixed: 'left', sortable: true },
  { key: 'age',      title: 'Age',       dataIndex: 'age',      width: 80,  align: 'center', sortable: true },
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

// Simple columns (no fixed cols)
const simpleColumns: TableColumn[] = [
  { key: 'name',   title: 'Name',   dataIndex: 'name',   width: 180, sortable: true },
  { key: 'age',    title: 'Age',    dataIndex: 'age',    width: 80, align: 'center', sortable: true },
  { key: 'role',   title: 'Role',   dataIndex: 'role',   width: 130,
    render: (r: string) => <Tag>{r}</Tag> },
  { key: 'status', title: 'Status', dataIndex: 'status', width: 120, align: 'center',
    render: (s: string) => <Tag type={s === 'Active' ? 'success' : s === 'Inactive' ? 'error' : 'warning'}>{s}</Tag> },
  { key: 'address1', title: 'Address', dataIndex: 'address1' },
];

// ─── Sample data ───────────────────────────────────────────────────────────

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
  key: i.toString(),
  name: `User ${i + 1}`,
  age: 20 + (i % 40),
  role: i % 3 === 0 ? 'Admin' : i % 3 === 1 ? 'Editor' : 'Viewer',
  status: i % 4 === 0 ? 'Inactive' : i % 4 === 3 ? 'Pending' : 'Active',
  address1: `City ${i % 100} No. ${i % 10 + 1} Lake Park`,
  address2: `Building ${String.fromCharCode(65 + (i % 26))}`,
  address3: `Floor ${i % 20 + 1}`,
}));

// ─── Page component ────────────────────────────────────────────────────────

export function TablePage() {
  const loadingState = signal(false);

  function simulateLoading() {
    loadingState.value = true;
    setTimeout(() => { loadingState.value = false; }, 2000);
  }

  return (
    <div class="nova-ui-page">
      <h1 class="nova-ui-page-title">Table</h1>
      <p class="nova-ui-page-desc">
        A powerful data grid supporting fixed columns, sorting, row selection, virtual scrolling, and massive datasets.
      </p>

      {/* ── 1. Basic Table ─────────────────────────────────────────────── */}
      <div class="nova-section">
        <h2 class="nova-section-title">Basic Table</h2>
        <div class="nova-demo-block">
          <div class="nova-demo-block-preview nova-demo-block-preview--vertical" style="width:100%;padding:0;">
            <Table
              columns={simpleColumns}
              dataSource={tableData}
            />
          </div>
          <div class="nova-demo-block-meta">
            <span class="nova-demo-block-meta-title">Simple table without scroll. Supports click-to-sort on marked columns.</span>
          </div>
        </div>
      </div>

      {/* ── 2. Fixed Columns + Scroll ──────────────────────────────────── */}
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
            <span class="nova-demo-block-meta-title">Fixed header, sticky left/right columns, horizontal + vertical scroll.</span>
          </div>
        </div>
      </div>

      {/* ── 3. Row Selection ───────────────────────────────────────────── */}
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
            <span class="nova-demo-block-meta-title">Enable checkbox selection with indeterminate "select all" header.</span>
          </div>
        </div>
      </div>

      {/* ── 4. Sizes ───────────────────────────────────────────────────── */}
      <div class="nova-section">
        <h2 class="nova-section-title">Size Variants</h2>
        <div class="nova-demo-block">
          <div class="nova-demo-block-preview nova-demo-block-preview--vertical" style="width:100%;padding:24px;gap:24px;display:flex;flex-direction:column;">
            <div>
              <p style="margin-bottom:8px;color:var(--n-text-2);font-size:var(--n-fs-sm);font-weight:600;">DEFAULT</p>
              <Table columns={simpleColumns} dataSource={tableData.slice(0, 3)} />
            </div>
            <div>
              <p style="margin-bottom:8px;color:var(--n-text-2);font-size:var(--n-fs-sm);font-weight:600;">MIDDLE</p>
              <Table columns={simpleColumns} dataSource={tableData.slice(0, 3)} size="middle" />
            </div>
            <div>
              <p style="margin-bottom:8px;color:var(--n-text-2);font-size:var(--n-fs-sm);font-weight:600;">SMALL</p>
              <Table columns={simpleColumns} dataSource={tableData.slice(0, 3)} size="small" />
            </div>
          </div>
          <div class="nova-demo-block-meta">
            <span class="nova-demo-block-meta-title">Three density levels: <code>default</code>, <code>middle</code>, <code>small</code>.</span>
          </div>
        </div>
      </div>

      {/* ── 5. Bordered ────────────────────────────────────────────────── */}
      <div class="nova-section">
        <h2 class="nova-section-title">Bordered Table</h2>
        <div class="nova-demo-block">
          <div class="nova-demo-block-preview nova-demo-block-preview--vertical" style="width:100%;padding:0;">
            <Table
              columns={simpleColumns}
              dataSource={tableData.slice(0, 4)}
              bordered={true}
            />
          </div>
          <div class="nova-demo-block-meta">
            <span class="nova-demo-block-meta-title">All cells get a visible border with <code>bordered</code> prop.</span>
          </div>
        </div>
      </div>

      {/* ── 6. Loading ─────────────────────────────────────────────────── */}
      <div class="nova-section">
        <h2 class="nova-section-title">Loading State</h2>
        <div class="nova-demo-block">
          <div class="nova-demo-block-preview nova-demo-block-preview--vertical" style="width:100%;padding:16px;gap:12px;display:flex;flex-direction:column;align-items:flex-start;">
            <Button onClick={simulateLoading}>Reload (2s)</Button>
            <div style="width:100%;">
              <Table
                columns={simpleColumns}
                dataSource={tableData}
                loading={loadingState.value}
              />
            </div>
          </div>
          <div class="nova-demo-block-meta">
            <span class="nova-demo-block-meta-title">Pass <code>loading</code> prop to show a spinner overlay on the table.</span>
          </div>
        </div>
      </div>

      {/* ── 7. Empty State ─────────────────────────────────────────────── */}
      <div class="nova-section">
        <h2 class="nova-section-title">Empty State</h2>
        <div class="nova-demo-block">
          <div class="nova-demo-block-preview nova-demo-block-preview--vertical" style="width:100%;padding:0;">
            <Table
              columns={simpleColumns}
              dataSource={[]}
              emptyText="No users found"
            />
          </div>
          <div class="nova-demo-block-meta">
            <span class="nova-demo-block-meta-title">Empty table renders a friendly placeholder with custom text.</span>
          </div>
        </div>
      </div>

      {/* ── 8. Virtual Scroll (10 000 rows) ────────────────────────────── */}
      <div class="nova-section">
        <h2 class="nova-section-title">Virtual Scroll — 10,000 rows</h2>
        <div class="nova-demo-block">
          <div class="nova-demo-block-preview nova-demo-block-preview--vertical" style="width:100%;padding:0;">
            <Table
              columns={baseColumns}
              dataSource={virtualData}
              scroll={{ x: 1350, y: 380 }}
              virtual={true}
              rowHeight={54}
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
            <span class="nova-demo-block-meta-title">60fps virtual scrolling — only visible rows render. Supports fixed columns and sorting.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
