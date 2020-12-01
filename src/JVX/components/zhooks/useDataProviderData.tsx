import {useContext, useEffect, useState} from "react";
import {jvxContext} from "../../jvxProvider";

const useDataProviderData = (compId:string, id: string, dataProvider: string): [Array<any>]=> {
    const context = useContext(jvxContext);
    const [data, setData] = useState<Array<any>>(context.contentStore.getData(compId, dataProvider));

    useEffect(() => {
        const onDataChange = () => {
            const a = context.contentStore.getData(compId, dataProvider);
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