/** Request imports */
import StartupRequest from "../request/StartupRequest";
import LoginRequest from "../request/LoginRequest";
import PressButtonRequest from "../request/PressButtonRequest";
import OpenScreenRequest from "../request/OpenScreenRequest";
import LogoutRequest from "../request/LogoutRequest";
import DeviceStatusRequest from "../request/DeviceStatusRequest";
import SelectRowRequest from "../request/SelectRowRequest";
import FetchRequest from "../request/FetchRequest";
import SetValuesRequest from "../request/SetValuesRequest";
import FilterRequest from "../request/FilterRequest";
import SetValueRequest from "../request/SetValueRequest";
import TabRequest from "../request/TabRequest";
import SaveRequest from "../request/SaveRequest";
import CloseScreenRequest from "../request/CloseScreenRequest";


/**
 * Returns the ClientId from the local storage
 * @returns the ClientId from the local storage
 */
const getClientId = (): string => {
    return sessionStorage.getItem("clientId") || "ClientIdNotFound"
}

/**
 * Returns a StartupRequest object with either values which can be overwritten or properties as parameters
 * @param values - properties for the startupRequest
 * @returns a StartupRequest object
 */
export const createStartupRequest = (values?: StartupRequest): StartupRequest => {
    const req: StartupRequest = {
        layoutMode: values?.layoutMode || "generic",
        appMode: values?.appMode || "full",
        applicationName: values?.applicationName || "demo",

        authKey: values?.authKey,
        userName: values?.userName,
        password: values?.password,

        osName: values?.osName,
        osVersion: values?.osVersion,
        technology: values?.technology || "react",

        screenWidth: values?.screenWidth || 1920,
        screenHeight: values?.screenHeight || 1080,

        deviceMode: values?.deviceMode || "mobile",

        deviceType: values?.deviceType || 'Browser',
        deviceTypeModel: values?.deviceTypeModel || navigator.userAgent,

        readAheadLimit: values?.readAheadLimit
    }
    return  req;
}

/**
 * Returns a loginRequest object with either properties which can be overwritten or properties as parameters
 * @param values - properties for the loginRequest
 * @returns a loginRequest object
 */
export const createLoginRequest = (values?: LoginRequest): LoginRequest => {
    const req: LoginRequest = {
        clientId: values?.clientId || getClientId(),
        createAuthKey: values?.createAuthKey || true,
        username: values?.username,
        password: values?.password,
    }
    return req;
}

/**
 * Returns a pressButtonRequest object with either properties which can be overwritten or properties as parameters
 * @param values - properties for the pressButtonRequest
 * @returns a pressButtonRequest object
 */
export const createPressButtonRequest = (values?: PressButtonRequest): PressButtonRequest => {
    const req: PressButtonRequest = {
        clientId: values?.clientId || getClientId(),
        componentId: values?.componentId
    }
    return req;
}

/**
 * Returns a openScreenRequest object with either properties which can be overwritten or properties as parameters
 * @param values - properties for the openScreenRequest
 * @returns a openScreenRequest object
 */
export const createOpenScreenRequest = (values?: OpenScreenRequest): OpenScreenRequest => {
    const req: OpenScreenRequest = {
        clientId: values?.clientId || getClientId(),
        componentId: values?.componentId
    }
    return req;
}

/**
 * Returns a logoutRequest object with either properties which can be overwritten or properties as parameters
 * @param values - properties for the logoutRequest
 * @returns a logoutRequest object
 */
export const createLogoutRequest = (values?: LogoutRequest): LogoutRequest => {
    const req: LogoutRequest = {
        clientId: values?.clientId || getClientId()
    }
    return req;
}

/**
 * Returns a deviceStatusRequest object with either properties which can be overwritten or properties as parameters
 * @param values - properties for the deviceStatusRequest
 * @returns a deviceStatusRequest object
 */
