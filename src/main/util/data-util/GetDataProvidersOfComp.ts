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

import { IDataBook, ISelectedRow } from "../../contentstore/BaseContentStore";

/**
 * Returns dataProviders and their data in a Map of a component. If there are no dataproviders
 * an empty Map is returned instead.
 * @param dataProviderMap - the dataProviderMap which contains every dataProvider and the data of a screen
 * @param dataBooks - the databooks of the component
 * @returns dataProviders and their data in a Map of a component, empty Map if no dataproviders for component
 */
export function getScreensData(dataProviderMap:Map<string, IDataBook>|undefined, dataBooks:string[], column?:string) {
    if (dataProviderMap !== undefined) {
        const tempMap = new Map();
        for (let [key, value] of dataProviderMap.entries()) {
            if (dataBooks.includes(key)) {
                if (column) {
                    tempMap.set(key, value.data?.get("current")[column]);
                }
                else {
                    tempMap.set(key, value.data);
                }
            }        
        }
        return tempMap;
    }
    return new Map();
}

/**
 * Returns the selected-rows of given databooks as a map
 * @param pMap - the databook map of a screen
 * @param dataBooks - the databooks of a screen
 */
export function getScreenSelectedRows(pMap:Map<string, IDataBook>|undefined, dataBooks:string[]): Map<string, ISelectedRow | undefined> {
    if (pMap !== undefined) {
        const tempMap = new Map();
        for (let [key, value] of pMap.entries()) {
            if (dataBooks.includes(key)) {
                tempMap.set(key, value.selectedRow);
            }
        }
        return tempMap;
    }
    return new Map();
}