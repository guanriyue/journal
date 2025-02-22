import { createPortal } from "react-dom";
import { TableOperationAreaInfo, useTableMenuStore } from "../store";
import { useTableGrid } from "./hooks";
import React, { useEffect } from "react";
import { TableColumnOperationBar } from "./TableColumnOperationBar";
import { TableRowOperationBar } from "./TableRowOperationBar";

interface SingleOperationAreaProps {
  area: TableOperationAreaInfo;
}

const SingleOperationArea = React.memo((props: SingleOperationAreaProps) => {
  const { area } = props;
  const { dom } = area;

  const { colsWidth, rowsHeight, scrollWrapperSize } = useTableGrid(area);

  useEffect(() => {
    dom.style.setProperty('--table-viewport-width', scrollWrapperSize.width + 'px');
    dom.style.setProperty('--table-viewport-height', scrollWrapperSize.height + 'px');
  }, [dom, scrollWrapperSize]);

  return createPortal(
    <>
      <TableColumnOperationBar area={area} colsWidth={colsWidth} />
      <TableRowOperationBar area={area} rowsHeight={rowsHeight} />
    </>,
    dom,
  );
});

SingleOperationArea.displayName = 'SingleTableOperationArea' as const;

export const OperationArea = () => {
  const operationAreas = useTableMenuStore(state => state.operationAreas);

  return (
    <>
      {Object.values(operationAreas).map(area => <SingleOperationArea key={area.id} area={area} />)}
    </>
  )
};
