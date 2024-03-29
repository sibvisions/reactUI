/* Copyright 2022 SIB Visions GmbH
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

import React, { FC } from "react";
import { SortDefinition } from "../../request/data/SortRequest";
import { DataTableColumnResizeEndEvent, DataTableSelectionCellChangeEvent } from "primereact/datatable";

// Interface for extendable-table
export interface IExtendableTable {
    onSort?(sortDefinition: SortDefinition[]| undefined): void
    onColOrderChange?(colOrder: string[]): void
    onColResizeEnd?(e: DataTableColumnResizeEndEvent): void
    onLazyLoadFetch?(records: any[]):void
    onRowSelect?(e: {originalEvent: DataTableSelectionCellChangeEvent<any>, selectedRow: any}): void
}

// This component is an empty substitute for the component UITable
const ExtendTable: FC<IExtendableTable> = () => {
    return (
        <>
        </>
    )
}
export default ExtendTable