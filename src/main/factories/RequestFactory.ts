/** Request imports */
import { StartupRequest,
         LoginRequest,
         PressButtonRequest,
         OpenScreenRequest,
         LogoutRequest,
         DeviceStatusRequest,
         SelectRowRequest,
         FetchRequest,
         SetValuesRequest,
         FilterRequest,
         SetValueRequest,
         TabRequest,
         DALSaveRequest,
         CloseScreenRequest,
         SelectTreeRequest, 
         SortRequest,
         InsertRecordRequest,
         BaseRequest,
         ComponentRequest,
         DataProviderRequest,
         ChangePasswordRequest,
         ResetPasswordRequest,
         SetScreenParameterRequest,
         MouseRequest,
         MouseClickedRequest,
         SaveRequest,
         ReloadRequest,
         UIRefreshRequest,
         RollbackRequest,
         ChangesRequest,
         FocusGainedRequest,
         FocusLostRequest,
         CloseFrameRequest,
         CloseContentRequest} from "../request";

/**
 * Returns the ClientId from the local storage
 * @returns the ClientId from the local storage
 */
export const getClientId = (): string => {
    return sessionStorage.getItem("clientId") || "ClientIdNotFound"
}

/**
 * Returns a StartupRequest object with either values which can be overwritten or properties as parameters
 * @param values - properties for the startupRequest
 * @returns a StartupRequest object
 */
export const createStartupRequest = (values?: StartupRequest): StartupRequest => {
    const req: StartupRequest = {
        appMode: values?.appMode || "full",
        applicationName: values?.applicationName,

        authKey: values?.authKey,
        userName: values?.userName,
        password: values?.password,

        osName: values?.osName,
        osVersion: values?.osVersion,
        technology: values?.technology || "react",

        screenWidth: values?.screenWidth || 1920,
        screenHeight: values?.screenHeight || 1080,

        deviceMode: values?.deviceMode || "desktop",

        deviceType: values?.deviceType || 'Browser',
        deviceTypeModel: values?.deviceTypeModel || navigator.userAgent,

        readAheadLimit: values?.readAheadLimit
    }
    return  req;
}

/**
 * Returns a base-request object with either properties which can be overwritten or properties as parameters
 * @param values - properties for the base-request
 * @returns a base-request object
 */
export const createBaseRequest = (values?: BaseRequest): BaseRequest => {
    const req: BaseRequest = {
        clientId: values?.clientId || getClientId()
    }
    return req;
}

/**
 * Returns a component-request object with either properties which can be overwritten or properties as parameters
 * @param values - properties for the component-request
 * @returns a component-request object
 */
export const createComponentRequest = (values?: ComponentRequest): ComponentRequest => {
    const req: ComponentRequest = {
        clientId: values?.clientId || getClientId(),
        componentId: values?.componentId
    }
    return req;
}

export const createDataProviderRequest = (values?: DataProviderRequest): DataProviderRequest => {
    const req: DataProviderRequest = {
        clientId: values?.clientId || getClientId(),
        dataProvider: values?.dataProvider
    }
    return req;
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
        newPassword: values?.newPassword,
        mode: values?.mode
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
        componentId: values?.componentId,
        className: values?.className,
        parameter: values?.parameter
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
        filter: values?.filter,
        selectedColumn: values?.selectedColumn
    }
    return req
}

/**
 * Returns a selectTreeRequest object with either properties which can be overwritten or properties as parameters
 * @param values - properties for the selectRowRequest
 * @returns a selectRowRequest object
 */
