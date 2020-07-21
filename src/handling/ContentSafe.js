class ContentSafe{

    flatContent= [];
    hierachyContent = [];


    menuItems = [];

    updateContent(updatedContent){
        updatedContent.forEach(newEl => {
            let existingComp = this.flatContent.find(oldEl => oldEl.id === newEl.id)
            if(existingComp){
                //ToDo manage delete
                for(let newProp in newEl){
                    existingComp[newProp] = newEl[newProp]
                }
            } else this.flatContent.push(newEl);
        });
        this.buildHierachy([...this.flatContent]);
    }

    buildHierachy(allComponents){
        let sortetComponents = [];
        let foundChildren = []
        allComponents.forEach(parent => {
            parent.subjects = [];
            allComponents.forEach(child => {
                if(parent.id === child.parent) {
                    parent.subjects.push(child)
                    foundChildren.push(child)
                }
            });
            if(!foundChildren.some(x => x === parent)) sortetComponents.push(parent)
        });
        this.hierachyContent = sortetComponents;
    }

    getWindow(componentId){
        return this.hierachyContent.find(window => window.name === componentId);
    }

    findYou(toFind, currnetObj=this.hierachyContent){
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
        return this.hierachyContent.find(window => window.name === windowID)
    }

    deleteWindow(windowID){
        let fullWindowToDelete =  this.hierachyContent.find(window => window.name === windowID.componentId)

        if(fullWindowToDelete){
            let all = []
            all = this.getAllSubjects(fullWindowToDelete, [fullWindowToDelete])
            console.log(all)
            let updatedContent = this.flatContent.filter(x => !all.includes(x));
            this.flatContent = updatedContent
        }

        
    }

    getAllSubjects(parent, toReturn ){
        parent.subjects.forEach(sub => {
            toReturn.push(sub);
            if(sub.subjects.length > 0)this.getAllSubjects(sub, toReturn);
        });
        return toReturn
    }
}
export default ContentSafe