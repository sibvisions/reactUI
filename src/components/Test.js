import React from 'react';
import BScreen from './responseObj/BScreen';
import { Switch, Route } from 'react-router-dom';


class Test extends BScreen {

    makeRoutes(ref){
        let routes = []
        ref.state.content.forEach(e => {
            routes.push(<Route key={e.props.componentid} path={"/" + e.props.componentid} component={() => e} />)
        });
        return routes;
    }

    render(){ 
        return ( 
            <div>
                <Switch>
                    {this.makeRoutes(this)}
                </Switch>
                {this.state.route}
            </div>
         );
    }
}
 
export default Test;