export const createSelectTreeRequest = (values?: SelectTreeRequest): SelectTreeRequest => {
    const req:SelectTreeRequest = {
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
        rowCount: values?.rowCount,
        includeMetaData: values?.includeMetaData
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
        values: values?.values,
        filter: values?.filter
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
export const createDALSaveRequest = (values?: DALSaveRequest): DALSaveRequest => {
    const req:DALSaveRequest = {
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
        componentId: values?.componentId,
        className: values?.className,
        parameter: values?.parameter
    };
    return req;
}

/**
 * Returns a sort-request object with either properties which can be overwritten or properties as parameters
 * @param values - properties for the sort-request
 * @returns a sort-request object
 */
export const createSortRequest = (values?: SortRequest): SortRequest => {
    const req:SortRequest = {
        clientId: values?.clientId || getClientId(),
        dataProvider: values?.dataProvider,
        sortDefinition: values?.sortDefinition
    };
    return req;
}

/**
 * Returns a insert-record-request object with either properties which can be overwritten or properties as parameters
 * @param values - properties for the insert-record-request
 * @returns a insert-record-request object
 */
export const createInsertRecordRequest = (values?: InsertRecordRequest): InsertRecordRequest => {
    const req:InsertRecordRequest = {
        clientId: values?.clientId || getClientId(),
        dataProvider: values?.dataProvider
    }
    return req;
}

/**
 * Returns a change-password-request object with either properties which can be overwritten or properties as parameters
 * @param values - properties for the change-password-request
 * @returns a change-password-request object
 */
export const createChangePasswordRequest = (values?: ChangePasswordRequest): ChangePasswordRequest => {
    const req:ChangePasswordRequest = {
        clientId: values?.clientId || getClientId(),
        password: values?.password,
        newPassword: values?.newPassword
    }
    return req;
}

/**
 * Returns a reset-password-request object with either properties which can be overwritten or properties as parameters
 * @param values - properties for the reset-password-request
 * @returns a reset-password-request object
 */
export const createResetPasswordRequest = (values?: ResetPasswordRequest): ResetPasswordRequest => {
    const req:ResetPasswordRequest = {
        clientId: values?.clientId || getClientId(),
        identifier: values?.identifier
    }
    return req;
}

/**
 * Returns a set-screen-parameter-request object with either properties which can be overwritten or properties as parameters
 * @param values - properties for the set-screen-parameter-request
 * @returns a set-screen-parameter-request object
 */
export const createSetScreenParameterRequest = (values?: SetScreenParameterRequest): SetScreenParameterRequest => {
    const req:SetScreenParameterRequest = {
        clientId: values?.clientId || getClientId(),
        componentId: values?.componentId,
        parameter: values?.parameter
    }
    return req;
}

/**
 * Returns a mouse-request object with either properties which can be overwritten or properties as parameters
 * @param values - properties for the mouse-request
 * @returns a mouse-request object
 */
export const createMouseRequest = (values?: MouseRequest): MouseRequest => {
    const req:MouseRequest = {
        clientId: values?.clientId || getClientId(),
        componentId: values?.componentId,
        button: values?.button,
        x: values?.x,
        y: values?.y
    }
    return req;
}

/**
 * Returns a mouse-clicked-request object with either properties which can be overwritten or properties as parameters
 * @param values - properties for the mouse-clicked-request
 * @returns a mouse-clicked-request object
 */
 export const createMouseClickedRequest = (values?: MouseClickedRequest): MouseClickedRequest => {
    const req:MouseClickedRequest = {
        clientId: values?.clientId || getClientId(),
        componentId: values?.componentId,
        button: values?.button,
        x: values?.x,
        y: values?.y,
        clickCount: values?.clickCount
    }
    return req;
}

/**
 * Returns a save-request object with either properties which can be overwritten or properties as parameters
 * @param values - properties for the save-request
 * @returns a save-request object
 */
export const createSaveRequest = (values?: SaveRequest) : SaveRequest => {
    const req:SaveRequest = {
        clientId: values?.clientId || getClientId()
    }
    return req;
}

/**
 * Returns a save-request object with either properties which can be overwritten or properties as parameters
 * @param values - properties for the save-request
 * @returns a save-request object
 */
export const createReloadRequest = (values?: ReloadRequest): ReloadRequest => {
    const req: ReloadRequest = {
        clientId: values?.clientId || getClientId()
    }
    return req;
}

/**
 * Returns a ui-refresh-request object with either properties which can be overwritten or properties as parameters
 * @param values - properties for the ui-refresh-request
 * @returns a ui-refresh-request object
 */
export const createUIRefreshRequest = (values?: UIRefreshRequest): UIRefreshRequest => {
    const req: UIRefreshRequest = {
        clientId: values?.clientId || getClientId()
    }
    return req;
}

/**
 * Returns a rollback-request object with either properties which can be overwritten or properties as parameters
 * @param values - properties for the rollback-request
 * @returns a rollback-request object
 */
export const createRollbackRequest = (values?: RollbackRequest): RollbackRequest => {
    const req: RollbackRequest = {
        clientId: values?.clientId || getClientId()
    }
    return req;
}

/**
 * Returns a changes-request object with either properties which can be overwritten or properties as parameters
 * @param values - properties for the changes-request
 * @returns a changes-request object
 */
export const createChangesRequest = (values?: ChangesRequest): ChangesRequest => {
    const req: ChangesRequest = {
        clientId: values?.clientId || getClientId()
    }
    return req;
}

/**
 * Returns a focus-gained-request object with either properties which can be overwritten or properties as parameters
 * @param values - properties for the focus-gained-request
 * @returns a focus-gained-request object
 */
 export const createFocusGainedRequest = (values?: FocusGainedRequest): FocusGainedRequest => {
    const req: FocusGainedRequest = {
        clientId: values?.clientId || getClientId(),
        componentId: values?.componentId
    }
    return req;
}

/**
 * Returns a focus-lost-request object with either properties which can be overwritten or properties as parameters
 * @param values - properties for the focus-lost-request
 * @returns a focus-lost-request object
 */
 export const createFocusLostRequest = (values?: FocusLostRequest): FocusLostRequest => {
    const req: FocusLostRequest = {
        clientId: values?.clientId || getClientId(),
        componentId: values?.componentId
    }
    return req;
}

/**
 * Returns a close-frame-request object with either properties which can be overwritten or properties as parameters
 * @param values - properties for the close-frame-request
 * @returns a close-frame-request object
 */
 export const createCloseFrameRequest = (values?: CloseFrameRequest): CloseFrameRequest => {
    const req: CloseFrameRequest = {
        clientId: values?.clientId || getClientId(),
        componentId: values?.componentId
    }
    return req;
}

/**
 * Returns a close-content-request object with either properties which can be overwritten or properties as parameters
 * @param values - properties for the close-content-request
 * @returns a close-content-request object
 */
 export const createCloseContentRequest = (values?: CloseContentRequest): CloseContentRequest => {
    const req: CloseContentRequest = {
        clientId: values?.clientId || getClientId(),
        componentId: values?.componentId
    }
    return req;
}