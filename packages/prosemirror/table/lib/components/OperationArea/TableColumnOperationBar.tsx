import { TableOperationAreaInfo } from "../store";
import { useElementScroll } from "./hooks";
import { TableColumnInsertBar } from "./TableColumnInsertBar";
import { TableColumnSelectBar } from "./TableColumnSelectBar";

export interface TableColumnOperationBarProps {
  area: TableOperationAreaInfo;
  
  colsWidth: number[];
}

export const TableColumnOperationBar = (
  props: TableColumnOperationBarProps,
) => {
  const { tableScrollWrapper } = props.area;

  const { scrollLeft } = useElementScroll(tableScrollWrapper);

  return (
    <div data-column-operation-bar="" style={{ ['--scroll-left' as string]: `${scrollLeft}px` }}>
      <div data-column-insert-bar-wrapper="">
        <TableColumnInsertBar {...props} />
      </div>
      <div data-column-select-bar-wrapper="">
        <TableColumnSelectBar {...props} />
      </div>
    </div>
  );
};

TableColumnOperationBar.displayName = 'TableColumnOperationBar' as const;
