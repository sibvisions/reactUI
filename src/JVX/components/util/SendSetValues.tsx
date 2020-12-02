import REQUEST_ENDPOINTS from "src/JVX/request/REQUEST_ENDPOINTS";
import Server from "src/JVX/Server";
import {createSetValuesRequest} from "../../factories/RequestFactory";

export function sendSetValues(dataProvider:string, name:string, columnName:string|string[], value:string|number|boolean|Array<any>|null, lastValue:any, server:Server) {
    const req = createSetValuesRequest();
    req.dataProvider = dataProvider;
    req.componentId = name;
    req.columnNames = Array.isArray(columnName) ? columnName : [columnName];
    let tempValues:any = value;
    if (typeof value === "object" && value !== null) {
        tempValues = Object.values(value)
    }
    req.values = Array.isArray(tempValues) ? tempValues : [tempValues];

    if (lastValue)
        lastValue = value;
    server.sendRequest(req, REQUEST_ENDPOINTS.SET_VALUES);
}