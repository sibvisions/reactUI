import React, {FC} from "react";
import Layout from "../Layout";
import {useParams} from "react-router-dom";
import useHomeComponents from "../../JVX/components/zhooks/useHomeComponents";


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