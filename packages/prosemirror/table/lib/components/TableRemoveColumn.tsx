import { forwardRef } from 'react';
import { Primitive, PrimitivePropsWithRef } from '@radix-ui/react-primitive';
import { useTableMenuStore } from './store';
import { useEditorState } from '@journal/prosemirror-event-provider';
import { isCellSelection, removeColumnCurrentState } from '../utils';

/**
 * 删除当前列（如果允许的话）
 */
export const TableRemoveColumn = forwardRef<
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
          removeColumnCurrentState(view.state, view.dispatch);
        }
      }}
      ref={ref}
    />
  );
});

TableRemoveColumn.displayName = 'TableRemoveColumn' as const;
