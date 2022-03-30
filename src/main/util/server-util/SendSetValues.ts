import { REQUEST_KEYWORDS, SelectFilter } from "../../request";
import Server from "../../Server";
import { createSetValueRequest, createSetValuesRequest } from "../../factories/RequestFactory";
import { showTopBar, TopBarContextType } from "../../components/topbar/TopBar";

/**
 * Builds a setValuesRequest and sends it to the server
 * @param dataProvider - the dataprovider
 * @param name - the componentId
 * @param columnName - the column name
 * @param value - current value of component to send
 * @param server - the server instance
 */
export async function sendSetValues(
    dataProvider: string,
    name: string,
    columnName: string | string[],
    value: string | number | boolean | Array<any> | null,
    server: Server,
    lastValue: string | number | boolean | Array<any> | null | undefined,
    topbar: TopBarContextType,
    rowIndex?: number,
    selectedIndex?: number,
    filter?: SelectFilter) {
    const req = createSetValuesRequest();
    req.dataProvider = dataProvider;
    req.componentId = name;
    /** Send as array if its not already an array */
    req.columnNames = Array.isArray(columnName) ? columnName : [columnName];
    let tempValues: any = value;
    /** If value is an object only send the values of the object */
    if (typeof value === "object" && value !== null) {
        tempValues = Object.values(value)
    }

    if (rowIndex !== undefined && selectedIndex !== undefined && rowIndex !== selectedIndex) {
        req.filter = filter
    }
    /** Send as array if its not already an array */
    req.values = Array.isArray(tempValues) ? tempValues : [tempValues];
    if (lastValue !== undefined) {
        if (value !== lastValue) {
            await showTopBar(server.sendRequest(req, REQUEST_KEYWORDS.SET_VALUES), topbar);
        }
    }
    else {
        await showTopBar(server.sendRequest(req, REQUEST_KEYWORDS.SET_VALUES), topbar);
    }
}

/**
 * Sends a set-value-request to the server but only if the last-value has changed
 * @param name - the name of the component
 * @param value - the value to send to the server
 * @param server - the server-class
 * @param lastValue - the last-value to compare to the current
 * @param topbar - the topbar to show loading
 */
export async function sendSetValue(
    name: string,
    value: string | number | boolean | Array<any> | null,
    server: Server,
    lastValue: string | number | boolean | Array<any> | null | undefined,
    topbar:TopBarContextType) {
        const req = createSetValueRequest();
        req.componentId = name;
        req.value = value;
        if (lastValue !== undefined) {
            if (value !== lastValue) {
                await showTopBar(server.sendRequest(req, REQUEST_KEYWORDS.SET_VALUE), topbar);
            }
        }
        else {
            await showTopBar(server.sendRequest(req, REQUEST_KEYWORDS.SET_VALUE), topbar);
        }
}