import {useContext, useEffect, useRef, useState} from "react";
import {jvxContext} from "../../jvxProvider";
import {of} from "rxjs";
import {createFetchRequest} from "../../factories/RequestFactory";
import REQUEST_ENDPOINTS from "../../request/REQUEST_ENDPOINTS";

const useDataProviderData = (id: string, dataProvider: string): [Array<any>]=> {
    const context = useContext(jvxContext);
    const [data, setData] = useState<Array<any>>(context.contentStore.getData(dataProvider));

    useEffect(() => {
        const onDataChange = () => {
            const a = context.contentStore.getData(dataProvider);
            setData([...a])
        }
        context.contentStore.subscribeToDataChange(dataProvider,onDataChange);
        return () => {
            context.contentStore.unsubscribeFromDataChange(dataProvider, onDataChange);
        }
    }, [context.contentStore, dataProvider]);

    return [data];
}
export default useDataProviderData