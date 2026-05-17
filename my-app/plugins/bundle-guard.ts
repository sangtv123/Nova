import { definePlugin } from '@nova/plugins';
import fs from 'fs';
import path from 'path';

export interface BundleGuardOptions {
  maxSizeKb?: number;      // Kích thước tối đa cho phép của mỗi file (KB) - mặc định: 5 KB
  failOnError?: boolean;   // Có tự động dừng build (crash) nếu phát hiện file quá dung lượng không
}

export const bundleGuardPlugin = (options: BundleGuardOptions = {}) => {
  const maxSize = (options.maxSizeKb || 5) * 1024; // chuyển đổi sang Bytes
  const failOnError = options.failOnError ?? false;

  return definePlugin({
    name: 'nova-bundle-guard',
    version: '1.0.0',

    /**
     * Hook: afterBuild
     * Chạy ngay sau khi build thành công để phân tích các tệp thành phẩm.
     */
    afterBuild(ctx) {
      const outDir = ctx.config.outDir || 'dist';
      const outPath = path.resolve(outDir);

      if (!fs.existsSync(outPath)) {
        console.warn(`⚠️ [Bundle-Guard] Không tìm thấy thư mục đầu ra: ${outPath}`);
        return;
      }

      console.log('\n🛡️ [Bundle-Guard] Đang bắt đầu kiểm tra & kiểm định kích thước Bundle thành phẩm...');
      
      const files = fs.readdirSync(outPath);
      const jsFiles = files.filter(f => f.endsWith('.js'));
      const cssFiles = files.filter(f => f.endsWith('.css'));
      const allAssets = [...jsFiles, ...cssFiles];

      const reportData: Array<{
        name: string;
        sizeBytes: number;
        status: 'PASS' | 'WARN' | 'FAIL';
        limitBytes: number;
      }> = [];

      let hasViolation = false;

      allAssets.forEach(file => {
        const filePath = path.join(outPath, file);
        const stats = fs.statSync(filePath);
        const size = stats.size;
        
        let status: 'PASS' | 'WARN' | 'FAIL' = 'PASS';
        if (size > maxSize) {
          status = 'FAIL';
          hasViolation = true;
        } else if (size > maxSize * 0.8) { // Cảnh báo từ 80% kích thước tối đa
          status = 'WARN';
        }

        reportData.push({
          name: file,
          sizeBytes: size,
          status,
          limitBytes: maxSize
        });
      });

      // 1. Hiển thị báo cáo CLI đẹp mắt ngay tại Console
      console.log('\n📊 BÁO CÁO KIỂM ĐỊNH KÍCH THƯỚC BUNDLE 📊');
      console.log('═'.repeat(74));
      console.log(`| ${'Tên tệp (File Name)'.padEnd(30)} | ${'Kích thước'.padEnd(12)} | ${'Giới hạn'.padEnd(12)} | Trạng thái |`);
      console.log('═'.repeat(74));

      reportData.forEach(row => {
        const sizeKb = `${(row.sizeBytes / 1024).toFixed(2)} KB`;
        const limitKb = `${(row.limitBytes / 1024).toFixed(2)} KB`;
        let statusStr = '🟢 PASS';
        if (row.status === 'FAIL') {
          statusStr = '🔴 FAIL';
        } else if (row.status === 'WARN') {
          statusStr = '🟡 WARN';
        }
        console.log(`| ${row.name.padEnd(30)} | ${sizeKb.padEnd(12)} | ${limitKb.padEnd(12)} | ${statusStr.padEnd(10)} |`);
      });
      console.log('═'.repeat(74));

      // 2. Tự động sinh file HTML Dashboard Visual Báo cáo Cực Đẹp
      const htmlReportPath = path.join(outPath, 'bundle-report.html');
      const htmlContent = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nova Audit Report - Bundle Guard</title>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&family=Inter:wght@400;500;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #0b0d13;
      --card-bg: rgba(255, 255, 255, 0.02);
      --border: rgba(255, 255, 255, 0.08);
      --text: #f3f4f6;
      --primary: #8b5cf6;
      --primary-gradient: linear-gradient(135deg, #a78bfa, #8b5cf6, #3b82f6);
      --success: #10b981;
      --warning: #f59e0b;
      --error: #ef4444;
    }
    body {
      background-color: var(--bg);
      color: var(--text);
      font-family: 'Outfit', 'Inter', sans-serif;
      margin: 0;
      padding: 3rem 2rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      min-height: 100vh;
      overflow-x: hidden;
    }
    .container {
      max-width: 1100px;
      width: 100%;
    }
    .header {
      text-align: center;
      margin-bottom: 4rem;
      position: relative;
    }
    .header h1 {
      font-size: 3.5rem;
      font-weight: 800;
      margin: 0;
      background: var(--primary-gradient);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      letter-spacing: -1.5px;
    }
    .header p {
      color: #9ca3af;
      margin-top: 0.8rem;
      font-size: 1.2rem;
      font-weight: 300;
    }
    .summary-card {
      background: linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(59, 130, 246, 0.08));
      border: 1px solid rgba(139, 92, 246, 0.2);
      border-radius: 24px;
      padding: 2.5rem;
      margin-bottom: 3.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      backdrop-filter: blur(12px);
      gap: 2rem;
    }
    .summary-info h2 {
      font-size: 1.8rem;
      font-weight: 700;
      margin: 0 0 0.5rem 0;
    }
    .summary-info p {
      color: #9ca3af;
      margin: 0;
      font-size: 1rem;
    }
    .summary-stats {
      display: flex;
      gap: 3rem;
    }
    .stat-item {
      text-align: center;
    }
    .stat-num {
      font-size: 3rem;
      font-weight: 800;
      line-height: 1;
      margin-bottom: 0.5rem;
    }
    .stat-lbl {
      font-size: 0.75rem;
      color: #9ca3af;
      text-transform: uppercase;
      font-weight: 600;
      letter-spacing: 1.5px;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1.8rem;
    }
    .card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 20px;
      padding: 1.8rem;
      backdrop-filter: blur(8px);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .card:hover {
      transform: translateY(-6px);
      border-color: rgba(255, 255, 255, 0.16);
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    }
    .card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 5px;
    }
    .card.pass::before { background: var(--success); }
    .card.warn::before { background: var(--warning); }
    .card.fail::before { background: var(--error); }
    
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.2rem;
    }
    .card-title {
      font-size: 1.15rem;
      font-weight: 600;
      word-break: break-all;
      color: #e5e7eb;
    }
    .card-size {
      font-size: 2.5rem;
      font-weight: 800;
      letter-spacing: -0.5px;
      margin: 0.5rem 0 1.2rem 0;
    }
    .card-meta {
      font-size: 0.85rem;
      color: #9ca3af;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
      padding-top: 1rem;
      display: flex;
      justify-content: space-between;
    }
    .badge {
      display: inline-block;
      padding: 0.3rem 0.6rem;
      border-radius: 9999px;
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .badge.pass { background: rgba(16, 185, 129, 0.12); color: var(--success); }
    .badge.warn { background: rgba(245, 158, 11, 0.12); color: var(--warning); }
    .badge.fail { background: rgba(239, 68, 68, 0.12); color: var(--error); }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🛡️ Nova Bundle Audit</h1>
      <p>Hệ thống giám sát và bảo mật kích thước tài nguyên sau đóng gói</p>
    </div>

    <div class="summary-card">
      <div class="summary-info">
        <h2>Phân tích kích thước tài nguyên</h2>
        <p>Giới hạn được cài đặt: <b>${(maxSize / 1024).toFixed(1)} KB</b> mỗi tệp</p>
      </div>
      <div class="summary-stats">
        <div class="stat-item">
          <div class="stat-num" style="color: var(--primary);">${allAssets.length}</div>
          <div class="stat-lbl">Tổng số tệp</div>
        </div>
        <div class="stat-item">
          <div class="stat-num" style="color: var(--success);">${reportData.filter(r => r.status === 'PASS').length}</div>
          <div class="stat-lbl">Đạt chuẩn</div>
        </div>
        <div class="stat-item">
          <div class="stat-num" style="color: ${hasViolation ? 'var(--error)' : 'var(--success)'}">${reportData.filter(r => r.status === 'FAIL').length}</div>
          <div class="stat-lbl">Vượt mức</div>
        </div>
      </div>
    </div>

    <div class="grid">
      ${reportData.map(row => `
        <div class="card ${row.status.toLowerCase()}">
          <div>
            <div class="card-header">
              <span class="badge ${row.status.toLowerCase()}">${row.status}</span>
              <span style="font-size: 0.8rem; color: #6b7280; font-weight: 500;">.${row.name.split('.').pop()?.toUpperCase()}</span>
            </div>
            <div class="card-title">${row.name}</div>
          </div>
          <div>
            <div class="card-size" style="color: var(--${row.status === 'FAIL' ? 'error' : row.status === 'WARN' ? 'warning' : 'text'})">
              ${(row.sizeBytes / 1024).toFixed(2)} <span style="font-size: 1.1rem; font-weight: 500; color: #6b7280;">KB</span>
            </div>
            <div class="card-meta">
              <span>Hạn mức: ${(row.limitBytes / 1024).toFixed(1)} KB</span>
              <span>${row.sizeBytes.toLocaleString()} B</span>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  </div>
</body>
</html>
      `;

      fs.writeFileSync(htmlReportPath, htmlContent, 'utf-8');
      console.log(`🛡️  [Bundle-Guard] Đã xuất bản báo cáo tương tác tuyệt đẹp tại: ${htmlReportPath}`);

      if (hasViolation && failOnError) {
        console.error('❌ [Bundle-Guard] Lỗi nghiêm trọng: Kích thước bundle vượt giới hạn cho phép! Hủy bỏ build.');
        process.exit(1);
      }
    }
  });
};
