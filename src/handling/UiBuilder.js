

class UiBuilder{
    activeWindow = {};
    menuSubscriber = [];
    btnPressedClass = {};

    constructor(activeWindow){
        this.setActiveWindow(activeWindow);
    }

    subscribeToMenu(func){
        this.menuSubscriber.push(func);
    }

    unsubscribeFromMenu(func){
        this.menuSubscriber.splice(this.menuSubscriber.indexOf(func),1);
    }

    setBtnPressClass(toTo){
        this.btnPressedClass = toTo
    }

    emitMenuChange(newMenu){
        this.menuSubscriber.forEach(fun => {
            fun(newMenu)
        });
    }

    setActiveWindow(reference){
        this.activeWindow = reference;    
    }

    loggedInUser(userData){
        this.activeWindow.props.history.push("/main")
    }

    buildMenu(unSortedMenuItems){
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
                        command: () => this.btnPressedClass.pressButton(subMenu.action.componentId),
                        key:subMenu.action.label})
                }
            });
        });
        this.emitMenuChange(groups)
    }
}

export default UiBuilder