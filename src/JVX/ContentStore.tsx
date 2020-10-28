import MenuResponse from "./response/MenuResponse";
import {ReplaySubject} from "rxjs";
import MenuItemCustom from "../primeExtension/MenuItemCustom";
import BaseComponent from "./components/BaseComponent";
import UserData from "./model/UserData";
import MetaDataResponse from "./response/MetaDataResponse";

class ContentStore{

    menuSubject = new ReplaySubject<Array<MenuItemCustom>>(1);
    flatContent = new Map<string ,BaseComponent>();
    removedContent = new Map<string ,BaseComponent>();
    invisibleContent = new Map<string, BaseComponent>();

    currentUser: UserData = new UserData();
    currentTheme: string = "dark"

    //Sub Maps
    propertiesSubscriber = new Map<string, Function>();
    parentSubscriber = new Map<string, Function>();
    rowSelectionSubscriber = new Map<string, Array<Function>>();
    rowSelectionIndexSubscriber = new Map<string, Array<Function>>();
    dataChangeSubscriber = new Map<string, Array<{ displayRecords: number, fn: Function }>>();

    //DataProvider Maps
    dataProviderData = new Map<string, Array<any>>();
    dataProviderMetaData = new Map<string, MetaDataResponse>();
    dataProviderFetched = new Map<string, boolean>();
    dataProviderSelectedRow = new Map<string, any>();
    dataProviderSelectedRowIndex = new Map<string, number>();

    //Content
    updateContent(componentsToUpdate: Array<BaseComponent>){
        const notifyList = new Array<string>();
        let existingComponent: BaseComponent | undefined;
        //Update FlatContent
        componentsToUpdate.forEach(newComponent => {

            //Changed notify List
            if(existingComponent) {
                if (newComponent.parent) {
                    notifyList.push(newComponent.parent);
                    notifyList.push(existingComponent.parent || "");
                }
                if (newComponent.visible !== undefined)
                    notifyList.push(existingComponent.parent || "");
                if (newComponent["~remove"] !== undefined)
                    notifyList.push(existingComponent.parent || "");
                if (newComponent["~destroy"] !== undefined)
                    notifyList.push(existingComponent.parent || "");
            }

            // [~destroy] Delete Element
            if(newComponent["~destroy"]){
                existingComponent = this.invisibleContent.get(newComponent.id);
                if(existingComponent)
                    this.invisibleContent.delete(newComponent.id);
                existingComponent = this.removedContent.get(newComponent.id);
                if(existingComponent)
                    this.removedContent.delete(newComponent.id);
                existingComponent = this.flatContent.get(newComponent.id);
                if(existingComponent)
                    this.flatContent.delete(newComponent.id);
            }
            // [~remove] & [visible]
            else if(newComponent["~remove"] !== undefined || newComponent.visible !== undefined) {
                // [~remove] Remove or re-add
                if(newComponent["~remove"]){
                    existingComponent = this.flatContent.get(newComponent.id);
                    if(existingComponent){
                        this.flatContent.delete(newComponent.id);
                        this.removedContent.set(newComponent.id, existingComponent);
                    }
                }
                else if(newComponent["~remove"] === false){
                    existingComponent = this.removedContent.get(newComponent.id);
                    if(existingComponent){
                        this.removedContent.delete(newComponent.id);
                        this.flatContent.set(newComponent.id, existingComponent);
                    }
                }

                // [visible] Remove or re-add
                if(newComponent.visible){
                    existingComponent = this.invisibleContent.get(newComponent.id);
                    if(existingComponent){
                        this.invisibleContent.delete(newComponent.id);
                        this.flatContent.set(newComponent.id, existingComponent);
                    }
                }
                else if(newComponent.visible === false){
                    existingComponent = this.flatContent.get(newComponent.id);
                    if(existingComponent){
                        this.flatContent.delete(newComponent.id);
                        this.invisibleContent.set(newComponent.id, existingComponent);
                    }
                }
            }

            existingComponent = this.flatContent.get(newComponent.id)

            // Add new Component or updated Properties
            if(existingComponent) {
                for (let newPropName in newComponent) {
                    // @ts-ignore
                    existingComponent[newPropName] = newComponent[newPropName]
                }
            }
            else if(newComponent["~remove"] === undefined && newComponent["~destroy"] === undefined) {
                this.flatContent.set(newComponent.id, newComponent);
            }
        });

        //Properties
        componentsToUpdate.forEach(value => {
            const existingComp = this.flatContent.get(value.id);
            const updateFunction = this.propertiesSubscriber.get(value.id);
            if(existingComp && updateFunction){
                updateFunction(existingComp);
            }
        });
        notifyList.filter(this.onlyUnique).forEach(parentId => this.parentSubscriber.get(parentId)?.apply(undefined, []));
    }

