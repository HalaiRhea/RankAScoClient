import React from 'react';
import {Link} from "react-router-dom";
import {filterCategorical} from "../HelperFunction";
import '../App.css';
import TinyASF from "./TinyASF";
import CategoricalPlotSmall from "./CategoricalPlotSmall";
import NumericalPlotSmall from "./NumericalPlotSmall";

class AttributeOverview extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            data: this.props.location.state.data,
            overallResult: this.props.location.state.overallResult,
            selectedAttributes: this.props.location.state.selectedAttributes,
            options: this.props.location.state.options,
            categorical: this.props.location.state.categorical,
            numerical: this.props.location.state.numerical,
            categoricalCorrelation: [],
            numericalCorrelation: [],

        };
        this.removeASF = this.removeASF.bind(this)
        this.removeAttributeFromListCategorical = this.removeAttributeFromListCategorical.bind(this);
        this.removeAttributeFromListNumerical = this.removeAttributeFromListNumerical.bind(this);
    }

    /**
     * Removes an ASF and the associated scores
     * @param attribute String The attribute where the ASF should be removed for
     */
    removeASF(attribute) {
        let result = this.state.overallResult;
        let removed, rest;
        let removedArray;

        //Remove the scores for a given attribute
        removedArray = [].concat(result.map(element => {
            ({[attribute]: removed, ...rest} = element);
            return rest;
        }))

        //Remove the attribute from the list of selected attributes
        let selectedAttributes = this.state.selectedAttributes;
        const shortenedArray = selectedAttributes.filter(element => attribute !== element);

        //Remove the attribute from the options
        let options = this.state.options;
        delete options[attribute]
        this.setState({overallResult: removedArray, selectedAttributes: shortenedArray, options: options})
    }

    /**
     * Removes a categorical attribute completely such that is is not shown on the overview anymore and no ASF can
     * be added for it
     * @param attribute String The attribute that should be removed
     */
    removeAttributeFromListCategorical(attribute) {
        let categorical = this.state.categorical.filter(element => attribute !== element);

        let result = this.state.data;
        let removed, rest;
        let removedArray;
        removedArray = [].concat(result.map(element => {
            ({[attribute]: removed, ...rest} = element);
            return rest;
        }))

        this.setState({categorical: categorical, data: removedArray,}, () => this.removeASF(attribute));
    }

    /**
     * Removes a numerical attribute completely such that is is not shown on the overview anymore and no ASF can
     * be added for it
     * @param key String The attribute that should be removed
     */
    removeAttributeFromListNumerical(key) {
        let numerical = this.state.numerical.filter(element => key !== element);

        let result = this.state.data;
        let removed, rest;
        let removedArray;
        removedArray = [].concat(result.map(element => {
            ({[key]: removed, ...rest} = element);
            return rest;
        }))

        this.setState({numerical: numerical, data: removedArray,}, () => this.removeASF(key));
    }

    render() {

        return (
            <div>
                <div className='largeHeader'><h1 style={{display: 'inline'}}>Overview of all attributes</h1>
                    <div style={{display: 'inline', float: 'right', marginRight: '5%'}}>

                        {this.state.selectedAttributes.length > 1 ?
                            <Link to={{
                                pathname: '/weighting',
                                state: {
                                    data: this.state.data,
                                    overallResult: this.state.overallResult,
                                    selectedAttributes: this.state.selectedAttributes,
                                    options: this.state.options,
                                    categorical: this.state.categorical,
                                    numerical: this.state.numerical,
                                }
                            }}>
                                <button className='nextButton button' type="button">Next</button>
                            </Link>
                            : <></>}

                    </div>
                </div>
                <p className='text'>
                    Please create attribute scoring functions for all attributes of interest. You can also modify
                    existing scoring functions.
                    In order to proceed, you need to define at least two Attribute Scoring Functions.
                    When you are ready to see the result, click on the next button.
                </p>


                <div><h2 className='smallHeader'>Categorical Attributes</h2></div>

                <div style={{paddingLeft: '2%'}}>
                    {this.state.categorical.map((key) => (
                        <>
                            <div className='smallChartCategorical'>
                                <div style={{marginTop: '5%'}}>
                                    <div style={{paddingLeft: '7%', marginTop: '5%', display: 'inline'}}>{key}</div>
                                    <button style={{float: 'right', marginRight: '9%', marginBottom: '5%', display: 'inline'}}
                                            key={'remove'} onClick={() => {
                                        this.removeAttributeFromListCategorical(key)
                                    }}><img src={process.env.PUBLIC_URL + 'images/icons8-remove-30.png'}
                                            width={'20px'}/>
                                    </button>
                                </div>
                                <div style={{paddingLeft: '2%'}}>
                                    <CategoricalPlotSmall key={key}
                                                          data={filterCategorical(key, this.state.data)}
                                                          name={key}/>
                                </div>
                                {this.state.selectedAttributes.find(element => element === key) ?
                                    <>
                                        <p className='smallText'>Missing
                                            Values: {this.state.data.filter(element => element[key] === null).length}</p>
                                        <div style={{paddingLeft: '8%'}}>
                                            <Link to={{
                                                pathname: '/selectedAttributesCategorical',
                                                state: {
                                                    data: this.state.data,
                                                    selected: key,
                                                    isCategorical: true,
                                                    overallResult: this.state.overallResult,
                                                    selectedAttributes: this.state.selectedAttributes,
                                                    options: this.state.options,
                                                    categorical: this.state.categorical,
                                                    numerical: this.state.numerical,
                                                }
                                            }}>
                                                <button className='modifyButton' type="button">Modify</button>
                                            </Link>
                                            <button style={{float: 'right', marginRight: '9%'}}
                                                    className='remove-Button' key={'remove'} onClick={() => {
                                                this.removeASF(key)
                                            }}>Remove
                                            </button>
                                        </div>
                                    </> :
                                    <>
                                        <p className='smallText'>Missing
                                            Values: {this.state.data.filter(element => element[key] === null).length}</p>
                                        <div style={{paddingLeft: '30%'}}>
                                            <Link to={{
                                                pathname: '/selectedAttributesCategorical',
                                                state: {
                                                    data: this.state.data,
                                                    selected: key,
                                                    isCategorical: true,
                                                    overallResult: this.state.overallResult,
                                                    selectedAttributes: this.state.selectedAttributes,
                                                    options: this.state.options,
                                                    categorical: this.state.categorical,
                                                    numerical: this.state.numerical,
                                                }
                                            }}>
                                                <button className='createButton button' type="button">Add</button>
                                            </Link></div>
                                    </>
                                }
                            </div>
                        </>
                    ))}
                </div>

                <div><h2 className='smallHeader'>Numerical Attributes</h2></div>
                <div style={{paddingLeft: '2%'}}>
                    {this.state.numerical.map((key) => (
                        <div className='smallChart'>
                            <div style={{marginTop: '5%'}}>
                                <div style={{paddingLeft: '7%', marginTop: '5%', display: 'inline'}}>{key}</div>
                                <button style={{float: 'right', marginRight: '9%', marginBottom: '5%', display: 'inline'}} key={'remove'}
                                        onClick={() => {
                                            this.removeAttributeFromListNumerical(key)
                                        }}><img src={process.env.PUBLIC_URL + 'images/icons8-remove-30.png'}
                                                width={'20px'}/>
                                </button>
                            </div>
                            <div style={{paddingLeft: '2%'}}>
                                <NumericalPlotSmall key={key} data={this.state.data.map(object => object[key])}
                                                    name={key}/>
                            </div>
                            {this.state.selectedAttributes.find(element => element === key) ?

                                <>
                                    <div style={{display: 'inline', marginLeft: '17%'}}>
                                        <TinyASF options={this.state.options[key]}/>
                                    </div>
                                    <div style={{paddingLeft: '8%', paddingTop: '10px', paddingBottom: '0px'}}>
                                        <Link to={{
                                            pathname: '/selectedAttributesNumerical',
                                            state: {
                                                data: this.state.data,
                                                selected: key,
                                                isCategorical: true,
                                                overallResult: this.state.overallResult,
                                                selectedAttributes: this.state.selectedAttributes,
                                                options: this.state.options,
                                                categorical: this.state.categorical,
                                                numerical: this.state.numerical,
                                            }
                                        }}>
                                            <button className='modifyButton' type="button">Modify</button>
                                        </Link>
                                        <button style={{float: 'right', marginRight: '9%'}} className='remove-Button'
                                                key={'remove'} onClick={() => {
                                            this.removeASF(key)
                                        }}>Remove
                                        </button>
                                    </div>
                                </> :
                                <>
                                    <p className='smallText' style={{paddingBottom: '15px'}}>Missing
                                        Values: {this.state.data.filter(element => isNaN(element[key])).length}</p>
                                    <div style={{paddingLeft: '30%', paddingTop: '10%', marginTop: '14%'}}>
                                        <Link to={{
                                            pathname: '/selectedAttributesNumerical',
                                            state: {
                                                data: this.state.data,
                                                selected: key,
                                                isCategorical: true,
                                                overallResult: this.state.overallResult,
                                                selectedAttributes: this.state.selectedAttributes,
                                                options: this.state.options,
                                                categorical: this.state.categorical,
                                                numerical: this.state.numerical,
                                            }
                                        }}>
                                            <button className='createButton button' type="button">Add</button>
                                        </Link></div>
                                </>
                            }
                        </div>
                    ))}
                </div>
            </div>
        );
    }
}

export default AttributeOverview;