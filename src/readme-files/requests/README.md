# Available Requests

## createStartupRequest(values?: StartupRequest)
Returns a StartupRequest object with either values which can be overwritten or properties as parameters.

Name | Type | Description
--- | --- | --- |
[key:string] | any | you are able to pass any property in the StartupRequest. Commonly used (appMode, applicationName, authKey, userName, password, osName, osVersion, technology, screenWidthm screenHeight, deviceMode, deviceType, deviceTypeModel, readAheadLimit)

### Usage
```typescript
    const startupReq = createStartupRequest();
    startupReq.applicationName = "demo";
    startupReq.userName = "abcdef";
    startupReq.password = "123456";
    startupReq.technology = "react";
    startupReq.langCode = "en";
    startupReq.deviceMode = "desktop";
    startupReq.deviceTypeModel = navigator.userAgent;
    startupReq.screenWidth = window.innerWidth;
    startupReq.screenHeight = window.innerHeight;
    api.sendRequest(startupReq, REQUEST_KEYWORDS.STARTUP);
```

## createBaseRequest(values?: BaseRequest)
Returns a base-request object with either properties which can be overwritten or properties as parameters.

Mostly the BaseRequest is not used on its own, other Requests always (except startup) extend the BaseRequest. 

Name | Type | Description
--- | --- | --- |
clientId | string | The clientId that is sent by the server, **doesn't have to be set it will be set automatically**.

### Usage
```typescript
    const req = createBaseRequest();
    api.sendRequest(req, REQUEST_KEYWORDS.ALIVE);
```

## createComponentRequest(values?: ComponentRequest)
Returns a component-request object with either properties which can be overwritten or properties as parameters.

Mostly the ComponentRequest is not used on its own, some Requests extend the ComponentRequest.

Name | Type | Description
--- | --- | --- |
clientId | string | The clientId that is sent by the server, **doesn't have to be set it will be set automatically**.
componentId | string, undefined | The name of the component which calls the action/is being changed.

### Usage
```typescript
    const req = createComponentRequest();
    req.componentId = props.name;
    api.sendRequest(req, REQUEST_KEYWORDS.CLOSE_POPUP_MENU);
```

## createDataProviderRequest(values?: DataProviderRequest)
Returns a dataProvider-request object with either properties which can be overwritten or properties as parameters. 

Mostly the DataProviderRequest is not used on its own, some Requests extend the DataProviderRequest.

Name | Type | Description
--- | --- | --- |
clientId | string | The clientId that is sent by the server, **doesn't have to be set it will be set automatically**.
dataProvider | string, string[], undefined | The dataprovider(s) you want to get information from or change

### Usage
```typescript
    const req = createDataProviderRequest();
    req.dataProvider = props.dataRow;
    api.sendRequest(req, REQUEST_KEYWORDS.FETCH);
```

## createLoginRequest(values?: LoginRequest)
Returns a loginRequest object with either properties which can be overwritten or properties as parameters. 

Login for an application. The LoginRequest has some extra properties for **different modes**!

Name | Type | Description
--- | --- | --- |
clientId | string | The clientId that is sent by the server, **doesn't have to be set it will be set automatically**.
username | string, undefined | The username of the user to log in.
password | string, undefined | The password of the user to log in.
newPassword | string, undefined | The new password when the password is being changed.
mode | LoginModeType, undefined | The current mode of the login.
createAuthKey | boolean | Whether an authKey for automatic login should be created.
confirmationCode | string, undefined | The confirmation code when using multi factor authentication.

## Usage
```typescript
    const loginReq = createLoginRequest();
    loginReq.username = changePWData.username;
    loginReq.password = changePWData.password;
    loginReq.newPassword = changePWData.newPassword;
    loginReq.mode = context.appSettings.loginMode;
    loginReq.createAuthKey = false;
    api.sendRequest(loginReq, REQUEST_KEYWORDS.LOGIN);
```

