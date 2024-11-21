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

import { ICellEditorCheckBox } from "../../components/editors/checkbox/UIEditorCheckbox"
import { ICellEditorChoice } from "../../components/editors/choice/UIEditorChoice"
import { ICellEditorDate } from "../../components/editors/date/UIEditorDate"
import { ICellEditorImage } from "../../components/editors/image/UIEditorImage"
import { ICellEditorLinked } from "../../components/editors/linked/UIEditorLinked"
import { ICellEditorNumber } from "../../components/editors/number/UIEditorNumber"
import BaseResponse from "../BaseResponse"

export enum DataTypeIdentifier {
    Binary = -2,
    BigDecimal = 3,
    Boolean = 16,
    Long = -5,
    Object = 2000,
    String = 12,
    Timestamp = 93,
}

/** Type for MetaData of dataprovider referencing other dataprovider */
export type MetaDataReference = {
    columnNames: string[],
    referencedColumnNames: string[],
    referencedDataBook: string
}

// Interface for column-description
export interface ColumnDescription {
    name:string,
    label: string,
    cellEditor: ICellEditorCheckBox|
                ICellEditorChoice|
                ICellEditorDate|
                ICellEditorImage|
                ICellEditorLinked|
                ICellEditorNumber,
    dataTypeIdentifier: number,
    width: number,
    readOnly: boolean,
    nullable: boolean,
    resizable: boolean,
    sortable: boolean,
    movable: boolean,
    forcedStateless: boolean
}
// Interface for length-based column-descriptions
export interface LengthBasedColumnDescription extends ColumnDescription {
    length: number
}

// Interface for numeric-based column-descriptions
export interface NumericColumnDescription extends LengthBasedColumnDescription {
    precision: number,
    scale: number,
    signed: boolean
}

/** Interface for MetaDataResponse */
interface MetaDataResponse extends BaseResponse {
    columnView_table_: Array<string>,
    columnView_tree_: Array<string>,
    columns: Array<LengthBasedColumnDescription|NumericColumnDescription>,
    primaryKeyColumns: Array<string>,
    dataProvider: string,
    model_deleteEnabled: boolean,
    deleteEnabled: boolean,
    model_insertEnabled: boolean,
    insertEnabled: boolean,
    model_updateEnabled: boolean,
    updateEnabled: boolean,
    readOnly: boolean,
    isAllFetched: boolean,
    masterReference?: MetaDataReference,
    detailReferences?: MetaDataReference[],
    rootReference?: MetaDataReference
}
export default MetaDataResponse;