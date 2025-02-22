import React from 'react';
import {
  autoUpdate,
  flip,
  hide,
  ReferenceType,
  shift,
  Side,
  useFloating,
} from '@floating-ui/react-dom';
import { offset } from '@floating-ui/react-dom';
import { createPortal } from 'react-dom';
import { useComposedRef } from '@journal/react-hooks';
import { useTableMenuStore } from './store';

export interface TableFloatingMenuProps
  extends React.HTMLAttributes<HTMLDivElement> {
  side?: Side;

  sideOffset?: number;

  anchor: ReferenceType | null | undefined;
}

export const TableFloatingMenu = React.forwardRef<
  HTMLDivElement,
  TableFloatingMenuProps
>((props, ref) => {
  const { side, anchor, sideOffset = 8, ...divProps } = props;

  const getPopoverContainer = useTableMenuStore(state => state.getPopoverContainer);

  const { floatingStyles, isPositioned, refs, placement, middlewareData } =
    useFloating({
      elements: {
        reference: anchor,
      },
      whileElementsMounted: autoUpdate,
      strategy: 'fixed',
      placement: side,
      transform: true,
      middleware: [
        offset({ mainAxis: sideOffset }),
        shift(),
        flip(),
        hide({ strategy: 'referenceHidden' }),
      ],
    });

  const composedRef = useComposedRef(refs.setFloating, ref);

  const [placedSide, placedAlign] = placement.split('-');

  return createPortal(
    <div
      ref={composedRef}
      role="dialog"
      {...divProps}
      data-side={placedSide}
      data-align={placedAlign}
      style={{
        ...props.style,
        ...floatingStyles,
        transform: isPositioned
          ? floatingStyles.transform
          : 'translate(0, -200%)',
        minWidth: 'max-content',
        ...(middlewareData.hide?.referenceHidden && {
          visibility: 'hidden',
          pointerEvents: 'none',
        }),
        animation: !isPositioned ? 'none' : props.style?.animation,
      }}
    />,
    getPopoverContainer(),
  );
});

TableFloatingMenu.displayName = 'TableFloatingMenu' as const;