## createLogoutRequest(values?: LogoutRequest)
Returns a logoutRequest object with either properties which can be overwritten or properties as parameters.

Logs the currently logged in user out.

Name | Type | Description
--- | --- | --- |
clientId | string | The clientId that is sent by the server, **doesn't have to be set it will be set automatically**.

### Usage
```typescript
    const logoutRequest = createLogoutRequest();
    api.sendRequest(logoutRequest, REQUEST_KEYWORDS.LOGOUT)
```

## createChangePasswordRequest(values?: ChangePasswordRequest)
Returns a change-password-request object with either properties which can be overwritten or properties as parameters.

Changes the password of the current user.

Name | Type | Description
--- | --- | --- |
clientId | string | The clientId that is sent by the server, **doesn't have to be set it will be set automatically**.
password | string, undefined | The password of the user.
newPassword | string, undefined | The new password of the user.

### Usage
```typescript
    const changeReq = createChangePasswordRequest();
    changeReq.password = changePWData.password;
    changeReq.newPassword = changePWData.newPassword;
    api.sendRequest(changeReq, REQUEST_KEYWORDS.CHANGE_PASSWORD);
```

## createResetPassword(values?: ResetPasswordRequest)
Returns a reset-password-request object with either properties which can be overwritten or properties as parameters.

Is used to reset a user's password

Name | Type | Description
--- | --- | --- |
clientId | string | The clientId that is sent by the server, **doesn't have to be set it will be set automatically**.
identifier | string, undefined | The identifier (email) of the user to send the code to.

### Usage 
```typescript
        const resetReq = createResetPasswordRequest();
        resetReq.identifier = email;
        api.sendRequest(resetReq, REQUEST_KEYWORDS.RESET_PASSWORD);
```

## createCancelLoginRequest(values?: CancelLoginRequest)
Returns a cancel-login-request object with either properties which can be overwritten or properties as parameters.

Is used when you want to cancel a login-attempt with multi factor authentication.

Name | Type | Description
--- | --- | --- |
clientId | string | The clientId that is sent by the server, **doesn't have to be set it will be set automatically**.

### Usage
```typescript
    api.sendRequest(createCancelLoginRequest(), REQUEST_KEYWORDS.CANCEL_LOGIN)
```

## createPressButtonRequest(values?: PressButtonRequest)
Returns a pressButtonRequest object with either properties which can be overwritten or properties as parameters.

Is used when pressing a button.

Name | Type | Description
--- | --- | --- |
clientId | string | The clientId that is sent by the server, **doesn't have to be set it will be set automatically**.
componentId | string, undefined | The name of the component which calls the action.

## Usage
```typescript
    const req = createPressButtonRequest();
    req.componentId = props.name;
    api.sendRequest(req, REQUEST_KEYWORDS.PRESS_BUTTON);
```

## createDispatchAction(values?:DispatchActionRequest)
Returns a dispatchActionRequest object with either properties which can be overwritten or properties as parameters.

Is used when pressing a button.

Name | Type | Description
--- | --- | --- |
clientId | string | The clientId that is sent by the server, **doesn't have to be set it will be set automatically**.
componentId | string, undefined | The name of the component which calls the action.

### Usage
```typescript
    const req = createDispatchActionRequest();
    req.componentId = props.name;
    api.sendRequest(req, REQUEST_KEYWORDS.PRESS_BUTTON);
```

## createOpenScreenRequest(values?: OpenScreenRequest)
Returns a openScreenRequest object with either properties which can be overwritten or properties as parameters.

Is used when opening a workscreen.

Name | Type | Description
--- | --- | --- |
clientId | string | The clientId that is sent by the server, **doesn't have to be set it will be set automatically**.
componentId | string, undefined | The componentId of the screen to open. (sent by the menu)
className | string, undefined | The classpath of the screen to open
parameter | { [key:string]: any } | Additional parameters sent to the server when opening a screen.

### Usage
```typescript
    const req = createOpenScreenRequest();
    req.componentId = screenToOpen;
    api.sendRequest(req, REQUEST_KEYWORDS.OPEN_SCREEN);
```

