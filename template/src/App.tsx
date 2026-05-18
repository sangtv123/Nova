import { NovaUIShell } from './components/NovaUIShell';
// @ts-ignore
import { activeKey } from './nova-ui/store.ts';

import { OverviewPage }    from './pages/nova-ui/overview';
import { ButtonPage }      from './pages/nova-ui/button';
import { IconPage }        from './pages/nova-ui/icon';
import { TypographyPage }  from './pages/nova-ui/typography';
import { DividerPage }     from './pages/nova-ui/divider';
import { DropdownPage }    from './pages/nova-ui/dropdown';

import { InputPage }       from './pages/nova-ui/input';
import { SelectPage }      from './pages/nova-ui/select';
import { CheckboxPage }    from './pages/nova-ui/checkbox';
import { RadioPage }       from './pages/nova-ui/radio';
import { SwitchPage }      from './pages/nova-ui/switch';
import { SliderPage }      from './pages/nova-ui/slider';
import { DatepickerPage }  from './pages/nova-ui/datepicker';
import { UploadPage }      from './pages/nova-ui/upload';
import { FormPage }        from './pages/nova-ui/form';
import { EditorPage }      from './pages/nova-ui/editor';

import { TablePage }       from './pages/nova-ui/table';
import { BreadcrumbPage }  from './pages/nova-ui/breadcrumb';
import { TabsPage }        from './pages/nova-ui/tabs';
import { PaginationPage }  from './pages/nova-ui/pagination';
import { StepsPage }       from './pages/nova-ui/steps';

import { CardPage }        from './pages/nova-ui/card';
import { BadgePage }       from './pages/nova-ui/badge';
import { AvatarPage }      from './pages/nova-ui/avatar';
import { TagPage }         from './pages/nova-ui/tag';
import { CollapsePage }    from './pages/nova-ui/collapse';
import { CarouselPage }    from './pages/nova-ui/carousel';
import { TimelinePage }    from './pages/nova-ui/timeline';
import { TooltipPage }     from './pages/nova-ui/tooltip';
import { TreePage }        from './pages/nova-ui/tree';

import { AlertPage }       from './pages/nova-ui/alert';
import { ModalPage }       from './pages/nova-ui/modal';
import { DrawerPage }      from './pages/nova-ui/drawer';
import { NotificationPage }from './pages/nova-ui/notification';
import { MessagePage }     from './pages/nova-ui/message';
import { SkeletonPage }    from './pages/nova-ui/skeleton';
import { SpinPage }        from './pages/nova-ui/spin';
import { ProgressPage }    from './pages/nova-ui/progress';

import { DataGridPage }    from './pages/nova-ui/data-grid';
import { CommandPage }     from './pages/nova-ui/command';
import { ThemeBuilderPage }from './pages/nova-ui/theme-builder';
import { KanbanPage }      from './pages/nova-ui/kanban';
import { ChartsPage }      from './pages/nova-ui/charts';
import { DashboardPage }   from './pages/nova-ui/dashboard';
import { MotionPage }      from './pages/nova-ui/motion';

export function App() {
  return (
    <NovaUIShell>
      <div>
        {() => activeKey.value === 'overview' && <OverviewPage />}
        
        {() => (activeKey.value === 'button' || activeKey.value === 'grid') && <ButtonPage />}
        {() => activeKey.value === 'icon' && <IconPage />}
        {() => activeKey.value === 'typography' && <TypographyPage />}
        {() => activeKey.value === 'divider' && <DividerPage />}
        
        {() => activeKey.value === 'input' && <InputPage />}
        {() => activeKey.value === 'select' && <SelectPage />}
        {() => activeKey.value === 'checkbox' && <CheckboxPage />}
        {() => activeKey.value === 'radio' && <RadioPage />}
        {() => activeKey.value === 'switch' && <SwitchPage />}
        {() => activeKey.value === 'slider' && <SliderPage />}
        {() => activeKey.value === 'datepicker' && <DatepickerPage />}
        {() => activeKey.value === 'upload' && <UploadPage />}
        {() => activeKey.value === 'form' && <FormPage />}
        {() => activeKey.value === 'editor' && <EditorPage />}
        
        {() => activeKey.value === 'breadcrumb' && <BreadcrumbPage />}
        {() => activeKey.value === 'tabs' && <TabsPage />}
        {() => activeKey.value === 'dropdown' && <DropdownPage />}
        {() => activeKey.value === 'pagination' && <PaginationPage />}
        {() => activeKey.value === 'steps' && <StepsPage />}
        
        {() => activeKey.value === 'table' && <TablePage />}
        {() => activeKey.value === 'card' && <CardPage />}
        {() => activeKey.value === 'collapse' && <CollapsePage />}
        {() => activeKey.value === 'carousel' && <CarouselPage />}
        {() => activeKey.value === 'avatar' && <AvatarPage />}
        {() => activeKey.value === 'badge' && <BadgePage />}
        {() => activeKey.value === 'tag' && <TagPage />}
        {() => activeKey.value === 'timeline' && <TimelinePage />}
        {() => activeKey.value === 'tooltip' && <TooltipPage />}
        {() => activeKey.value === 'tree' && <TreePage />}
        
        {() => activeKey.value === 'alert' && <AlertPage />}
        {() => activeKey.value === 'modal' && <ModalPage />}
        {() => activeKey.value === 'drawer' && <DrawerPage />}
        {() => activeKey.value === 'notification' && <NotificationPage />}
        {() => activeKey.value === 'message' && <MessagePage />}
        {() => activeKey.value === 'skeleton' && <SkeletonPage />}
        {() => activeKey.value === 'spin' && <SpinPage />}
        {() => activeKey.value === 'progress' && <ProgressPage />}
        
        {() => activeKey.value === 'data-grid' && <DataGridPage />}
        {() => activeKey.value === 'command' && <CommandPage />}
        {() => activeKey.value === 'theme-builder' && <ThemeBuilderPage />}
        {() => activeKey.value === 'kanban' && <KanbanPage />}
        {() => activeKey.value === 'charts' && <ChartsPage />}
        {() => activeKey.value === 'dashboard' && <DashboardPage />}
        {() => activeKey.value === 'motion' && <MotionPage />}
      </div>
    </NovaUIShell>
  );
}
