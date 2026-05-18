import { signal } from '@nova/signals';

interface DropdownProps {
  trigger?: 'hover' | 'click';
  body?: boolean;
  menu: any;
  children: any;
  onSelect?: (key: string, itemEl: HTMLElement) => void;
}

export function Dropdown(props: DropdownProps) {
  const isOpen = signal(false);
  const triggerMode = props.trigger || 'hover';
  
  const id = `dropdown-${Math.random().toString(36).substring(2, 9)}`;
  const triggerId = `${id}-trigger`;
  const menuId = `${id}-menu`;
  
  let hideTimeout: any = null;

  function updateBodyPosition() {
    const triggerEl = document.getElementById(triggerId);
    const menuEl = document.getElementById(menuId);
    
    if (menuEl) {
      // Nếu có thuộc tính body, di chuyển menu ra ngoài body
      if (props.body && menuEl.parentElement !== document.body) {
        document.body.appendChild(menuEl);
      }
      
      // Tính toán tọa độ và gắn vào menu
      if (props.body && triggerEl) {
        const rect = triggerEl.getBoundingClientRect();
        menuEl.style.position = 'absolute';
        menuEl.style.top = `${rect.bottom + window.scrollY + 4}px`;
        menuEl.style.left = `${rect.left + window.scrollX}px`;
        menuEl.style.zIndex = '1050';
      }
    }
  }

  function open() {
    isOpen.value = true;
    setTimeout(() => {
      updateBodyPosition();
    }, 0);
  }

  function close() {
    const menuEl = document.getElementById(menuId);
    
    // Xóa triệt để HTML khỏi DOM ngay lập tức bằng lệnh thuần JS
    // Đảm bảo không bị dính trên màn hình
    if (menuEl) {
      menuEl.remove();
    }
    
    // Báo cho framework biết là đã đóng
    isOpen.value = false;
  }

  function handleMouseEnter() {
    if (triggerMode === 'hover') {
      clearTimeout(hideTimeout);
      open();
    }
  }

  function handleMouseLeave() {
    if (triggerMode === 'hover') {
      hideTimeout = setTimeout(() => {
        close();
      }, 150);
    }
  }

  function handleTriggerClick(e: MouseEvent) {
    if (triggerMode === 'click') {
      e.stopPropagation();
      if (isOpen.value) {
        close();
      } else {
        open();
      }
    }
  }

  // Xử lý sự kiện click vào item
  function handleMenuClick(e: MouseEvent) {
    e.stopPropagation(); // Ngăn chặn sự kiện click nổi bọt (bubbling) lên thẻ cha
    
    const target = e.target as HTMLElement;
    const item = target.closest('.n-dropdown-item') as HTMLElement;
    
    if (item && !item.classList.contains('n-dropdown-item--disabled')) {
      const key = item.getAttribute('data-key') || item.textContent || '';
      if (props.onSelect) {
        props.onSelect(key.trim(), item);
      }
      close();
    }
  }

  if (typeof window !== 'undefined') {
    document.addEventListener('click', (e: MouseEvent) => {
      if (triggerMode === 'click' && isOpen.value) {
        const triggerEl = document.getElementById(triggerId);
        const menuEl = document.getElementById(menuId);
        if (triggerEl && triggerEl.contains(e.target as Node)) return;
        if (menuEl && menuEl.contains(e.target as Node)) return;
        close();
      }
    });
  }

  return (
    <div 
      id={triggerId}
      class="n-dropdown" 
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleTriggerClick}
    >
      {props.children}
      
      {/* Framework sẽ tự tạo/xóa DOM element khi isOpen thay đổi */}
      {() => {
        if (!isOpen.value) return null;
        return (
          <div 
            id={menuId}
            class="n-dropdown-menu" 
            onClick={handleMenuClick}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            {props.menu}
          </div>
        );
      }}
    </div>
  );
}
