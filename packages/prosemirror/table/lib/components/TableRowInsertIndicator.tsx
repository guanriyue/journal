import React from 'react';
import { useTableMenuStore } from './store';
import { hide, offset, useFloating } from '@floating-ui/react-dom';
import { useComposedRef } from '@journal/react-hooks';
import { useShallow } from 'zustand/shallow';
import { createPortal } from 'react-dom';

/**
 * 当鼠标悬浮在插入行的操作点上出现的指示器，可以用于提供图标、提示信息等
 */
export const TableRowInsertIndicator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>((props, ref) => {
  const { anchor, setAnchor, insertRow, area } = useTableMenuStore(
    useShallow((state) => {
      const id = state.insertRowAnchor?.dataset.tableId;

      return {
        anchor: state.insertRowAnchor,
        setAnchor: state.setInsertRowAnchor,
        insertRow: state.insertRow,
        area: id ? state.operationAreas[id] : undefined,
      };
    }),
  );

  const { refs, isPositioned, floatingStyles, middlewareData } = useFloating({
    elements: {
      reference: anchor,
    },
    strategy: 'absolute',
    transform: true,
    placement: 'left',
    middleware: [
      offset((options) => {
        return {
          mainAxis: -options.rects.reference.width,
        };
      }),
      hide({ strategy: 'referenceHidden' }),
    ],
  });

  const composeRef = useComposedRef(ref, refs.setFloating);

  if (!anchor || !area) {
    return null;
  }

  return createPortal(
    <div
      ref={composeRef}
      {...props}
      style={{
        minWidth: 'max-content',
        ...props.style,
        ...floatingStyles,
        transform: isPositioned
          ? floatingStyles.transform
          : props.style?.transform || 'translate(0, -200%)',
        ...(middlewareData.hide?.referenceHidden && {
          visibility: 'hidden',
          pointerEvents: 'none',
        }),
        animation: !isPositioned ? 'none' : props.style?.animation,
      }}
      onPointerEnter={(e) => {
        props.onPointerEnter?.(e);
        setAnchor(anchor);
      }}
      onPointerLeave={(e) => {
        props.onPointerLeave?.(e);
        setAnchor(undefined);
      }}
      onClick={(e) => {
        props.onClick?.(e);
        if (!e.defaultPrevented) {
          insertRow(area?.getPos(), Number(anchor.dataset.rowIndex));
        }
      }}
    />,
    area.dom,
  );
});

TableRowInsertIndicator.displayName = 'TableRowInsertIndicator';
