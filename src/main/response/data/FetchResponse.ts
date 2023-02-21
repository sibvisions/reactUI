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

import { SortDefinition } from "../../request/data/SortRequest"
import RecordFormat from "../../util/types/RecordFormat"
import BaseResponse from "../BaseResponse"

/** Interface for FetchResponse */
interface FetchResponse extends BaseResponse{
    columnNames: Array<string>
    records: Array<Array<any>>
    dataProvider: string
    isAllFetched: boolean
    selectedRow: number
    from: number
    to: number
    treePath?: number[]
    selectedColumn?: string
    sortDefinition?: SortDefinition[]
    recordFormat?: RecordFormat
    clear?: boolean,
    masterRow: any[];
}
export default FetchResponse