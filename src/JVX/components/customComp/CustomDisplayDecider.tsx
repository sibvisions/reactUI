import React, { FC, useContext } from "react"
import { useParams } from "react-router";
import { jvxContext } from "../../jvxProvider"
import { getScreenIdFromNavigation } from "../util/GetScreenNameFromNavigation";
import WorkScreen from "../workscreen/WorkScreen";
import CustomDisplayScreen from "./CustomDisplayScreen";

const CustomDisplayDecider:FC = () => {
    const context = useContext(jvxContext);
    const { componentId } = useParams<any>();
    const screenId = getScreenIdFromNavigation(componentId, context.contentStore)

    return context.contentStore.customDisplays.has(screenId) ? <CustomDisplayScreen/> : <WorkScreen/>
}
export default CustomDisplayDecider;