/* Copyright 2022 SIB Visions GmbH
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

/** Request imports */
import AboutRequest from "../request/application-ui/AboutRequest";
import CloseContentRequest from "../request/application-ui/CloseContentRequest";
import CloseFrameRequest from "../request/application-ui/CloseFrameRequest";
import CloseScreenRequest from "../request/application-ui/CloseScreenRequest";
import DeviceStatusRequest from "../request/application-ui/DeviceStatusRequest";
import OpenScreenRequest from "../request/application-ui/OpenScreenRequest";
import StartupRequest from "../request/application-ui/StartupRequest";
import UIRefreshRequest from "../request/application-ui/UIRefreshRequest";
import BaseRequest from "../request/BaseRequest";
import BoundsRequest from "../request/comp/BoundsRequest";
import ComponentRequest from "../request/comp/ComponentRequest";
import SetValueRequest from "../request/comp/SetValueRequest";
import TabRequest from "../request/comp/TabRequest";
import DALSaveRequest from "../request/data/DALSaveRequest";
import DataProviderRequest from "../request/data/DataProviderRequest";
import FetchRequest from "../request/data/FetchRequest";
import FilterRequest from "../request/data/FilterRequest";
import InsertRecordRequest from "../request/data/InsertRecordRequest";
import SelectRowRequest from "../request/data/SelectRowRequest";
import SelectTreeRequest from "../request/data/SelectTreeRequest";
import SetValuesRequest from "../request/data/SetValuesRequest";
import SortRequest from "../request/data/SortRequest";
import WidthRequest from "../request/data/WidthRequest";
import DispatchActionRequest from "../request/events/DispatchActionRequest";
import FocusGainedRequest from "../request/events/FocusGainedRequest";
import FocusLostRequest from "../request/events/FocusLostRequest";
import MouseClickedRequest from "../request/events/MouseClickedRequest";
import MouseRequest from "../request/events/MouseRequest";
import PressButtonRequest from "../request/events/PressButtonRequest";
import CancelLoginRequest from "../request/login/CancelLoginRequest";
import ChangePasswordRequest from "../request/login/ChangePasswordRequest";
import LoginRequest from "../request/login/LoginRequest";
import LogoutRequest from "../request/login/LogoutRequest";
import ResetPasswordRequest from "../request/login/ResetPasswordRequest";
import AliveRequest from "../request/other/AliveRequest";
import ChangesRequest from "../request/other/ChangesRequest";
import ReloadRequest from "../request/other/ReloadRequest";
import RollbackRequest from "../request/other/RollbackRequest";
import SaveRequest from "../request/other/SaveRequest";
import SetParameterRequest from "../request/other/SetParameterRequest";
import SetScreenParameterRequest from "../request/other/SetScreenParameterRequest";

/**
 * Returns the ClientId from the local storage
 * @returns the ClientId from the local storage
 */
export const getClientId = (): string => {
    return sessionStorage.getItem("clientId") || "ClientIdNotFound"
}

const mobileCheck = () => {
    let check = false;
    (function (a) { if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substring(0, 4))) check = true; })(navigator.userAgent);
    return check;
};

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

        osName: values?.osName || navigator.platform,
        osVersion: values?.osVersion,
        technology: values?.technology || "react",

        screenWidth: values?.screenWidth || 1920,
        screenHeight: values?.screenHeight || 1080,

        deviceMode: values?.deviceMode || "desktop",
        // Maybe needed in the future
        //deviceMode: values?.deviceMode || mobileCheck() ? "mobile" : "desktop",

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

/**
 * Returns a dataProvider-request object with either properties which can be overwritten or properties as parameters
 * @param values - properties for the dataProvider-request
 * @returns a dataProvider-request object
 */
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
        mode: values?.mode,
        confirmationCode: values?.confirmationCode
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
 * Returns a dispatchActionRequest object with either properties which can be overwritten or properties as parameters
 * @param values - properties for the dispatchActionRequest
 * @returns a dispatchActionRequest object
 */
export const createDispatchActionRequest = (values?:DispatchActionRequest): DispatchActionRequest => {
    const req: DispatchActionRequest = {
        clientId: values?.clientId || getClientId(),
        componentId: values?.componentId,
        isUploadButton: values?.isUploadButton
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
        selectedColumn: values?.selectedColumn,
        rowNumber: values?.rowNumber
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
        filter: values?.filter,
        rowNumber: values?.rowNumber,
        editorColumnName: values?.editorColumnName
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
 * Returns a set-parameter-request object with either properties which can be overwritten or properties as parameters
 * @param values - properties for the set-screen-parameter-request
 * @returns a set-parameter-request object
 */
export const createSetParameterRequest = (values?: SetParameterRequest): SetParameterRequest => {
    const req:SetScreenParameterRequest = {
        clientId: values?.clientId || getClientId(),
        parameter: values?.parameter
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

/**
 * Returns a bounds-request object with either properties which can be overwritten or properties as parameters
 * @param values - properties for the bounds-request
 * @returns a bounds-request object
 */
 export const createBoundsRequest = (values?: BoundsRequest): BoundsRequest => {
    const req:BoundsRequest = {
        clientId: values?.clientId || getClientId(),
        componentId: values?.componentId,
        width: values?.width,
        height: values?.height,
        x: values?.x,
        y: values?.y,
    }
    return req;
}

/**
 * Returns a cancel-login-request object with either properties which can be overwritten or properties as parameters
 * @param values - properties for the cancel-login-request
 * @returns a cancel-login-request object
 */
export const createCancelLoginRequest = (values?: CancelLoginRequest) => {
    const req:CancelLoginRequest = {
        clientId: values?.clientId || getClientId()
    }
    return req;
}

/**
 * Returns an alive-request object with either properties which can be overwritten or properties as parameters
 * @param values - properties for the alive-request
 * @returns an alive-request object
 */
export const createAliveRequest = (values?: AliveRequest): AliveRequest => {
    const req:AliveRequest = {
        clientId: values?.clientId || getClientId()
    }
    return req;
}

/**
 * Returns an about-request object with either properties which can be overwritten or properties as parameters
 * @param values - properties for the about-request
 * @returns an alive-request object
 */
 export const createAboutRequest = (values?: AboutRequest): AboutRequest => {
    const req:AboutRequest = {
        clientId: values?.clientId || getClientId()
    }
    return req;
}

export const createWidthRequest = (values?: WidthRequest): WidthRequest => {
    const req:WidthRequest = {
        clientId: values?.clientId || getClientId(),
        columnName: values?.columnName,
        width: values?.width,
        dataProvider: values?.dataProvider
    }
    return req;
}