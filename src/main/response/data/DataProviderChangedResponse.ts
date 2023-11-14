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

import { ICellEditor } from "../../components/editors/IEditor"
import RecordFormat from "../../util/types/RecordFormat"
import BaseResponse from "../BaseResponse"

// Type for changed-columns
export type IChangedColumns = {
    name: string
    label?: string
    readonly?: boolean
    movable?: boolean
    sortable?: boolean
    cellEditor?: ICellEditor
}

/** Interface for DataProviderChangedResponse */
interface DataProviderChangedResponse extends BaseResponse{
    dataProvider: string,
    model_insertEnabled?: boolean,
    insertEnabled?: boolean,
    model_deleteEnabled?: boolean,
    deleteEnabled?: boolean,
    model_updateEnabled?: boolean,
    updateEnabled?: boolean,
    readOnly?: boolean,
    reload?: -1 | 0 | 1,
    selectedRow?: number,
    treePath?: number[],
    selectedColumn?: string,
    changedValues?: any[],
    changedColumnNames?: string[],
    changedColumns?: IChangedColumns[],
    deletedRow?: number,
    recordFormat?: RecordFormat
    recordReadOnly?: { records: number[][] }
}
export default DataProviderChangedResponse