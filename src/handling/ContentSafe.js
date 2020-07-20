import { Subject } from "rxjs";

class ContentSafe{

    allContent = [];
    menuItems = [];

    metaDataSubject = new Subject();

    updateContent(updatedContent){
        updatedContent.forEach(newComponent => {
            let loadedComponent = this.findYou(newComponent)
            if(!loadedComponent){
                if(!newComponent.parent && newComponent.className) {
                    this.allContent.push(newComponent);
                }
            }
            else
            {
                for(let newProp in newComponent){
                    for(let oldProp in loadedComponent){
                        // update property to new value
                        if(newProp === oldProp){
                            loadedComponent[oldProp] = newComponent[newProp];
                            break;
                        }
                        // add new property
                        else if(!loadedComponent[newProp]){
                            loadedComponent.newProp = newComponent[newProp];
                        }
                    }
                }
            }
        });
    }

    updateMetaDataOfContent(){
        
    }

    emitMetaDataRecievedEvent(metaDataArray){
        this.metaDataSubject.next(metaDataArray);
    }

    getWindow(componentId){
        return this.allContent.find(window => window.name === componentId);
    }

    findYou(toFind, currnetObj=this.allContent){
        let foundObj;
        currnetObj.some(comp => {
            if(comp.id === toFind.id){
                foundObj = comp;
                return true;
            } else if (comp.subjects.length > 0){
                let f =  this.findYou(toFind, comp.subjects);
                if(f){
                    foundObj = f; 
                    return true;
                }
            }
            return false;
        })
        return foundObj;
    }

    findParent(child){
        let fullObj = this.findYou(child);
        let parent = this.findYou({id: fullObj.parent})

        return parent;
    }

    findWindow(windowID){
        return this.allContent.find(window => window.name === windowID)
    }

    deleteWindow(windowID){
        this.allContent.splice(this.allContent.findIndex(x => x.id === windowID),1);
    }
}
export default ContentSafe