export const createDeviceStatusRequest = (values?: DeviceStatusRequest): DeviceStatusRequest => {
    const req: DeviceStatusRequest = {
        clientId: getClientId(),
        screenHeight: values?.screenHeight || 0,
        screenWidth: values?.screenWidth || 0
    }
    return req;
}

/**
 * Returns a selectRowRequest object with either properties which can be overwritten or properties as parameters
 * @param values - properties for the selectRowRequest
 * @returns a selectRowRequest object
 */
export const createSelectRowRequest = (values?: SelectRowRequest): SelectRowRequest => {
    const req: SelectRowRequest = {
        clientId: values?.clientId || getClientId(),
        componentId: values?.componentId,
        dataProvider: values?.dataProvider,
        filter: values?.filter
    }
    return req
}

/**
 * Returns a fetchRequest object with either properties which can be overwritten or properties as parameters
 * @param values - properties for the fetchRequest
 * @returns a fetchRequest object
 */
export const createFetchRequest = (values?: FetchRequest): FetchRequest => {
    const req: FetchRequest = {
        clientId: values?.clientId || getClientId(),
        dataProvider: values?.dataProvider,
        columnNames: values?.columnNames,
        filter: values?.filter,
        fromRow: values?.fromRow,
        rowCount: values?.rowCount
    }
    return req;
}

/**
 * Returns a filterRequest object with either properties which can be overwritten or properties as parameters
 * @param values - properties for the filterRequest
 * @returns a filterRequest object
 */
export const createFilterRequest = (values?: FilterRequest): FilterRequest => {
    const req: FilterRequest = {
        clientId: values?.clientId || getClientId(),
        dataProvider: values?.dataProvider,
        editorComponentId: values?.editorComponentId,
        value: values?.value||"",
        filterCondition: values?.filterCondition
    }
    return req;
}

/**
 * Returns a setValueRequest object with either properties which can be overwritten or properties as parameters
 * @param values - properties for the setValueRequest
 * @returns a setValueRequest object
 */
export const createSetValueRequest = (values?: SetValueRequest): SetValueRequest => {
    const req: SetValueRequest = {
        clientId: values?.clientId || getClientId(),
        componentId: values?.componentId,
        value: values?.value
    };
    return req;
}

/**
 * Returns a setValuesRequest object with either properties which can be overwritten or properties as parameters
 * @param values - properties for the setValuesRequest
 * @returns a setValuesRequest object
 */
export const createSetValuesRequest = (values?: SetValuesRequest): SetValuesRequest => {
    const req: SetValuesRequest = {
        clientId: values?.clientId || getClientId(),
        columnNames: values?.columnNames,
        componentId: values?.componentId,
        dataProvider: values?.dataProvider,
        values: values?.values
    };
    return req;
}

/**
 * Returns a tabRequest object with either properties which can be overwritten or properties as parameters
 * @param values - properties for the tabRequest
 * @returns a tabRequest object
 */
export const createTabRequest = (values?: TabRequest): TabRequest => {
    const req:TabRequest = {
        clientId: values?.clientId || getClientId(),
        componentId: values?.componentId,
        index: values?.index
    };
    return req;
}

/**
 * Returns a saveRequest object with either properties which can be overwritten or properties as parameters
 * @param values - properties for the saveRequest
 * @returns a saveRequest object
 */
export const createSaveRequest = (values?: SaveRequest): SaveRequest => {
    const req:SaveRequest = {
        clientId: values?.clientId || getClientId(),
        dataProvider: values?.dataProvider,
        onlySelected: values?.onlySelected
    };
    return req;
}

/**
 * Returns a closeScreenRequest object with either properties which can be overwritten or properties as parameters
 * @param values - properties for the closeScreenRequest
 * @returns a closeScreenRequest object
 */
export const createCloseScreenRequest = (values?: CloseScreenRequest): CloseScreenRequest => {
    const req:CloseScreenRequest = {
        clientId: values?.clientId || getClientId(),
        componentId: values?.componentId
    };
    return req;
}