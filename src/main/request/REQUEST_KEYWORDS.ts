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

/** Enum to get the key to find the right request-endpoint */
enum REQUEST_KEYWORDS {
    //application/UI
    STARTUP = "startup",
    UI_REFRESH = "ui_refresh",
    DEVICE_STATUS = "device_status",
    CLOSE_FRAME = "close_frame",
    OPEN_SCREEN = "open_screen",
    CLOSE_SCREEN = "close_screen",
    CLOSE_CONTENT = "close_content",
    REOPEN_SCREEN = "reopen_screen",
    EXIT = "exit",

    //login
    LOGIN = "login",
    LOGOUT = "logout",
    CHANGE_PASSWORD = "change_password",
    RESET_PASSWORD = "reset_password",
    CANCEL_LOGIN = "cancel_login",

    //events
    PRESS_BUTTON = "press_button",
    MOUSE_CLICKED = "mouse_clicked",
    MOUSE_PRESSED = "mouse_pressed",
    MOUSE_RELEASED = "mouse_released",
    FOCUS_GAINED = "focus_gained",
    FOCUS_LOST = "focus_lost",

    //upload
    UPLOAD = "upload",

    //data
    METADATA = "metadata",
    FETCH = "fetch",
    SELECT_ROW = "select_row",
    SELECT_TREE = "select_tree",
    SELECT_COLUMN = "select_column",
    DELETE_RECORD = "delete_record",
    INSERT_RECORD = "insert_record",
    SET_VALUES = "set_values",
    FILTER = "filter",
    DAL_SAVE = "dal_save",
    SORT = "sort",

    //comp
    SET_VALUE = "set_value",
    SELECT_TAB = "select_tab",
    CLOSE_TAB = "close_tab",
    CLOSE_POPUP_MENU = "close_popup_menu",
    BOUNDS = "bounds",

    //other
    SAVE = "save",
    SET_SCREEN_PARAMETER = "set_screen_parameter",
    RELOAD = "reload",
    ROLLBACK = "rollback",
    CHANGES = "changes",
    ALIVE = "alive"
}
export default REQUEST_KEYWORDS