    onlyUnique(value: string, index: number, self: Array<string>) {
        return self.indexOf(value) === index;
    }


    closeScreen(windowName: string){
        const deleteChildren = (parentId: string) => {
            const children = this.getChildren(parentId);

            children.forEach(child => {
                deleteChildren(child.id);
                this.flatContent.delete(child.id);
            });
        }

        const window = this.getWindow(windowName);
        if(window){
            deleteChildren(window.id);
            this.flatContent.delete(window.id);
        }
    }

    reset(){
        this.flatContent.clear();
        this.removedContent.clear();
        this.currentUser = new UserData();
        this.dataProviderData.clear();
        this.dataProviderMetaData.clear();
        this.dataProviderFetched.clear();
        this.dataProviderSelectedRow.clear();
    }


    //Data Provider Management
    updateDataProviderData(dataProvider: string, newDataSet: Array<any>, to: number, from: number){
        const existingData = this.dataProviderData.get(dataProvider);
        if(existingData){
            if(existingData.length <= from){
                existingData.push(...newDataSet)
            } else {
                let newDataSetIndex = 0;
                for(let i = to; i <= from; i++){
                    existingData[i] = newDataSet[newDataSetIndex];
                    newDataSetIndex++;
                }
            }
        }
        else{
            this.dataProviderData.set(dataProvider, newDataSet);
        }

        //Notify
        this.dataChangeSubscriber.get(dataProvider)?.forEach(value => {
            value.fn.apply(undefined, []);
        });
    }

    getData(dataProvider: string, from?: number, to?: number): Array<any>{
        const dataArray = this.dataProviderData.get(dataProvider);

        if(from !== undefined && to !== undefined){
            return dataArray?.slice(from, to) || [];
        }

        return  dataArray || []
    }

    getDataRow(dataProvider: string, indexOfRow: number) : any{
        const data = this.getData(dataProvider);
        const dataRow = data[indexOfRow];
        if(dataRow)
            return dataRow;
        else
            return undefined
    }

    getSelectedIndex(dataProvider: string) : number{
        return this.dataProviderSelectedRowIndex.get(dataProvider) || -1
    }

    setSelectedRow(dataProvider: string, dataRow: any, index: number){
        this.dataProviderSelectedRow.set(dataProvider, dataRow);
        this.dataProviderSelectedRowIndex.set(dataProvider, index)
    }

    clearSelectedRow(dataProvider: string){
        this.dataProviderSelectedRow.delete(dataProvider);
        this.dataProviderSelectedRowIndex.delete(dataProvider);
    }

    clearDataFromProvider(dataProvider: string){
        this.dataProviderData.delete(dataProvider);
    }


    //Getters
    getWindow(windowName: string): BaseComponent | undefined{
        const componentEntries = this.flatContent.entries();

        let entry = componentEntries.next();
        while(!entry.done){
            if(entry.value[1].name === windowName){
                return entry.value[1];
            }
            entry = componentEntries.next();
        }
        return undefined;
    }

    getChildren(parentId: string): Array<BaseComponent>{
        const componentEntries = this.flatContent.entries();
        const children = new Array<BaseComponent>();

        let entry = componentEntries.next();
        while (!entry.done){
            if(entry.value[1].parent === parentId){
                children.push(entry.value[1]);
            }
            entry = componentEntries.next();
        }
        return children;
    }


