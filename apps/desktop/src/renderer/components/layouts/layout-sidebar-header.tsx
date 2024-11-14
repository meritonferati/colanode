import React from 'react';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { Avatar } from '@/renderer/components/avatars/avatar';
import { useAccount } from '@/renderer/contexts/account';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/renderer/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/renderer/components/ui/sidebar';
import { ChevronsUpDown, Settings, Plus, Bell } from 'lucide-react';
import { useRadar } from '@/renderer/contexts/radar';

interface WorkspaceStateIndicatorProps {
  importantCount: number;
  hasUnseenChanges: boolean;
}

const WorkspaceStateIndicator = ({
  importantCount,
  hasUnseenChanges,
}: WorkspaceStateIndicatorProps) => {
  return (
    <React.Fragment>
      {importantCount > 0 && (
        <span className="mr-1 rounded-md px-1 py-0.5 text-xs bg-red-400 text-white">
          {importantCount}
        </span>
      )}
      {importantCount === 0 && hasUnseenChanges && (
        <span className="size-2 rounded-full bg-red-500" />
      )}
    </React.Fragment>
  );
};

export const LayoutSidebarHeader = () => {
  const workspace = useWorkspace();
  const account = useAccount();
  const navigate = useNavigate();
  const sidebar = useSidebar();
  const radar = useRadar();

  const [open, setOpen] = React.useState(false);
  const otherWorkspaces = account.workspaces.filter(
    (w) => w.id !== workspace.id
  );
  const otherWorkspaceStates = otherWorkspaces.map((w) =>
    radar.getWorkspaceState(w.userId)
  );
  const importantCount = otherWorkspaceStates.reduce(
    (acc, curr) => acc + curr.importantCount,
    0
  );
  const hasUnseenChanges = otherWorkspaceStates.some((w) => w.hasUnseenChanges);

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="focus-visible:outline-none focus-visible:ring-0 data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <Avatar
                  id={workspace.id}
                  avatar={workspace.avatar}
                  name={workspace.name}
                  className="h-full w-full"
                />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{workspace.name}</span>
                <span className="truncate text-xs">Free Plan</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
              <WorkspaceStateIndicator
                importantCount={importantCount}
                hasUnseenChanges={hasUnseenChanges}
              />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-80 rounded-lg"
            align="start"
            side={sidebar.isMobile ? 'bottom' : 'right'}
            sideOffset={4}
          >
            <DropdownMenuItem key={workspace.id} className="p-0">
              <div className="w-full flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar
                  className="h-8 w-8 rounded-lg"
                  id={workspace.id}
                  name={workspace.name}
                  avatar={workspace.avatar}
                />
                <p className="flex-1 text-left text-sm leading-tight truncate font-semibold">
                  {workspace.name}
                </p>
              </div>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-2 p-2"
              onClick={() => {
                workspace.openSettings();
              }}
            >
              <Settings className="size-4" />
              <p className="font-medium">Settings</p>
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2 p-2" disabled={true}>
              <Bell className="size-4" />
              <p className="font-medium">Notifications</p>
            </DropdownMenuItem>
            {otherWorkspaces.length > 0 && (
              <React.Fragment>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="mb-1">
                  Other workspaces
                </DropdownMenuLabel>
                {otherWorkspaces.map((otherWorkspace) => {
                  const workspaceState = radar.getWorkspaceState(
                    otherWorkspace.userId
                  );
                  return (
                    <DropdownMenuItem
                      key={otherWorkspace.id}
                      className="p-0"
                      onClick={() => {
                        navigate(`/${account.id}/${otherWorkspace.id}`);
                      }}
                    >
                      <div className="w-full flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                        <Avatar
                          className="h-8 w-8 rounded-lg"
                          id={otherWorkspace.id}
                          name={otherWorkspace.name}
                          avatar={otherWorkspace.avatar}
                        />
                        <p className="flex-1 text-left text-sm leading-tight truncate font-normal">
                          {otherWorkspace.name}
                        </p>
                        <WorkspaceStateIndicator
                          importantCount={workspaceState.importantCount}
                          hasUnseenChanges={workspaceState.hasUnseenChanges}
                        />
                      </div>
                    </DropdownMenuItem>
                  );
                })}
              </React.Fragment>
            )}
            <DropdownMenuSeparator className="my-1" />
            <DropdownMenuItem
              className="gap-2 p-2 text-muted-foreground hover:text-foreground"
              onClick={() => {
                navigate(`/${account.id}/create`);
              }}
            >
              <Plus className="size-4" />
              <p className="font-medium">Create workspace</p>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
};
