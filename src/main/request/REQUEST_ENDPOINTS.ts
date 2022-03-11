/** Enum for server request endpoints */
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
    META_DATA="/v2/api/dal/metaData",
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

    //remaining v1
    LOGIN = "/api/v2/login",
    LOGOUT = "/api/logout",
    CLOSE_SCREEN = "/api/closeScreen",
    OPEN_SCREEN = "/api/v2/openScreen",
    UPLOAD = "/upload",
    CHANGE_PASSWORD = "/api/changePassword",
    RESET_PASSWORD = "/api/resetPassword",
    SET_SCREEN_PARAMETER = "/api/setScreenParameter",
    RELOAD = "/api/reload",
    ROLLBACK = "/api/rollback",
    CHANGES = "/api/changes",
    CLOSE_CONTENT = "/api/closeContent",
    REOPEN_SCREEN = "/api/reopenScreen",
    SAVE = "/api/save"
}
export default REQUEST_ENDPOINTS