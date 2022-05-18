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

import { BaseResponse } from "..";
import { ICellEditorCheckBox, 
         ICellEditorChoice, 
         ICellEditorDate, 
         ICellEditorImage, 
         ICellEditorLinked, 
         ICellEditorNumber } from "../../components/editors"

/** Type for MetaData of dataprovider referencing other dataprovider */
export type MetaDataReference = {
    columnNames: string[],
    referencedColumnNames: string[],
    referencedDataBook: string
}

export interface ColumnDescription {
    name:string,
    label: string,
    cellEditor: ICellEditorCheckBox|
                ICellEditorChoice|
                ICellEditorDate|
                ICellEditorImage|
                ICellEditorLinked|
                ICellEditorNumber,
    dataTypeIdentifyer: number,
    width: number,
    readonly: boolean,
    nullable: boolean,
    resizable: boolean,
    sortable: boolean,
    movable: boolean
}

export interface LengthBasedColumnDescription extends ColumnDescription {
    length: number
}

export interface NumericColumnDescription extends LengthBasedColumnDescription {
    precision: number,
    scale: number,
    signed: boolean
}

/** Interface for MetaDataResponse */
interface MetaDataResponse extends BaseResponse {
    columnView_table_: Array<string>,
    columns: Array<LengthBasedColumnDescription|NumericColumnDescription>,
    primaryKeyColumns: Array<string>,
    dataProvider: string,
    deleteEnabled: boolean,
    insertEnabled: boolean,
    updateEnabled: boolean,
    readOnly: boolean,
    isAllFetched: boolean,
    masterReference?: MetaDataReference,
    detailReferences?: MetaDataReference[]
}
export default MetaDataResponse;