import React, {FC, useContext} from "react";
import {jvxContext} from "../../JVX/jvxProvider";
import Layout from "../Layout";
import {useParams} from "react-router-dom";
import Settings from "../settings/Settings";


const Home: FC = () => {
    const { componentId } = useParams<any>();
    const context = useContext(jvxContext);

    const buildWindow = () => {
        if (componentId === "settings") {
            return <Settings />
        }
        return context.contentStore.getWindow(componentId);
    }


    return(
        <Layout>
            {buildWindow()}
        </Layout>
    )
}
export default Home