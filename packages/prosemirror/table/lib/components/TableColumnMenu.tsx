import React from 'react';
import { useTableMenuStore } from './store';
import { useShallow } from 'zustand/shallow';
import { Side } from '@floating-ui/react-dom';
import { TableFloatingMenu } from './FloatingMenu';

export interface TableColumnMenuProps
  extends React.HTMLAttributes<HTMLDivElement> {
  side?: Side;

  sideOffset?: number;
}

/**
 * 当通过 select-bar 选中一列单元格时显示的菜单
 */
export const TableColumnMenu = React.forwardRef<
  HTMLDivElement,
  TableColumnMenuProps
>((props, ref) => {
  const { side = 'top' } = props;

  const { anchor, open } = useTableMenuStore(
    useShallow((state) => {
      const open = state.menuType === 'column';
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

  return <TableFloatingMenu {...props} side={side} anchor={anchor} ref={ref} />;
});

TableColumnMenu.displayName = 'TableColumnMenu' as const;
