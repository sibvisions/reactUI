import {ReactElement, useCallback, useContext, useEffect, useState} from "react";
import {jvxContext} from "../../jvxProvider";
import {componentHandler} from "../../factories/UIFactory";
export type ComponentSize = {
    width: number,
    height: number
}


const useComponents = (id: string): [Array<ReactElement>, Map<string,ComponentSize>| undefined] => {

    const [preferredSizes, setPreferredSizes] = useState<Map<string, ComponentSize>>();
    const context = useContext(jvxContext);

    const buildComponents = useCallback((): Array<ReactElement> => {
        let tempSizes = new Map<string, ComponentSize>();
        if (preferredSizes)
            tempSizes = preferredSizes
        const children = context.contentStore.getChildren(id);
        const reactChildrenArray: Array<ReactElement> = [];
        console.log(children, id)
        const componentHasLoaded = (compId: string, height: number, width: number)=> {
            const preferredComp = tempSizes.get(compId)
            tempSizes.set(compId, {width: width, height: height});
            console.log(tempSizes.size, children.size, id)
            if(tempSizes.size === children.size && (preferredComp?.height !== height || preferredComp?.width !== width)){
                setPreferredSizes(new Map(tempSizes));
            }

            //Set Preferred Sizes of changed Components
            if(preferredSizes && preferredSizes.has(compId)){
                const preferredComp = preferredSizes.get(compId);
                if(preferredComp && (preferredComp.height !== height || preferredComp.width !== width)){
                    preferredComp.height = height;
                    preferredComp.width = width;
                    setPreferredSizes(new Map(preferredSizes));
                }
            }
        }

        if(children.size === 0 && !preferredSizes){
            setPreferredSizes(new Map<string, ComponentSize>());
        }

        if (tempSizes.size > children.size) {
            tempSizes.forEach((value, key) => {
                if(!children.has(key))
                    tempSizes.delete(key)
            });
            if (tempSizes.size === children.size)
                setPreferredSizes(new Map(tempSizes))
        }

        children.forEach(child => {
            console.log(child.onLoadCallback)
            child.onLoadCallback = componentHasLoaded;
            const reactChild = componentHandler(child);
            if(reactChild){
                reactChildrenArray.push(reactChild);
            }
        });
        return reactChildrenArray;
    },[context.contentStore, id, preferredSizes]);
    
    const [components, setComponents] = useState<Array<ReactElement>>(buildComponents());



    useEffect(() => {
        context.contentStore.subscribeToParentChange(id, () => {
            const newComponents = buildComponents();
            const cl = new Array<ReactElement>();
            newComponents.forEach(nc => {
                let alreadyAdded = false
                components.forEach(oc => {
                    if(nc.props.id === oc.props.id){
                        alreadyAdded = true
                        cl.push(oc);
                    }
                });
                if(!alreadyAdded){
                    cl.push(nc);
                }
            });
            setComponents(cl);
        });

        return () => {
            context.contentStore.unsubscribeFromParentChange(id);
        }
    }, [context.contentStore, id, components, buildComponents]);



    return [components, preferredSizes];
}
export default useComponents;