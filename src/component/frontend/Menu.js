import React, {Component} from 'react';
import "./Menu.scss"
import {TieredMenu} from 'primereact/tieredmenu';
import {InputText} from 'primereact/inputtext';
import { withRouter } from "react-router-dom";
import { AppConsumer } from './AppContext';

class MenuComponent extends Component {

    /**
     * When the menu component gets mounted, change the submenu icon
     */
    componentDidMount() {
        var elems = document.getElementsByClassName("pi-caret-right");
        while(elems.length > 0) {
            for(let e of elems) {
                e.classList.remove("pi-caret-right");
                e.classList.add("pi-angle-right")
                e.style.fontSize = "1em"
            };
        }
    }

    /**
     * When the menu component gets mounted, change the submenu icon
     * (In Future version maybe not needed)
     */
    componentDidUpdate() {
        var elems = document.getElementsByClassName("pi-caret-right");
        while(elems.length > 0) {
            for(let e of elems) {
                e.classList.remove("pi-caret-right");
                e.classList.add("pi-angle-right")
                e.style.fontSize = "1em"
            };
        }
    }
    
    //rendering of menu component
    render() {
            /**
             * If the window width is below a certain point hide the menu, if the classList if the div already contains show or hide, remove it and add their counterpart
             */
            window.onresize = () => {
                if(this.menu != null) {
                    if(window.innerWidth <= 600 && this.menu.classList.contains("show")){
                        this.menu.classList.remove("show");
                        this.menu.classList.add("hide");
                    }
                    else if(window.innerWidth > 600 && this.menu.classList.contains("hide")) {
                        this.menu.classList.remove("hide");
                        this.menu.classList.add("show");
                    }
                    else if(window.innerWidth <= 600) {
                        this.menu.classList.add("hide");
                    }
                }
            }
        return (
            <AppConsumer>
                {({sendProfileOptions}) => (
                    <React.Fragment>
                    <div className="topBar">
                        <div className="logo-sidemenu">
                            <img src={process.env.PUBLIC_URL + '/assets/sibvisionslogo.png'} alt="firmenlogo"/>
                        </div>
                        {/**
                        * When the div/button is clicked, add hide or show respectively on which value is in the classList
                        */}
                        <div className="menuBtnSide" onClick={() => {
                            if(!this.menu.classList.contains("hide")) {
                                if(this.menu.classList.contains("show")) {
                                    this.menu.classList.remove("show");
                                }
                                this.menu.classList.add("hide");
                            }
                            else {
                                this.menu.classList.remove("hide");
                                this.menu.classList.add("show");
                            }
                        }
                        }>
            	            <i className="pi pi-bars" style={{fontSize: '1.5em', fontWeight:'bold'}}/>
                        </div>
                        <div className="searchbar-sidemenu">
                            <div className="p-inputgroup">
                                <span className="p-inputgroup-addon">
                                    <i className="pi pi-search" style={{fontSize: "1em"}}></i>
                                </span>
                                <InputText placeholder="Suchen..." />
                            </div>
                        </div>
                    </div>
                    <div className={"menu-container"} ref={el => this.menu = el} onChange={(e) => this.onMenuChange}>
                        <TieredMenu model={sendProfileOptions()} />
                        <TieredMenu model={this.props.menu}/>
                    </div>
                </React.Fragment>
                )}
            </AppConsumer>    
        )
    }
}
export default withRouter(MenuComponent);