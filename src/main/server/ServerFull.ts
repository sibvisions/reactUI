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

import COMPONENT_CLASSNAMES from "../components/COMPONENT_CLASSNAMES";
import { IPanel } from "../components/panels/panel/UIPanel";
import REQUEST_KEYWORDS from "../request/REQUEST_KEYWORDS";
import RESPONSE_NAMES from "../response/RESPONSE_NAMES";
import CloseScreenResponse from "../response/ui/CloseScreenResponse";
import UIResponse from "../response/ui/UIResponse";
import BaseServer from "./BaseServer";

/** Enum for server request endpoints version 2 */
enum REQUEST_ENDPOINTS {
    //application/UI
    STARTUP = "/v2/api/startup",
    EXIT = "/v2/api/exit",
    DEVICE_STATUS="/v2/api/deviceStatus",
    UI_REFRESH = "/v2/api/uiRefresh",
    CLOSE_FRAME = "/v2/api/closeFrame",

    //events
    DISPATCH_ACTION = "/v2/api/dispatchAction",
    MOUSE_CLICKED = "/v2/api/mouseClicked",
    MOUSE_PRESSED = "/v2/api/mousePressed",
    MOUSE_RELEASED = "/v2/api/mouseReleased",
    FOCUS_GAINED = "/v2/api/focusGained",
    FOCUS_LOST = "/v2/api/focusLost",

    //data
    METADATA="/v2/api/dal/metaData",
    FETCH="/v2/api/dal/fetch",
    SELECT_ROW = "/v2/api/dal/selectRecord",
    SELECT_TREE = "/v2/api/dal/selectRecordTree",
    SELECT_COLUMN = "/v2/api/dal/selectColumn",
    DELETE_RECORD = "/v2/api/dal/deleteRecord",
    INSERT_RECORD = "/v2/api/dal/insertRecord",
    SET_VALUES = "/v2/api/dal/setValues",
    FILTER = "/v2/api/dal/filter",
    DAL_SAVE = "/v2/api/dal/save",
    SORT = "/v2/api/dal/sort",

    //comp
    SET_VALUE = "/v2/api/comp/setValue",
    SELECT_TAB = "/v2/api/comp/selectTab",
    CLOSE_TAB = "/v2/api/comp/closeTab",
    CLOSE_POPUP_MENU = "/v2/api/comp/closePopupMenu ",
    BOUNDS = "/v2/api/comp/bounds",

    //other
    ALIVE = "/v2/api/alive",

    //remaining v1
    LOGIN = "/api/v2/login",
    LOGOUT = "/api/logout",
    CLOSE_SCREEN = "/api/closeScreen",
    OPEN_SCREEN = "/api/v3/openScreen",
    UPLOAD = "/upload",
    CHANGE_PASSWORD = "/api/changePassword",
    RESET_PASSWORD = "/api/resetPassword",
    SET_SCREEN_PARAMETER = "/api/setScreenParameter",
    RELOAD = "/api/reload",
    ROLLBACK = "/api/rollback",
    CHANGES = "/api/changes",
    CLOSE_CONTENT = "/api/closeContent",
    REOPEN_SCREEN = "/api/v3/reopenScreen",
    SAVE = "/api/save",
    WIDTH = "/api/dal/width"
}

export default class ServerFull extends BaseServer {
    /**
     * Returns true if the component exists
     * @param name - the name of the component
     */
    componentExists(name:string) {
        for (let [, value] of this.contentStore.flatContent.entries()) {
            if (value.name === name) {
                return true;
            }
        }

        for (let [, value] of this.contentStore.replacedContent.entries()) {
            if (value.name === name) {
                return true;
            }
        }

        return false;
    }

