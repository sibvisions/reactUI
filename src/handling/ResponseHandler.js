class ResponseHandler{

    // Setter

    setContentStore(contentStore){
        this.contentStore = contentStore;
    }

    setServerCommunicator(serverCommunicator){
        this.serverCommunicator = serverCommunicator;
    }
    
    setMainScreen(screenRef){
        this.mainScreen = screenRef;
    }

    // Misc.
    updateContent(updatedContent){
        this.contentStore.updateContent(updatedContent)
    }

    routeTo(route){
        this.mainScreen.routeTo(route);
    }

    layoutModeChanged(){
        this.mainScreen.refresh()
    }

    //Response handling
    responseMapper= 
    [
        {
            name:"applicationMetaData",
            methodToExecute: this.applicationMetaData.bind(this)
        },
        {
            name:"menu",
            methodToExecute: this.menu.bind(this)
        },
        {
            name: "userData",
            methodToExecute: this.userData.bind(this)
        },
        {
            name: "screen.generic",
            methodToExecute: this.generic.bind(this)
        },
        {
            name: "closeScreen",
            methodToExecute: this.closeScreen.bind(this)
        },
        {
            name: "message.error",
            methodToExecute: this.errorMessage.bind(this)
        },
        {
            name: "message.sessionexpired",
            methodToExecute: this.sessionExpiredMessage.bind(this)

        },
        {
            name: "dal.fetch",
            methodToExecute: this.fetchedData.bind(this)
        },
        {
            name: "deviceStatus",
            methodToExecute: this.deviceStatus.bind(this)
        },
        {
            name: "dal.dataProviderChanged",
            methodToExecute: this.dataProviderChange.bind(this)
        }
    ]

    getResponse(requestPromise){
        requestPromise
            .then(response => response.json())
            .then(jResponse => this.handler(jResponse))
            .catch(error => {throw new Error(error)})
    }

    handler(responseArray){

        let metaData = responseArray.filter(response => response.name === "dal.metaData");
        metaData.forEach(data => {
            this.metaData(data);
        })


        responseArray.forEach(res => {
            let toExecute = this.responseMapper.find(toExecute => toExecute.name === res.name)
            toExecute ? toExecute.methodToExecute(res, this) : toExecute = undefined
        });
    }

    applicationMetaData(metaData){
        localStorage.setItem("clientId", metaData.clientId);
    }

    menu(unSortedMenuItems){
        let groupsString= [];
        let groups = [];
        //Make out distinct groups
        unSortedMenuItems.items.forEach(parent => {
            if(groupsString.indexOf(parent.group) === -1) {
                groupsString.push(parent.group)
                groups.push({label: parent.group, items: [], key: parent.group, icon: "pi pi-google"})
            }
        });
        //Add SubMenus to parents
        groups.forEach(e => {
            unSortedMenuItems.items.forEach(subMenu => {
                if(e.label===subMenu.group) {
                    e.items.push({
                        label: subMenu.action.label,
                        componentId:subMenu.action.componentId,
                        command: () => this.serverCommunicator.openScreen(subMenu.action.componentId),
                        key:subMenu.action.label})
                }
            });
        });
        this.contentStore.menuItems = groups;
        this.routeTo("/main")
    }

    userData(userData){
        this.contentStore.setCurrentUser(userData);
    }

    generic(genericResponse){
        if(genericResponse.changedComponents && genericResponse.changedComponents.length > 0){
            this.updateContent(genericResponse.changedComponents)
        }
        if(genericResponse.update){
            this.mainScreen.refresh();
        }
        this.routeTo("/main/"+genericResponse.componentId)
    }

    closeScreen(screenToClose){
        this.contentStore.deleteWindow(screenToClose)
        this.routeTo("/main");
    }

    errorMessage(error){
        throw new Error(error.message)
    }
    
    sessionExpiredMessage(message){
        this.routeTo("/login");
        throw new Error(message.title);
    }

    deviceStatus(deviceData){
        if(deviceData.layoutMode !== this.contentStore.layoutMode){
            this.contentStore.layoutMode = deviceData.layoutMode
            this.layoutModeChanged( );
        }
    }


    //dal

    fetchedData(fetchResponse){
        this.contentStore.emitFetchSuccess(fetchResponse);
    }

    dataProviderChange(changeData){
        if(changeData.reload === -1){
            this.serverCommunicator.fetchDataFromProvider(changeData.dataProvider);    
        }
    }

    metaData(mData){
        mData["columnView.table"].forEach((column, index) => {
            this.contentStore.metaData.set(column, mData.columns.find(data => data.name === column));
        });
    }
}
export default ResponseHandler