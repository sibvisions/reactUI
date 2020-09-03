import {ReactElement, useContext} from "react";
import {jvxContext} from "../../jvxProvider";
import {componentHandler} from "../../factories/UIFactory";


const useChildren = (id: string, onLoadCallback: Function): Array<ReactElement> => {
    const context = useContext(jvxContext)
    const children = context.contentStore.getChildren(id);

    const buildChildren = (): Array<ReactElement> => {
        const reactChildrenArray: Array<ReactElement> = []
        children.forEach(child => {
            child.onLoadCallback = onLoadCallback;
             const reactChild = componentHandler(child);
             if(reactChild){
                 reactChildrenArray.push(reactChild);
             }
        });
        return reactChildrenArray;
    }

    const reactChildren : Array<ReactElement> = buildChildren();

    return reactChildren;
}
export default useChildren