import { useEffect, useState, useContext } from 'react';
import { RefContext } from '../helper/Context';
import { recordToObject } from '../helper/RecordToObject';

function useRowSelect(columnName, init, id="no", dataProvider) {
    const [selectedColumn, editColumn] = useState(init);
    const con = useContext(RefContext);

    // eslint-disable-next-line
    String.prototype.indexOfEnd = function(string) {
        var io = this.indexOf(string);
        return io === -1 ? -1 : io + string.length;
    }

    useEffect(()=> {
        const rowSub = con.contentStore.selectedDataRowChange.subscribe(row => {
            const value = row[columnName];
            if(value){
                editColumn(row[columnName]);
            }
            else {
                editColumn("");
            } 
            con.contentStore.updateContent([{id: id, initialValue: value}]);
        });

        const fetchSub = con.contentStore.fetchCompleted.subscribe(fetchResponse => {
            if (fetchResponse.dataProvider === dataProvider) {
                let fetchedData = [];
                if (fetchResponse.records.length > 0) {
                    fetchResponse.records.forEach(record => {
                        fetchedData.push(recordToObject(fetchResponse, record));
                    });
                    let primaryKeyColumns = con.contentStore.metaData.get(fetchResponse.dataProvider).primaryKeyColumns;
                    let storedData = con.contentStore.storedData.get(fetchResponse.dataProvider);
                    fetchedData.forEach(record => {
                        if (primaryKeyColumns) {
                            let found;
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
                            if (found === storedData[con.contentStore.selectedRow.get(dataProvider)]) {
                                if(found[columnName]) {
                                    editColumn(found[columnName]);
                                }
                                else {
                                    editColumn("");
                                }
                            }
                        }
                        else {
                            if (record[columnName]) {
                                editColumn(record[columnName]);
                            }
                            else {
                                editColumn("");
                            }
                        }
                    })
                }
            }
        })
        return function cleanUp(){
            rowSub.unsubscribe();
            fetchSub.unsubscribe();
        }
    });
    return [selectedColumn , editColumn];
}
export default useRowSelect;