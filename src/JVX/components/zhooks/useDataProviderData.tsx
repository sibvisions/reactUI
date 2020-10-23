import {useContext, useEffect, useState} from "react";
import {jvxContext} from "../../jvxProvider";

const useDataProviderData = (id: string, dataProvider: string): [Array<any>]=> {
    const context = useContext(jvxContext);
    const [data, setData] = useState<Array<any>>(context.contentStore.getData(dataProvider));

    useEffect(() => {
        const onDataChange = () => {
            const a = context.contentStore.getData(dataProvider);
            console.log(a)
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