    // A Map which contains the request-keyword as key and the server endpoint as value
    endpointMap: Map<string, string> = new Map<string, string>()
    .set(REQUEST_KEYWORDS.OPEN_SCREEN, REQUEST_ENDPOINTS.OPEN_SCREEN)
    .set(REQUEST_KEYWORDS.CLOSE_SCREEN, REQUEST_ENDPOINTS.CLOSE_SCREEN)
    .set(REQUEST_KEYWORDS.CLOSE_CONTENT, REQUEST_ENDPOINTS.CLOSE_CONTENT)
    .set(REQUEST_KEYWORDS.REOPEN_SCREEN, REQUEST_ENDPOINTS.REOPEN_SCREEN)
    .set(REQUEST_KEYWORDS.EXIT, REQUEST_ENDPOINTS.EXIT)
    .set(REQUEST_KEYWORDS.LOGIN, REQUEST_ENDPOINTS.LOGIN)
    .set(REQUEST_KEYWORDS.LOGOUT, REQUEST_ENDPOINTS.LOGOUT)
    .set(REQUEST_KEYWORDS.CHANGE_PASSWORD, REQUEST_ENDPOINTS.CHANGE_PASSWORD)
    .set(REQUEST_KEYWORDS.RESET_PASSWORD, REQUEST_ENDPOINTS.RESET_PASSWORD)
    .set(REQUEST_KEYWORDS.UPLOAD, REQUEST_ENDPOINTS.UPLOAD)
    .set(REQUEST_KEYWORDS.BOUNDS, REQUEST_ENDPOINTS.BOUNDS)
    .set(REQUEST_KEYWORDS.SAVE, REQUEST_ENDPOINTS.SAVE)
    .set(REQUEST_KEYWORDS.SET_SCREEN_PARAMETER, REQUEST_ENDPOINTS.SET_SCREEN_PARAMETER)
    .set(REQUEST_KEYWORDS.RELOAD, REQUEST_ENDPOINTS.RELOAD)
    .set(REQUEST_KEYWORDS.ROLLBACK, REQUEST_ENDPOINTS.ROLLBACK)
    .set(REQUEST_KEYWORDS.CHANGES, REQUEST_ENDPOINTS.CHANGES)
    .set(REQUEST_KEYWORDS.STARTUP, REQUEST_ENDPOINTS.STARTUP)
    .set(REQUEST_KEYWORDS.UI_REFRESH, REQUEST_ENDPOINTS.UI_REFRESH)
    .set(REQUEST_KEYWORDS.DEVICE_STATUS, REQUEST_ENDPOINTS.DEVICE_STATUS)
    .set(REQUEST_KEYWORDS.CLOSE_FRAME, REQUEST_ENDPOINTS.CLOSE_FRAME)
    .set(REQUEST_KEYWORDS.PRESS_BUTTON, REQUEST_ENDPOINTS.DISPATCH_ACTION)
    .set(REQUEST_KEYWORDS.MOUSE_CLICKED, REQUEST_ENDPOINTS.MOUSE_CLICKED)
    .set(REQUEST_KEYWORDS.MOUSE_PRESSED, REQUEST_ENDPOINTS.MOUSE_PRESSED)
    .set(REQUEST_KEYWORDS.MOUSE_RELEASED, REQUEST_ENDPOINTS.MOUSE_RELEASED)
    .set(REQUEST_KEYWORDS.FOCUS_GAINED, REQUEST_ENDPOINTS.FOCUS_GAINED)
    .set(REQUEST_KEYWORDS.FOCUS_LOST, REQUEST_ENDPOINTS.FOCUS_LOST)
    .set(REQUEST_KEYWORDS.METADATA, REQUEST_ENDPOINTS.METADATA)
    .set(REQUEST_KEYWORDS.FETCH, REQUEST_ENDPOINTS.FETCH)
    .set(REQUEST_KEYWORDS.SELECT_ROW, REQUEST_ENDPOINTS.SELECT_ROW)
    .set(REQUEST_KEYWORDS.SELECT_TREE, REQUEST_ENDPOINTS.SELECT_TREE)
    .set(REQUEST_KEYWORDS.SELECT_COLUMN, REQUEST_ENDPOINTS.SELECT_COLUMN)
    .set(REQUEST_KEYWORDS.DELETE_RECORD, REQUEST_ENDPOINTS.DELETE_RECORD)
    .set(REQUEST_KEYWORDS.INSERT_RECORD, REQUEST_ENDPOINTS.INSERT_RECORD)
    .set(REQUEST_KEYWORDS.SET_VALUES, REQUEST_ENDPOINTS.SET_VALUES)
    .set(REQUEST_KEYWORDS.FILTER, REQUEST_ENDPOINTS.FILTER)
    .set(REQUEST_KEYWORDS.DAL_SAVE, REQUEST_ENDPOINTS.DAL_SAVE)
    .set(REQUEST_KEYWORDS.SORT, REQUEST_ENDPOINTS.SORT)
    .set(REQUEST_KEYWORDS.SET_VALUE, REQUEST_ENDPOINTS.SET_VALUE)
    .set(REQUEST_KEYWORDS.SELECT_TAB, REQUEST_ENDPOINTS.SELECT_TAB)
    .set(REQUEST_KEYWORDS.CLOSE_TAB, REQUEST_ENDPOINTS.CLOSE_TAB)
    .set(REQUEST_KEYWORDS.CLOSE_POPUP_MENU, REQUEST_ENDPOINTS.CLOSE_POPUP_MENU)
    .set(REQUEST_KEYWORDS.CLOSE_POPUP_MENU, REQUEST_ENDPOINTS.CLOSE_POPUP_MENU)
    .set(REQUEST_KEYWORDS.ALIVE, REQUEST_ENDPOINTS.ALIVE);

