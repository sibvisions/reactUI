import { Subject, ReplaySubject } from "rxjs";

class ContentStore{

    layoutMode="";

    currentUser= {};

    flatContent= [];
    menuItems = [];

    storedData = new Map();


    selectedDataRowChange = new ReplaySubject(1);
    fetchCompleted = new Subject();

    // Event
    emitChangeOfSelectedRow(newSelection){
        this.selectedDataRowChange.next(newSelection);
    }

    emitFetchSuccess(fetchResponse){
        this.storedData.set(fetchResponse.dataProvider, fetchResponse)
        this.fetchCompleted.next(fetchResponse);
    }

    // Getter

    getWindow(componentId){
        return this.flatContent.find(window => {
            if(!window.parent){
                return window.name === componentId;
            }
            return false;
        });
    }

    getAllBelow(parent){
        let subs = []
        parent.subjects.forEach(element => {
            subs.push(element);
            if(element.subjects.length > 0){
                subs.concat(this.getAllBelow(element));
            }
        });
        return subs;
    }

    getCurrentUser(){
        return this.currentUser
    }

    // Content Management

    updateContent(updatedContent){
        updatedContent.forEach(newEl => {
            let existingComp = this.flatContent.find(oldEl => oldEl.id === newEl.id)
            if(existingComp){
                if(newEl["~destroy"]){
                    let indexToDelete = this.flatContent.findIndex(x => x.id === newEl.id);
                    if(indexToDelete !== -1) this.flatContent.splice(indexToDelete, 1);              
                } else {
                    for(let newProp in newEl){
                        existingComp[newProp] = newEl[newProp]
                    }
                    console.log(existingComp["cellEditor"]["preferredEditorMode"]);
                    console.log(newEl)
                }   
            } else this.flatContent.push(newEl)
        });
        this.buildHierachy(this.flatContent);
    }

    buildHierachy(allComponents){
        let sortetComponents = [];
        let foundChildren = [];
        allComponents.forEach(parent => {
            parent.subjects = []; parent.subjects.length = 0;
            allComponents.forEach(child => {
                if(parent.id === child.parent) {
                    parent.subjects.push(child)
                    foundChildren.push(child)
                }
            });
            if(!foundChildren.some(x => x === parent)) sortetComponents.push(parent)
        });
    }

    deleteWindow(window){
        let toDelete = this.getWindow(window.componentId)
        let allSubs = this.getAllBelow(toDelete);
        allSubs.forEach(el => {
            let toDeleteId = this.flatContent.findIndex(x => x.id === el.id);
            this.flatContent.splice(toDeleteId, 1);
        });
        this.flatContent.splice(this.flatContent.findIndex(x => x.id === toDelete.id),1);
    }


    // Misc.

    setCurrentUser(userData){
        this.currentUser = userData
    }
}
export default ContentStore