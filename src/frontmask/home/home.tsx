import React, {FC, useContext} from "react";
import {jvxContext} from "../../JVX/jvxProvider";
import Layout from "../Layout";
import {componentHandler} from "../../JVX/factories/UIFactory";
import {useParams} from "react-router-dom";


const Home: FC = () => {
    const { componentId } = useParams<any>();
    const context = useContext(jvxContext);

    const buildWindow = () => {
        const window = context.contentStore.getWindow(componentId);
        if(window){
            const component = componentHandler(window);
            return component;
        }
        return undefined;
    }

    return(
        <Layout>
            {buildWindow()}
        </Layout>
    )
}
export default Home