    //Menu
    buildMenuBar(menuResponse: MenuResponse){
        let groupsString= Array<string>();
        let groups = Array<MenuItemCustom>();
        //Make out distinct groups
        menuResponse.items.forEach(parent => {
            if(groupsString.indexOf(parent.group) === -1) {
                groupsString.push(parent.group)
                groups.push({label: parent.group, items: Array<MenuItemCustom>()})
            }
        });
        //Add SubMenus to parents
        groups.forEach(parent => {
            menuResponse.items.forEach(subMenu => {
                if(parent.label===subMenu.group) {
                    const item:MenuItemCustom = {
                        label: subMenu.action.label,
                        componentId: subMenu.action.componentId
                    }

                    // @ts-ignore
                    parent.items.push(item);
                }
            });
        });
        this.menuSubject.next(groups);
    }


    //Subscription Management
    subscribeToPropChange(id: string, fn: Function){
        this.propertiesSubscriber.set(id, fn);
    }

    subscribeToParentChange(id: string, fn: Function){
        this.parentSubscriber.set(id, fn);
    }

    subscribeToRowSelection(dataProvider: string, fn: Function){
        const subscriber = this.rowSelectionSubscriber.get(dataProvider);
        if(subscriber){
            subscriber.push(fn);
        } else {
            this.rowSelectionSubscriber.set(dataProvider, new Array<Function>(fn));
        }
    }

    subscribeToRowIndexSelection(dataProvider: string, fn: Function){
        const subscriber = this.rowSelectionIndexSubscriber.get(dataProvider);
        const selectedIndex = this.dataProviderSelectedRowIndex.get(dataProvider);
        if(selectedIndex !== undefined)
            fn.apply(undefined, [selectedIndex])
        if(subscriber){
            subscriber.push(fn);
        } else {
            this.rowSelectionIndexSubscriber.set(dataProvider, new Array<Function>(fn));
        }
    }

    subscribeToDataChange(dataProvider: string, fn: Function, displayRecords= 50){
        const subscriber = this.dataChangeSubscriber.get(dataProvider);
        if(subscriber){
            subscriber.push({fn: fn, displayRecords: displayRecords});
        } else {
            this.dataChangeSubscriber.set(dataProvider, new Array<{ displayRecords: number, fn: Function}>({fn: fn, displayRecords: displayRecords}));
        }
    }


    unsubscribeFromDataChange(dataProvider: string, fn: Function){
        const subscriber = this.dataChangeSubscriber.get(dataProvider)
        if(subscriber){
            subscriber.splice(subscriber.findIndex(value => value.fn === fn),1);
        }
    }

    unsubscribeFromRowSelection(dataProvider: string, fn: Function){
        const subscriber = this.rowSelectionSubscriber.get(dataProvider)
        if(subscriber){
            subscriber.splice(subscriber.findIndex(value => value === fn),1);
        }
    }

    unsubscribeFromRowIndexSelection(dataProvider: string, fn: Function){
        const subscriber = this.rowSelectionSubscriber.get(dataProvider)
        if(subscriber){
            subscriber.splice(subscriber.findIndex(value => value === fn),1);
        }
    }

    unsubscribeFromParentChange(id: string){
        this.parentSubscriber.delete(id);
    }

    unsubscribeFromPropChange(id: string){
        this.propertiesSubscriber.delete(id);
    }


    //Events
    emitRowSelect(dataProvider: string){
        const rowSubscriber = this.rowSelectionSubscriber.get(dataProvider);
        const indexSubscriber = this.rowSelectionIndexSubscriber.get(dataProvider);
        const selectedRow = this.dataProviderSelectedRow.get(dataProvider);
        const selectedIndex = this.dataProviderSelectedRowIndex.get(dataProvider);
        if(rowSubscriber)
            rowSubscriber.forEach(sub => {
                sub.apply(undefined, [selectedRow]);
            });
        if(indexSubscriber)
            indexSubscriber.forEach(sub => {
                sub.apply(undefined, [selectedIndex]);
            });
    }
}
export default ContentStore