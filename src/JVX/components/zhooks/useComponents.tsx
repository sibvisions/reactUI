import {ReactElement, useContext, useEffect, useState} from "react";
import {jvxContext} from "../../jvxProvider";
import {componentHandler} from "../../factories/UIFactory";
export type ComponentSize = {
    width: number,
    height: number
}


const useComponents = (id: string): [Array<ReactElement>, Map<string,ComponentSize>| undefined] => {

    let tempSizes = new Map<string, ComponentSize>();
    const [preferredSizes, setPreferredSizes] = useState<Map<string, ComponentSize>>();
    const context = useContext(jvxContext);




    const buildComponents = (): Array<ReactElement> => {
        const children = context.contentStore.getChildren(id);
        const reactChildrenArray: Array<ReactElement> = [];
        const componentHasLoaded = (compId: string, height: number, width: number)=> {
            const testComp = tempSizes.get(compId)
            tempSizes.set(compId, {width: width, height: height});
            if(tempSizes.size === components.length && (testComp?.height !== height || testComp?.width !== width)){
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

        if(children.length === 0 && !preferredSizes){
            setPreferredSizes(new Map<string, ComponentSize>());
        }
        children.forEach(child => {
            child.onLoadCallback = componentHasLoaded;
            const reactChild = componentHandler(child);
            if(reactChild){
                reactChildrenArray.push(reactChild);
            }
        });
        return reactChildrenArray;
    }


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
    }, [context.contentStore, id, components]);



    return [components, preferredSizes];
}
export default useComponents;