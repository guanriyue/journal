import { EditorView } from 'prosemirror-view';
import {
  TableMenuProvider as TableMenuProviderIml,
  TableMenuStoreState,
} from './store';
import { useEffect, useMemo, useRef } from 'react';
import { createStore } from 'zustand';
import {
  insertColumn,
  insertRow,
  removeColumn,
  removeRow,
  selectColumn,
  selectRow,
} from '../commands';
import { registerPlugin } from '@journal/prosemirror-utils';
import {
  EditorEventProvider,
  useEditorEventListener,
} from '@journal/prosemirror-event-provider';
import { interactiveTable, InteractiveTableOptions } from '../plugin';
import { omit } from 'lodash-es';
import { OperationArea } from './OperationArea';
import { isCellSelection } from '../utils';
import { useAsRef } from '@journal/react-hooks';

export interface TableMenuProps
  extends Pick<
    InteractiveTableOptions,
    | 'cellMinWidth'
    | 'defaultCellMinWidth'
    | 'resizeHandleWidth'
    | 'lastColumnResizable'
  > {
  view: EditorView;

  insertHandleSize?: number;

  popoverContainer?:
    | Element
    | null
    | undefined
    | (() => Element | null | undefined);

  children?: React.ReactNode;
}

const TableMenuProviderImpl = (props: TableMenuProps) => {
  const {
    view,
    insertHandleSize = 16,
    cellMinWidth,
    defaultCellMinWidth,
    resizeHandleWidth,
    lastColumnResizable,
    popoverContainer,
    children,
  } = props;

  const initialInsertHandleSize = useRef(insertHandleSize);
  const popoverContainerRef = useAsRef(popoverContainer);

  const store = useMemo(() => {
    return createStore<TableMenuStoreState>((set) => {
      return {
        view,
        operationAreas: {},
        insertHandleSize: initialInsertHandleSize.current,
        insertColumnAnchor: undefined,
        insertRowAnchor: undefined,
        menuAnchor: undefined,
        menuType: undefined,

        getPopoverContainer: () => {
          const container = popoverContainerRef.current;
          if (!container) {
            return document.body;
          }

          if (typeof container === 'function') {
            return container() || document.body;
          }

          return container;
        },

        selectColumn: (pos, columnIndex, event) => {
          if (
            selectColumn(pos, columnIndex)(view.state, view.dispatch, view) &&
            event
          ) {
            event.preventDefault();
            const el = event.target;
            if (el instanceof HTMLElement) {
              set({ menuAnchor: el, menuType: 'column' });
            }
          }
        },
        selectRow: (pos, rowIndex, event) => {
          if (
            selectRow(pos, rowIndex)(view.state, view.dispatch, view) &&
            event
          ) {
            event.preventDefault();
            const el = event.target;
            if (el instanceof HTMLElement) {
              set({ menuAnchor: el, menuType: 'row' });
            }
          }
        },
        insertColumn: (pos, columnIndex) => {
          if (insertColumn(pos, columnIndex)(view.state, view.dispatch, view)) {
            view.focus();
          }
        },
        insertRow: (pos, rowIndex) => {
          if (insertRow(pos, rowIndex)(view.state, view.dispatch, view)) {
            view.focus();
          }
        },
        removeColumn: (pos, rowIndex) => {
          if (removeColumn(pos, rowIndex)(view.state, view.dispatch, view)) {
            view.focus();
          }
        },
        removeRow: (pos, columnIndex) => {
          if (removeRow(pos, columnIndex)(view.state, view.dispatch, view)) {
            view.focus();
          }
        },
        setInsertColumnAnchor: (anchor) => {
          set((prev) =>
            prev.insertColumnAnchor === anchor
              ? prev
              : { insertColumnAnchor: anchor },
          );
        },
        setInsertRowAnchor: (anchor) => {
          set((prev) =>
            prev.insertRowAnchor === anchor
              ? prev
              : { insertRowAnchor: anchor },
          );
        },
      };
    });
  }, [popoverContainerRef, view]);

  useEffect(() => {
    const plugin = interactiveTable({
      cellMinWidth,
      defaultCellMinWidth,
      resizeHandleWidth,
      lastColumnResizable,
      operationAreaRender: ({ id, ...areaProps }) => {
        const dom = document.createElement('div');
        dom.setAttribute('data-table-operation-area', '');

        return {
          dom,
          mount: () => {
            store.setState({
              operationAreas: {
                ...store.getState().operationAreas,
                [id]: {
                  id,
                  dom,
                  ...areaProps,
                },
              },
            });
          },
          unmount: () => {
            const currentAreas = store.getState().operationAreas;
            store.setState({
              operationAreas: omit(currentAreas, id),
            });
          },
        };
      },
    });

    return registerPlugin(view, [plugin], 'head');
  }, [
    cellMinWidth,
    defaultCellMinWidth,
    resizeHandleWidth,
    lastColumnResizable,
    store,
    view,
  ]);

  useEffect(() => {
    store.setState((prev) =>
      prev.insertHandleSize === insertHandleSize ? prev : { insertHandleSize },
    );
  }, [store, insertHandleSize]);

  const listen = useEditorEventListener();

  useEffect(() => {
    let isPointerDown = false;
    let resolveMenuOnPointerUp = false;

    const resolveMenuState = () => {
      const selection = view.state.selection;
      if (!isCellSelection(selection)) {
        store.setState((prev) => {
          return prev.menuAnchor === undefined && prev.menuType === undefined
            ? prev
            : {
                menuAnchor: undefined,
                menuType: undefined,
              };
        });
        return;
      }

      if (!store.getState().menuAnchor) {
        store.setState((prev) => {
          return prev.menuType === 'cell' ? prev : { menuType: 'cell' };
        });
      }
    };

    const handlePointerDown = () => {
      isPointerDown = true;
    };

    const handlePointerUp = () => {
      isPointerDown = false;

      if (resolveMenuOnPointerUp) {
        resolveMenuOnPointerUp = false;
        resolveMenuState();
      }
    };

    const stopListenSelectionUpdate = listen('selectionUpdate', () => {
      if (isPointerDown) {
        resolveMenuOnPointerUp = true;

        store.setState((prev) => {
          return prev.menuAnchor === undefined && prev.menuType === undefined
            ? prev
            : {
                menuAnchor: undefined,
                menuType: undefined,
              };
        });
      } else {
        resolveMenuState();
      }
    });

    view.dom.addEventListener('pointerdown', handlePointerDown);
    view.dom.addEventListener('pointerup', handlePointerUp);

    return () => {
      stopListenSelectionUpdate();
      view.dom.removeEventListener('pointerdown', handlePointerDown);
      view.dom.removeEventListener('pointerup', handlePointerUp);
    };
  }, [listen, store, view]);

  useEffect(() => {
    return listen('docChanged', () => {
      store.setState((prev) => {
        return prev.menuType
          ? { menuType: undefined, menuAnchor: undefined }
          : prev;
      });
    });
  }, [listen, store]);

  return (
    <TableMenuProviderIml value={store}>
      <OperationArea />
      {children}
    </TableMenuProviderIml>
  );
};

TableMenuProviderImpl.displayName = 'TableMenuProviderImpl' as const;

/**
 * 表格菜单的根节点
 *
 * structure:
 * ```
 * <TableMenu>
 *   <TableColumnMenu>
 *     <TableMergeCells />
 *     <TableRemoveColumn />
 *   </TableColumnMenu>
 *   <TableRowMenu>
 *     <TableMergeCells />
 *     <TableRemoveRow />
 *   </TableRowMenu>
 *   <TableCellMenu>
 *     <TableMergeCells />
 *   </TableCellMenu>
 *   <TableColumnInsertIndicator />
 *   <TableColumnInsertIndicator />
 * </TableMenu>
 * ```
 */
export const TableMenu = (props: TableMenuProps) => {
  return (
    <EditorEventProvider view={props.view}>
      <TableMenuProviderImpl {...props} />
    </EditorEventProvider>
  );
};

TableMenu.displayName = 'TableMenu' as const;
