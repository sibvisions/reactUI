import React, {FC, ReactElement, useContext, useState} from "react";
import {jvxContext} from "../../JVX/jvxProvider";
import Layout from "../Layout";
import {useParams} from "react-router-dom";
import Settings from "../settings/Settings";
import useHomeComponents from "src/JVX/components/zhooks/useHomeComponents";


const Home: FC = () => {
    const { componentId } = useParams<any>();
    const homeChildren = useHomeComponents(componentId);

    return(
        <Layout>
            {homeChildren}
        </Layout>
    )
}
export default Home