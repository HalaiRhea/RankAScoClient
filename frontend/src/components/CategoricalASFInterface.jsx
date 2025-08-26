import React from 'react'
import {minMaxNormalization, minMaxNormalizationMinus} from "../HelperFunction";
import CategoricalPlot from "./CategoricalPlot";
import ScoreAssignment from "./ASF/ScoreAssignment";
import NonEquidistant from "./ASF/NonEquidistant";
import ScoresPlot from "./ScoresPlot";
import {Link} from "react-router-dom";
import Equidistant from "./ASF/Equidistant";

class CategoricalASFInterface extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            selected: this.props.location.state.selected, //The attribute that is currently used for the ASF
            result: [], //All the scores
            secondHistogram: [],//The scores in a form that can be used by the histogram plot

            points: [], //The points of the ASF
            neutralValue: 0, //The neutral value that is used in the score assignment ASF
            neutralValueError: '', //The error message (if it exists) for the neutral value
            individualScoresError: '', //The error message if there exist errors in the individual scores

            radioButton: "scoreAssignment", //The radio button that selected the ASF type

            y: [], //An array containing all categories for the selected attribute
            x: [], //An array containing the counts for all categories for the selected attribute

            //The overallResult array contains all scores for an item that have been created by other ASF so far
            overallResult: this.props.location.state.overallResult,

            //The options contain all ASF that have been created so far
            options: JSON.parse(JSON.stringify(this.props.location.state.options)),

            //The selectedAttributes array contains all attributes for which ASFs have been created so far
            selectedAttributes: this.props.location.state.selectedAttributes,
        };

        this.normalizeYValue = this.normalizeYValue.bind(this);
        this.normalizeXValue = this.normalizeXValue.bind(this);
        this.setRadioButton = this.setRadioButton.bind(this);
        this.calculateTransformationScoreAssignment = this.calculateTransformationScoreAssignment.bind(this);
        this.calculateTransformation = this.calculateTransformation.bind(this);
        this.transformValuesToScores = this.transformValuesToScores.bind(this);
        this.handleChangeInNeutralValue = this.handleChangeInNeutralValue.bind(this);
        this.handleLeaveInNeutralValue = this.handleLeaveInNeutralValue.bind(this);

    }

    /**
     * Life-cycle method that initializes the options and the ASF if it was already created
     * In addition, the input distribution plot is calculated
     */
    componentWillMount() {
        let options = JSON.parse(JSON.stringify(this.props.location.state.options));

        let selectedAttributes = [].concat(this.props.location.state.selectedAttributes);

        //Add the selected attribute to the list of all selected attributes
        if (selectedAttributes.findIndex(element => element === this.state.selected) === -1) {
            selectedAttributes.push(this.state.selected)
        }

        //Calculate the data for the input distribution plot
        let data = this.props.location.state.data;
        let distinctCategories = [...new Set(data.map(item => item[this.state.selected]))];
        let x = []
        let y = []
        distinctCategories.forEach(
            category => {
                let count = data.filter(element => element[this.state.selected] === category).length;
                y.push(count);
                x.push(category);
            });

        if (!options.hasOwnProperty(this.state.selected)) {
            //If no options exist for this attribute, new options are added
            this.setState({points: [], radioButton: "scoreAssignment"})
        } else {
            //Else, the existing properties are loaded
            this.setState({
                points: options[this.state.selected].points,
                radioButton: options[this.state.selected].radioButton,
                neutralValue: options[this.state.selected].neutralValue,
                neutralValueError: options[this.state.selected].neutralValueError
            })
        }

        this.setState({x: x, y: y, selectedAttributes: selectedAttributes});
    }

    /**
     * Normalize an x value to the range [100, 3200] since the coordinate system spans this range
     * @param xValue the x value that should be transformed
     */
    normalizeXValue(xValue) {
        let min = 100;
        let max = 3200;

        return minMaxNormalization(xValue, min, max);
    }

    /**
     * Normalize a y value to the range [20, 820] since the coordinate system spans this range
     * @param yValue the y value that should be transformed
     */
    normalizeYValue(yValue) {
        let min = 20;
        let max = 820;

        let returnValue = minMaxNormalization(yValue + 20, min, max);
        return 1 - returnValue;
    }

    /**
     * Transforms all attribute values into scores based on a created ASF
     * @param points the points of the ASF
     */
    transformValuesToScores(points) {
        this.setState({points: points},
            () => {
                if (this.state.radioButton === 'scoreAssignment') {
                    this.calculateTransformationScoreAssignment(points);
                } else {
                    this.calculateTransformation(points);
                }
            })
    }

    /**
     * Handle the result object when a new ASF is added and add all scores to the object
     */
    handleResult() {
        let result = this.state.overallResult;
        result.forEach(element => {
                element[this.props.location.state.selected] = this.state.result
                    .filter(resultElement => resultElement.id === element.id)[0].value
            }
        )
        this.setState({overallResult: result})
        this.handleOptions()
    }

    /**
     * Handle the options object when a new ASF is added and add the new options to it
     */
    handleOptions() {
        let options = this.state.options;

        options[this.state.selected] = {
            radioButton: this.state.radioButton, points: this.state.points,
            neutralValueError: this.state.neutralValueError, neutralValue: this.state.neutralValue
        }
        this.setState({options})
    }

    /**
     * Updates the radio button state when another radio button is clicked
     * @param event the click button event
     */
    setRadioButton(event) {
        this.setState({radioButton: event.target.value, points: []});
    }

    /**
     * Calculate the transformation of the score assignment ASF
     */
    calculateTransformationScoreAssignment(points) {
        let i;
        let result = []
        let data = this.props.location.state.data;

        //First, we need to check if there exist any errors in the ASF
        if (this.checkErrors(points)) {
            this.setState({individualScoresError: "There's an error in one of the scoring functions"})
            return;
        } else {
            this.setState({individualScoresError: ""})
        }

        //Loop through all items and calculate the score value
        for (i = 0; i < data.length; i++) {
            let score = points.filter(element => element.category == data[i][this.state.selected])[0]

            if (score.value === '') {
                score = this.state.neutralValue
            } else {
                score = score.value;
            }
            result.push({id: data[i].id, value: score})
        }

        this.setState({result}, () => this.handleResult())
    }

    /**
     * Calculate the transformation of the equidistant and non-equidistant ASF
     */
    calculateTransformation(points) {
        let i;
        let result = []
        let data = this.props.location.state.data;

        //Loop through all items and calculate the score
        for (i = 0; i < data.length; i++) {
            let score = points.filter(element => element.category === data[i][this.state.selected])[0].x;
            let normalized = minMaxNormalizationMinus(score, 100, 3200)
            result.push({id: data[i].id, value: normalized});
        }
        this.setState({result}, () => this.handleResult())
    }

    /**
     * Handles changes in the neutral value input field (e.g. when a character is deleted or added)
     * @param event the new value of the neutral value input field
     */
    handleChangeInNeutralValue(event) {
        this.setState({neutralValue: event.target.value})
    }

    /**
     * Handles the on leave event in the neutral value input field
     * @param event the new value of the missing value input field
     */
    handleLeaveInNeutralValue(event) {
        let error = "";
        let valueAsNumber = "";
        if (!(event.target.value === "")) {
            valueAsNumber = Number(event.target.value)
        }

        //Check if the value is between -1 and +1
        if (valueAsNumber > 1 || valueAsNumber < -1) {
            error = "The neutral value must be between -1 and +1"
        }
        //Check if the value is a valid number
        if (isNaN(valueAsNumber)) {
            error = "Only numeric values between +1 and -1 are accepted."
        }

        this.setState({
            neutralValueError: error,
            neutralValue: valueAsNumber
        }, () => this.transformValuesToScores(this.state.points))
    }

    /**
     * Check if there exist any errors in the individual points
     * @param points all points from the ASF
     */
    checkErrors(points) {
        let overallError = false;
        points.forEach(point => {
            if (point.error !== '') {
                overallError = true;
            }
        })
        return overallError;
    }

    render() {
        let radioButton, chart;
        radioButton =
            <div>
                <ul style={{listStyleType: 'none'}} onChange={this.setRadioButton.bind(this)} className='text'>
                    <li>
                        <input type="radio" value="scoreAssignment" name="function" id="scoreAssignmentRB"
                               checked={this.state.radioButton === 'scoreAssignment'}/>
                        &#160;
                        <img src={process.env.PUBLIC_URL + 'images/scoreAssignment.png'} width={'20px'}/>
                        &#160; <label for="scoreAssignmentRB">Score Assignment</label>
                    </li>
                    <li>
                        <input type="radio" value="equidistant" name="function" id="equidistantRB"
                               checked={this.state.radioButton === 'equidistant'}/>
                        &#160;
                        <img src={process.env.PUBLIC_URL + 'images/equidistant.png'} width={'20px'}/>
                        &#160; <label for="equidistantRB">Equidistant</label>
                    </li>
                    <li>
                        <input type="radio" value="nonEquidistant" name="function" id="nonEquidistantRB"
                               checked={this.state.radioButton === 'nonEquidistant'}/>
                        &#160;
                        <img src={process.env.PUBLIC_URL + 'images/nonEquidistant.png'} width={'20px'}/>
                        &#160; <label for="nonEquidistantRB">Non-Equidistant</label>
                    </li>
                </ul>
            </div>

        chart = <CategoricalPlot key={'somethingElse'} data={this.props.location.state.data} name="Input distribution"
                                 x={this.state.x} y={this.state.y}/>

        let resultChart = <ScoresPlot data={this.state.result.map(element => element.value)}
                                      name='Output distribution'/>

        let asf;
        let neutralValue = <></>;

        if (this.state.radioButton === "scoreAssignment") {
            asf = <ScoreAssignment categories={this.state.x} handler={this.transformValuesToScores}
                                   points={this.state.points}/>
            neutralValue =
                <form onSubmit={this.handleLeaveInNeutralValue}>
                    <label className='text'>
                        Neutral Value:
                        <input type="text" id='NeutralValue' value={this.state.neutralValue}
                               onChange={this.handleChangeInNeutralValue}
                               style={this.state.neutralValueError ? {color: "red", width: '60px', marginLeft: '10px'}
                                   : {color: "black", width: '50px', marginLeft: '10px'}}
                               onBlur={this.handleLeaveInNeutralValue}/>
                    </label>
                    <p className='text' style={{marginTop: '0px', color: 'red'}}>{this.state.neutralValueError}</p>
                </form>

        } else if (this.state.radioButton === "equidistant") {
            asf = <Equidistant categories={this.state.x} handler={this.transformValuesToScores}
                               points={this.state.points}/>
        } else if (this.state.radioButton === "nonEquidistant") {
            asf = <NonEquidistant categories={this.state.x} handler={this.transformValuesToScores}
                                  points={this.state.points}/>
        }

        return (
            <>
                <div>
                    <div className='largeHeader'>
                        <h1 style={{display: 'inline'}}>Attribute Scoring Function</h1>
                        <div style={{display: 'inline', float: 'right', marginRight: '5%'}}>
                            <Link to={{
                                pathname: '/datasetAttributes',
                                state: {
                                    data: this.props.location.state.data, overallResult: this.state.overallResult,
                                    selectedAttributes: this.state.selectedAttributes, options: this.state.options,
                                    categorical: this.props.location.state.categorical,
                                    numerical: this.props.location.state.numerical,
                                }
                            }}>
                                <button
                                    className={(this.state.individualScoresError !== ''
                                        || this.state.neutralValueError !== '')
                                        ? 'button-disabled button' : 'nextButton button'}
                                    type="button"
                                    disabled={this.state.individualScoresError !== ''
                                    || this.state.neutralValueError !== ''}
                                    style={{marginLeft: '20px'}}>Save
                                </button>
                            </Link>
                            <Link to={{
                                pathname: '/datasetAttributes',
                                state: {
                                    data: this.props.location.state.data,
                                    overallResult: this.props.location.state.overallResult,
                                    selectedAttributes: this.props.location.state.selectedAttributes,
                                    options: this.props.location.state.options,
                                    categorical: this.props.location.state.categorical,
                                    numerical: this.props.location.state.numerical,
                                }
                            }}>
                                <button className='nextButton button' type="button" style={{marginLeft: '30px'}}>
                                    Cancel
                                </button>
                            </Link>
                        </div>
                    </div>

                    <p className='text' style={{paddingTop: '1%'}}>
                        Please choose a type of attribute scoring function and adjust it according to your preferences
                        for the attribute <b>{this.state.selected}</b>. A score of +1 means that a value is preferred
                        and a score of -1 means that a value is not preferred.
                    </p>
               

                <div style={{paddingLeft: '5%', display: 'inline'}}>
                    <div style={{paddingRight: '3%', display: 'inline'}}>
                        {chart}
                    </div>
                    <div style={{display: 'inline'}}>
                        {resultChart}
                    </div>
                </div>

                <div style={{marginTop: '2%'}}>
                    {radioButton}
                </div>

                <div>
                    {asf}
                    {neutralValue}
                </div>

                <div style={{marginTop: '1%'}}>
                    <p className='text' style={{display: 'inline'}}>
                        {this.state.neutralValueError ?
                            'Please set a valid value for the missing attribute values before saving your function.'
                            : ''}</p>
                </div>
            </div>
            </>)
    }
}

export default CategoricalASFInterface;