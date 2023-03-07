# Available Hooks

## useAPI()
This hook gives users access to the api functions. [Check out the API-functions here](../api-functions)

### Usage
```typescript
    const api = useAPI();
```

## useMenuItems()
This hook returns the menuItems of the application. This hook is used to create a custom application wrapper.

### Usage
```typescript
    const menuItems = useMenuItems();
```

## useDataProviders(screenName: string)
 This hook returns the dataProviders of a screen, it updates whenever there is a new dataProvider for the screen. The parameter is the name of the screen (Screen-Wrapper props.screenName).

 ### Usage
 ```typescript
    const dataProviders = useDataProviders(props.screenName);
 ```

 ## useDataProviderData(screenName: string, dataProvider: string)
 This hook returns the data of the dataprovider, it updates whenever the dataprovider gets updated. The first parameter is the name of the screen (Screen-Wrapper props.screenName). The second parameter is the dataProvider which you want to get the data from.

 ### Usage
 ```typescript
    const data: = useDataProviderData(props.screenName, dataProviders[0]);
 ```

 ## useAllDataProviderData(screenName:string, dataBooks:string[])
 This hook returns the current data of all dataproviders of a component as Map. The first parameter is the name of the screen (Screen-Wrapper props.screenName). The second parameter is an array of dataProviders which you want to get the data from.

 ### Usage
 ```typescript
    const providedData = useAllDataProviderData(screenName, dataProviders);
 ```

 ## useRowSelect(screenName:string, dataProvider: string, rowIndex?:number)
This hook returns the current state of either the selectedRow of the databook sent by the server for the given dataprovider as array. The first parameter is the name of the screen (Screen-Wrapper props.screenName). The second parameter is the dataProvider which you want to get the selectedRow from. The third parameter is optional. It returns the rowdata of the index you pass.

### Usage
```typescript
    const [selectedRow] = useRowSelect(screenName, props.dataBook);
```

## useAllRowSelect(screenName:string, dataBooks:string[])
This hook returns every currently selected Row of all dataproviders of a component as Map. The first parameter is the name of the screen (Screen-Wrapper props.screenName). The second parameter is an array of dataproviders you want to receive the selectedRows from.

### Usage
```typescript
    const selectedRows = useAllRowSelect(screenName, props.dataBooks);
```