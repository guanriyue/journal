import { Side, VirtualElement } from '@floating-ui/react-dom';
import React, { useMemo } from 'react';
import { useTableMenuStore } from './store';
import { useShallow } from 'zustand/shallow';
import { TableFloatingMenu } from './FloatingMenu';
import { domRectAt } from '@journal/prosemirror-utils';
import { isCellSelection } from '../utils';
import { useEditorState } from '@journal/prosemirror-event-provider';

export interface TableCellMenuProps
  extends React.HTMLAttributes<HTMLDivElement> {
  side?: Side;

  sideOffset?: number;
}

/**
 * 当选中单元格时显示的菜单。必须通过鼠标修改的选区行为触发
 */
export const TableCellMenu = React.forwardRef<
  HTMLDivElement,
  TableCellMenuProps
>((props, ref) => {
  const { side = 'top' } = props;

  const { open, view } = useTableMenuStore(
    useShallow((state) => {
      const open = state.menuType === 'cell';

      return {
        open,
        view: state.view,
      };
    }),
  );

  const contextElement = useEditorState(view => {
    if (!open) {
      return undefined;
    }

    const { selection } = view.state;
    if (!isCellSelection(selection)) {
      return undefined;
    }

    const dom = view.nodeDOM(selection.$anchorCell.before(-1));
    return dom instanceof Element ? dom.querySelector('table') || view.dom : view.dom;
  });

  const anchor = useMemo<VirtualElement>(() => {
    return {
      contextElement,
      getBoundingClientRect: () => {
        const { selection, doc } = view.state;

        if (isCellSelection(selection)) {
          const anchorCellPos = selection.$anchorCell.pos;
          const headerCellPos = selection.$headCell.pos;

          const [smaller, bigger] = anchorCellPos < headerCellPos ? [anchorCellPos, headerCellPos] : [headerCellPos, anchorCellPos];

          const from = smaller;
          const to = bigger + (doc.nodeAt(bigger)?.nodeSize || 0);

          return domRectAt(view, from, to);
        }

        const { from, to } = view.state.selection;

        return domRectAt(view, from, to);
      },
    };
  }, [contextElement, view]);

  if (!open) {
    return null;
  }

  return <TableFloatingMenu {...props} side={side} anchor={anchor} ref={ref} />;
});

TableCellMenu.displayName = 'TableCellMenu' as const;
