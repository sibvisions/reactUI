import React, {Component} from 'react';
import "./Menu.scss"
import {TieredMenu} from 'primereact/tieredmenu';
import logo from './imgs/sibvisionslogo.png'
import {InputText} from 'primereact/inputtext';
import { withRouter } from "react-router-dom";

class MenuComponent extends Component {

    constructor(props) {
        super(props)
        this.items = [
            {
                label: "Home",
                icon: "pi pi-home",
                command: () => this.props.history.push("/content")
            },
            {
                label: "Zahlungen",
                icon: "pi pi-dollar",
                items: [ 
                    {
                        label: 'Übersicht',
                        icon: 'pi pi-align-justify'
                    },
                    {
                        label: 'Eingänge',
                        icon: 'pi pi-angle-double-down'
                    },
                    {
                        label: 'Ausgänge',
                        icon: 'pi pi-angle-double-up'
                    }
                ]
            },
            {
                label: "Projekte",
                icon: "pi pi-globe",
                items: [ 
                    {
                        label: 'Projekt A',
                        icon: 'pi pi-angle-right'
                    },
                    {
                        label: 'Projekt B',
                        icon: 'pi pi-angle-right'
                    }
                ]
            },
            {
                label: "Grafiken",
                icon: "pi pi-chart-bar",
                items: [ 
                    {
                        label: 'Übersicht',
                        icon: 'pi pi-align-justify'

                    },
                    {
                        label: 'Grafik A',
                        icon: 'pi pi-angle-right'
                    },
                    {
                        label: 'Grafik B',
                        icon: 'pi pi-angle-right'
                    }
                ]
            },
            {
                label: "Dokumente",
                icon: "pi pi-file-pdf",
                items: [ 
                    {
                        label: 'Dokument A',
                        icon: 'pi pi-angle-right'
                    },
                    {
                        label: 'Dokument B',
                        icon: 'pi pi-angle-right'
                    },
                    {
                        label: 'Dokument C',
                        icon: 'pi pi-angle-right'
                    },
                    {
                        label: 'Dokument D',
                        icon: 'pi pi-angle-right'
                    }
                ]
            },
            {
                label: "Weiteres",
                icon: "pi pi-list",
                items: [ 
                    {
                        label: 'Weiteres Submenu 1',
                    },
                    {
                        label: 'Weiteres Submenu 2',
                    }
                ]
            }
        ]
        this.profileOptions = [
            {
                label: "John Doe",
                icon: "pi avatar-icon",
                items: [
                    {
                        label: 'Profil',
                        icon: "pi pi-user"
                    },
                    {
                        label: 'Einstellungen',
                        icon: "pi pi-cog",
                        command: () => this.props.history.push("/settings")
                    },
                    {
                        label: 'Logout',
                        icon: "pi pi-power-off"
                    }
                ]
            },
        ]
    }
    
    render() {
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
            <React.Fragment>
                <div className={"topBar "  + this.props.theme}>
                    <div className="logo-sidemenu">
                        <img src={logo} alt="firmenlogo"/>
                    </div>
                    <div className="button-sidemenu" onClick={() => {
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
                    <TieredMenu model={this.profileOptions} />
                    <TieredMenu model={this.props.menu}/>
                </div>
            </React.Fragment>
                
        )
    }
}
export default withRouter(MenuComponent);