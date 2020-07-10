import { Subject } from "rxjs";
class UiBuilder{
    activeWindow = {};
    btnPressedClass = {};

    menuSubject = new Subject();
    contentEvent = new Subject();

    genericComponentMapper = 
    [
        {
            name:"Panel",
            method: this.panel
        }
    ]

    constructor(activeWindow){
        this.setActiveWindow(activeWindow);
    }

    // Emit events
    emitMenuChange(newMenu){
        this.menuSubject.next(newMenu);
    }

    emitContentChanges(updatedContent){
        this.contentEvent.next(updatedContent);
    }

    // Setters
    setBtnPressClass(toTo){
        this.btnPressedClass = toTo
    }

    // Misc.
    setActiveWindow(reference){
        this.activeWindow = reference;    
    }

    routeFromActiveScreen(route){
        this.activeWindow.props.history.push(route);
    }

    
    // Generic Handler
    genericHandler(genericResponse){

        if(genericResponse.changedComponents !== undefined && genericResponse.changedComponents.length > 0){
            let sortetComponents = [];
            genericResponse.changedComponents.forEach(parent => {
                parent.descendants = [];
                let isParent = false;
                genericResponse.changedComponents.forEach(child => {
                    if(parent.id === child.parent) {
                        isParent = true
                        parent.descendants.push(child)
                    }
                });
                if(isParent) sortetComponents.push(parent)
            });
            this.emitContentChanges(sortetComponents)
        }
    }

    compontenthandler(component){

    }

    // UI building
    loggedInUser(userData){
        
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


    // Components
    panel(panelData){
        console.log(panelData);
    }
}

export default UiBuilder