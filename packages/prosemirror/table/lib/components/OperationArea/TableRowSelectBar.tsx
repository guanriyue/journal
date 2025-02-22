import { useShallow } from 'zustand/shallow';
import { TableOperationAreaInfo, useTableMenuStore } from '../store';

interface TableRowSelectBarProps {
  area: TableOperationAreaInfo;

  rowsHeight: number[];
}

export const TableRowSelectBar = (props: TableRowSelectBarProps) => {
  const { area, rowsHeight } = props;

  const { activeRowIndex, selectRow } = useTableMenuStore(useShallow(state => {
    return {
      selectRow: state.selectRow,
      activeRowIndex: state.menuAnchor?.dataset.rowIndex
    }
  }));

  return (
    <div data-row-select-bar="">
      {rowsHeight.map((height, index) => {
        return (
          <span
            key={index}
            data-row-select-bar-item=""
            data-row-index={index}
            data-active={activeRowIndex === String(index) ? '' : undefined}
            style={{ height }}
            onClick={(event) => {
              if (activeRowIndex !== String(index)) {
                selectRow(area.getPos(), index, event.nativeEvent)
              }
            }}
            onDoubleClick={e => e.preventDefault()}
          />
        );
      })}
    </div>
  );
};

TableRowSelectBar.displayName = 'TableRowSelectBar' as const;
