import React from 'react'
import {render} from 'react-dom'

import Home from "./components/Home";
import AttributeOverview from "./components/AttributeOverview";
import DataLoading from "./components/DataLoading";
import {BrowserRouter as Router, Route, Redirect, Switch,} from "react-router-dom";
import CategoricalASFInterface from "./components/CategoricalASFInterface";
import NumericalASFInterface from "./components/NumericalASFInterface";
import Weighting from "./components/Weighting";
import 'bootstrap/dist/css/bootstrap.min.css';
import ScrollToTop from "./ScrollToTop";
import FooterSticky from './components/FooterSticky';

//This file serves as the entry point of the app
//It contains all imports and the routing

class App extends React.Component {
    constructor(props) {
        super(props)
    }

    render() {

        //Every page must be registered as a Route
        return (
            <div className='wholeApp'>
                <Router>
                    <ScrollToTop>
                        <Route path="/datasetAttributes" component={AttributeOverview}/>
                        <Route path="/dataLoading" component={DataLoading}/>
                        <Route path="/selectedAttributesCategorical" component={CategoricalASFInterface}/>
                        <Route path="/selectedAttributesNumerical" component={NumericalASFInterface}/>
                        <Route path="/weighting" component={Weighting}/>
                        <Route path='/home' component={Home}/>
                        <Route exact path="/">
                            <Redirect to="/home"/>
                        </Route>
                    </ScrollToTop>
                </Router>
                <div>
                <FooterSticky/>
                </div>
            </div>
            
        );
    }
}

render(<App/>, document.getElementById('root'))

export default App;
