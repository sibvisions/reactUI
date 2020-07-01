import React, { Component } from "react";
import "./Footer.scss"
import { CheckFooterSide, CheckFooterTop } from "./CheckFooter";

class FooterComponent extends Component {

    /**
     * When the footer gets mounted, check which menu is active and call the respective function
     */
    componentDidMount() {
        this.props.menuTop ? CheckFooterTop(this.props.divToCheck) : CheckFooterSide(this.props.divToCheck)
    }

    /**
     * Footer gets rendered based on menu
     */
    render() {
        if(this.props.menuTop) {
            return(
                <div className="footer-topmenu">Fußzeile</div>
            )
        }
        else {
            return(
                <div className="footer-sidemenu">Fußzeile</div>
            )
        }
    }
}
export default FooterComponent;