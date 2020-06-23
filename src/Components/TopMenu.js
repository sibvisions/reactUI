import React, { Component } from "react";
import "./TopMenu.css"
import {Menubar} from 'primereact/menubar';
import logo from './imgs/sibvisionslogo.png';
import {InputText} from 'primereact/inputtext';
import {Sidebar} from 'primereact/sidebar';
import {TieredMenu} from 'primereact/tieredmenu';
import avatar from './imgs/avatar.jfif'
import { Redirect } from "react-router-dom";

const ProfileOptions = () => (
    <ul className="profile-options">
        <li className="profile-options-item">
            <a className="profile-options-link" href="#">
                <span>
                    <i className="pi pi-user" style={{fontSize: '1em'}}/>
                </span>
                <span className="profile-options-text">Profil</span>
            </a>
        </li>
        <li className="profile-options-item" onClick={<Redirect to='/settings' />}>
            <a className="profile-options-link" href="/settings">
                <span>
                    <i className="pi pi-cog" style={{fontSize: '1em'}}/>
                </span>
                <span className="profile-options-text">Einstellungen</span>
            </a>
        </li>
        <li className="profile-options-item">
            <a className="profile-options-link" href="#">
            <span>
                    <i className="pi pi-power-off" style={{fontSize: '1em'}}/>
                </span>
                <span className="profile-options-text">Logout</span>
            </a>
        </li>
    </ul>
)

class TopMenuComponent extends Component {

    constructor(props) {
        super(props)
        this.state = {
            sideBarVisible: false,
            profileOptionsVisible: false
        }
        this.items = [
            {
                label: "Home",
                icon: "pi pi-home",
                command: () => window.location = "/content"
            },
            {
                label: "Zahlungen",
                icon: "pi pi-dollar",
                items: [ 
                    {
                        label: 'Übersicht',
                        icon: 'pi pi-align-justify',
                        className: "submenu"
                    },
                    {
                        label: 'Eingänge',
                        icon: 'pi pi-angle-double-down',
                        className: "submenu"
                    },
                    {
                        label: 'Ausgänge',
                        icon: 'pi pi-angle-double-up',
                        className: "submenu"
                    }
                ]
            },
            {
                label: "Projekte",
                icon: "pi pi-globe",
                items: [ 
                    {
                        label: 'Projekt A',
                        icon: 'pi pi-angle-right',
                        className: "submenu"
                    },
                    {
                        label: 'Projekt B',
                        icon: 'pi pi-angle-right',
                        className: "submenu"
                    }
                ]
            },
            {
                label: "Grafiken",
                icon: "pi pi-chart-bar",
                items: [ 
                    {
                        label: 'Übersicht',
                        icon: 'pi pi-align-justify',
                        className: "submenu"

                    },
                    {
                        label: 'Grafik A',
                        icon: 'pi pi-angle-right',
                        className: "submenu"
                    },
                    {
                        label: 'Grafik B',
                        icon: 'pi pi-angle-right',
                        className: "submenu"
                    }
                ]
            },
            {
                label: "Dokumente",
                icon: "pi pi-file-pdf",
                items: [ 
                    {
                        label: 'Dokument A',
                        icon: 'pi pi-angle-right',
                        className: "submenu"
                    },
                    {
                        label: 'Dokument B',
                        icon: 'pi pi-angle-right',
                        className: "submenu"
                    },
                    {
                        label: 'Dokument C',
                        icon: 'pi pi-angle-right',
                        className: "submenu"
                    },
                    {
                        label: 'Dokument D',
                        icon: 'pi pi-angle-right',
                        className: "submenu"
                    }
                ]
            },
            {
                label: "Weiteres",
                icon: "pi pi-list",
                items: [ 
                    {
                        label: 'Weiteres Submenu 1',
                        className: "submenu"
                    },
                    {
                        label: 'Weiteres Submenu 2',
                        className: "submenu"
                    }
                ]
            }
        ]
    }

    render() {
        return (
            <React.Fragment>
                <div className="topMenuBar p-grid">
                    <div className="logo-topmenu p-col-fixed">
                        <img src={logo} alt="firmenlogo"/>
                    </div>
                    <div className="button-topmenu p-col-fixed" onClick={() => this.state.sideBarVisible ? this.setState({sideBarVisible: false}) : this.setState({sideBarVisible: true})}>
            	        <i className="pi pi-bars" style={{fontSize: '2em', fontWeight:'bold'}}/>
                    </div>
                    <Menubar model={this.items} className="p-col"/>
                    <div className="searchbar-topmenu p-col-fixed">
                        <div className="p-inputgroup">
                            <span className="p-inputgroup-addon">
                                <i className="pi pi-search" style={{fontSize: "1em"}}></i>
                            </span>
                            <InputText placeholder="Suchen..." />
                        </div>
                    </div>
                    <div className="profile p-col-fixed">
                        <div className="profile-content" onClick={() => this.state.profileOptionsVisible ? this.setState({profileOptionsVisible: false}) : this.setState({profileOptionsVisible: true})}>
                            <img className="avatar" alt="avatar of user" src={avatar}></img>
                            <span>John Doe</span>
                        </div>         
                        {this.state.profileOptionsVisible ? <ProfileOptions /> : null}
                    </div>
                </div>
                <Sidebar visible={this.state.sideBarVisible} position="left" onHide={() => this.setState({sideBarVisible:false})}>
                    <TieredMenu className="sidebar-menu" model={this.items}/>
                </Sidebar>
            </React.Fragment>
        )
    }
}
export default TopMenuComponent;