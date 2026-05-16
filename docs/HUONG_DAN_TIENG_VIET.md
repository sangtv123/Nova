# Nova Framework - Hướng Dẫn Tiếng Việt

## 📖 Mục Lục
- [Giới Thiệu](#giới-thiệu)
- [Cài Đặt](#cài-đặt)
- [Khái Niệm Cơ Bản](#khái-niệm-cơ-bản)
- [Signals - Trạng Thái Phản Ứng](#signals---trạng-thái-phản-ứng)
- [Components - Thành Phần](#components---thành-phần)
- [Định Tuyến](#định-tuyến)
- [Islands - Kiến Trúc Đảo](#islands---kiến-trúc-đảo)
- [Server-Side Rendering](#server-side-rendering)
- [Xây Dựng & Triển Khai](#xây-dựng--triển-khai)
- [Plugin](#plugin)
- [Gỡ Lỗi](#gỡ-lỗi)

---

## 🎯 Giới Thiệu

**Nova** là một framework frontend hiện đại được thiết kế để:

✨ **Nhanh** - Runtime <5kb, không Virtual DOM  
🎯 **Dễ Hiểu** - Signal-based, mô hình dễ học  
🤖 **AI-Friendly** - Kiến trúc dự đoán được  
⚡ **Hiệu Năng Cao** - Cập nhật chi tiết (granular updates)  
🏝️ **Island Architecture** - Hydration tiến bộ  

### Đặc Điểm Chính

| Tính Năng | Nova | React | Vue | Svelte |
|-----------|------|-------|-----|--------|
| Kích Thước | <5kb | 42kb | 34kb | 14kb |
| Không Virtual DOM | ✅ | ❌ | ❌ | ✅ |
| Signals | ✅ | ❌ | ✅ | ✅ |
| Islands | ✅ | ❌ | ❌ | ❌ |
| Định Tuyến Tự Động | ✅ | ⚠️ | ⚠️ | ✅ |

---

## 🚀 Cài Đặt

### Tạo Dự Án Mới

```bash
npm create nova@latest my-app
cd my-app
npm install
```

### Khởi Động Dev Server

```bash
npm run dev
```

Mở trình duyệt: **http://localhost:3000**

### Build Cho Production

```bash
npm run build
```

Output sẽ ở thư mục `dist/`

---

## 📚 Khái Niệm Cơ Bản

### 1. Signals - Trạng Thái Phản Ứng

**Signal** là một container chứa giá trị có thể thay đổi:

```typescript
import { signal } from '@nova/signals';

// Tạo signal
const count = signal(0);

// Đọc giá trị
console.log(count.value);  // 0

// Thay đổi giá trị
count.value = 1;           // Trigger cập nhật
```

### 2. Computed - Giá Trị Dẫn Xuất

**Computed** tự động tính toán lại khi phụ thuộc thay đổi:

```typescript
import { signal, computed } from '@nova/signals';

const count = signal(5);
const doubled = computed(() => count.value * 2);

console.log(doubled.value);  // 10
count.value = 10;
console.log(doubled.value);  // 20 (tự động cập nhật)
```

### 3. Effect - Hiệu Ứng Phụ

**Effect** chạy khi phụ thuộc thay đổi:

```typescript
import { signal, effect } from '@nova/signals';

const name = signal('Nova');

effect(() => {
  console.log(`Xin chào ${name.value}`);
});

name.value = 'Việt';  // Logs: "Xin chào Việt"
```

---

## 💻 Signals - Trạng Thái Phản Ứng

### Tạo Signal

```typescript
// Số
const count = signal(0);

// Chuỗi
const name = signal('Nova');

// Đối tượng
const user = signal({ name: 'An', age: 25 });

// Mảng
const items = signal([1, 2, 3]);
```

### Đọc & Ghi

```typescript
const count = signal(0);

// Đọc (tạo phụ thuộc)
console.log(count.value);

// Ghi (trigger cập nhật)
count.value = 1;

// Peek (không tạo phụ thuộc)
const value = count.peek();
```

### Computed - Giá Trị Tính Toán

```typescript
const price = signal(100);
const quantity = signal(5);

// Tính tổng tự động
const total = computed(() => price.value * quantity.value);

console.log(total.value);  // 500

price.value = 200;
console.log(total.value);  // 1000 (tự động cập nhật)
```

### Effect - Hiệu Ứng

```typescript
const count = signal(0);

// Chạy mỗi khi count thay đổi
effect(() => {
  console.log(`Count: ${count.value}`);
});

count.value = 1;  // Logs: "Count: 1"
count.value = 2;  // Logs: "Count: 2"

// Trả về hàm cleanup
effect(() => {
  const handler = () => console.log(count.value);
  window.addEventListener('click', handler);
  
  // Cleanup function
  return () => {
    window.removeEventListener('click', handler);
  };
});
```

### Batch - Cập Nhật Hàng Loạt

```typescript
import { batch } from '@nova/signals';

// Cập nhật nhiều signal cùng lúc
batch(() => {
  count.value = 1;
  name.value = 'Nova';
  age.value = 1;
  // Effects chạy 1 lần duy nhất
});
```

---

## 🎨 Components - Thành Phần

### Component Đơn Giản

```typescript
// Component không có props
function Welcome() {
  return <h1>Chào mừng đến Nova!</h1>;
}
```

### Component Với Props

```typescript
function Greeting(props: { name: string; age: number }) {
  return (
    <div>
      <p>{props.name} - {props.age} tuổi</p>
    </div>
  );
}

// Sử dụng
<Greeting name="An" age={25} />
```

### Component Interactive

```typescript
function Counter() {
  const count = signal(0);

  return (
    <div>
      <p>Số đếm: {count.value}</p>
      <button onClick={() => count.value++}>
        Tăng
      </button>
      <button onClick={() => count.value = 0}>
        Đặt lại
      </button>
    </div>
  );
}
```

### Children - Nội Dung Con

```typescript
function Card(props: { title: string; children: any }) {
  return (
    <div class="card">
      <h2>{props.title}</h2>
      <div class="content">
        {props.children}
      </div>
    </div>
  );
}

// Sử dụng
<Card title="Tiêu đề">
  <p>Nội dung thẻ</p>
  <button>Nút bấm</button>
</Card>
```

### Fragment - Nhóm Phần Tử

```typescript
function List() {
  return (
    <>
      <li>Mục 1</li>
      <li>Mục 2</li>
      <li>Mục 3</li>
    </>
  );
}
```

### Event Handlers - Xử Lý Sự Kiện

```typescript
function Form() {
  const email = signal('');

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    console.log('Email:', email.value);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email.value}
        onChange={(e) => email.value = e.target.value}
        placeholder="Nhập email"
      />
      <button type="submit">Gửi</button>
    </form>
  );
}
```

---

## 📂 Định Tuyến

### Cấu Trúc Thư Mục

Nova sử dụng **định tuyến dựa trên file**:

```
src/pages/
├── index.tsx          → /
├── about.tsx          → /about
├── contact.tsx        → /contact
└── posts/
    ├── index.tsx      → /posts
    └── [id].tsx       → /posts/:id
```

### Truy Cập Router

```typescript
import { router } from '@nova/router';

// Điều hướng
router.navigate('/about');
router.navigate('/posts/123');

// Lấy route hiện tại
const match = router.getCurrentMatch();
console.log(match?.route.path);      // '/posts/:id'
console.log(match?.params);          // { id: '123' }
console.log(match?.query);           // { sort: 'asc' }

// Lắng nghe thay đổi
router.subscribe((match) => {
  console.log('Route thay đổi:', match?.route.path);
});

// Khởi tạo (trong main.ts)
router.init();
```

### Liên Kết Điều Hướng

```typescript
export function Navigation() {
  return (
    <nav>
      <a href="/" onClick={(e) => {
        e.preventDefault();
        router.navigate('/');
      }}>
        Trang Chủ
      </a>
      <a href="/about" onClick={(e) => {
        e.preventDefault();
        router.navigate('/about');
      }}>
        Về Chúng Tôi
      </a>
    </nav>
  );
}
```

---

## 🏝️ Islands - Kiến Trúc Đảo

**Island Architecture** cho phép một phần trang được tương tác trong khi phần khác tĩnh:

### Cách Hoạt Động

```typescript
// Component tĩnh (server render)
function BlogPost(props: { title: string; content: string }) {
  return (
    <article>
      <h1>{props.title}</h1>
      <div>{props.content}</div>
    </article>
  );
}

// Component interactive (island)
function Comments() {
  const comments = signal<string[]>([]);

  return (
    <div>
      <h3>Bình Luận</h3>
      <ul>
        {comments.value.map(c => <li>{c}</li>)}
      </ul>
      <input 
        type="text"
        onKeyPress={(e) => {
          if (e.key === 'Enter') {
            comments.value = [...comments.value, e.target.value];
            e.target.value = '';
          }
        }}
      />
    </div>
  );
}

// Trang - Comments là island
export function Blog() {
  return (
    <>
      <BlogPost title="Bài viết" content="..." />
      {/* Comments được hydrate độc lập */}
      <Comments />
    </>
  );
}
```

### Lợi Ích

✅ Trang tải nhanh hơn  
✅ Chỉ hydrate những phần cần thiết  
✅ Tiết kiệm bandwidth  
✅ Performance tốt hơn  

---

## 🖥️ Server-Side Rendering

### Bật SSR

Trong `nova.config.ts`:

```typescript
export default defineConfig({
  ssr: true,
});
```

### Component SSR

```typescript
// Component này render trên server trước
export default async function App() {
  const data = signal(await fetchData());
  
  return (
    <div>
      <h1>Dữ Liệu: {data.value}</h1>
    </div>
  );
}
```

---

## 🏗️ Xây Dựng & Triển Khai

### Development

```bash
# Khởi động dev server với HMR
npm run dev

# Mở http://localhost:3000
# Chỉnh sửa tệp → Tự động cập nhật
```

### Production Build

```bash
# Build cho production
npm run build

# Xem kết quả
npm run preview
```

### Triển Khai

#### Vercel
```bash
vercel deploy
```

#### Netlify
```bash
netlify deploy --prod
```

#### Server Tĩnh
```bash
npm run build
# Upload thư mục dist/
```

---

## 🔌 Plugin

### Tạo Plugin

```typescript
import { definePlugin } from '@nova/plugins';

export default definePlugin({
  name: 'my-plugin',
  version: '1.0.0',

  // Transform mã trước compile
  beforeCompile(code, id) {
    if (id.endsWith('.special')) {
      return transformCode(code);
    }
  },

  // Transform modules
  transform(code, id) {
    return code;
  },

  // Tải module
  load(id) {
    if (id.endsWith('.data')) {
      return 'export default {}';
    }
  },
});
```

### Sử Dụng Plugin

Trong `nova.config.ts`:

```typescript
import myPlugin from './plugins/my-plugin';

export default defineConfig({
  plugins: [myPlugin],
});
```

---

## 🐛 Gỡ Lỗi

### Vấn Đề 1: Signal Không Cập Nhật

```typescript
// ❌ Sai - Mutate đối tượng
signal.value.prop = newValue;

// ✅ Đúng - Gán giá trị mới
signal.value = { ...signal.value, prop: newValue };
```

### Vấn Đề 2: HMR Không Hoạt Động

```bash
# Kiểm tra:
1. Dev server đang chạy?
2. WebSocket kết nối?
3. Không có lỗi console?

# Giải pháp:
npm run dev  # Khởi động lại
```

### Vấn Đề 3: Bundle Quá Lớn

```typescript
// Kiểm tra:
1. Có dependency không sử dụng?
2. Tree-shaking bật?
3. Dùng islands để chia code?

// Tối ưu:
npm run build  // Kiểm tra kích thước
```

### Console Logs

```typescript
// Debug signals
const count = signal(0);

effect(() => {
  console.log('Count:', count.value);
});

// Debug components
console.table({ signal: count.value });
```

---

## 📝 Ví Dụ Hoàn Chỉnh

### Counter Ứng Dụng

```typescript
import { signal, computed } from '@nova/signals';

export default function Counter() {
  const count = signal(0);
  const step = signal(1);
  const doubled = computed(() => count.value * 2);

  return (
    <div style={{ padding: '20px' }}>
      <h1>Ứng Dụng Đếm</h1>
      
      <p style={{ fontSize: '24px' }}>
        Đếm: {count.value}
      </p>
      <p>
        Gấp đôi: {doubled.value}
      </p>

      <div style={{ marginBottom: '20px' }}>
        <label>
          Bước:
          <input
            type="number"
            value={step.value}
            onChange={(e) => step.value = parseInt(e.target.value)}
          />
        </label>
      </div>

      <button onClick={() => count.value += step.value}>
        +{step.value}
      </button>
      <button onClick={() => count.value -= step.value}>
        -{step.value}
      </button>
      <button onClick={() => count.value = 0}>
        Đặt Lại
      </button>
    </div>
  );
}
```

### Todo Ứng Dụng

```typescript
import { signal, computed } from '@nova/signals';

interface Todo {
  id: number;
  text: string;
  done: boolean;
}

export default function TodoApp() {
  const todos = signal<Todo[]>([]);
  const input = signal('');
  let id = 1;

  const completedCount = computed(() =>
    todos.value.filter(t => t.done).length
  );

  const addTodo = () => {
    if (input.value.trim()) {
      todos.value = [...todos.value, {
        id: id++,
        text: input.value,
        done: false,
      }];
      input.value = '';
    }
  };

  return (
    <div>
      <h1>📝 Todo</h1>
      
      <div>
        <input
          value={input.value}
          onChange={(e) => input.value = e.target.value}
          placeholder="Nhập công việc..."
        />
        <button onClick={addTodo}>Thêm</button>
      </div>

      <p>Hoàn thành: {completedCount.value}/{todos.value.length}</p>

      <ul>
        {todos.value.map(todo => (
          <li key={todo.id}>
            <input
              type="checkbox"
              checked={todo.done}
              onChange={() => {
                todo.done = !todo.done;
                todos.value = [...todos.value];
              }}
            />
            <span style={{
              textDecoration: todo.done ? 'line-through' : 'none'
            }}>
              {todo.text}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

---

## 📚 Tài Nguyên Thêm

| Tài Nguyên | Liên Kết |
|-----------|----------|
| Tài Liệu Chính | [README.md](../README.md) |
| Bắt Đầu Nhanh | [START_HERE.md](../START_HERE.md) |
| Tham Khảo API | [API.md](./API.md) |
| Kiến Trúc | [ARCHITECTURE.md](./ARCHITECTURE.md) |
| Bảng Tham Chiếu | [QUICK_REFERENCE.md](../QUICK_REFERENCE.md) |

---

## 💡 Tips & Tricks

### Tip 1: Sử Dụng Computed Cho Giá Trị Dẫn Xuất

```typescript
// ✅ Tốt
const total = computed(() => price.value * quantity.value);

// ❌ Tệ
let total = 0;
effect(() => {
  total = price.value * quantity.value;
});
```

### Tip 2: Batch Cập Nhật Liên Quan

```typescript
// ✅ Tốt - Chạy effect 1 lần
batch(() => {
  name.value = 'Nova';
  age.value = 1;
});

// ❌ Tệ - Chạy effect 2 lần
name.value = 'Nova';
age.value = 1;
```

### Tip 3: Untrack Cho Đọc Mà Không Phụ Thuộc

```typescript
// ✅ Chỉ phụ thuộc vào 'name'
effect(() => {
  const value = untrack(() => count.value);
  console.log(name.value);
});
```

---

## ❓ FAQ

### Q: Nova so với React?
**A:** Nova dùng signals thay vì hooks, không có virtual DOM, nhẹ hơn (<5kb).

### Q: Có hỗ trợ TypeScript?
**A:** Có, strict mode bật mặc định.

### Q: Có thể dùng trong production?
**A:** Có, kiến trúc ổn định và ready.

### Q: Làm thế nào để tối ưu bundle?
**A:** Dùng islands, tree-shaking, code splitting.

### Q: SSR như thế nào?
**A:** Bật `ssr: true` trong config, Nova tự xử lý.

---

## 🚀 Bước Tiếp Theo

1. ✅ Cài đặt: `npm create nova@latest my-app`
2. ✅ Khởi chạy: `npm run dev`
3. ✅ Đọc hướng dẫn: [GETTING_STARTED.md](./GETTING_STARTED.md)
4. ✅ Thử ví dụ: `examples/counter`, `examples/todo-app`
5. ✅ Xây dựng app của bạn!

---

## 📞 Hỗ Trợ

- 📖 Tài liệu: `docs/` folder
- 💻 Ví dụ: `examples/` folder
- 🐛 Bug report: GitHub Issues
- 💬 Thảo luận: GitHub Discussions

---

**Chúc bạn lập trình vui vẻ với Nova! 🎉**

Bắt đầu từ [START_HERE.md](../START_HERE.md) →
