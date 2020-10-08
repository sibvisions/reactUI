import { Subject } from "rxjs";
import { mergeObject } from "../component/helper/MergeObject";

class ContentStore{

    layoutMode="";

    currentUser= {};

    flatContent= [];
    menuItems = [];
    removedContent = [];

    selectedRow = new Map();
    storedData = new Map();
    metaData = new Map();
    dataProviderChangedData = new Map();


    selectedDataRowChange = new Subject();
    fetchCompleted = new Subject();
    onSizeCalculated = new Subject();

    // Event
    emitChangeOfSelectedRow(newSelection){
        this.selectedDataRowChange.next(newSelection);
    }

    emitFetchSuccess(fetchResponse){
        let currData = this.storedData.get(fetchResponse.dataProvider);
        if (currData) {
            let x = 0;
            this.selectedRow.set(fetchResponse.dataProvider, fetchResponse.selectedRow);
            for (let i = fetchResponse.from; i <= fetchResponse.to; i++) {
                if (currData.length > 0) {
                    currData[i] = mergeObject(fetchResponse.columnNames, fetchResponse.records[x]);
                }
                x++;
            }
        }
        else {
            this.selectedRow.set(fetchResponse.dataProvider, fetchResponse.selectedRow);
            let fetchedData = []
            fetchResponse.records.forEach(record => {
                fetchedData.push(mergeObject(fetchResponse.columnNames, record));
            });
            this.storedData.set(fetchResponse.dataProvider, fetchedData)
        }
        this.fetchCompleted.next(fetchResponse);
    }

    emitSizeCalculated(calculatedSize) {
        this.onSizeCalculated.next(calculatedSize);
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

    getCurrentUser(){
        return this.currentUser
    }

    // Content Management

    updateContent(updatedContent){
        updatedContent.forEach(newEl => {
            let existingComp;

            existingComp = this.removedContent.findIndex(oldEl => oldEl.id === newEl.id)
            if(existingComp !== -1){
                let yeet =  this.removedContent.splice(existingComp,1);
                this.flatContent.push(yeet[0]);
            }

            existingComp = this.flatContent.find(oldEl => oldEl.id === newEl.id)
            
            if(existingComp){
                if(newEl["~destroy"]){
                    let indexToDelete = this.flatContent.findIndex(component => component.id === newEl.id);
                    if(indexToDelete !== -1) this.flatContent.splice(indexToDelete, 1);              
                }
                else if (newEl["~remove"]) {
                    let indexToRemove = this.flatContent.findIndex(component => component.id === newEl.id);
                    if(indexToRemove !== -1) {
                        let removedElem = this.flatContent.splice(indexToRemove, 1);
                        this.removedContent.push(removedElem[0]);
                    } 
                }
                else {
                    for(let newProp in newEl){
                        existingComp[newProp] = newEl[newProp]
                    }
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


    // Misc.

    setCurrentUser(userData){
        this.currentUser = userData
    }

    setDataProviderChangeData(changeData) {
        if (changeData.reload === -1) {
            this.storedData.delete(changeData.dataProvider)
        }
    }
}
export default ContentStore