    /** A Map which checks which function needs to be called when a response is received, for data responses */
    dataResponseMap: Map<string, Function> = new Map()
    .set(RESPONSE_NAMES.DAL_FETCH, this.processFetch.bind(this))
    .set(RESPONSE_NAMES.DAL_META_DATA, this.processMetaData.bind(this))
    .set(RESPONSE_NAMES.DAL_DATA_PROVIDER_CHANGED, this.processDataProviderChanged.bind(this));

    /** A Map which checks which function needs to be called when a response is received */
    responseMap = new Map<string, Function>()
    .set(RESPONSE_NAMES.APPLICATION_META_DATA, this.applicationMetaData.bind(this))
    // .set(RESPONSE_NAMES.UPLOAD, this.upload.bind(this))
    // .set(RESPONSE_NAMES.DOWNLOAD, this.download.bind(this))
    //.set(RESPONSE_NAMES.SHOW_DOCUMENT, this.showDocument.bind(this))
    .set(RESPONSE_NAMES.SESSION_EXPIRED, this.sessionExpired.bind(this))
    //.set(RESPONSE_NAMES.ERROR, this.showError.bind(this))
    //.set(RESPONSE_NAMES.RESTART, this.showRestart.bind(this))
    //.set(RESPONSE_NAMES.APPLICATION_PARAMETERS, this.applicationParameters.bind(this))
    //.set(RESPONSE_NAMES.INFORMATION, this.showInfo.bind(this))
    //.set(RESPONSE_NAMES.APPLICATION_SETTINGS, this.applicationSettings.bind(this))
    .set(RESPONSE_NAMES.DEVICE_STATUS, this.deviceStatus.bind(this))
    //.set(RESPONSE_NAMES.WELCOME_DATA, this.welcomeData.bind(this))
    //.set(RESPONSE_NAMES.CLOSE_FRAME, this.closeFrame.bind(this))
    //.set(RESPONSE_NAMES.CLOSE_CONTENT, this.closeContent.bind(this))
    .set(RESPONSE_NAMES.UI, this.handleUIResponse.bind(this))
    .set(RESPONSE_NAMES.BAD_CLIENT, this.badClient.bind(this));


    /**
     * Returns the current screen-name
     * @param dataProvider 
     * @returns 
     */
    getScreenName(dataProvider: string): string {
        return dataProvider.split("/")[1];
    }

    /** Handles the UI Response sent by the server and initialises the UI changes */
    handleUIResponse(uiData:UIResponse) {
        let firstComp:IPanel|undefined
        if(uiData.changedComponents && uiData.changedComponents.length) {
            this.contentStore.updateContent(uiData.changedComponents, false);
            firstComp = uiData.changedComponents[0] as IPanel;
            if (firstComp.className === COMPONENT_CLASSNAMES.MOBILELAUNCHER) {
                this.contentStore.activeScreens = [{ name: firstComp.name, id: firstComp.id, className: firstComp.className }]
                this.subManager.emitActiveScreens();
            }
        }
    }

    closeScreen(closeScreenData: CloseScreenResponse): void {
        
    }
}