import React, { Component } from "react";
import "./Content.css"
import TopMenuComponent from "./TopMenu";
import MenuComponent from "./Menu";
import FooterComponent from "./Footer"
import { stretch } from "./Stretch";
import {Card} from 'primereact/card';

class ContentComponent extends Component {

    componentDidMount() {
        console.log(this.props.menuTop)
        if(!this.props.menuTop) {
            stretch('content-sidemenu');
        }
    }

    render() {
        if(this.props.menuTop) {
            return (
                <React.Fragment>
                    <TopMenuComponent/> 
                    <div className="content-topmenu">
                        <div className="p-grid">
                            <div className={"p-col-12 zahlungen"}>Zahlungen</div>
                            <div className="p-col-6">
                                <Card title={<span className="incomingPay cardTitle">Eingänge</span>}>
                                    <p>30 Zahlungseingänge</p>
                                    <p>50.000€</p>
                                </Card>
                            </div>
                            <div className="p-col-6">
                                <Card title={<span className="outgoingPay cardTitle">Ausgänge</span>}>
                                    <p>50 Zahlungsausgänge</p>
                                    <p>30.000€</p>
                                </Card>
                            </div>
                        </div>
                        <FooterComponent menuTop={this.props.menuTop} divToCheck="content-topmenu"/>
                    </div>
                </React.Fragment>
            )
        }
        else {
            return (
                <React.Fragment>
                    <MenuComponent/>
                    
                    <div className="content-sidemenu">
                        <div className="p-grid">
                            <div className={"p-col-12 zahlungen"}>Zahlungen</div>
                            <div className="p-col-6">
                                <Card title="Eingänge">
                                    <p>30 Zahlungseingänge</p>
                                    <p>50.000€</p>
                                </Card>
                            </div>
                            <div className="p-col-6">
                                <Card title="Ausgänge">
                                    <p>50 Zahlungsausgänge</p>
                                    <p>30.000€</p>
                                </Card>
                            </div>
                        </div>
                        <FooterComponent menuTop={this.props.menuTop} divToCheck="content-sidemenu"/>
                    </div>
                </React.Fragment>
            )
        }
    }
}

export default ContentComponent;