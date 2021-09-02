/** React imports */
import { useContext, useEffect, useState } from "react";

/** Other imports */
import { appContext } from "../../AppProvider";
import { MetaDataResponse } from "../../response";
import { getMetaData } from "../util";

const useMetaData = (compId:string, dataProvider:string):MetaDataResponse|undefined => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    /** Current state of the data received by the dataprovider */
    const [metaData, setMetaData] = useState<MetaDataResponse|undefined>(getMetaData(compId, dataProvider, context.contentStore));

    useEffect(() => {
        context.subscriptions.subscribeToMetaData(compId, dataProvider, () => setMetaData(getMetaData(compId, dataProvider, context.contentStore)));
        return () => context.subscriptions.unsubscribeFromMetaData(compId, dataProvider, () => setMetaData(getMetaData(compId, dataProvider, context.contentStore)));
    }, [context.subscriptions, compId, dataProvider, context.contentStore]);

    return metaData;
}
export default useMetaData