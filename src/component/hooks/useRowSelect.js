import { useEffect, useState, useContext } from 'react';
import { RefContext } from '../helper/Context';
import { recordToObject } from '../helper/RecordToObject';

function useRowSelect(columnName, init, id="no", dataProvider) {
    const [selectedColumn, editColumn] = useState(init);
    const con = useContext(RefContext);

    useEffect(()=> {
        const sub = con.contentStore.selectedDataRowChange.subscribe(row => {
            const value = row[columnName];
            if(value){
                editColumn(row[columnName]);
            }
            else editColumn("");
            con.contentStore.updateContent([{id: id, initialValue: value || init}]);
        });

        const sub2 = con.contentStore.fetchCompleted.subscribe(fetchResponse => {
            if (fetchResponse.dataProvider === dataProvider) {
                let fetchedData = [];
                if (fetchResponse.records.length > 0) {
                    fetchResponse.records.forEach(record => {
                        fetchedData.push(recordToObject(fetchResponse, record));
                    });
                    let primaryKeyColumns = con.contentStore.metaData.get(fetchResponse.dataProvider).primaryKeyColumns;
                    let storedData = con.contentStore.storedData.get(fetchResponse.dataProvider);
                    let found;
                    fetchedData.forEach(record => {
                        let filter = {};
                        primaryKeyColumns.forEach(pkColumn => {
                            filter[pkColumn] = record[pkColumn];
                        })
                        found = storedData.find(storedRecord => {
                            for (let key in filter) {
                                if (storedRecord[key] === undefined || storedRecord[key] !== filter[key]) {
                                    return false;
                                }
                            }
                            return true;
                        })
                        if (found[columnName] && found === storedData[con.contentStore.selectedRow.get(dataProvider)]) {
                            editColumn(found[columnName])
                        }
                    })
                }
            }
        })

        return function cleanUp(){
            sub.unsubscribe();
            sub2.unsubscribe();
        }
    });
    return [selectedColumn , editColumn];
}
export default useRowSelect;