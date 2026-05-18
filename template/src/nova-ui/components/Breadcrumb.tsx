import { Fragment, createElement } from '@nova/runtime';
import { Dropdown } from './Dropdown';

export interface BreadcrumbItemType {
  title: any;
  href?: string;
  icon?: any;
  onClick?: (e: MouseEvent) => void;
  menu?: any; // For dropdown
}

export interface BreadcrumbProps {
  items?: BreadcrumbItemType[];
  separator?: any;
  class?: string;
  style?: any;
  children?: any;
}

export function Breadcrumb(props: BreadcrumbProps) {
  const customClass = props.class ? ` ${props.class}` : '';
  const separator = props.separator !== undefined ? props.separator : '/';

  if (props.items && props.items.length > 0) {
    return (
      <nav class={`n-breadcrumb${customClass}`} style={props.style}>
        {props.items.map((item, index) => {
          const isLast = index === props.items!.length - 1;
          
          let content = (
            <span class={`n-breadcrumb-link${item.href || item.onClick ? ' n-breadcrumb-link--interactive' : ''}`} onClick={item.onClick}>
              {item.icon && <span class="n-breadcrumb-icon">{item.icon}</span>}
              <span class="n-breadcrumb-text">{item.title}</span>
            </span>
          );

          if (item.href) {
            content = (
              <a href={item.href} class="n-breadcrumb-link n-breadcrumb-link--interactive" onClick={item.onClick}>
                {item.icon && <span class="n-breadcrumb-icon">{item.icon}</span>}
                <span class="n-breadcrumb-text">{item.title}</span>
              </a>
            );
          }

          if (item.menu) {
            content = (
              <Dropdown overlay={item.menu} trigger="hover">
                {content}
              </Dropdown>
            );
          }

          return (
            <span class={`n-breadcrumb-item${isLast ? ' n-breadcrumb-item--last' : ''}`}>
              {content}
              {!isLast && <span class="n-breadcrumb-separator">{separator}</span>}
            </span>
          );
        })}
      </nav>
    );
  }

  return (
    <nav class={`n-breadcrumb${customClass}`} style={props.style}>
      {props.children}
    </nav>
  );
}

export interface BreadcrumbItemProps {
  href?: string;
  onClick?: (e: MouseEvent) => void;
  separator?: any;
  class?: string;
  style?: any;
  children?: any;
  isLast?: boolean;
}

export function BreadcrumbItem(props: BreadcrumbItemProps) {
  const customClass = props.class ? ` ${props.class}` : '';
  
  let content = (
    <span class={`n-breadcrumb-link${props.href || props.onClick ? ' n-breadcrumb-link--interactive' : ''}`} onClick={props.onClick}>
      {props.children}
    </span>
  );

  if (props.href) {
    content = (
      <a href={props.href} class="n-breadcrumb-link n-breadcrumb-link--interactive" onClick={props.onClick}>
        {props.children}
      </a>
    );
  }

  return (
    <span class={`n-breadcrumb-item${customClass}`} style={props.style}>
      {content}
      {!props.isLast && <span class="n-breadcrumb-separator">{props.separator !== undefined ? props.separator : '/'}</span>}
    </span>
  );
}