## createCloseScreenRequest(values?: CloseScreenRequest)
Returns a closeScreenRequest object with either properties which can be overwritten or properties as parameters. 

Is used when closing a workscreen.

Name | Type | Description
--- | --- | --- |
clientId | string | The clientId that is sent by the server, **doesn't have to be set it will be set automatically**.
componentId | string, undefined | The componentId of the screen to close. (sent by the menu)
className | string, undefined | The classpath of the screen to close
parameter | { [key:string]: any } | Additional parameters sent to the server when closing a screen.

### Usage
```typescript
    const req = createCloseScreenRequest();
    req.componentId = screenToClose;
    api.sendRequest(req, REQUEST_KEYWORDS.CLOSE_SCREEN);
```

## createCloseFrameRequest(values?: CloseFrameRequest)
Returns a close-frame-request object with either properties which can be overwritten or properties as parameters.

Is used when a message or a frame is being closed.

Name | Type | Description
--- | --- | --- |
clientId | string | The clientId that is sent by the server, **doesn't have to be set it will be set automatically**.
componentId | string, undefined | The name of the message/frame to close.

### Usage
```typescript
    const closeReq = createCloseFrameRequest();
    closeReq.componentId = props.name;
    api.sendRequest(closeReq, REQUEST_KEYWORDS.CLOSE_FRAME);
```

## createCloseContentRequest(values?: CloseContentRequest)
Returns a close-content-request object with either properties which can be overwritten or properties as parameters.

Is used to close a content-popup.

Name | Type | Description
--- | --- | --- |
clientId | string | The clientId that is sent by the server, **doesn't have to be set it will be set automatically**.
componentId | string, undefined | The name of the message/frame to close.

### Usage
```typescript
    const closeReq = createCloseContentRequest();
    closeReq.componentId = props.name;
    api.sendRequest(closeReq, REQUEST_KEYWORDS.CLOSE_CONTENT);
```

## createDeviceStatusRequest(values?: DeviceStatusRequest)
Returns a deviceStatusRequest object with either properties which can be overwritten or properties as parameters.

Is used when the browser-size changes. (Is sent automatically for you)

Name | Type | Description
--- | --- | --- |
clientId | string | The clientId that is sent by the server, **doesn't have to be set it will be set automatically**.
screenWidth | number | The width of the screen.
screenHeight | number | The height of the screen.

### Usage
```typescript
    const deviceStatusReq = createDeviceStatusRequest();
    deviceStatusReq.screenHeight = window.innerHeight;
    deviceStatusReq.screenWidth = window.innerWidth;
    api.sendRequest(deviceStatusReq, REQUEST_KEYWORDS.DEVICE_STATUS);
```

## createSelectRowRequest(values?: SelectRowRequest)
Returns a selectRowRequest object with either properties which can be overwritten or properties as parameters.

Is used to select a row and/or column of a dataprovider.

Name | Type | Description
--- | --- | --- |
clientId | string | The clientId that is sent by the server, **doesn't have to be set it will be set automatically**.
componentId | string, undefined | The name of the component which calls the action/is being changed.
dataProvider | string, string[], undefined | The dataprovider you want to select the row from.
filter | SelectFilter, undefined | A combination of columnNames (string[]) and values (any[]), so the server knows which row to select.
selectedColumn | string, undefined | The column to select.
rowNumber | number, undefined | The number of the row you want to select.

### Usage
```typescript
    const selectReq = createSelectRowRequest();
    selectReq.dataProvider = props.dataBook;
    selectReq.componentId = props.name;
    selectReq.rowNumber = rowIndex;
    if (selectedColumn) selectReq.selectedColumn = selectedColumn;
    if (filter) selectReq.filter = filter;
    api.sendRecord(selectReq, filter ? REQUEST_KEYWORDS.SELECT_ROW : REQUEST_KEYWORDS.SELECT_COLUMN)
```

