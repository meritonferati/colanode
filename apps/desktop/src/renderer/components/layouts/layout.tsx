import { Resizable } from 're-resizable';

import { LayoutTabs } from '@/renderer/components/layouts/layout-tabs';
import { Sidebar } from '@/renderer/components/layouts/sidebars/sidebar';
import { LayoutContext } from '@/renderer/contexts/layout';
import { useLayoutState } from '@/renderer/hooks/user-layout-state';
import { useWindowSize } from '@/renderer/hooks/use-window-size';
import { percentToNumber } from '@/shared/lib/utils';

export const Layout = () => {
  const windowSize = useWindowSize();

  const {
    activeContainer,
    sidebarMetadata,
    leftContainerMetadata,
    rightContainerMetadata,
    handleSidebarResize,
    handleMenuChange,
    handleRightContainerResize,
    handleFocus,
    handleOpen,
    handleOpenLeft,
    handleOpenRight,
    handleClose,
    handleCloseLeft,
    handleCloseRight,
    handlePreview,
    handlePreviewLeft,
    handlePreviewRight,
    handleActivateLeft,
    handleActivateRight,
  } = useLayoutState();

  const shouldDisplayLeft = leftContainerMetadata.tabs.length > 0;

  const shouldDisplayRight =
    shouldDisplayLeft && rightContainerMetadata.tabs.length > 0;

  return (
    <LayoutContext.Provider
      value={{
        open: handleOpen,
        openLeft: handleOpenLeft,
        openRight: handleOpenRight,
        close: handleClose,
        closeLeft: handleCloseLeft,
        closeRight: handleCloseRight,
        preview: handlePreview,
        previewLeft: handlePreviewLeft,
        previewRight: handlePreviewRight,
        activeTab:
          activeContainer === 'left'
            ? leftContainerMetadata.tabs.find((t) => t.active)?.id
            : rightContainerMetadata.tabs.find((t) => t.active)?.id,
      }}
    >
      <div className="w-screen min-w-screen h-screen min-h-screen flex flex-row">
        <Resizable
          as="aside"
          size={{ width: sidebarMetadata.width, height: '100vh' }}
          className="border-r border-gray-200"
          minWidth={200}
          maxWidth={500}
          enable={{
            bottom: false,
            bottomLeft: false,
            bottomRight: false,
            left: false,
            right: true,
            top: false,
            topLeft: false,
            topRight: false,
          }}
          handleClasses={{
            right: 'opacity-0 hover:opacity-100 bg-blue-300 z-30',
          }}
          handleStyles={{
            right: {
              width: '3px',
              right: '-3px',
            },
          }}
          onResize={(_, __, ref) => {
            handleSidebarResize(ref.offsetWidth);
          }}
        >
          <Sidebar
            menu={sidebarMetadata.menu}
            onMenuChange={handleMenuChange}
          />
        </Resizable>

        {shouldDisplayLeft && (
          <div className="h-full max-h-screen w-full flex-grow overflow-hidden bg-white">
            <LayoutTabs
              tabs={leftContainerMetadata.tabs}
              onFocus={() => {
                handleFocus('left');
              }}
              onClose={handleCloseLeft}
              onTabChange={handleActivateLeft}
            />
          </div>
        )}
        {shouldDisplayRight && (
          <Resizable
            as="div"
            className="h-full max-h-full min-h-full overflow-hidden border-l border-gray-200 bg-white"
            size={{ width: rightContainerMetadata.width, height: '100%' }}
            minWidth={percentToNumber(windowSize.width, 20)}
            maxWidth={percentToNumber(windowSize.width, 50)}
            enable={{
              bottom: false,
              bottomLeft: false,
              bottomRight: false,
              left: true,
              right: false,
              top: false,
              topLeft: false,
              topRight: false,
            }}
            handleClasses={{
              left: 'opacity-0 hover:opacity-100 bg-blue-300 z-30',
            }}
            handleStyles={{
              left: {
                width: '3px',
                left: '-3px',
              },
            }}
            onResize={(_, __, ref) => {
              handleRightContainerResize(ref.offsetWidth);
            }}
          >
            <LayoutTabs
              tabs={rightContainerMetadata.tabs}
              onFocus={() => {
                handleFocus('right');
              }}
              onTabChange={handleActivateRight}
              onClose={handleCloseRight}
            />
          </Resizable>
        )}
      </div>
    </LayoutContext.Provider>
  );
};
