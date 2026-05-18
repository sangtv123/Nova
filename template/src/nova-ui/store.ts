import { signal } from '@nova/signals';
import { router } from '@nova/router';

// Sidebar navigation structure
export const navItems = [
  {
    section: 'Getting Started',
    items: [
      { key: 'overview',    label: 'Overview',   icon: '🏠' },
      { key: 'changelog',   label: 'Changelog',  icon: '📋' },
    ]
  },
  {
    section: 'Basic',
    items: [
      { key: 'button',      label: 'Button',      icon: '🔲' },
      { key: 'icon',        label: 'Icon',        icon: '✨' },
      { key: 'typography',  label: 'Typography',  icon: '🔤' },
      { key: 'divider',     label: 'Divider',     icon: '➖' },

      { key: 'grid',        label: 'Grid / Flex', icon: '🔳' },
    ]
  },
  {
    section: 'Navigation',
    items: [

      { key: 'breadcrumb',  label: 'Breadcrumb',  icon: '🧭' },
      { key: 'tabs',        label: 'Tabs',        icon: '📑' },
      { key: 'dropdown',    label: 'Dropdown',    icon: '⬇️' },
      { key: 'pagination',  label: 'Pagination',  icon: '📄' },
      { key: 'steps',       label: 'Steps',       icon: '👣' },
    ]
  },
  {
    section: 'Data Entry',
    items: [
      { key: 'input',       label: 'Input',       icon: '📝' },
      { key: 'select',      label: 'Select',      icon: '🔽' },
      { key: 'checkbox',    label: 'Checkbox',    icon: '☑️' },
      { key: 'radio',       label: 'Radio',       icon: '🔘' },
      { key: 'switch',      label: 'Switch',      icon: '🔀' },
      { key: 'slider',      label: 'Slider',      icon: '🎚️' },
      { key: 'datepicker',  label: 'DatePicker',  icon: '📅' },
      { key: 'upload',      label: 'Upload',      icon: '📤' },
      { key: 'form',        label: 'Form',        icon: '📋' },
      { key: 'editor',      label: 'Text Editor', icon: '✍️' },
    ]
  },
  {
    section: 'Data Display',
    items: [
      { key: 'table',       label: 'Table',       icon: '📊' },
      { key: 'card',        label: 'Card',        icon: '🃏' },
      { key: 'collapse',    label: 'Collapse',    icon: '🗂️' },
      { key: 'carousel',    label: 'Carousel',    icon: '🎠' },
      { key: 'avatar',      label: 'Avatar',      icon: '👤' },
      { key: 'badge',       label: 'Badge',       icon: '🏷️' },
      { key: 'tag',         label: 'Tag',         icon: '🔖' },
      { key: 'timeline',    label: 'Timeline',    icon: '⏱️' },
      { key: 'tooltip',     label: 'Tooltip',     icon: '💬' },
      { key: 'tree',        label: 'Tree',        icon: '🌳' },
    ]
  },
  {
    section: 'Feedback',
    items: [
      { key: 'alert',       label: 'Alert',       icon: '⚠️' },
      { key: 'modal',       label: 'Modal',       icon: '🪟' },
      { key: 'drawer',      label: 'Drawer',      icon: '🗄️' },
      { key: 'notification',label: 'Notification',icon: '🔔' },
      { key: 'message',     label: 'Message',     icon: '💌' },
      { key: 'skeleton',    label: 'Skeleton',    icon: '💀' },
      { key: 'spin',        label: 'Spin',        icon: '⏳' },
      { key: 'progress',    label: 'Progress',    icon: '📈' },
    ]
  },
  {
    section: 'Advanced',
    items: [
      { key: 'data-grid',     label: 'Data Grid',       icon: '🗃️', badge: 'New' },
      { key: 'command',       label: 'Command Palette',  icon: '⌨️', badge: 'New' },
      { key: 'theme-builder', label: 'Theme Builder',    icon: '🎨', badge: 'New' },
      { key: 'kanban',        label: 'Kanban Board',     icon: '📌', badge: 'New' },
      { key: 'charts',        label: 'Charts',           icon: '📉', badge: 'New' },
      { key: 'dashboard',     label: 'Dashboard',        icon: '🖥️', badge: 'New' },
      { key: 'motion',        label: 'Motion',           icon: '🎬', badge: 'New' },
      { key: 'i18n',          label: 'i18n (Reactive)',  icon: '🌍', badge: 'New' },
    ]
  },
];

// Use Hash Routing to avoid 404 on refresh without server fallback support
const getHashKey = () => typeof window !== 'undefined' ? window.location.hash.slice(2) || 'overview' : 'overview';

export const activeKey = signal(getHashKey());
export const isDark = signal(false);
export const sidebarOpen = signal(false);

export function navigate(key: string) {
  activeKey.value = key;
  if (typeof window !== 'undefined') {
    window.location.hash = `/${key}`;
  }
  sidebarOpen.value = false;
}

// Listen to hash change for back/forward browser buttons
if (typeof window !== 'undefined') {
  window.addEventListener('hashchange', () => {
    activeKey.value = getHashKey();
  });
}

export function toggleTheme() {
  isDark.value = !isDark.value;
  document.documentElement.setAttribute('data-theme', isDark.value ? 'dark' : 'light');
}
