# Available API-Functions
Gain access to the API functions by using the `useAPI` hook: 
``` typescript
const api = useAPI()
```

## sendRequest(req: any, keyword: string)

Sends a request to the server. 

As first parameter build a request using the [request-factory-functions](../requests).

For the second parameter use the [REQUEST_KEYWORDS](https://github.com/sibvisions/reactUI/blob/master/src/main/request/REQUEST_KEYWORDS.ts) enum.

### Usage
```typescript
        const req = createSetValuesRequest();
        req.clientId = getClientId();
        req.columnNames = ["YEAR", "BRUTTO", "NETTO"];
        req.dataProvider = dataProviders[0];
        req.componentId = "Cha-OL_C_Chart";
        req.values = [99, 5000.32, 3123.12];
        api.sendRequest(req, "set_values");
```

## sendOpenScreenRequest(id: string, parameter?: { [key: string]: any }, readAheadLimit?: number)
Sends an open-screen-request to the server to open a workscreen.

For the first parameter use the classpath of the screen you want to open. The second parameter is optional, it is used to send additional parameters to the server in the open-screen request. The third parameter limits how many records are being fetched at once from the server

### Usage
```typescript
    api.sendOpenScreenRequest("com.sibvisions.apps.mobile.demo.screens.features.PopupExampleWorkScreen", { testParam: 'test', hello: 'world' }, 100)
```

## sendScreenParameter(screenName: string, parameter: { [key: string]: any })
Sends parameters for the given screen to the server.

For the first parameter use the name of the screen (Screen-Wrapper: props.screenName). The second parameter is an object of the parameters you want to send to the server.

### Usage
```typescript
    api.sendScreenParameter(props.screenName { testParam: 'test' })
```

## sendCloseScreenRequest(id: string, parameter?: { [key: string]: any }, popup?:boolean)

Sends a closeScreenRequest to the server for the given screen.

The first parameter is the screenName of the screen you want to close.(Screen-Wrapper: props.screenName) The second and third Parameters are optional. The second is to send additional parameters to the server, the third parameter is a flag which must be set to true, if a popup is being closed!

### Usage
```typescript
    api.sendCloseScreenRequest(props.screenName, { closeParam: 'closing' })
```

## insertRecord(id: string, dataProvider: string)
Inserts an empty record into the given dataprovider

The first parameter is the screenName of the screen (Screen-Wrapper: props.screenName) and the second parameter is the dataprovider in which the record should be added.

### Usage
```typescript
    api.insertRecord(props.screenName, dataProviders[0]);
```

## deleteRecord(id: string, dataProvider: string)
Deletes the current selected record from the given dataprovider

The first parameter is the screenName of the screen (Screen-Wrapper: props.screenName) and the second parameter is the dataprovider in which the record should be deleted. The currently selected record is always deleted.

### Usage
```typescript
    api.deleteRecord(props.screenName, dataProviders[0]);
```

## addCustomScreen(screenName: string, screen: ReactElement)
Adds a custom-screen to the application. You must use `api.addMenuItem` aswell, to add the custom-screen to your menu.

The first parameter is the screenName of the screen which you can choose, it has to be the same as the `id` in the object of `api.addMenuItem` and the second parameter is the screen you want to render.

### Usage
```typescript
    api.addCustomScreen("LiveCounter", <CustomCounter />);
```

## addReplaceScreen(screenName:string, screen:ReactElement)
Replaces a current screen sent by the server, based on the given screenName, with a custom-screen.

The first parameter is the screenName which you want to replace and the second parameter is the screen you want to render. In your replaced screen you will have access to the screenName with `props.screenName`.

### Usage
```typescript
    api.addReplaceScreen("Cha-OL", <CustomChartScreen />);
```

## addScreenWrapper(screenName:string, wrapper:ReactElement, pOptions?:ScreenWrapperOptions)
Adds a screen-wrapper to a workscreen. A screen-wrapper is the entrypoint to an existing workscreen.

The first parameter is the screenName which you want to add the screenwrapper to, the second parameter is the screen-wrapper you want to render and the third parameter is optional and is an object which contains additional options. More info can be found [here](../screen-wrapper).

### Usage
```typescript
    api.addScreenWrapper("Fir-N7", <ScreenWrapperFirst/>, { global: false });
```

## addMenuItem(menuItem: CustomMenuItem)
Adds a menu-item to your application. To actually render a custom-screen, the function `api.addCustomScreen` needs to be called aswell. Custom-Screens you want to add with this method call, need to be added before! The parameter is an object of the CustomMenuItem type.

### CustomMenuItem Properties
Property | Type | Description
--- | --- | --- |
id | string | ID of the screen. The screen has to be already registered by a ```api.addCustomScreen``` call with the same id.
text | string | The text which should be displayed on the menu-item.
menuGroup | string | The menu-group the screen should be added into, if the menu-group isn't already added a new menu-group is created.
icon | string, undefined | An icon which will be displayed in the menu. FontAwesome and PrimeIcon supported

### Usage
```typescript
      api.addMenuItem({
        id: "LiveCounter",
        text: "Live Counter",
        menuGroup: "Custom Screens",
        icon: "pi-plus"
      });
```

## editMenuItem(editItem: EditableMenuItem)
Edits an existing menu-item the server sends. The parameter is an object of the EditableMenuItem type.

### EditableMenuItem Properties
Property | Type | Description
--- | --- | --- |
id | string | The classname of the menu-item you want to edit. Can be found in VisionX
newTitle | string, undefined | The new title of the menu-item
newIcon | string, undefined | The new icon of the menu-item

### Usage
```typescript
    api.editMenuItem({
    id: "com.sibvisions.apps.mobile.demo.screens.features.FirstWorkScreen",
    newTitle: "new First",
    newIcon: "fa-bookmark"
    });
```

## removeMenuItem(id:string)
Removes a menu-item, which the server sends from your application. The parameter is the id of the menu-item which should be removed.

### Usage
```typescript
    api.removeMenuItem("com.sibvisions.apps.mobile.demo.screens.features.SecondWorkScreen");
```

## addToolbarItem(toolbarItem: CustomToolbarItem)
Adds an item to the toolbar.  To actually render a custom-screen, the function `api.addCustomScreen` needs to be called aswell. If instead you want to render a screen sent by the server use the classpath as the id. Custom-Screens you want to render with this function need to be added first. The parameter is an object of the CustomToolbarItem type.

### CustomToolBarItem Properties
Property | Type | Description
--- | --- | --- |
id | string | The classname of the menu-item you want to edit. Can be found in VisionX
title | string, undefined | The new title of the menu-item
icon | string, undefined | The new icon of the menu-item

### Usage
```typescript
      api.addToolbarItem({
        id: "com.sibvisions.apps.mobile.demo.screens.features.PopupExampleWorkScreen",
        icon: "fa-bookmark",
        title: "Popup",
        navigationName: ""
      });
```

## editToolbarItem(editItem:EditableMenuItem)
Edits an existing toolbar-item the server sends. The parameter is an object of the EditableMenuItem type.

### EditableMenuItem Properties
Property | Type | Description
--- | --- | --- |
id | string | The classname of the menu-item you want to edit. Can be found in VisionX
newTitle | string, undefined | The new title of the menu-item
newIcon | string, undefined | The new icon of the menu-item

### Usage
```typescript
      api.editToolbarItem({
        id: "com.sibvisions.apps.mobile.demo.screens.features.UpAndDownloadWorkScreen",
        newTitle: "Changed Toolbar Title",
        newIcon: "fa-bath"
      });
```

## removeToolbarItem(id: string)
Removes a toolbar-item, which the server sends from the toolbar. The parameter is the classpath of the screen you want to remove

### Usage
```typescript
    api.removeToolbarItem("com.sibvisions.apps.mobile.demo.screens.features.MouseWorkScreen");
```

## addStartupProperties(startupProps: CustomStartupProps[])
Adds properties which will be sent on startup. Needs to be combined with to the onStartup method passed to the `ReactUI` component, to actually send the properties on startup


### Usage
```typescript
    const onStartup = () => {
        api.addStartupProperties([{ "test.parameter": true }, { test2: 'value2' }]);
    }
```

## addCustomComponent(name: string, customComp: ReactElement)
Replaces an existing component of a screen with a custom-component. The first parameter is the name of the component you want to replace (can be found in VisionX) and the second parameter is the custom-component you want to replace it with.

### Usage
```typescript
    api.addCustomComponent("Con-CG_E_contacts_IMAGE", <CustomCounter />)
```

## removeComponent(name: string)
Removes a component from a screen based on the given name. The parameter is the name of the component you want to remove (can be found in VisionX).

### Usage
```typescript
    api.removeComponent("Fir-N7_B_DOOPEN");
```

## getUser()
Returns the data of the current user.

### Usage
```typescript
    if (api.getUser().userName === "admin") {

    }
```

## addGlobalComponent(name: string, comp: ReactElement)
Adds a global-component to the ContentStore. When the server sends components, the `ReactUI` checks, if there is a global-component defined for that classname, if there is one, it is rendered. This can be used to either define "web-only" components which but are still sent by the server or to change already existing components by classname.

The first parameter is the classname you want to "replace". The second parameter is the component you want to render.

### Usage
```typescript
    api.addGlobalComponent("MobileBrowser", <CustomBrowser />)
```

## addCSSToHeadBefore(path:string)
Adds a css file to the head "in front of" the dynamically loaded css files of the `ReactUI`. The parameter is to define to path to the css file.

### Usage
```typescript
    api.addCSSToHeadBefore('../public/color-schemes/blue.scss');
```

## addCSSToHeadAfter(path:string)
Adds a css file to the head "iafter" the dynamically loaded css files of the `ReactUI`. The parameter is to define to path to the css file.

### Usage
```typescript
    api.addCSSToHeadAfter('../public/color-schemes/blue.scss');
```

## extendComponent(name: string, component: ReactElement)
Extends a component with the given functions. The first parameter is the name of the component you want to extend and the second parameter is the component you want to extend it with.

For more info check out the [extendComponent README](../extend-components)

### Usage
```typescript
    api.extendComponent(
        "Com-K3_SP1_TB1", 
        <UIToggleButton
            onClick={(e) => {
                setText1("togglebutton pressed")
            }}
            onChange={(value) => setText2(value)}
        />
    )
```

## getApplicationParameter(key:name)
Returns the value for the given key out of the application-parameters

### Usage
```
const myPrivateKey = api.getApplicationParameter("privkey");
```