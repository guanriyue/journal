import { forwardRef } from 'react';
import { Toggle, ToggleProps } from '@radix-ui/react-toggle';
import { useEditorState } from '@journal/prosemirror-event-provider';
import { useShallow } from 'zustand/shallow';
import { getCellsMergeState } from '../utils';
import { mergeCells, splitCell } from 'prosemirror-tables';
import { isNil } from 'lodash-es';

export type TableMergeCellsProps = Omit<ToggleProps, 'pressed'>;

/**
 * 用于标识当前选中的单元格是否可以合并或拆分
 */
export const TableMergeCells = forwardRef<
  HTMLButtonElement,
  TableMergeCellsProps
>((props, ref) => {
  const { view, disabled, isMergedCell } = useEditorState(
    useShallow((view) => {
      return {
        ...getCellsMergeState(view),
        view,
      };
    }),
  );

  if (isNil(isMergedCell)) {
    return null;
  }

  return (
    <Toggle
      {...props}
      pressed={isMergedCell}
      disabled={disabled || props.disabled}
      onPressedChange={(pressed) => {
        props.onPressedChange?.(pressed);
        if (pressed) {
          mergeCells(view.state, view.dispatch);
        } else {
          splitCell(view.state, view.dispatch);
        }
      }}
      ref={ref}
    />
  );
});

TableMergeCells.displayName = 'TableMergeCells' as const;
