import React from 'react'
import MultiPointContinuous from "./ASF/MultiPointContinuous";
import TwoPointLinear from "./ASF/TwoPointLinear";
import TwoPointNonLinear from "./ASF/TwoPointNonLinear"
import MultiPointDiscontinuous from "./ASF/MultiPointDiscontinuous";
import {
    bezierCurve,
    filterNumerical,
    findConstant,
    findSlope,
    minMaxNormalization,
    minMaxNormalizationMinus,
    transformLinear
} from "../HelperFunction";
import NumericalPlot from "./NumericalPlot";
import ScoresPlot from "./ScoresPlot";
import {Link} from "react-router-dom";

class NumericalASFInterface extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            selected: this.props.location.state.selected, //The attribute that is currently used for the ASF
            dataIsolated: [], //The transformed data that can be used for the calculation of scores
            result: [], //All the scores
            secondHistogram: [], //The scores in a form that can be used by the histogram plot

            min: 0, //The maximal attribute value
            max: 0, //The minimal attribute value

            points: [], //The points of the ASF
            controlPoints: [], //The control points of the ASF
            numberOfPoints: 3, //The number of points of the ASF

            quantileNormalizationValue: 0, //The percentage of quantile normalization that should be applied

            radioButton: "linear", //The radio button that selected the ASF type

            //The overallResult array contains all scores for an item that have been created by other ASF so far
            overallResult: this.props.location.state.overallResult,

            //The options contain all ASF that have been created so far
            options: JSON.parse(JSON.stringify(this.props.location.state.options)),

            //The selectedAttributes array contains all attributes for which ASFs have been created so far
            selectedAttributes: this.props.location.state.selectedAttributes,

            missingValue: 0, //The value that is used for items with missing attribute values
            missingValueError: '', //The error that is shown if no value for the missing value has been assigned
            missingValuePercentage: 0, //The percentage of items that have a missing value
        };
        this.calculateTransformation = this.calculateTransformation.bind(this);
        this.calculateTransformationLinear = this.calculateTransformationLinear.bind(this);
        this.normalizeYValueNonLinear = this.normalizeYValueNonLinear.bind(this);
        this.normalizeXValue = this.normalizeXValue.bind(this);
        this.transformValuesToScores = this.transformValuesToScores.bind(this);
        this.setRadioButton = this.setRadioButton.bind(this);
        this.handleSliderChange = this.handleSliderChange.bind(this);
        this.handleChangeInMissingValue = this.handleChangeInMissingValue.bind(this);
        this.handleLeaveInMissingValue = this.handleLeaveInMissingValue.bind(this);
        this.timekeeper = null;
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
        let dataIsolated = []
        data.filter(element => !isNaN(element[this.state.selected])).forEach(element => {
            dataIsolated.push({
                id: element.id,
                value: Number(element[this.state.selected]),
                transformed: 0,
                normalized: 0
            })
        });

        let min = Math.min.apply(Math, dataIsolated.map(element => element.value));
        let max = Math.max.apply(Math, dataIsolated.map(element => element.value));

        //Normalize all numerical values
        dataIsolated.forEach(function (element) {
            element.normalized = minMaxNormalization(element.value, min - 0.0001, max + 0.0001)
            element.transformed = minMaxNormalization(element.value, min, max);
        });

        //For items with missing values, add a default value to the data set and count how many missings exist
        let counter = 0;
        data.filter(element => isNaN(element[this.state.selected])).forEach(element => {
            counter = counter + 1;
            dataIsolated.push({
                id: element.id,
                value: -99,
                transformed: this.state.missingValue,
                normalized: this.state.missingValue
            })
        });

        let attributeValues = dataIsolated.map(object => object.transformed);

        this.setState({
            secondHistogram: attributeValues, key: Math.random(),
            selectedAttributes: selectedAttributes, missingValuePercentage: counter,
            min: min, max: max, result: data, dataStart: [[min, -1], [max, 1]]
        })

        //Check if options already exist and if yes, set the radio button and state accordingly
        if (!options.hasOwnProperty(this.state.selected)) {
            this.setRadioButton({target: {value: "linear"}})
            this.setState({points: [], controlPoints: [], sliderValue: 50})
        } else {
            this.setState({
                missingValue: options[this.props.location.state.selected].missingValue,
                missingValueError: options[this.props.location.state.selected].missingValueError
            });

            this.setRadioButton({target: {value: options[this.props.location.state.selected].radioButton}})

            //Set the correct ASF is it is reloaded from the options
            if (options[this.props.location.state.selected].radioButton === 'linear') {
                this.setState({
                    points: options[this.state.selected].points,
                    controlPoints: [],
                })
            } else if (options[this.props.location.state.selected].radioButton === 'nonLinear') {
                this.setState({
                    points: options[this.state.selected].points,
                    controlPoints: options[this.state.selected].controlPoints,
                })
            } else if (options[this.props.location.state.selected].radioButton === 'quantile') {
                this.setState({
                    sliderValue: options[this.state.selected].sliderValue
                })
            } else {
                this.setState({
                    points: options[this.state.selected].points,
                    controlPoints: options[this.state.selected].controlPoints,
                    numberOfPoints: options[this.state.selected].numberOfPoints
                })
            }
            this.transformValuesToScores(options[this.state.selected].points, options[this.state.selected].controlPoints)
        }
        this.setState({dataIsolated})
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
     * Normalize a y value to the range [420, 1220] since the coordinate system spans this range for non-linear ASFs
     * @param yValue the y value that should be transformed
     */
    normalizeYValueNonLinear(yValue) {
        let min = 420;
        let max = 1220;

        let returnValue = minMaxNormalization(yValue, min, max);
        return 1 - returnValue;
    }

    /**
     * Normalize a y value to the range [420, 1220] since the coordinate system spans this range for linear ASFs
     * @param yValue the y value that should be transformed
     */
    normalizeYValueLinear(yValue) {
        let min = 20;
        let max = 820;

        let returnValue = minMaxNormalization(yValue, min, max);
        return 1 - returnValue;
    }

    /**
     * Transforms all attribute values into scores based on a created ASF
     * @param points the points of the ASF
     * @param controlPoints the control points of the ASF
     * @param numberOfPoints number of points that the ASF has
     */
    transformValuesToScores(points, controlPoints, numberOfPoints = 0) {
        this.setState({points: points, controlPoints: controlPoints}, () => {

            if (this.state.radioButton === 'linear') {
                this.calculateTransformationLinear();
            } else if (this.state.radioButton === 'discontinuous') {
                this.calculateTransformation(true);
                this.setState({numberOfPoints})
            } else if (this.state.radioButton === 'continuous') {
                this.calculateTransformation();
                this.setState({numberOfPoints})
            } else if (this.state.radioButton === 'nonLinear') {
                this.calculateTransformation();
            } else if ((this.state.radioButton === 'quantile')) {
                this.calculateQuantileNormalization(this.state.sliderValue)
            }

        })
    }

    /**
     * Calculate the transformation of a non-linear ASF
     * @param isDiscontinuous indicates whether the ASF used for the transformation is discontinuous or not
     */
    calculateTransformation(isDiscontinuous = false) {
        let points = this.state.points;
        let controlPoints = this.state.controlPoints;

        //Normalize all points
        this.normalizePoints(points);
        this.normalizePoints(controlPoints);

        let temp = this.state.dataIsolated;

        let i;

        if (isDiscontinuous) {
            //Loop through all line segments
            for (i = 1; i < points.length; i = i + 2) {
                //Get the start and end point of the line segment and the control point in between
                let startPoint = points[i - 1];
                let endPoint = points[i];
                let controlPoint = controlPoints[(i - 1) / 2];

                //Calculate the bezier curve value for all attribute values
                temp.filter(element => element.value !== -99)
                    .filter(element => element.normalized <= endPoint.normalizedX
                        && element.normalized > startPoint.normalizedX)
                    .forEach(element => {
                        element.transformed =
                            minMaxNormalizationMinus(
                                bezierCurve(startPoint, endPoint, controlPoint, element.normalized), 0 - 0.0001, 1 + 0.0001)
                    })
            }
        } else {
            //Loop through all line segments
            for (i = 1; i < points.length; i++) {
                //Get the start and end point of the line segment and the control point in between
                let startPoint = points[i - 1];
                let endPoint = points[i];
                let controlPoint = controlPoints[i - 1];

                //Calculate the bezier curve value for all attribute values
                temp.filter(element => element.value !== -99)
                    .filter(element => element.normalized <= endPoint.normalizedX
                        && element.normalized > startPoint.normalizedX)
                    .forEach(element => {
                        element.transformed =
                            minMaxNormalizationMinus(
                                bezierCurve(startPoint, endPoint, controlPoint, element.normalized), 0 - 0.0001, 1 + 0.0001)
                    })
            }
        }

        //Get the scores only
        let attributeValues = temp.map(object => object.transformed);

        //Set the scores and the result
        this.setState({
            secondHistogram: attributeValues, //can be removed
            result: temp,
            key: Math.random()
        }, () => this.setMissingValues())
    }

    /**
     * Calculate the transformation of a linear ASF
     */
    calculateTransformationLinear() {
        let points = this.state.points;

        //Normalize all points
        this.normalizePointsLinear(points);

        let temp = this.state.dataIsolated;

        //Get the start and end point of the ASF
        let startPoint = points[0];
        let endPoint = points[1];

        //Calculate the function value for all attribute values
        let slope = findSlope(startPoint.normalizedX, endPoint.normalizedX, startPoint.normalizedY, endPoint.normalizedY);
        let constant = findConstant(startPoint.normalizedX, startPoint.normalizedY, slope)
        temp.filter(element => element.value !== -99)
            .filter(element => element.normalized <= endPoint.normalizedX
                && element.normalized > startPoint.normalizedX)
            .forEach(element => {
                element.transformed =
                    minMaxNormalizationMinus(
                        transformLinear(element.normalized, slope, constant), 0 - 0.0001, 1 + 0.0001)
            })

        //Get the scores only
        let attributeValues = temp.map(object => object.transformed);

        //Set the scores and the result
        this.setState({
            secondHistogram: attributeValues, //can be removed
            result: temp,
            key: Math.random()
        }, () => this.setMissingValues())
    }

    /**
     * Calculate the quantile normalization ASF
     * @param sliderValue The percentage of quantile normalization that should be used
     */
    calculateQuantileNormalization(sliderValue) {
        let sorted = [].concat(this.state.dataIsolated)
            .sort((a, b) => a[this.state.selected] > b[this.state.selected] ? 1 : -1);

        let sliderPercentage = sliderValue / 100;

        let i;
        for (i = 0; i < sorted.length; i++) {
            let value = minMaxNormalizationMinus(sorted[i].value, this.state.min, this.state.max);
            let rank = minMaxNormalizationMinus(i + 1, 0, sorted.length);
            sorted[i].transformed = value * (1 - sliderPercentage) + rank * sliderPercentage;
        }
        let attributeValues = sorted.map(object => object.transformed);

        this.setState({secondHistogram: attributeValues}, () => this.setMissingValues())
    }

    /**
     * Adds the scores for the items with missing values
     */
    setMissingValues() {
        if (this.state.missingValue <= 1 || this.state.missingValue >= -1) {
            let temp = this.state.dataIsolated;

            temp.forEach(element => {
                if (element.value === -99) {
                    element.transformed = this.state.missingValue;
                }
            })

            let attributeValues = temp.map(object => object.transformed);
            this.setState({secondHistogram: attributeValues, result: temp, dataIsolated: temp, key: Math.random()})
            this.handleResult();
            this.handleOptions();
        }
    }

    /**
     * Handle the result object when a new ASF is added and add all scores to the object
     */
    handleResult() {
        let result = this.state.overallResult;
        result.forEach(element => {
                element[this.props.location.state.selected] = this.state.dataIsolated
                    .filter(resultElement => resultElement.id === element.id)[0].transformed
            }
        )
        this.setState({overallResult: result})
    }

    /**
     * Handle the options object when a new ASF is added and add the new options to it
     */
    handleOptions() {
        let options = this.state.options;
        if (this.state.radioButton === 'linear') {
            options[this.state.selected] = {
                radioButton: this.state.radioButton, points: this.state.points, controlPoints: [],
                missingValue: this.state.missingValue, missingValueError: this.state.missingValueError
            }
        } else if (this.state.radioButton === 'nonLinear') {
            options[this.state.selected] = {
                radioButton: this.state.radioButton, points: this.state.points, controlPoints: this.state.controlPoints,
                missingValue: this.state.missingValue, missingValueError: this.state.missingValueError
            }
        } else if (options[this.props.location.state.selected].radioButton === 'quantile') {
            options[this.state.selected] = {
                radioButton: 'quantile', points: [], controlPoints: [],
                missingValue: this.state.missingValue, missingValueError: this.state.missingValueError,
                sliderValue: this.state.sliderValue
            }
        } else {
            options[this.state.selected] = {
                radioButton: this.state.radioButton, points: this.state.points,
                controlPoints: this.state.controlPoints, numberOfPoints: this.state.numberOfPoints,
                missingValue: this.state.missingValue, missingValueError: this.state.missingValueError
            }
        }
        this.setState({options})
    }

    /**
     * Normalize all points from a non-linear ASF
     * @param points the array of points
     */
    normalizePoints(points) {
        points.forEach(element => {
            element.normalizedX = this.normalizeXValue(element.x);
            element.normalizedY = this.normalizeYValueNonLinear(element.y)
        });
    }

    /**
     * Normalize all points from a linear ASF
     * @param points the array of points
     */
    normalizePointsLinear(points) {
        points.forEach(element => {
            element.normalizedX = this.normalizeXValue(element.x);
            element.normalizedY = this.normalizeYValueLinear(element.y)
        });
    }

    /**
     * Updates the radio button state when another radio button is clicked
     * @param event the click button event
     */
    setRadioButton(event) {
        this.setState({
            radioButton: event.target.value,
            points: [],
            controlPoints: [],
            numberOfPoints: 3,
            sliderValue: 50
        });
    }

    /**
     * Handles the slider change for the quantile normalization asf and re-calculates the scores
     * @param event the new value of the slider
     */
    handleSliderChange(event) {

        this.setState({sliderValue: event.target.valueAsNumber})

        // Creates a delay to change state in order to save expensive computation for calculating ranks (and PCA output) every time slider changes continously. This should create the experience of onRelease (i.e, when the user releases the mouse on a slider then calculate the ranks again) and makes system more fluid
        clearTimeout(this.timekeeper);
        this.timekeeper = setTimeout(() => {
            this.calculateQuantileNormalization(event.target.valueAsNumber)
        }, 300); // change this number to set delay in milliseconds (ms)
    }

    /**
     * Handles changes in the missing value input field (e.g. when a character is deleted or added)
     * @param event the new value of the missing value input field
     */
    handleChangeInMissingValue(event) {
        this.setState({missingValue: event.target.value})
    }

    /**
     * Handles the on leave event in the missing value input field
     * @param event the new value of the missing value input field
     */
    handleLeaveInMissingValue(event) {
        let error = "";
        let valueAsNumber = "";
        if (!(event.target.value === "")) {
            valueAsNumber = Number(event.target.value)
        }

        //Check if the value is between -1 and +1
        if (valueAsNumber > 1 || valueAsNumber < -1) {
            error = "The value for missing attribute values must be between -1 and +1"
        }

        //Check if the value is a valid number
        if (isNaN(valueAsNumber)) {
            error = "Only numeric values between +1 and -1 are accepted."
        }

        this.setState({missingValueError: error, missingValue: valueAsNumber}, () => this.setMissingValues())
    }


    render() {
        let radioButton =
            <div>
                <ul style={{listStyleType: 'none'}} onChange={this.setRadioButton.bind(this)} className='text'>
                    <li>
                        <input type="radio" value="linear" name="function" id="linearRB"
                               checked={this.state.radioButton === 'linear'}/>
                        &#160;
                        <img src={process.env.PUBLIC_URL + 'images/twoPointLinear.png'} width={'20px'}/>
                        &#160; <label for="linearRB">Two-Point Linear</label>
                    </li>
                    <li>
                        <input type="radio" value="nonLinear" name="function" id="nonLinearRB"
                               checked={this.state.radioButton === 'nonLinear'}/>
                        &#160;
                        <img src={process.env.PUBLIC_URL + 'images/twoPointNonLinear.png'} width={'20px'}/>
                        &#160; <label for="nonLinearRB">Two-Point NonLinear</label>
                    </li>
                    <li>
                        <input type="radio" value="continuous" name="function" id="continousRB"
                               checked={this.state.radioButton === 'continuous'}/>
                        &#160;
                        <img src={process.env.PUBLIC_URL + 'images/multiPointContinuous.png'} width={'20px'}/>
                        &#160; <label for="continousRB">Multi-Point Continuous</label>
                    </li>
                    <li>
                        <input type="radio" value="discontinuous" name="function" id="discontinousRB"
                               checked={this.state.radioButton === 'discontinuous'}/>
                        &#160;
                        <img src={process.env.PUBLIC_URL + 'images/multiPointDiscontinuous.png'} width={'20px'}/>
                        &#160; <label for="discontinousRB">Multi-Point Discontinuous</label>
                    </li>
                    <li>
                        <input type="radio" value="quantile" name="function" id="quantileRB"
                               checked={this.state.radioButton === 'quantile'}/>
                        &#160;
                        <img src={process.env.PUBLIC_URL + 'images/quantile.png'} width={'20px'}/>
                        &#160;<label for="quantileRB"> Quantile Based</label>
                    </li>
                </ul>

                <form onSubmit={this.handleLeaveInMissingValue}>
                    {this.state.missingValuePercentage === 0 ? <>
                            <label className='text'>
                                There are {this.state.missingValuePercentage} items with a missing value.
                            </label>
                        </>
                        : <>
                            <label className='text'>
                                There are {this.state.missingValuePercentage} items with a missing value. Please set a
                                value
                                for them:
                                <input type="text" id='MissingValue' value={this.state.missingValue}
                                       onChange={this.handleChangeInMissingValue}
                                       style={this.state.missingValueError ? {
                                               color: "red",
                                               width: '50px',
                                               marginLeft: '10px'
                                           }
                                           : {color: "black", width: '50px', marginLeft: '10px'}}
                                       onBlur={this.handleLeaveInMissingValue}/>
                            </label>
                            <p className='text'
                               style={{marginTop: '0px', color: 'red'}}>{this.state.missingValueError}</p></>
                    }
                </form>
            </div>

        let chart = <NumericalPlot key={'numericalPlotly'}
                                   data={filterNumerical(this.state.selected, this.props.location.state.data)}
                                   name='Input distribution'/>
        let asf;

        if (this.state.radioButton === "nonLinear") {
            asf = <TwoPointNonLinear maxValue={this.state.max} minValue={this.state.min}
                                     handler={this.transformValuesToScores}
                                     points={this.state.points} controlPoints={this.state.controlPoints}/>
        } else if (this.state.radioButton === "continuous") {
            asf = <MultiPointContinuous maxValue={this.state.max} minValue={this.state.min}
                                        handler={this.transformValuesToScores}
                                        points={this.state.points} controlPoints={this.state.controlPoints}
                                        numberOfPoints={this.state.numberOfPoints}/>
        } else if (this.state.radioButton === "discontinuous") {
            asf =
                <MultiPointDiscontinuous maxValue={this.state.max} minValue={this.state.min}
                                         handler={this.transformValuesToScores}
                                         points={this.state.points} controlPoints={this.state.controlPoints}
                                         numberOfPoints={this.state.numberOfPoints}/>
        } else if (this.state.radioButton === "quantile") {
            asf =
                <div style={{paddingLeft: '0px', paddingTop: '10px', paddingBottom: '30px'}}>
                   
                    <span className='text'>Quantile Normalization Percentage: </span>
                    
                    <label style={{marginRight: '10px'}}>0%</label>
                    <input
                        type="range"
                        id={"slider"}
                        min={0}
                        max={100}
                        step={1}
                        defaultValue={this.state.sliderValue}
                        onChange={this.handleSliderChange}/>
                    <label style={{marginRight: '10px'}}>100%</label>
                    <label
                        htmlFor="range"
                        style={{
                            transform: `translateX(${this.state.sliderValue-175}px) translateY(15px)`,
                        }}>{this.state.sliderValue}</label>
                </div>;
        } else {
            asf = <TwoPointLinear maxValue={this.state.max} minValue={this.state.min}
                                  handler={this.transformValuesToScores}
                                  points={this.state.points}/>
        }

        return (
            <>
                <div>
                    <div className='largeHeader'><h1 style={{display: 'inline'}}>Attribute Scoring Function</h1>
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
                                    className={this.state.missingValueError ? 'button-disabled button' : 'nextButton button'}
                                    type="button" disabled={this.state.missingValueError}
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
                    <p className='text' style={{paddingTop: '1%'}}>Please choose a type of Attribute Scoring Function
                        and adjust it according to
                        your preferences for the attribute <b>{this.state.selected}</b>.
                        A score of +1 means that a value is preferred and a score of -1 means that a value is not
                        preferred.
                    </p>
                </div>

                <div style={{paddingLeft: '3%', marginRight: '100', display: 'inline'}}>
                    <div style={{paddingRight: '3%', display: 'inline', width: '35%'}}>
                        {chart}
                    </div>
                    <div style={{display: 'inline', width: '35%'}}>
                        <ScoresPlot key={this.state.key} data={this.state.secondHistogram}
                                    numberOfBins={7}
                                    name='Output distribution' fixedRange={true}/>
                    </div>
                </div>

                <div style={{marginTop: '2%'}}>
                    {radioButton}
                </div>
                <div>
                    {asf}
                </div>
            </>)
    }
}

export default NumericalASFInterface;