## createSelectTreeRequest(values?: SelectTreeRequest)
Returns a selectTreeRequest object with either properties which can be overwritten or properties as parameters.

Is used to select nodes of a tree.

Name | Type | Description
--- | --- | --- |
clientId | string | The clientId that is sent by the server, **doesn't have to be set it will be set automatically**.
componentId | string, undefined | The name of the component which calls the action/is being changed.
dataProvider | string, string[], undefined | The dataproviders you want to select the row from.
filter | SelectFilter[], undefined | An array of combinations of columnNames (string[]) and values (any[]), so the server knows which row to select.

Multiple Dataproviders in an array need to be in the same order as you put it in the filter.

### Usage
```typescript
    const selectedFilters:Array<SelectFilter|null> = [];
    const primaryKeys = getMetaData(screenName, dataBook, context.contentStore, undefined)?.primaryKeyColumns || ["ID"];
    selectedFilters.push({
        columnNames: primaryKeys,
        values: primaryKeys.map((pk: string) => dataRow[pk])
    });
    const selectReq = createSelectTreeRequest();
    selectReq.componentId = props.name;
    selectReq.dataProvider = props.dataBooks;
    selectReq.filter = selectedFilters;
    api.sendRequest(selectReq, REQUEST_KEYWORDS.SELECT_TREE);
```

## createFetchRequest(values?: FetchRequest)
Returns a fetchRequest object with either properties which can be overwritten or properties as parameters.

Is used to fetch data from a dataprovider

Name | Type | Description
--- | --- | --- |
clientId | string | The clientId that is sent by the server, **doesn't have to be set it will be set automatically**.
dataProvider | string, string[], undefined | The dataprovider(s) you want to get information from or change
columnNames | string[], undefined | Reduce the fetch results to these columns
filter | FilterType, undefined | Gets sub elements of master **Tree only**
fromRow | number, undefined | Fetch from this row
rowCount | number, undefined | Fetch this many rows
includeMetaData | boolean, undefined | True, if you want to include the MetaData of the dataprovider to this fetch

### Usage
```typescript
    const fetchReq = createFetchRequest();
    fetchReq.dataProvider = props.dataBook;
    fetchReq.fromRow = providerData.length;
    fetchReq.rowCount = length * 4;
    api.sendRequest(fetchReq, REQUEST_KEYWORDS.FETCH);
```

## createFilterRequest(values?: FilterRequest)
Returns a filterRequest object with either properties which can be overwritten or properties as parameters.

Is used to filter the data of a dataprovider.

Name | Type | Description
--- | --- | --- |
clientId | string | The clientId that is sent by the server, **doesn't have to be set it will be set automatically**.
dataProvider | string, string[], undefined | The dataprovider(s) you want to get information from or change
editorComponentId | string, undefined | The editor which filters the dataprovider
value | string | The value which the dataprovider is being filtered by
filterCondition | FilterCondition, undefined | Some special condition which are used in SQL queries

### Usage
```typescript
    const filterReq = createFilterRequest();
    filterReq.dataProvider = props.cellEditor.linkReference?.referencedDataBook;
    filterReq.editorComponentId = props.name;
    filterReq.value = value;

    if (props.isCellEditor) {
        filterReq.columnNames = [props.columnName];
    }

    api.sendRequest(filterReq, REQUEST_KEYWORDS.FILTER);
```

## createSetValueRequest(values?: SetValueRequest)

Returns a setValueRequest object with either properties which can be overwritten or properties as parameters.

Is used to set values for components **without** dataprovider.

Name | Type | Description
--- | --- | --- |
clientId | string | The clientId that is sent by the server, **doesn't have to be set it will be set automatically**.
componentId | string, undefined | The name of the component which calls the action/is being changed.
value | string, undefined | The value to set

### Usage
```typescript
    const req = createSetValueRequest();
    req.componentId = name;
    req.value = value;
    api.sendRequest(req, REQUEST_KEYWORDS.SET_VALUE);
```

