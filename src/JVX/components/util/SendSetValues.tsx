import REQUEST_ENDPOINTS from "src/JVX/request/REQUEST_ENDPOINTS";
import {createSetValuesRequest} from "../../factories/RequestFactory";

export function sendSetValues(dataProvider:string, name:string, columnName:string, value:string|number|Array<any>|null, lastValue:any, con:any) {
    const req = createSetValuesRequest();
    req.dataProvider = dataProvider;
    req.componentId = name;
    req.columnNames = [columnName];
    req.values = [value];

    lastValue = value;
    con.server.sendRequest(req, REQUEST_ENDPOINTS.SET_VALUES);
}