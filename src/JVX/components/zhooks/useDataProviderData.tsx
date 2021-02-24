/** React imports */
import {useContext, useEffect, useState} from "react";

/** Other imports */
import {jvxContext} from "../../jvxProvider";

/**
 * This hook returns the data of the dataprovider, it updates whenever the dataprovider gets updated
 * @param compId - componentId of screen
 * @param dataProvider - the dataprovider
 */
const useDataProviderData = (compId:string, dataProvider:string|string[]): [Array<any>]=> {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(jvxContext);

    const initData = (compId:string, dataProvider:string|string[]) => {
        if (Array.isArray(dataProvider)) {
            let tempArray:Array<any> = new Array();
            dataProvider.forEach(provider => tempArray.concat(context.contentStore.getData(compId, provider)));
            return tempArray;
        }
        else
            return context.contentStore.getData(compId, dataProvider)
    }

    /** Current state of the data received by the dataprovider */
    const [data, setData] = useState<Array<any>>(initData(compId, dataProvider));

    /**
     * Subscribes to dataChange which will update the data state everytime the dataprovider updates
     * @returns unsubscribes from dataChange
     */
    useEffect(() => {
        /** Get the data from the dataProvider and set the state */
        const onDataChange = () => {
            const a = initData(compId, dataProvider)
            setData([...a])
        }
        context.contentStore.subscribeToDataChange(compId, dataProvider, onDataChange);
        return () => {
            context.contentStore.unsubscribeFromDataChange(compId, dataProvider, onDataChange);
        }
    }, [context.contentStore, dataProvider, compId]);

    return [data];
}
export default useDataProviderData