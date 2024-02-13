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

import BaseContentStore from "../../contentstore/BaseContentStore";
import { FullOrColumn } from "../../hooks/data-hooks/useMetaData";
import MetaDataResponse from "../../response/data/MetaDataResponse";

/**
 * Returns the metadata of the given dataprovider
 * @param screenName - the component id of the screen
 * @param dataProvider - the dataprovider of the metadata wanted
 * @param contentStore - the contentstore instance
 * @returns the metadata of the given dataprovider
 */
export function getMetaData<T extends string|undefined, U extends "numeric"|undefined>(screenName:string, dataProvider:string, contentStore:BaseContentStore, column?:T):FullOrColumn<T, U>|undefined {
    const fullMetaData = contentStore.getDataBook(screenName, dataProvider)?.metaData;
    if (fullMetaData) {
        if (column) {
            const columnMetaData = fullMetaData.columns.find(c => c.name === column);
            if (columnMetaData) {
                return columnMetaData as FullOrColumn<T, U>
            }
        }
        else {
            return fullMetaData as FullOrColumn<T, U>;
        }
    }
    return undefined
}

/**
 * Returns the primaryKey columns as array based on the metadata
 * @param metaData - the metadata
 */
export function getPrimaryKeys(metaData: MetaDataResponse|undefined): string[] {
    if (metaData) {
        if (metaData.primaryKeyColumns) {
            return metaData.primaryKeyColumns;
        }
        else {
            return metaData.columns.map(col => col.name);
        }
    }
    else {
        return [];
    }
}