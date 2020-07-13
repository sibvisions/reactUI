

class ContentSafe{

    allContent = [];
    menuItems = [];


    updateContent(updatedContent){
        updatedContent.forEach(newComponent => {
            if(!this.findYou(newComponent)){
                if(!newComponent.parent && newComponent.className) this.allContent.push(newComponent);
                else {
                    let parnetComp = this.findYou({id: newComponent.parent})
                    //TO DO
                    //Update Info in allContent Array
                    console.log(newComponent)
                }
            }
            else
            {
                
            }
        });
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