# Nova Framework - Events & Lifecycle Guide

This document provides a complete reference for all events, hooks, and reactive triggers available in the Nova framework.

---

## 1. Component Lifecycle Hooks
Import những hàm này từ `@nova/runtime`. Chúng cho phép bạn chạy mã vào các giai đoạn cụ thể của một component.

| Hook | Thời điểm chạy | Mục đích |
| :--- | :--- | :--- |
| `onMount` | Sau khi node được chèn vào DOM | Fetch dữ liệu, khởi tạo thư viện bên thứ 3 |
| `onHydrated` | Sau khi Island được hydrate xong | Logic cần tương tác (chỉ dành cho Islands) |
| `onUnmount` | Trước khi node bị xóa khỏi DOM | Dừng timer, dọn dẹp kết nối socket |
| `onCleanup` | Khi unmount hoặc trước khi effect chạy lại | Logic dọn dẹp chung (general cleanup) |
| `onAppReady` | Khi ứng dụng hoàn tất render lần đầu | Tracking, xóa splash screen, khởi tạo global plugin |

**Ví dụ:**
```tsx
import { onMount, onUnmount, onCleanup } from '@nova/runtime';

export function MyComponent() {
  onMount(() => {
    console.log("Đã mounted!");
    const timer = setInterval(() => console.log("Tick"), 1000);
    
    // Cleanup bên trong onMount
    onCleanup(() => clearInterval(timer)); 
  });

  return <div>Nội dung Component</div>;
}
```

---

## 2. Reactive Triggers (Signals)
Các sự kiện phản xạ tự động kích hoạt khi trạng thái (state) thay đổi.

| Event | Mô tả |
| :--- | :--- |
| `effect` | Chạy một side-effect mỗi khi các signals phụ thuộc thay đổi. |
| `domEffect` | Trigger nội bộ dùng để cập nhật thuộc tính DOM reactively. |
| `signal.subscribe` | Lắng nghe thủ công sự thay đổi giá trị của một signal cụ thể. |

**Ví dụ:**
```typescript
import { signal, effect } from '@nova/signals';

const count = signal(0);
effect(() => {
  console.log("Giá trị count đã đổi thành:", count.value);
});
```

---

## 3. Router & Navigation Events
Quản lý bởi `@nova/router`.

| Event | Loại | Mô tả |
| :--- | :--- | :--- |
| `canActivate` | Route Guard | Chạy **trước** khi chuyển trang. Trả về `false` để chặn hoặc `string` để redirect. |
| `resolve` | Resolver | Chạy **sau** guard nhưng **trước** khi render. Dùng để pre-fetch dữ liệu. |
| `router.subscribe` | Listener | Kích hoạt mỗi khi một lần điều hướng (navigation) thành công. |
| `router.onBeforeNavigate` | Global Hook | Chạy trước mọi lần điều hướng toàn cục. |
| `router.onAfterNavigate` | Global Hook | Chạy sau khi điều hướng thành công toàn cục. |

**Ví dụ (Guards & Resolvers):**
```typescript
router.registerRoute('pages/admin.tsx', () => import('./Admin'), [], {
  canActivate: [() => checkAuth()], // Guard
  resolve: { 
    user: () => fetchUser()        // Resolver
  }
});
```

---

## 4. Built-in Directives
Nova Compiler chuyển đổi các thuộc tính đặc biệt này thành các event handlers.

| Directive | Chuyển đổi (Transformation) |
| :--- | :--- |
| `n-router="/path"` | Thêm `href="/path"` và `onClick` với `e.preventDefault()`. |
| `n-if={signal}` | Render có điều kiện phản xạ (reactive conditional rendering). |
| `n-for="item in items"` | Render danh sách phản xạ (reactive list rendering). |

---

## 5. Hot Module Replacement (HMR)
Các sự kiện truyền qua WebSocket giữa Dev Server và Browser.

| Event | Ý nghĩa |
| :--- | :--- |
| `hmr:update` | Một file cụ thể đã đổi. Browser cố gắng hot-swap hoặc reload. |
| `hmr:reload` | Cần tải lại toàn bộ trang (Hard refresh). |

---

## 6. Standard DOM Events
Nova hỗ trợ tất cả các sự kiện chuẩn của HTML thông qua JSX.

*   **Mouse Events**: `onClick`, `onMouseEnter`, `onMouseLeave`, `onMouseDown`, `onMouseUp`.
*   **Form Events**: `onInput`, `onChange`, `onSubmit`, `onFocus`, `onBlur`.
*   **Keyboard Events**: `onKeyDown`, `onKeyUp`, `onKeyPress`.

---

## 7. Global Lifecycle Events
Quản lý bởi Runtime Core.

*   **`MutationObserver`**: Framework lắng nghe các thay đổi `childList` trên body để tự động kích hoạt `onUnmount` và hủy các signal của các node bị xóa.
*   **`window.popstate`**: Router lắng nghe sự kiện này để xử lý nút Back/Forward của trình duyệt.

---

## 8. Motion & Animation Events
Managed by `@nova/motion`. Dùng để điều khiển và phản hồi các hoạt động chuyển động.

| Event | Mô tả |
| :--- | :--- |
| `onStart` | Kích hoạt khi một hiệu ứng motion bắt đầu chạy. |
| `onComplete` | Kích hoạt khi hiệu ứng motion đã kết thúc hoàn toàn. |
| `onUpdate` | Kích hoạt liên tục trên mỗi khung hình (frame) của animation. |

**Ví dụ:**
```tsx
<div use:motion={{ 
  animate: { opacity: 1 }, 
  onComplete: () => console.log("Xong phim!") 
}}>...</div>
```

---

## 9. Plugin Lifecycle Events
Dành cho các nhà phát triển Plugin mở rộng Nova Framework. Quản lý bởi `@nova/plugins`.

| Hook | Giai đoạn | Mục đích |
| :--- | :--- | :--- |
| `beforeCompile` | Trước khi biên dịch | Chỉnh sửa source code thô (raw code) |
| `transform` | Trong khi biên dịch | Thay đổi AST hoặc can thiệp vào logic JSX |
| `afterCompile` | Sau khi biên dịch | Hậu xử lý code đã được compile (minify, inject code) |

---

## 10. Custom Events (Sự kiện tùy chỉnh)
Nova khuyến khích sử dụng các sự kiện chuẩn của trình duyệt để giao tiếp giữa các Component/Islands không có quan hệ cha con.

**Gửi sự kiện (Dispatch):**
```typescript
const notify = () => {
  window.dispatchEvent(new CustomEvent('nova:notify', { detail: { msg: 'Hello' } }));
};
```

**Lắng nghe sự kiện (Listen):**
```typescript
onMount(() => {
  const handler = (e) => console.log(e.detail.msg);
  window.addEventListener('nova:notify', handler);
  
  onCleanup(() => window.removeEventListener('nova:notify', handler));
});
```

---

## 11. Error Events (Xử lý lỗi)
Cách Nova phản hồi khi có sự cố.

| Event | Phạm vi | Mô tả |
| :--- | :--- | :--- |
| `window.onerror` | Global | Bắt các lỗi runtime chưa được xử lý trong component. |
| `unhandledrejection` | Global | Bắt các lỗi từ Promise/Async bị fail mà không có .catch(). |