## createSetValuesRequest(values?: SetValuesRequest)
Returns a setValuesRequest object with either properties which can be overwritten or properties as parameters.

Is used to set values for components **with** dataprovider.

Name | Type | Description
--- | --- | --- |
clientId | string | The clientId that is sent by the server, **doesn't have to be set it will be set automatically**.
componentId | string, undefined | The name of the component which calls the action/is being changed.
dataProvider | string, string[], undefined | The dataprovider(s) you want to get information from or change
columnNames | string[], undefined | The columnNames of which values are to be changed
values | any[], undefined | The values which are being set
rowNumber | number, undefined | The rowNumber which is changed

### Usage
```typescript
    const setValReq = createSetValuesRequest();
    setValReq.componentId = props.name;
    setValReq.columnNames = [props.columnName];
    setValReq.dataProvider = props.dataRow;
    setValReq.values = [props.cellEditor.allowedValues[0]];
    api.sendRequest(setValReq, REQUEST_KEYWORDS.SET_VALUES);
```

## createTabRequest(values?: TabRequest)
Returns a tabRequest object with either properties which can be overwritten or properties as parameters.

Is used to either switch a tab on a TabsetPanel or to close a tab. To select a tab use `REQUEST_KEYWORDS.SELECT_TAB` to close a tab use `REQUEST_KEYWORDS.CLOSE_TAB`.

Name | Type | Description
--- | --- | --- |
clientId | string | The clientId that is sent by the server, **doesn't have to be set it will be set automatically**.
componentId | string, undefined | The name of the component which calls the action/is being changed.
index | number, undefined | The index of the tab you want to select/close

### Usage
```typescript
    const buildTabRequest = useCallback((tabId:number) => {
        const req = createTabRequest();
        req.componentId = props.name;
        req.index = tabId;
        return req
    },[props.name]);

    const handleSelect = (tabId:number) => {
        api.sendRequest(buildTabRequest(tabId), REQUEST_KEYWORDS.SELECT_TAB);
    }

    const handleClose = (tabId:number) => {
        api.sendRequest(buildTabRequest(tabId), REQUEST_KEYWORDS.CLOSE_TAB);
    }
```

## createDALSaveRequest(values?: DALSaveRequest)
Returns a saveRequest object with either properties which can be overwritten or properties as parameters.

Is used for saving the data of the dataprovider.

Name | Type | Description
--- | --- | --- |
clientId | string | The clientId that is sent by the server, **doesn't have to be set it will be set automatically**.
dataProvider | string, string[], undefined | The dataprovider(s) you want to get information from or change
onlySelected | boolean, undefined | Save only the selectedRow instead of the entire dataprovider

## createSortRequest(values?: SortRequest)
Returns a sort-request object with either properties which can be overwritten or properties as parameters.

Is used to sort the data of a dataprovider

Name | Type | Description
--- | --- | --- |
clientId | string | The clientId that is sent by the server, **doesn't have to be set it will be set automatically**.
dataProvider | string, string[], undefined | The dataprovider(s) you want to get information from or change
sortDefinition | SortDefinition[], undefined | The sort-definition to send to the server ({ columnName: string , mode: "None", "Ascending", "Descending"  })

### Usage
```typescript
    const sortReq = createSortRequest();
    sortReq.dataProvider = props.dataBook;
    let sortDefToSend: SortDefinition[] = sortDefinitions || [];
    if (context.ctrlPressed) {
        if (!sortDef) {
            sortDefToSend.push({ columnName: columnName, mode: "Ascending" })
        }
        else {
            sortDefToSend[sortDefToSend.findIndex(sortDef => sortDef.columnName === columnName)] = { columnName: columnName, mode: getNextSort(sortDef?.mode) }
        }
    }
    else {
        sortDefToSend = [{ columnName: columnName, mode: getNextSort(sortDef?.mode) }]
    }
    sortReq.sortDefinition = sortDefToSend;
    api.sendRequest(sortReq, REQUEST_KEYWORDS.SORT);
```

