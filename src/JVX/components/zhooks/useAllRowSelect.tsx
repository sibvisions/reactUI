/** React imports */
import {useContext, useEffect, useMemo, useState} from "react";

/** Other imports */
import {jvxContext} from "../../jvxProvider";
import { getDataProvidersOfComp } from "../util/GetDataProvidersOfComp";

const useAllRowSelect = (compId:string, dataBooks:string[], column?:string) => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(jvxContext);

    // const buildMap = useMemo(() => {
    //     const
    // },[])

    /** Current state of dataMap */
    const [selectedRowMap, setSelectedRowMap] = useState<Map<string, any>>(getDataProvidersOfComp(context.contentStore.dataProviderSelectedRow.get(compId), dataBooks));
    
    //console.log(context.contentStore.dataProviderSelectedRow)

    useEffect(() => {
        const onScreenSelectedRowChange = () => {
            const a = getDataProvidersOfComp(context.contentStore.dataProviderSelectedRow.get(compId), dataBooks);
            setSelectedRowMap(new Map(a));
        }

        context.subscriptions.subscribeToScreenRowChange(compId, onScreenSelectedRowChange);
        return () => context.subscriptions.unsubscribeFromScreenRowChange(compId);
    }, [context.contentStore, context.subscriptions, compId, dataBooks]);

    return selectedRowMap;
}
export default useAllRowSelect;