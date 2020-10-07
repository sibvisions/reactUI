import {useContext, useEffect, useMemo, useState} from "react";
import {jvxContext} from "../../jvxProvider";

const useDataProviderData = (id: string, dataProvider: string) => {
    const context = useContext(jvxContext);
    const initialData = useMemo(() => {
        return context.contentStore.getData(dataProvider);
    }, [context.contentStore, dataProvider]);
    const [data, setData] = useState<Array<any>>(initialData);

    useEffect(() => {

        const onDataChange = (to: number, from: number) => setData([...context.contentStore.getData(dataProvider)]);

        context.contentStore.subscribeToDataChange(dataProvider,onDataChange);

        return () => {
            context.contentStore.unsubscribeFromDataChange(dataProvider, onDataChange);
        }
    }, [context.contentStore, dataProvider]);




    return [data];
}
export default useDataProviderData