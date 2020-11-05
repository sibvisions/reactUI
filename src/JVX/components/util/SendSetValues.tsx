import REQUEST_ENDPOINTS from "src/JVX/request/REQUEST_ENDPOINTS";
import {createSetValuesRequest} from "../../factories/RequestFactory";

export function sendSetValues(dataProvider:string, name:string, columnName:string|string[], value:string|number|boolean|Array<any>|null, lastValue:any, server:any) {
    const req = createSetValuesRequest();
    req.dataProvider = dataProvider;
    req.componentId = name;
    req.columnNames = Array.isArray(columnName) ? columnName : [columnName];
    let tempValues:any = value;
    if (typeof value === "object" && value !== null) {
        tempValues = Object.values(value)
    }
    req.values = Array.isArray(tempValues) ? tempValues : [tempValues];

    lastValue = value;
    server.sendRequest(req, REQUEST_ENDPOINTS.SET_VALUES);
}