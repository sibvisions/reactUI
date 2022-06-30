import { DataTableColumnResizeEndParams, DataTableSelectionChangeParams } from "primereact/datatable";
import React, { FC } from "react";
import { SortDefinition } from "../../request/data/SortRequest";

export interface IExtendableTable {
    onSort?(sortDefinition: SortDefinition[]| undefined): void
    onColOrderChange?(colOrder: string[]): void
    onColResizeEnd?(e: DataTableColumnResizeEndParams): void
    onLazyLoadFetch?(records: any[]):void
    onRowSelect?(e: {originalEvent: DataTableSelectionChangeParams, selectedRow: any}): void
}

const ExtendTable: FC<IExtendableTable> = () => {
    return (
        <>
        </>
    )
}
export default ExtendTable