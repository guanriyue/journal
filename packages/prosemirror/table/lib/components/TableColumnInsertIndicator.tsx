import React from 'react';
import { useTableMenuStore } from './store';
import { hide, offset, useFloating } from '@floating-ui/react-dom';
import { useComposedRef } from '@journal/react-hooks';
import { useShallow } from 'zustand/shallow';
import { createPortal } from 'react-dom';

/**
 * 当鼠标悬浮在插入列操作点上时显示的指示器，可以用于提供图标、提示信息等
 */
export const TableColumnInsertIndicator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>((props, ref) => {
  const { anchor, setAnchor, insertColumn, area } = useTableMenuStore(
    useShallow((state) => {
      const id = state.insertColumnAnchor?.dataset.tableId;

      return {
        anchor: state.insertColumnAnchor,
        setAnchor: state.setInsertColumnAnchor,
        insertColumn: state.insertColumn,
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
    placement: 'top',
    middleware: [
      offset((options) => {
        return {
          mainAxis: -options.rects.reference.height,
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
          insertColumn(area?.getPos(), Number(anchor.dataset.columnIndex));
        }
      }}
    />,
    area.dom,
  );
});

TableColumnInsertIndicator.displayName = 'TableColumnInsertIndicator';
