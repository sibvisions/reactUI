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
            methodToExecute: this.applicationMetaData
        },
        {
            name:"menu",
            methodToExecute: this.menu
        },
        {
            name: "userData",
            methodToExecute: this.userData
        },
        {
            name: "screen.generic",
            methodToExecute: this.generic
        },
        {
            name: "closeScreen",
            methodToExecute: this.closeScreen
        }
    ]

    getResponse(requestPromise){
        requestPromise
            .then(response => response.json())
            .then(jResponse => this.handler(jResponse))
            .catch(error => console.log(error))
    }

    handler(responseArray){
        responseArray.forEach(res => {
            let toExecute = this.responseMapper.find(toExecute => toExecute.name === res.name)
            toExecute ? toExecute.methodToExecute(res, this) : toExecute = "yikes"
        });
    }

    applicationMetaData(metaData){
        localStorage.setItem("clientId", metaData.clientId);
    }

    menu(unSortedMenuItems, thisRef){
        let groupsString= [];
        let groups = [];
        //Make out distinct groups
        unSortedMenuItems.items.forEach(parent => {
            if(groupsString.indexOf(parent.group) === -1) {
                groupsString.push(parent.group)
                groups.push({label: parent.group, items: [], key: parent.group})
            }
        });
        //Add SubMenus to parents
        groups.forEach(e => {
            unSortedMenuItems.items.forEach(subMenu => {
                if(e.label===subMenu.group) {
                    e.items.push({
                        label: subMenu.action.label,
                        componentId:subMenu.action.componentId,
                        command: () => thisRef.serverCommunicator.pressButton(subMenu.action.componentId),
                        key:subMenu.action.label})
                }
            });
        });
        thisRef.contentSafe.menuItems = groups;
        thisRef.routeTo("/main")
    }

    userData(userData, thisRef){
    }

    generic(genericResponse, thisRef){
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
            thisRef.updateContent(sortetComponents)
        }
        if(!genericResponse.update){
            thisRef.routeTo("/main/"+genericResponse.componentId)
        }
    }

    closeScreen(screenToClose, thisRef){
        let windowToDelete = thisRef.contentSafe.findWindow(screenToClose.componentId);
        thisRef.contentSafe.deleteWindow(windowToDelete.id)
        thisRef.routeTo("/main");
    }
}

export default ResponseHandler