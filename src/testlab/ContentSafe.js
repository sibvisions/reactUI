

class ContentSafe{

    allContent = [];
    menuItems = [];


    updateContent(updatedContent){
        updatedContent.forEach(newComponent => {
            if(!this.findYou(newComponent)){
                if(!newComponent.parent) this.allContent.push(newComponent);
                else {
                    let parnetComp = this.findYou({id: newComponent.parent})
                    //TO DO
                    //Tell parent to update Content
                    //Update Info in allContent Array
                    console.log(parnetComp)
                }
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
}
export default ContentSafe