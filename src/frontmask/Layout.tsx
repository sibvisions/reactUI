import React ,{FC} from "react";
import Menu from "./menu/menu";
import "./Layout.scss"

const Layout: FC = ({children}) => {
    return(
        <div className={"layout"}>
            <Menu/>
            <div className={"main"}>
                {children}
            </div>
            <div>
                <h1>footer</h1>
            </div>
        </div>

    )
}
export default Layout