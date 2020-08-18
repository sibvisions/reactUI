import { useEffect, useState, useContext } from 'react';
import { RefContext } from '../helper/Context';

function useRowSelect() {
    const [selectedRow, rowChange] = useState({});
    const con = useContext(RefContext)

    function editProperty(value ,propertyName){
        let rowCopy = {...selectedRow};
        if(rowCopy[propertyName]){
            rowCopy[propertyName] = value;
            rowChange(rowCopy);
        }
    }

    useEffect(()=> {
        const sub =  con.contentStore.selectedDataRowChange.subscribe(row => rowChange(row));
        return function cleanUp(){
            sub.unsubscribe();
        }
    })
    return [selectedRow, editProperty];
}
export default useRowSelect;