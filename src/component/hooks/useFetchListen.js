import {useState, useEffect, useContext} from 'react';
import { RefContext } from '../helper/Context';

function useFetchListen(dataProvider){
    const [fetchResponse, newFetch] = useState();
    const con = useContext(RefContext)

    useEffect(() => {
        const sub = con.contentStore.fetchCompleted.subscribe(fetchResponse => {
            if(fetchResponse.dataProvider === dataProvider){
                newFetch(fetchResponse);
            }
        });
        return () => { 
            sub.unsubscribe();
        }
    });
    return [fetchResponse]
}
export default useFetchListen