## createInsertRecordRequest(values?: InsertRecordRequest)
Returns a insert-record-request object with either properties which can be overwritten or properties as parameters.

This request is used to insert a record into the given dataprovider

Name | Type | Description
--- | --- | --- |
clientId | string | The clientId that is sent by the server, **doesn't have to be set it will be set automatically**.
dataProvider | string, string[], undefined | The dataprovider(s) you want to get information from or change

### Usage
```typescript
    const insertReq = createInsertRecordRequest();
    insertReq.dataProvider = props.dataBook;
    api.sendRequest(insertReq, REQUEST_KEYWORDS.INSERT_RECORD);
```

## createSetScreenParameter(values?: SetScreenParameterRequest)
Returns a set-screen-parameter-request object with either properties which can be overwritten or properties as parameters. 

This request is to send parameters for a screen to the server.

Name | Type | Description
--- | --- | --- |
clientId | string | The clientId that is sent by the server, **doesn't have to be set it will be set automatically**.
componentId | string, undefined | The name of the screen
parameter | { [key:string]: any }, undefined | The parameters which are sent to the server

### Usage
```typescript
    const parameterReq = createSetScreenParameterRequest();
    parameterReq.componentId = screenName;
    parameterReq.parameter = parameter;
    api.sendRequest(parameterReq, REQUEST_KEYWORDS.SET_SCREEN_PARAMETER);
```

## createMouseRequest(values?: MouseRequest)
Returns a mouse-request object with either properties which can be overwritten or properties as parameters.

Is used for the mouse-pressed (mouse-down) and mouse-released (mouse-up) request.

Name | Type | Description
--- | --- | --- |
clientId | string | The clientId that is sent by the server, **doesn't have to be set it will be set automatically**.
componentId | string, undefined | The name of the component which calls the action/is being changed.
button | "Left", "Middle", "Right", undefined | The mouse-button which was used
x | number, undefined | The x-position where the click happened
y | number, undefined | The y-position where the click happened

### Usage
```typescript
    const releaseReq = createMouseRequest();
    releaseReq.componentId = compName;
    releaseReq.button = getMouseButton(event.button);
    releaseReq.x = event.x;
    releaseReq.y = event.y;
    api.sendRequest(releaseReq, REQUEST_KEYWORDS.MOUSE_RELEASED);
```

## createMouseClickedRequest(values?: MouseClickedRequest)
Returns a mouse-clicked-request object with either properties which can be overwritten or properties as parameters.

Is used for the mouse-clicked (mouse-up) event.

Name | Type | Description
--- | --- | --- |
clientId | string | The clientId that is sent by the server, **doesn't have to be set it will be set automatically**.
componentId | string, undefined | The name of the component which calls the action/is being changed.
button | "Left", "Middle", "Right", undefined | The mouse-button which was used
x | number, undefined | The x-position where the click happened
y | number, undefined | The y-position where the click happened
clickCount | number, undefined | number of times the button was clicked

### Usage
```typescript
    const clickReq = createMouseClickedRequest();
    clickReq.componentId = compName;
    clickReq.button = getMouseButton(event.button);
    clickReq.x = event.x;
    clickReq.y = event.y;
    clickReq.clickCount = event.detail;
    api.sendRequest(clickReq, REQUEST_KEYWORDS.MOUSE_CLICKED);
```

## createSaveRequest(values?: SaveRequest)
Returns a save-request object with either properties which can be overwritten or properties as parameters.

Is used to save the entire application.

Name | Type | Description
--- | --- | --- |
clientId | string | The clientId that is sent by the server, **doesn't have to be set it will be set automatically**.

### Usage
```typescript
    api.sendRequest(createSaveRequest(), REQUEST_KEYWORDS.SAVE);
```

## createReloadRequest(values?: ReloadRequest)
Returns a reload-request object with either properties which can be overwritten or properties as parameters.

Is used to reload the entire application.

