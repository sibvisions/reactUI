class ResponseHandler{

    testMap = new Map();

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
            name:"login",
            methodToExecute: this.login.bind(this)
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
            name: "restart",
            methodToExecute: this.restart.bind(this)
        },
        {
            name: "authenticationData",
            methodToExecute: this.authenticationData.bind(this)
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
        },
        {
            name: "upload",
            methodToExecute: this.upload.bind(this)
        },
        {
            name: "download",
            methodToExecute: this.download.bind(this)
        },
        {
            name: "showDocument",
            methodToExecute: this.showDocument.bind(this)
        }
    ]

    getResponse(requestPromise){
        requestPromise
            .then(response => { return response.json()})
            .then(jResponse => this.handler(jResponse))
            .catch(error => {console.error(error)})
    }

    handler(responseArray){

        let metaData = responseArray.filter(response => response.name === "dal.metaData");
        metaData.forEach(data => {
            this.metaData(data);
        })

        let fetchedData = responseArray.filter(response => response.name === "dal.fetch");
        fetchedData.forEach(data => {
            this.fetchedData(data);
        });


        responseArray.forEach(res => {
            let toExecute = this.responseMapper.find(toExecute => toExecute.name === res.name)
            toExecute ? toExecute.methodToExecute(res, this) : toExecute = undefined
        });
    }

    login(loginData){
        this.routeTo("/login");
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

    restart(restartData) {
        console.log(restartData, this)
    }

    authenticationData(authData){
        localStorage.setItem("authKey", authData.authKey);
    }

    errorMessage(error){
        throw new Error(error.message)
    }
    
    sessionExpiredMessage(message){
        this.serverCommunicator.startUp();
        this.routeTo("/login");
        throw new Error(message.title);
    }

    deviceStatus(deviceData){
        if(deviceData.layoutMode !== this.contentStore.layoutMode){
            this.contentStore.layoutMode = deviceData.layoutMode
            this.layoutModeChanged();
        }
    }

    showDocument(showData) {
        const a = document.createElement('a');
        a.style.display = 'none';
        let splitURL = showData.url.split(';')
        a.href = splitURL[0];
        a.setAttribute('target', splitURL[2]);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    //upload & download

    upload(uploadData) {
        const inputElem = document.createElement('input');
        inputElem.style.display = 'none';
        inputElem.type = 'file';
        document.body.appendChild(inputElem);
        inputElem.click()
        inputElem.onchange = e => {
            this.serverCommunicator.upload(uploadData.fileId, e.target.files[0].name, e.target.files[0])
        }
    }

    download(downloadData) {
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = downloadData.url.split(';')[0];
        a.setAttribute('download', downloadData.fileName);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }


    //dal

    fetchedData(fetchResponse){
        this.contentStore.emitFetchSuccess(fetchResponse);
    }

    dataProviderChange(changeData){
        this.contentStore.setDataProviderChangeData(changeData);
        this.serverCommunicator.fetchDataFromProvider(changeData.dataProvider);
    }

    metaData(mData){
        let metaValue = {}
        metaValue["primaryKeyColumns"] = mData["primaryKeyColumns"];
        metaValue["columns"] = new Map();
         mData["columns"].forEach(column => {
            metaValue["columns"].set(column.name, column)
        })
        this.contentStore.metaData.set(mData.dataProvider, metaValue)
    }
}
export default ResponseHandler