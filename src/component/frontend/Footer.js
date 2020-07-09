import React, { Component } from "react";
import "./Footer.scss"
import { stretch } from "./Stretch";

class FooterComponent extends Component {

    /**
     * When the footer gets mounted or updated, if the sidemenu is active, call th stretch functions
     */
    componentDidMount() {
        if(!this.props.menuTop) {
            stretch('footer-sidemenu')
        };
    }

    componentDidUpdate() {
        if(!this.props.menuTop) {
            stretch('footer-sidemenu')
        };
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