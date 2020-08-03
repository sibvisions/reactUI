import React, { Component } from 'react';
import { RefContext } from '../helper/Context';


//Prime
import {TieredMenu} from 'primereact/tieredmenu';
import {InputText} from 'primereact/inputtext';
import {Menubar} from 'primereact/menubar';
import {Sidebar} from 'primereact/sidebar';


import "./Menu.scss";
import "./TopMenu.scss"
import { withRouter } from 'react-router-dom';

class Menu extends Component {

    state = {
        sideBarVisible: false
    }

    componentDidMount() {
        this.replaceSubIcon('right');
        this.replaceSubIcon('down');
    }

    replaceSubIcon(direction) {
        var elems = document.getElementsByClassName("pi-caret-" + direction);
        while (elems.length > 0) {
            for (let e of elems) {
                e.classList.remove("pi-caret-" + direction);
                e.classList.add("pi-angle-" + direction)
                e.style.fontSize = "1em"
            };
        }
    }

    getProfileMenu(){
        let profileMenu = [
            {
              label: this.context.contentStore.getCurrentUser().displayName,
              icon: "pi avatar-icon",
              items: [
                  {
                    label: 'Home',
                    icon: "pi pi-home",
                    command: () => {
                      this.props.history.push('/main');
                    }
                  },
                  {
                      label: 'Profil',
                      icon: "pi pi-user"
                  },
                  {
                      label: 'Einstellungen',
                      icon: "pi pi-cog",
                      command: () => {
                        this.props.history.push('/main/settings');
                      }
                  },
                  {
                      label: 'Logout',
                      icon: "pi pi-power-off",
                      command: () => {
                        this.context.serverComm.logOut();
                        this.props.history.push('/login');
                        this.context.growl({severity: 'success', summary:"Logged out successfully", detail:"logged out"})
                      }
                  }
              ]
            },
          ]
        return profileMenu
    }

    doScssStuff(thisRef){
        if(!thisRef.menu.classList.contains("hide")) {
            if(thisRef.menu.classList.contains("show")) {
                thisRef.menu.classList.remove("show");
            }
            thisRef.menu.classList.add("hide");
        }
        else {
            thisRef.menu.classList.remove("hide");
            thisRef.menu.classList.add("show");
        }
    }

    sideMenu(value){
 
        return (
            <React.Fragment>
            <div className="topBar">
                    <div className="logo-sidemenu">
                        <img src={process.env.PUBLIC_URL + '/assets/sibvisionslogo.png'} alt="firmenlogo"/>
                    </div>
                    {/** When the div/button is clicked, add hide or show respectively on which value is in the classList */}
                    <div className="menuBtnSide" onClick={() => this.doScssStuff(this) }>
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
                    <div className="profile p-col-fixed">
                        <div className="profile-content">
                            <Menubar model={this.getProfileMenu()} />
                        </div>
                    </div>
            </div>
            <div className={"menu-container"} ref={el => this.menu = el}>
                <TieredMenu model={value.contentStore.menuItems}/>
            </div>
            </React.Fragment>
        );
    }

    topMenu(value){
        return (
            <React.Fragment>
                <div className="topMenuBar p-grid ">
                    <div className="logo-topmenu p-col-fixed">
                        <img src={process.env.PUBLIC_URL + '/assets/sibvisionslogo.png'} alt="firmenlogo"/>
                    </div>
                    <div className="menuBtnTop p-col-fixed" onClick={() => this.state.sideBarVisible ? this.setState({sideBarVisible: false}) : this.setState({sideBarVisible: true})}>
                        <i className="pi pi-bars" style={{fontSize: '2em', fontWeight:'bold'}}/>
                    </div>
                    <Menubar model={value.contentStore.menuItems}  className="p-col"/>
                    <div className="searchbar-topmenu p-col-fixed">
                        <div className="p-inputgroup">
                            <span className="p-inputgroup-addon">
                                <i className="pi pi-search" style={{fontSize: "1em"}}></i>
                            </span>
                            <InputText placeholder="Suchen..." />
                        </div>
                    </div>
                    <div className="profile p-col-fixed">
                        <div className="profile-content">
                            <Menubar model={this.getProfileMenu()} />
                        </div>
                    </div>
                </div>
                <Sidebar visible={this.state.sideBarVisible} position="left" onHide={() => this.setState({sideBarVisible:false})}>
                    <TieredMenu className="sidebar-menu" model={value.contentStore.menuItems}/>
                </Sidebar>
            </React.Fragment>
        )
    }
    
    sideOrTop(value, thisRef){
        if(value.menuLocation === "side") return thisRef.sideMenu(value); else return thisRef.topMenu(value);
    }

    render() {
        if(this.context.menuLocation ==="side"){
            window.onresize = () => {
                if(this.menu) {
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
        }
        return (  
            <span>
                {this.sideOrTop(this.context, this)}
            </span>

        );
    }
}
Menu.contextType = RefContext
export default withRouter(Menu);