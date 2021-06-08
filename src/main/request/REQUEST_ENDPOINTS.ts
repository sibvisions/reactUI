/** Enum for server request endpoints */
enum REQUEST_ENDPOINTS  {
    STARTUP = "/api/startup",
    LOGIN = "/api/v2/login",
    LOGOUT = "/api/logout",
    CLOSE_SCREEN = "/api/closeScreen",
    PRESS_BUTTON = "/api/v2/pressButton",
    OPEN_SCREEN = "/api/v2/openScreen",
    DEVICE_STATUS = "/api/deviceStatus",
    UPLOAD = "/upload",
    INSERT_RECORD = "/api/dal/insertRecord",
    SELECT_ROW = "/api/dal/selectRecord",
    SELECT_COLUMN = "/api/dal/selectColumn",
    SELECT_TREE = "/api/dal/selectRecordTree",
    FETCH = "/api/dal/fetch",
    FILTER = "/api/dal/filter",
    SET_VALUE = "/api/comp/setValue",
    SET_VALUES = "/api/dal/setValues",
    SELECT_TAB = "/api/comp/selectTab",
    CLOSE_TAB = "/api/comp/closeTab",
    SAVE = "/api/dal/save",
    SORT = "/api/dal/sort"
}
export default REQUEST_ENDPOINTS