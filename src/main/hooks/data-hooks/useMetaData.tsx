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

import { useContext, useEffect, useState } from "react";
import { appContext } from "../../AppProvider";
import { LengthBasedColumnDescription, MetaDataResponse, NumericColumnDescription } from "../../response";
import { getMetaData } from "../../util";

//T is the column which metadata is needed, if column is set it is looking for U which is whether the column is numeric or length.
//If T is not set the whole metadata-response is returned
export type FullOrColumn<T extends string|undefined, U extends "numeric"|undefined> = T extends string ? (U extends "numeric" ? NumericColumnDescription : LengthBasedColumnDescription) : MetaDataResponse

/**
 * This hook returns either the full metadata of a dataprovider or only the metadata of a column if the column parameter is set.
 * @param screenName - the name of the screen
 * @param dataProvider - the dataprovider which metadata is needed
 * @param column - the column which should be extracted out of the metadata
 * @param numeric - if the column-metadata is numeric or length based
 * @returns metadata
 */
const useMetaData = <T extends string|undefined, U extends "numeric"|undefined>(screenName:string, dataProvider:string, column?:T, numeric?:U):FullOrColumn<T, U>|undefined => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    /** Current state of the data received by the dataprovider */
    const [metaData, setMetaData] = useState<FullOrColumn<T, U>|undefined>(getMetaData(screenName, dataProvider, context.contentStore, column));

    useEffect(() => {
        context.subscriptions.subscribeToMetaData(screenName, dataProvider, () => setMetaData(getMetaData(screenName, dataProvider, context.contentStore, column)));
        return () => context.subscriptions.unsubscribeFromMetaData(screenName, dataProvider, () => setMetaData(getMetaData(screenName, dataProvider, context.contentStore, column)));
    }, [context.subscriptions, screenName, dataProvider, context.contentStore]);

    return metaData;
}
export default useMetaData