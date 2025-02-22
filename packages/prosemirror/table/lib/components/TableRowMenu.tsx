import React from 'react';
import { useTableMenuStore } from './store';
import { useShallow } from 'zustand/shallow';
import { Side } from '@floating-ui/react-dom';
import { TableFloatingMenu } from './FloatingMenu';

export interface TableRowMenuProps
  extends React.HTMLAttributes<HTMLDivElement> {
  side?: Side;

  sideOffset?: number;
}

/**
 * 当通过 select-bar 选中一行单元格时显示的菜单
 */
export const TableRowMenu = React.forwardRef<HTMLDivElement, TableRowMenuProps>(
  (props, ref) => {
    const { side = 'left' } = props;

    const { anchor, open } = useTableMenuStore(
      useShallow((state) => {
        const open = state.menuType === 'row';
        const anchor = open ? state.menuAnchor : undefined;
        const tableId = anchor?.dataset.tableId;
        const area = tableId ? state.operationAreas[tableId] : undefined;

        return {
          open,
          anchor,
          area,
        };
      }),
    );

    if (!open) {
      return null;
    }

    return (
      <TableFloatingMenu {...props} side={side} anchor={anchor} ref={ref} />
    );
  },
);

TableRowMenu.displayName = 'TableRowMenu' as const;
