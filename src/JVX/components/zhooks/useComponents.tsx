/** React imports */
import {ReactElement, useCallback, useContext, useEffect, useState} from "react";

/** Other imports */
import {jvxContext} from "../../jvxProvider";
import {componentHandler, createCustomComponentWrapper} from "../../factories/UIFactory";

/** Type for component sizes */
export type ComponentSize = {
    width: number,
    height: number
}

/**
 * A hook which returns the state of a parents rendered Childcomponents and their preferred size 
 * @param id - the id of the component
 * @returns a layouts rendered Childcomponents and their preferred size
 */
const useComponents = (id: string): [Array<ReactElement>, Map<string,ComponentSize>| undefined] => {
    /** Current state of the preferredSizes of a parents Childcomponents */
    const [preferredSizes, setPreferredSizes] = useState<Map<string, ComponentSize>>();
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(jvxContext);

    /** Builds the Childcomponents of a parent and sets/updates their preferred size */
    const buildComponents = useCallback((): Array<ReactElement> => {
        let tempSizes = new Map<string, ComponentSize>();
        /** If the preferredSizes get updated and components have been removed, remove it from tempSizes */
        if (preferredSizes) {
            tempSizes = preferredSizes
            tempSizes.forEach((val, key) => {
                if (!context.contentStore.flatContent.has(key) && !context.contentStore.replacedContent.has(key)) {
                    tempSizes.delete(key)
                }
            });
        }
        /** Gets the Childcomponents of the parent */
        const children = context.contentStore.getChildren(id);
        const reactChildrenArray: Array<ReactElement> = [];
        /**
         * This function gets called when onLoadcallback of a component is called, if all components of a parents are loaded,
         * set the preferredSizes, if the components change update the current preferredSizes.
         * @param compId - the component id
         * @param height - the preferred height of the component
         * @param width - the preferred width of the component
         */
        const componentHasLoaded = (compId: string, height: number, width: number)=> {
            const preferredComp = tempSizes.get(compId)
            tempSizes.set(compId, {width: width, height: height});
            /** If all components are loaded or it is a tabsetpanel and the size changed, set the preferredSizes */
            if((tempSizes.size === children.size || id.includes('TP')) && (preferredComp?.height !== height || preferredComp?.width !== width)){
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

        /** If there are no children set an empty map */
        if(children.size === 0 && !preferredSizes){
            setPreferredSizes(new Map<string, ComponentSize>());
        }

        /** If there are components in tempSizes which are not longer in the current children (got removed, invisible), remove them and set preferredSize */
        if (tempSizes.size > children.size) {
            tempSizes.forEach((value, key) => {
                if(!children.has(key))
                    tempSizes.delete(key)
            });
            if (tempSizes.size === children.size)
                setPreferredSizes(new Map(tempSizes))
        }

        /** Create the reactchildren */
        children.forEach(child => {
            let reactChild;
            child.onLoadCallback = componentHasLoaded;
            if (!context.contentStore.replacedContent.has(child.id))
                reactChild = componentHandler(child);
            /** If it is a custom component, put the custom component in the CustomComponentWrapper */
            else {
                let customComp = context.contentStore.customContent.get(child.name as string)?.apply(undefined, []);
                reactChild = createCustomComponentWrapper(child, customComp);
            }
                
            if(reactChild){
                reactChildrenArray.push(reactChild);
            }
        });
        return reactChildrenArray;
    },[context.contentStore, id, preferredSizes]);
    
    /** Current state of a parents Childcomponents as reactchildren */
    const [components, setComponents] = useState<Array<ReactElement>>(buildComponents());

    /**
     * Subscribes to parent changes
     * @returns unsubscribes from parent changes
     */
    useEffect(() => {
        context.contentStore.subscribeToParentChange(id, () => {
            /** New Components of a parent when it changes */
            const newComponents = buildComponents();
            /** Contains the components */
            const cl = new Array<ReactElement>();
            newComponents.forEach(nc => {
                let alreadyAdded = false
                /** Checks if the new component is already added in the current components if yes add the old component else the new one */
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