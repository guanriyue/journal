import { forwardRef } from 'react';
import { Primitive, PrimitivePropsWithRef } from '@radix-ui/react-primitive';
import { useTableMenuStore } from './store';
import { useEditorState } from '@journal/prosemirror-event-provider';
import { isCellSelection, removeRowCurrentState } from '../utils';

/**
 * 删除当前行（如果允许的话）
 */
export const TableRemoveRow = forwardRef<
  HTMLButtonElement,
  PrimitivePropsWithRef<'button'>
>((props, ref) => {
  const view = useTableMenuStore((state) => state.view);
  const disabled = useEditorState((view) => !isCellSelection(view.state.selection));

  return (
    <Primitive.button
      {...props}
      disabled={disabled || props.disabled}
      onClick={(e) => {
        props.onClick?.(e);
        if (!e.defaultPrevented) {
          removeRowCurrentState(view.state, view.dispatch);
        }
      }}
      ref={ref}
    />
  );
});

TableRemoveRow.displayName = 'TableRemoveRow' as const;
