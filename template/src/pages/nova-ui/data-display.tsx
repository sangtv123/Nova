import { signal } from '@nova/signals';
import { Card, CardMeta } from '../../nova-ui/components/Card';
import { Tag } from '../../nova-ui/components/Tag';
import { Button } from '../../nova-ui/components/Button';
import { Avatar, AvatarGroup } from '../../nova-ui/components/Avatar';
import { Badge } from '../../nova-ui/components/Badge';
import { Table, TableColumn } from '../../nova-ui/components/Table';

const columns: TableColumn[] = [
  { key: 'name', title: 'Name', dataIndex: 'name', width: 200 },
  { key: 'age', title: 'Age', dataIndex: 'age', width: 100 },
  { key: 'role', title: 'Role', dataIndex: 'role', width: 150, render: (r: any) => <Tag>{r}</Tag> },
  { 
    key: 'status', 
    title: 'Status', 
    dataIndex: 'status',
    width: 150,
    render: (s: any) => <Tag type={s === 'Active' ? 'success' : s === 'Inactive' ? 'error' : 'warning'}>{s}</Tag> 
  },
  { 
    key: 'action', 
    title: 'Action', 
    render: () => (
      <div style="display: flex; gap: 8px;">
        <Button type="link" size="small">Edit</Button>
        <Button type="text" size="small" danger>Delete</Button>
      </div>
    ) 
  }
];

const tableData = [
  { key: '1', name: 'John Brown',   age: 32, role: 'Admin',    status: 'Active' },
  { key: '2', name: 'Jane Smith',   age: 28, role: 'Editor',   status: 'Active' },
  { key: '3', name: 'Bob Johnson',  age: 45, role: 'Viewer',   status: 'Inactive' },
  { key: '4', name: 'Alice Wang',   age: 23, role: 'Admin',    status: 'Active' },
  { key: '5', name: 'Tom Davis',    age: 37, role: 'Editor',   status: 'Pending' },
  { key: '6', name: 'Charlie Lee',  age: 41, role: 'Admin',    status: 'Active' },
  { key: '7', name: 'Diana Prince', age: 29, role: 'Viewer',   status: 'Active' },
];

const virtualData = Array.from({ length: 10000 }).map((_, i) => ({
  key: i.toString(),
  name: `User ${i}`,
  age: 20 + (i % 30),
  role: i % 2 === 0 ? 'Admin' : 'Editor',
  status: i % 3 === 0 ? 'Inactive' : 'Active'
}));

