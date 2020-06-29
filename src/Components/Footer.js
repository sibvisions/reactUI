import React, { Component } from "react";
import "./Footer.scss"
import { CheckFooterSide, CheckFooterTop } from "./CheckFooter";

class FooterComponent extends Component {

    componentDidMount() {
        this.props.menuTop ? CheckFooterTop(this.props.divToCheck) : CheckFooterSide(this.props.divToCheck)
    }

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