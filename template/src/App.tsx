import { NovaUIShell } from './components/NovaUIShell';
// @ts-ignore
import { activeKey } from './nova-ui/store.ts';
import { OverviewPage }    from './pages/nova-ui/overview';
import { ButtonPage }      from './pages/nova-ui/button';
import { IconPage }        from './pages/nova-ui/icon';
import { TypographyPage }  from './pages/nova-ui/typography';
import { DividerPage }     from './pages/nova-ui/divider';
import { DropdownPage }    from './pages/nova-ui/dropdown';
import { DataEntryPage }   from './pages/nova-ui/data-entry';
import { DataDisplayPage } from './pages/nova-ui/data-display';
import { FeedbackPage }    from './pages/nova-ui/feedback';
import { AdvancedPage }    from './pages/nova-ui/advanced';
import { TablePage }       from './pages/nova-ui/table';
import { BreadcrumbPage }  from './pages/nova-ui/breadcrumb';

export function App() {
  return (
    <NovaUIShell>
      <div>
        {() => activeKey.value === 'overview' && <OverviewPage />}
        {() => activeKey.value === 'button' && <ButtonPage />}
        {() => activeKey.value === 'icon' && <IconPage />}
        {() => activeKey.value === 'typography' && <TypographyPage />}
        {() => activeKey.value === 'divider' && <DividerPage />}
        {() => activeKey.value === 'dropdown' && <DropdownPage />}
        {() => ['grid'].includes(activeKey.value) && <ButtonPage />}
        {() => ['input','select','checkbox','radio','switch','slider','datepicker','upload','form'].includes(activeKey.value) && <DataEntryPage />}
        {() => activeKey.value === 'table' && <TablePage />}
        {() => activeKey.value === 'breadcrumb' && <BreadcrumbPage />}
        {() => ['card','collapse','carousel','avatar','badge','tag','timeline','tooltip','tree'].includes(activeKey.value) && <DataDisplayPage />}
        {() => ['alert','modal','drawer','notification','message','skeleton','spin','progress'].includes(activeKey.value) && <FeedbackPage />}
        {() => ['data-grid','command','theme-builder','kanban','charts','dashboard'].includes(activeKey.value) && <AdvancedPage />}
      </div>
    </NovaUIShell>
  );
}