export function DataDisplayPage() {
  const openCollapse = signal<string[]>(['1']);
  const carouselIdx = signal(0);

  const slides = [
    { bg: 'linear-gradient(135deg,#1677ff,#722ed1)', label: 'Slide 1 — Nova UI' },
    { bg: 'linear-gradient(135deg,#52c41a,#13c2c2)', label: 'Slide 2 — Components' },
    { bg: 'linear-gradient(135deg,#fa8c16,#eb2f96)', label: 'Slide 3 — Open Source' },
  ];

  function toggleCollapse(key: string) {
    const v = openCollapse.value;
    openCollapse.value = v.includes(key) ? v.filter(k => k !== key) : [...v, key];
  }

  return (
    <div class="nova-ui-page">
      <h1 class="nova-ui-page-title">Data Display</h1>
      <p class="nova-ui-page-desc">Table, Card, Collapse, Carousel, Avatar, Badge, Tag, Timeline, Tooltip, Tree.</p>

      {/* Table */}
      <div class="nova-section">
        <h2 class="nova-section-title">Table (Scroll & Virtual)</h2>
        <div class="nova-demo-block">
          <div class="nova-demo-block-preview nova-demo-block-preview--vertical" style="width:100%;padding:0">
            <h3 style="padding: 16px; margin: 0; font-size: 16px; color: var(--n-text-1);">Standard ScrollView Table</h3>
            <Table 
              columns={columns} 
              dataSource={tableData} 
              scroll={{ y: 200 }} 
            />
            
            <h3 style="padding: 16px; margin: 0; font-size: 16px; border-top: 1px solid var(--n-border); color: var(--n-text-1);">VirtualView Table (10,000 rows)</h3>
            <Table 
              columns={columns} 
              dataSource={virtualData} 
              scroll={{ y: 300 }} 
              virtual={true}
              rowHeight={54}
            />
            
            <div class="n-table-pagination" style="border-top: 1px solid var(--n-border);">
              <span style="color:var(--n-text-2);font-size:var(--n-fs-sm)">Total 10,000 items</span>
              <div class="n-pagination">
                <div class="n-pagination-item n-pagination-item--prev">‹</div>
                <div class="n-pagination-item n-pagination-item--active">1</div>
                <div class="n-pagination-item">2</div>
                <div class="n-pagination-item">3</div>
                <div class="n-pagination-item n-pagination-item--next">›</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Card, Avatar, Badge, Tag */}
      <div class="nova-section">
        <h2 class="nova-section-title">Card, Avatar, Badge, Tag</h2>
        <div class="nova-demo-block">
          <div class="nova-demo-block-preview" style="gap:var(--n-lg);flex-wrap:wrap;align-items:flex-start">

            {/* Card */}
            <Card
              style="width:240px"
              cover={<div style="height:120px;background:linear-gradient(135deg,#1677ff,#722ed1)"></div>}
              actions={[
                <span>👍 Like</span>,
                <span>💬 Comment</span>,
                <span>↗ Share</span>
              ]}
            >
              <CardMeta
                avatar="JD"
                title="John Doe"
                description="Frontend Engineer"
              />
            </Card>

            {/* Avatars & Tags */}
            <div style="display:flex;flex-direction:column;gap:var(--n-md)">
              <AvatarGroup>
                <Avatar size="large" style="background:#1677ff">A</Avatar>
                <Avatar size="large" style="background:#722ed1">B</Avatar>
                <Avatar size="large" style="background:#52c41a">C</Avatar>
                <Avatar size="large" style="background:var(--n-border);color:var(--n-text-2)">+5</Avatar>
              </AvatarGroup>
              
              <div style="display:flex;gap:var(--n-sm);align-items:center">
                <Badge count={5}>
                  <Avatar size="large" style="background:#fa8c16">N</Avatar>
                </Badge>
                <Badge dot status="processing">
                  <Avatar size="large" style="background:#eb2f96">P</Avatar>
                </Badge>
              </div>
              
              <div style="display:flex;gap:var(--n-xs);flex-wrap:wrap">
                <Tag>Default</Tag>
                <Tag type="primary">Primary</Tag>
                <Tag type="success">Success</Tag>
                <Tag type="warning">Warning</Tag>
                <Tag type="error">Error</Tag>
                <Tag type="processing">Live</Tag>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Collapse */}
      <div class="nova-section">
        <h2 class="nova-section-title">Collapse</h2>
        <div class="nova-demo-block">
          <div class="nova-demo-block-preview nova-demo-block-preview--vertical" style="width:100%;padding:0">
            <div class="n-collapse" style="width:100%">
              {[
                { key:'1', title:'Panel 1 — What is Nova UI?', content:'Nova UI is an enterprise-class component library built on the Nova framework, providing 50+ production-ready components.' },
                { key:'2', title:'Panel 2 — SCSS Architecture', content:'Nova UI uses a modular SCSS architecture with design tokens, mixins, and component-scoped partials for maximum maintainability.' },
                { key:'3', title:'Panel 3 — Signals-Powered', content:'Every interactive component leverages Nova\'s fine-grained signals system for optimal rendering performance.' },
              ].map(p => (
                <div class={() => `n-collapse-item${openCollapse.value.includes(p.key) ? ' n-collapse-item--active' : ''}`}>
                  <div class="n-collapse-header" onClick={() => toggleCollapse(p.key)}>
                    <span>{p.title}</span>
                    <span class="n-collapse-arrow">▶</span>
                  </div>
                  {() => openCollapse.value.includes(p.key) && (
                    <div class="n-collapse-content">
                      <div class="n-collapse-content-inner">{p.content}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Carousel */}
      <div class="nova-section">
        <h2 class="nova-section-title">Carousel</h2>
        <div class="nova-demo-block">
          <div class="nova-demo-block-preview nova-demo-block-preview--vertical" style="width:100%;padding:0">
            <div class="n-carousel" style="height:200px;width:100%">
              <div class="n-carousel-track" style={() => ({ transform: `translateX(-${carouselIdx.value * 100}%)` })}>
                {slides.map(s => (
                  <div class="n-carousel-slide" style={`background:${s.bg};display:flex;align-items:center;justify-content:center;color:#fff;font-size:var(--n-fs-xl);font-weight:700`}>
                    {s.label}
                  </div>
                ))}
              </div>
              <button class="n-carousel-arrow n-carousel-arrow--prev"
                onClick={() => { carouselIdx.value = Math.max(0, carouselIdx.value - 1); }}>‹</button>
              <button class="n-carousel-arrow n-carousel-arrow--next"
                onClick={() => { carouselIdx.value = Math.min(slides.length - 1, carouselIdx.value + 1); }}>›</button>
              <div class="n-carousel-dots">
                {slides.map((_, i) => (
                  <div class={() => `n-carousel-dot${carouselIdx.value === i ? ' n-carousel-dot--active' : ''}`}
                    onClick={() => { carouselIdx.value = i; }}></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div class="nova-section">
        <h2 class="nova-section-title">Timeline</h2>
        <div class="nova-demo-block">
          <div class="nova-demo-block-preview nova-demo-block-preview--vertical" style="padding:var(--n-2xl)">
            <ul class="n-timeline">
              {[
                { label:'2026-01-01', title:'Project Kickoff',   type:'',        desc:'Nova UI development started.' },
                { label:'2026-02-15', title:'Alpha Release',     type:'success', desc:'First alpha with 20 components.' },
                { label:'2026-04-01', title:'Beta Release',      type:'',        desc:'Full component coverage, SCSS.' },
                { label:'2026-05-17', title:'v1.0 Launch 🎉',    type:'success', desc:'Production ready.' },
              ].map(e => (
                <li class={`n-timeline-item n-timeline-item--${e.type || 'default'}`}>
                  <div class="n-timeline-item-tail"></div>
                  <div class="n-timeline-item-dot"></div>
                  <div class="n-timeline-item-content">
                    <div class="n-timeline-item-label">{e.label}</div>
                    <strong>{e.title}</strong>
                    <div style="color:var(--n-text-2);font-size:var(--n-fs-sm)">{e.desc}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
