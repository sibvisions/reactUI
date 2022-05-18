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

import BaseComponent from "../../util/types/BaseComponent";

/** Interface for cellEditor property of CellEditors */
export interface ICellEditor{
    className: string,
    contentType?: string,
    horizontalAlignment?: 0 | 1 | 2| 3,
    verticalAlignment?: 0 | 1 | 2| 3,
    directCellEditor?: boolean,
    preferredEditorMode?: number
    autoOpenPopup?: boolean
}

/** Base Interface for CellEditors */
export interface IEditor extends BaseComponent{
    cellEditor?: ICellEditor,
    cellEditor_editable_:boolean,
    cellEditor_horizontalAlignment_?: 0 | 1 | 2| 3,
    cellEditor_verticalAlignment_?: 0 | 1 | 2| 3,
    cellEditor_background_?:string,
    cellEditor_foreground_?:string
    cellEditor_font_?:string
    cellEditor_placeholder_?:string
    columnName: string,
    dataRow: string,
    text:string,
    autoFocus?: boolean,
    nullable?: boolean,
    readonly?: boolean,
}