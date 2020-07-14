class ResponseHandler{

    // Setter

    setContentSafe(contentSafe){
        this.contentSafe = contentSafe;
    }

    setServerCommunicator(serverCommunicator){
        this.serverCommunicator = serverCommunicator;
    }
    
    setMainScreen(screenRef){
        this.mainScreen = screenRef;
    }

    // Misc.
    updateContent(updatedContent){
        this.contentSafe.updateContent(updatedContent)
    }

    routeTo(route){
        this.mainScreen.routeTo(route);
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

        }
    ]

    getResponse(requestPromise){
        requestPromise
            .then(response => response.json())
            .then(jResponse => this.handler(jResponse))
            .catch(error => console.log(error))
    }

    handler(responseArray){
        console.log(responseArray)
        responseArray.forEach(res => {
            let toExecute = this.responseMapper.find(toExecute => toExecute.name === res.name)
            toExecute ? toExecute.methodToExecute(res, this) : toExecute = "yikes"
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
                        command: () => this.serverCommunicator.pressButton(subMenu.action.componentId),
                        key:subMenu.action.label})
                }
            });
        });
        this.contentSafe.menuItems = groups;
        this.routeTo("/main")
    }

    userData(userData){
    }

    generic(genericResponse){
        if(genericResponse.changedComponents && genericResponse.changedComponents.length > 0){
            let sortetComponents = [];
            let foundChildren = []
            genericResponse.changedComponents.forEach(parent => {
                parent.subjects = [];
                genericResponse.changedComponents.forEach(child => {
                    if(parent.id === child.parent) {
                        parent.subjects.push(child)
                        foundChildren.push(child)
                    }
                });
                if(!foundChildren.some(x => x === parent)) sortetComponents.push(parent)
            });
            this.updateContent(sortetComponents)
        }
        if(!genericResponse.update){
            this.routeTo("/main/"+genericResponse.componentId)
        }
    }

    closeScreen(screenToClose){
        let windowToDelete = this.contentSafe.findWindow(screenToClose.componentId);
        this.contentSafe.deleteWindow(windowToDelete.id)
        this.routeTo("/main");
    }

    errorMessage(error){
        throw new Error(error.message)
    }
    
    sessionExpiredMessage(message){
        this.routeTo("/login");
        throw new Error(message.title);
    }
}

export default ResponseHandler