Name | Type | Description
--- | --- | --- |
clientId | string | The clientId that is sent by the server, **doesn't have to be set it will be set automatically**.

### Usage
```typescript
    api.sendRequest(createReloadRequest(), REQUEST_KEYWORDS.RELOAD);
```

## createUIRefreshRequest(values?: UIRefreshRequest)
Returns a ui-refresh-request object with either properties which can be overwritten or properties as parameters.

Restarts the application at the exact state before the reload (new startup).

Name | Type | Description
--- | --- | --- |
clientId | string | The clientId that is sent by the server, **doesn't have to be set it will be set automatically**.

### Usage
```typescript
    api.sendRequest(createUIRefreshRequest(), REQUEST_KEYWORDS.UI_REFRESH);
```

## createRollbackRequest(values?: RollbackRequest)
Returns a rollback-request object with either properties which can be overwritten or properties as parameters.

Is used to rollback a transaction.

Name | Type | Description
--- | --- | --- |
clientId | string | The clientId that is sent by the server, **doesn't have to be set it will be set automatically**.

### Usage
```typescript
    api.sendRequest(createRollbackRequest(), REQUEST_KEYWORDS.ROLLBACK);
```

## createChangesRequest(values?: ChangesRequest)
Returns a changes-request object with either properties which can be overwritten or properties as parameters.

When the Websocket sends a message with "changes" this changes request is being sent to receive updated content.

Name | Type | Description
--- | --- | --- |
clientId | string | The clientId that is sent by the server, **doesn't have to be set it will be set automatically**.

### Usage
```typescript
    api.sendRequest(createChangesRequest(), REQUEST_KEYWORDS.CHANGES);
```

## createFocusGainedRequest(values?: FocusGainedRequest)
Returns a focus-gained-request object with either properties which can be overwritten or properties as parameters.

Is used when a component gains focus.

Name | Type | Description
--- | --- | --- |
clientId | string | The clientId that is sent by the server, **doesn't have to be set it will be set automatically**.
componentId | string, undefined | The name of the component which calls the action/is being changed.

### Usage
```typescript
    export function onFocusGained(componentId: string, server: Server|ServerFull) {
        const focusGainedReq = createFocusGainedRequest();
        focusGainedReq.componentId = componentId;
        return api.sendRequest(focusGainedReq, REQUEST_KEYWORDS.FOCUS_GAINED);
    }
```

## createFocusLostRequest(values?: FocusLostRequest)
Returns a focus-lost-request object with either properties which can be overwritten or properties as parameters.

Is used when a component loses focus.

Name | Type | Description
--- | --- | --- |
clientId | string | The clientId that is sent by the server, **doesn't have to be set it will be set automatically**.
componentId | string, undefined | The name of the component which calls the action/is being changed.

### Usage
```typescript
    export function onFocusLost(componentId: string, server: Server|ServerFull) {
        const focusGainedReq = createFocusGainedRequest();
        focusGainedReq.componentId = componentId;
        return api.sendRequest(focusGainedReq, REQUEST_KEYWORDS.FOCUS_LOST);
    }
```

## createAliveRequest(values?: AliveRequest)
Returns an alive-request object with either properties which can be overwritten or properties as parameters.

Is used to tell the server that the client is still "alive" (is send automatically for you).

Name | Type | Description
--- | --- | --- |
clientId | string | The clientId that is sent by the server, **doesn't have to be set it will be set automatically**.

### Usage
```typescript
    api.sendRequest(createAliveRequest(), REQUEST_KEYWORDS.ALIVE);
```

## createAboutRequest(values?: AboutRequest)
Returns an about-request object with either properties which can be overwritten or properties as parameters.

Opens an about popup.

Name | Type | Description
--- | --- | --- |
clientId | string | The clientId that is sent by the server, **doesn't have to be set it will be set automatically**.

### Usage
```typescript
    api.sendRequest(createAboutRequest(), REQUEST_KEYWORDS.ABOUT);
```