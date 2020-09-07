import {ReactElement, useContext} from "react";
import {jvxContext} from "../../jvxProvider";
import {componentHandler} from "../../factories/UIFactory";
import {onLoadCallBack} from "../BaseComponent";


const useChildren = (id: string, onLoadCallback: onLoadCallBack): Array<ReactElement> => {
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