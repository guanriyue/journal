import { TableOperationAreaInfo, useTableMenuStore } from '../store';
import { useShallow } from 'zustand/shallow';

interface TableColumnSelectBarProps {
  area: TableOperationAreaInfo;

  colsWidth: number[];
}

export const TableColumnSelectBar = (
  props: TableColumnSelectBarProps,
) => {
  const { area, colsWidth } = props;

  const { activeColumnIndex, selectColumn } = useTableMenuStore(useShallow((state) => {
    return {
      selectColumn: state.selectColumn,
      activeColumnIndex: state.menuAnchor?.dataset.columnIndex,
    };
  }));

  return (
    <div data-column-select-bar="">
      {colsWidth.map((width, index) => {
        return (
          <span
            key={index}
            data-column-select-bar-item
            data-column-index={index}
            data-active={activeColumnIndex === String(index) ? "" : undefined}
            style={{ width }}
            onClick={(event) => {
              if (activeColumnIndex !== String(index)) {
                selectColumn(area.getPos(), index, event.nativeEvent)
              }
            }}
            onDoubleClick={e => e.preventDefault()}
          />
        );
      })}
    </div>
  );
};

TableColumnSelectBar.displayName = 'TableColumnSelectBar' as const;
