import React from "react";
import {Link} from "react-router-dom";
import Table from "react-bootstrap/Table";

import * as druid from "@saehrimnir/druidjs";

import Plot from "react-plotly.js";
import {minMaxNormalization, minMaxNormalizationMinus} from "../HelperFunction";
import {BarSymbolImpact, BarSymbolNegative, BarSymbolPositive} from "./HelperComponents";

const DataEncoder = require('data-encoder');
const DataMappers = require('data-encoder/data-mappers');

class Weighting extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            resultsTransformed: [], //The scores that are calculated based on the ASFs
            sliderValues: [], //The values of all weight sliders
            pca_x_output: [], //The x values of the scores transformed with a PCA
            pca_y_output: [], //The y values of the scores transformed with a PCA
            pca_x_input: [], //The x values of the input values transformed with a PCA
            pca_y_input: [], //The y values of the input values transformed with a PCA

            colorList: [], //The colors of each item calculated based on the color map
            hex: [], //The hex values of each item calculated based on the color map
            imgObj: null, //The loaded image used for the calculation of color values
            canvas: null, //The canvas used for the calculation of color values
            colorCoding: 'input', //The PCA data used for the calculation of the colors

            categorical: this.props.location.state.categorical, //The categorical input data
            inputData: [], //The input data that is not ready for PCA
            oneHotEncodedData: [], //The one-hot encoded categorical input data

            text: [], //The text labels used for the PCA plots

            //The minimal and maximal values of the score, weighted score and impact
            //They are used for the calculation of the small score icons
            minScore: 0,
            maxScore: 0,
            minWeightedScore: 0,
            maxWeightedScore: 0,
            minImpact: 0,
            maxImpact: 0,

            //The minimal and maximal values of the input and output
            //They are used for the calculation of the colors
            x_min_input: 0,
            x_min_output: 0,
            x_max_input: 0,
            x_max_output: 0,
            y_min_input: 0,
            y_min_output: 0,
            y_max_input: 0,
            y_max_output: 0,

            //Pagination
            currentpage: 1,
            table_size: 10,
            resultsListed: [],
            btnActiveColor: "blue",
        };
        this.handleSliderChange = this.handleSliderChange.bind(this);
        this.setRadioButton = this.setRadioButton.bind(this);
        this.handleClick = this.handleClick.bind(this);
        this.handleClickNavigation = this.handleClickNavigation.bind(this);
        this.timekeeper = null;
    }

    /**
     * Life-cycle method that initializes all weight sliders and prepares the input data such that it can be used by PCA
     * In addition, the color map is loaded and initial ranks are calculated with the default weights
     */
    componentWillMount() {
        //Initialize all weight sliders with a value of 0.5
        let sliders = []
        this.props.location.state.selectedAttributes.forEach(attribute => {
            sliders.push({id: attribute, value: 0.5})
        })

        //Find the min and max values of each numerical attribute
        let data = JSON.parse(JSON.stringify(this.props.location.state.data));
        this.props.location.state.numerical.forEach(attribute => {

            let max = Math.max.apply(Math, data.map(element => Number(element[attribute])));
            let min = Math.min.apply(Math, data.map(element => Number(element[attribute])));

            //Normalize all numerical attribute values
            data.forEach(element => {
                element[attribute] = minMaxNormalization(element[attribute], min, max);
                delete element.id;
            })
        })
        this.setState({sliderValues: sliders, transformedData: data}, () => this.transformCategoricalData())

        //Calculate the ranks with default weights
        this.calculateRanks(true)

        //Load the color map
        this.getColor()
    }

    /**
     * Load the color map and draw it such that it can be used for the color calculation of items
     */
    getColor() {
        // reset canvas
        let element = document.getElementById("colormap");
        if (element !== null) {
            element.outerHTML = "";
        }

        let canvas = document.createElement("canvas");
        canvas.id = "colormap";
        canvas.width = 512;
        canvas.height = 512;
        canvas.style = "display:none";
        document.body.appendChild(canvas);

        let context = canvas.getContext("2d");
        // draw colormap image
        let imgObj = new Image();
        imgObj.onload = () => {
            context.drawImage(imgObj, 0, 0);
            this.setState({imgObj, canvas}, () => {
                this.calculatePCAForTranformedData();
                this.setRadioButton({target: {value: 'input'}})
            })
        };
        imgObj.src = "data/teulingfig2.png";
    }


    /**
     * Calculate all item ranks based on scores and the weight sliders values or the default weights
     * @param {boolean} isDefault boolean that indicates whether the default weights should be used or not
     */
    calculateRanks(isDefault) {
        //Initialize all values
        let resultList = [];
        // let resultListPartial = [];
        let text = [];
        

        //Calculate the scores, weighted scores and impact for all items
        this.props.location.state.overallResult.forEach(element => {
            let score = 0;
            let weightedScore = 0;
            let impact = 0;

            //If isDefault is true, then the default weights are taken
            if (isDefault) {
                this.props.location.state.selectedAttributes.forEach(attribute => {
                    score = score + (element[attribute] * 0.5)
                    weightedScore = weightedScore + (element[attribute] * 0.5)
                    impact = impact + Math.abs((element[attribute]))
                })
            }
            //If false, the weights from the sliders are taken
            else {
                this.props.location.state.selectedAttributes.forEach(attribute => {
                    weightedScore = weightedScore + (element[attribute] * this.state.sliderValues[this.state.sliderValues.findIndex(slider => slider.id === attribute)].value)
                    score = score + (element[attribute])
                    impact = impact + Math.abs((element[attribute]))
                })
            }

            resultList.push({id: element.id, score: score, weightedScore: weightedScore, impact: impact})

            //Add text symbols containing the id and the score. They are shown in the PCA plots
            text.push(element.id + ": " + score.toFixed(3));
        })

        // Ask which one to sort based on

        //Sort all items based on the score
        resultList = resultList.sort((a, b) => a.score < b.score ? 1 : -1);

        //Sort all items based on the weighted score
        //resultList = resultList.sort((a, b) => a.weightedScore < b.weightedScore ? 1 : -1);
        
        
        console.log(resultList.length) //This shows that the resultList is calculated again but then for the following operations we only use top 500 results

        //Calculate the rank for each item
        resultList.forEach(element =>
            element.rankNumber = resultList.findIndex(object => object.id === element.id) + 1)

        //Find all minimal and maximal values since they are needed for the symbol calculation
        let weightedMin = Math.min.apply(Math, resultList.map(element => element.weightedScore));
        let weightedMax = Math.max.apply(Math, resultList.map(element => element.weightedScore));

        let impactMin = Math.min.apply(Math, resultList.map(element => element.impact));
        let impactMax = Math.max.apply(Math, resultList.map(element => element.impact));

        let scoreMin = Math.min.apply(Math, resultList.map(element => element.score));
        let scoreMax = Math.max.apply(Math, resultList.map(element => element.score));

        //Shrink the list to top 500 to speed up computation (Alternative: Use pagination)
        // resultListPartial = resultList.slice(0,500)

        this.setState(
            {
                resultsTransformed: resultList, text: text,
                resultsTransformedSave: resultList,
                resultsListed: resultList,
                btnActiveColor: "summary",
                minScore: scoreMin, maxScore: scoreMax,
                minImpact: impactMin, maxImpact: impactMax,
                minWeightedScore: weightedMin, maxWeightedScore: weightedMax,
            }, () => this.calculatePCAOutput())
    }

    /**
     * Calculates the PCA of the weighted scores
     */
    calculatePCAOutput() {
        //Create the data structure that is needed by the druid library
        let matrix = []
        this.props.location.state.overallResult.forEach(element => {
            let list = [];
            this.props.location.state.selectedAttributes.forEach(attribute =>
                list.push(element[attribute] * this.state.sliderValues[this.state.sliderValues.findIndex(slider => slider.id === attribute)].value))
            matrix.push(list);
        })

        //Calculate the PCA
        let pca = new druid.PCA(matrix).transform();
        let pca_x = [], pca_y = [];

        //Find the minimal and maximal values
        let x_max = Math.max.apply(Math, pca.map(element => element[0]));
        let y_max = Math.max.apply(Math, pca.map(element => element[1]));
        let x_min = Math.min.apply(Math, pca.map(element => element[0]));
        let y_min = Math.min.apply(Math, pca.map(element => element[1]));
        this.setState({x_min_output: x_min, x_max_output: x_max, y_min_output: y_min, y_max_output: y_max});

        //Normalize all values and calculate the color according to the PCA
        let color = [], hex = [];
        pca.forEach(element => {
            pca_x.push(minMaxNormalization(element[0], x_min, x_max));
            pca_y.push(minMaxNormalization(element[1], y_min, y_max));

            if (this.state.colorCoding === 'output') {
                if (this.state.imgObj !== null) {
                    let colorValue = this.calculateColor(minMaxNormalization(element[0], x_min, x_max) * 511, minMaxNormalization(element[1], y_min, y_max) * 511);
                    color.push('rgb(' + colorValue[0] + ', ' + colorValue[1] + ', ' + colorValue[2] + ')')
                    hex.push(this.colorToHex(colorValue))
                }
            }
        })
        if (this.state.colorCoding === 'output') {
            this.setState({colorList: color, hex});
        }
        this.setState({pca_x_output: pca_x, pca_y_output: pca_y});
    }

    /**
     * Prepare the categorical data such that it can be used by for the calculation of the PCA
     */
    transformCategoricalData() {
        let data = this.state.transformedData;

        const OneHot = DataMappers.OneHot;
        const dataEncoder = new DataEncoder();
        let mapping = {}
        this.state.categorical.forEach(category => {
            mapping[category] = new OneHot()

        })
        data = dataEncoder.fitTransform(data, mapping);
        this.setState({oneHotEncodedData: data}, () => this.calculatePCAForTranformedData())
    }

    /**
     * Calculate the PCA for the pre-processed and one hot encoded input data
     */
    calculatePCAForTranformedData() {
        let matrix = this.state.oneHotEncodedData.values;

        //Calculate the PCA
        let pca = new druid.PCA(matrix).transform();
        let pca_x = [], pca_y = [];

        //Find the minimal and maximal values
        let x_max = Math.max.apply(Math, pca.map(element => element[0]));
        let y_max = Math.max.apply(Math, pca.map(element => element[1]));
        let x_min = Math.min.apply(Math, pca.map(element => element[0]));
        let y_min = Math.min.apply(Math, pca.map(element => element[1]));

        this.setState({x_min_input: x_min, x_max_input: x_max, y_min_input: y_min, y_max_input: y_max})

        pca.forEach(element => {
            pca_x.push(element[0]);
            pca_y.push(element[1]);

        })
        this.setState({pca_x_input: pca_x, pca_y_input: pca_y});
    }

    /**
     * Calculate the color for given x and y coordinates in the PCA plot
     */
    calculateColor(x, y) {
        let context = this.state.canvas.getContext("2d");
        let color = context.getImageData(x, y, 1, 1); // rgba [0, 255]
        let r = color.data[0];
        let g = color.data[1];
        let b = color.data[2];
        return [r, g, b];
    }

    /**
     * Transform an rgb color number into a hex component
     */
    componentToHex(c) {
        let hex = c.toString(16);
        return hex.length === 1 ? "0" + hex : hex;
    }

    /**
     * Transform a rgb color to a hex code
     */
    colorToHex(color) {
        return "#" + this.componentToHex(color[0]) + this.componentToHex(color[1]) + this.componentToHex(color[2]);
    }

    /**
     * Convert a JSON to a CSV file
     */
    JSONToCSVConvertor(JSONData) {
        //If JSONData is not an object then JSON.parse will parse the JSON string in an Object
        let arrData = typeof JSONData !== "object" ? JSON.parse(JSONData) : JSONData;

        let CSV = "";

        //This condition will generate the Label/Header
        //This loop will extract the label from 1st index of on array
        let header = ""
        for (let label in arrData[0]) {
            //Now convert each value to string and comma-seprated
            header += label + ",";
        }

        header = header.slice(0, -1);

        //append Label row with line break
        CSV += header + "\r\n";

        //1st loop is to extract each row
        for (let i = 0; i < arrData.length; i++) {
            let row = "";

            //2nd loop will extract each column and convert it in string comma-separated
            for (let attribute in arrData[i]) {
                row += '"' + arrData[i][attribute] + '",';
            }

            row.slice(0, row.length - 1);

            //add a line break after each row
            CSV += row + "\r\n";
        }

        if (CSV === "") {
            alert("Invalid data");
            return;
        }

        return CSV;
    };

    /**
     * Handle radio button changes (when the colors should be calculated based on the input or output)
     */
    setRadioButton(event) {
        this.setState({colorCoding: event.target.value});

        let colorList = [], hex = [];
        let pca_x, pca_y;
        let x_min, x_max, y_min, y_max;


        //Check if the colors should be calculated based on the output PCA
        if (event.target.value === 'output') {
            pca_x = this.state.pca_x_output;
            pca_y = this.state.pca_y_output;

            if (this.state.imgObj !== null) {

                for (let i = 0; i < pca_x.length; i++) {
                    let colorValue = this.calculateColor(pca_x[i] * 511, pca_y[i] * 511);
                    colorList.push('rgb(' + colorValue[0] + ', ' + colorValue[1] + ', ' + colorValue[2] + ')')
                    hex.push(this.colorToHex(colorValue))
                }
            }

        } else {
            pca_x = this.state.pca_x_input;
            pca_y = this.state.pca_y_input;

            x_min = this.state.x_min_input;
            x_max = this.state.x_max_input;
            y_min = this.state.y_min_input;
            y_max = this.state.y_max_input;

            if (this.state.imgObj !== null) {
                for (let i = 0; i < pca_x.length; i++) {
                    let colorValue = this.calculateColor(minMaxNormalization(pca_x[i], x_min, x_max) * 511,
                        minMaxNormalization(pca_y[i], y_min, y_max) * 511);
                    colorList.push('rgb(' + colorValue[0] + ', ' + colorValue[1] + ', ' + colorValue[2] + ')')
                    hex.push(this.colorToHex(colorValue))
                }
            }
        }

        this.setState({hex: hex, colorList: colorList});
    }

    /**
     * Handle weight slider changes and calculate the ranks again with the new slider values
     */
    handleSliderChange(key, event) {
        let sliderValues = this.state.sliderValues;
        let index = sliderValues.findIndex(element => element.id === key.id);

        sliderValues[index] = {id: sliderValues[index].id, value: event.target.valueAsNumber}

        // Creates a delay to change state in order to save expensive computation for calculating ranks (and PCA output) every time slider changes continously. This should create the experience of onRelease (i.e, when the user releases the mouse on a slider then calculate the ranks again) and makes system more fluid
        clearTimeout(this.timekeeper);
        this.timekeeper = setTimeout(() => this.setState({sliderValues: sliderValues}, () => {
            this.calculateRanks(false)
        }), 300); // change this number to set delay in milliseconds (ms)

        /*
        this.setState({sliderValues: sliderValues}, () => {
            this.calculateRanks(false)
        })
        */
    }

    handleClick(event) {
        let pagePressed = Number(event.target.id);
        this.setState({currentpage: pagePressed});
    }

    handleClickNavigation(event){

        // Find last page
        const total_items = this.state.resultsTransformed.length
        const last_page = Math.ceil(total_items/this.state.table_size);

        if ((event.target.id) === "Previous") 
        {
            let page = this.state.currentpage
            let prev_page

            if (page === 1) {
                prev_page = page
            }
            else {
                prev_page = this.state.currentpage -1
            }

            this.setState({currentpage: prev_page})
        }
        else if ((event.target.id) === "First") 
        {
            let first_page = 1
            this.setState({currentpage: first_page})
        }
        else if ((event.target.id) === "Next") 
        {
            let page = this.state.currentpage
            let next_page

            if (page === last_page) {
                next_page = page
            }
            else {
                next_page = this.state.currentpage + 1
            }

            this.setState({currentpage: next_page})
        }
        else if ((event.target.id) === "Last") 
        {
            this.setState({currentpage: last_page})
        }
    }

    handleSortWeighted() {
        console.log("Sort by weight")
        var resultsTableList = JSON.parse(JSON.stringify(this.state.resultsTransformed))

        // Sort all items based on the weightedScore
        // resultsTableList = resultsTableList.sort((a, b) => a.weightedScore < b.weightedScore ? 1 : -1);
        resultsTableList = resultsTableList.sort((a,b) => b.weightedScore - a.weightedScore )

        this.setState(
            {
                resultsListed: resultsTableList,
                btnActiveColor: "weighted"
            })

    }

    handleSortSummary() {
        var resultsTableList = this.state.resultsTransformed
        this.setState(
            {
                resultsListed: resultsTableList,
                btnActiveColor: "summary"
            })
    }

    handleSortImpact() {
        var resultsTableList = JSON.parse(JSON.stringify(this.state.resultsTransformed))

        // Sort all items based on the impact score
        resultsTableList = resultsTableList.sort((a,b) => b.impact - a.impact)

        this.setState(
            {
                resultsListed: resultsTableList,
                btnActiveColor: "impact"
            })
    }

    render() {
        let resultValue = [];

        //Create all sliders such that they can be displayed
        this.state.sliderValues.forEach((key) => {
            resultValue.push(
                <div style={{display: 'inline-block', width: '230px', textAlign: 'center',}}>
                    <p className='text' style={{paddingLeft: '0px', marginLeft: '0px'}}>{key.id}</p>
                    <label style={{marginRight: '10px'}}>0</label>
                    <input
                        type="range"
                        id={key}
                        min={0.001}
                        max={1}
                        step={0.01}
                        defaultValue={0.5}
                        onChange={(event) => {
                            this.handleSliderChange(key, event)
                        }}
                    />
                    <label style={{marginRight: '10px'}}>1</label>
                    <p>{(key.value).toFixed(2)}</p>
                </div>
            )
        })

        // Implementing sorting logic

        // Sort by weighted score

        // var resultsTableList = this.state.resultsTransformed

        // // Sort all items based on the weighted score
        // resultsTableList = resultsTableList.sort((a, b) => a.weightedScore < b.weightedScore ? 1 : -1);


        let result = []
        
        // var resultsRanked = this.state.resultsTransformed

        var resultsRanked = this.state.resultsListed
        
        //Implement pagination logic
        const total_items = resultsRanked.length
        const pages = Math.ceil(total_items/this.state.table_size);
        
        // Initialize pages to show
        var startpage = 1;
        var endpage = 10;

        if (this.state.currentpage >= 6){
            startpage = this.state.currentpage - 4
            endpage = this.state.currentpage + 5
        }

        // As state change of the currentpage calls render again, this function will run and change the displayed
        // content of the table

        const start_index = (this.state.currentpage - 1)*this.state.table_size;
        const end_index = start_index + this.state.table_size;
        var resultsRankedSlice = resultsRanked.slice(start_index,end_index);
        console.log(pages)

        //Implement page number line (shows only maximum 10 pages)
        const pageNumbers = [];
        for (let page = startpage; page <= endpage; page++) {
            pageNumbers.push(page);

        }

        // Logic to change page (and thus change state of currentpage and thus re-render the table with the data slice)
        const pageSelection = pageNumbers.map(page => {
            if(page === this.state.currentpage) {
                return (
                    <li key={page} className='activePage' id={page}><a id={page} onClick={this.handleClick}>{page}</a></li>
                )
            }
            else if (page < pages) {
                return (
                    <li key={page} id={page}><a id={page} onClick={this.handleClick}>{page}</a></li>
                )
            }
        });

        // Implement buttons for next page, previous page, first page and last page

        let pageNavigationLeft = (
            <ul className="pagination">
                <li></li>
            </ul>
        );
        if(this.state.currentpage !== 1)
        {
            pageNavigationLeft = (
                <ul className="pagination">
                <li> <a id="First" onClick={this.handleClickNavigation}>First</a></li>
                <li> <a id="Previous" onClick={this.handleClickNavigation}>Previous</a></li>
                </ul>
            )
        }

        let pageNavigationRight = (
            <ul className="pagination">
                <li></li>
            </ul>
        );
        if(this.state.currentpage !== pages)
        {
            pageNavigationRight = (
                <ul className="pagination">
                <li> <a id="Next" onClick={this.handleClickNavigation}>Next</a></li>
                <li> <a id="Last" onClick={this.handleClickNavigation}>Last</a></li>
                </ul>
            )
        }
        

        //Create the table of ranked items

        resultsRankedSlice.forEach(element => {
        //resultsRanked.forEach(element => {
            let index = this.props.location.state.overallResult.findIndex(object => object.id === element.id)
            let data = this.props.location.state.overallResult[index]
            // console.log("Also resultsTransformed called")
            let normalizedScore = minMaxNormalizationMinus(element.score, this.state.minScore, this.state.maxScore).toFixed(3);
            let scoreSymbol = normalizedScore < 0 ?
                <td><BarSymbolNegative score={Math.abs(normalizedScore) * 50}/></td> :
                <td><BarSymbolPositive score={Math.abs(normalizedScore) * 50}/></td>

            let normalizedWeightedScore = minMaxNormalizationMinus(element.weightedScore, this.state.minWeightedScore,
                this.state.maxWeightedScore).toFixed(3);
            let weightedScoreSymbol = normalizedWeightedScore < 0 ?
                <td><BarSymbolNegative score={Math.abs(normalizedWeightedScore) * 50}/></td> :
                <td><BarSymbolPositive score={Math.abs(normalizedWeightedScore) * 50}/></td>

            let impact = minMaxNormalization(element.impact, 0, this.state.maxImpact).toFixed(3);
            let impactSymbol = <td><BarSymbolImpact score={Math.abs(impact) * 100}/></td>;

            //Create the whole table row based on the symbols and the scores
            result.push(
                <tr>
                    <td>{element.rankNumber}</td>
                    <td>{element.id}</td>
                    <td bgcolor={this.state.hex[index]}></td>

                    <td>{element.score.toFixed(3)}</td>
                    {scoreSymbol}

                    <td>{element.weightedScore.toFixed(3)}</td>
                    {weightedScoreSymbol}

                    <td>{element.impact.toFixed(3)}</td>
                    {impactSymbol}

                    {this.state.sliderValues.map(item => {
                        return <td>{data[item.id].toFixed(3)}</td>
                    })}
                </tr>
            )
        })


        return (
            <>
                <div className='largeHeader'><h1 style={{display: 'inline'}}>Result Overview</h1>
                    <div style={{display: 'inline', marginLeft: '3%'}}>
                        <a
                            href={`data:text/json;charset=utf-8,${encodeURIComponent(
                                JSON.stringify(this.state.resultsTransformedSave)
                            )}`}
                            download="result.json"
                        >
                            <button className='nextButton button' type="button">Download JSON</button>
                        </a>
                        <a
                            href={`data:text/json;charset=utf-8,${encodeURIComponent(
                                JSON.stringify(this.props.location.state.options)
                            )}`}
                            download="options.json"
                        >
                            <button className='nextButton button' type="button"
                                    style={{display: 'inline', marginLeft: '3%'}}>Download Options
                            </button>
                        </a>
                        <a
                            href={`data:text/json;charset=utf-8,${encodeURIComponent(
                                JSON.stringify(this.state.sliderValues)
                            )}`}
                            download="weights.json"
                        >
                            <button className='nextButton button' type="button"
                                    style={{display: 'inline', marginLeft: '3%'}}>Download Weights
                            </button>
                        </a>

                        <a
                            href={`data:text/csv;charset=utf-8,${encodeURIComponent(
                                this.JSONToCSVConvertor(JSON.stringify(this.state.resultsTransformedSave))
                            )}`}
                            download="result.csv"
                        >
                            <button className='nextButton button' type="button"
                                    style={{display: 'inline', marginLeft: '3%'}}>Download CSV
                            </button>
                        </a>
                        <div style={{display: 'inline', marginLeft: '3%'}}>
                            <Link to={{
                                pathname: '/datasetAttributes',
                                state: {
                                    data: this.props.location.state.data,
                                    overallResult: this.props.location.state.overallResult,
                                    selectedAttributes: this.props.location.state.selectedAttributes,
                                    options: this.props.location.state.options,
                                    categorical: this.state.categorical,
                                    numerical: this.props.location.state.numerical,
                                }
                            }}>
                                <button className='nextButton button' type="button">Back</button>
                            </Link>
                        </div>
                    </div>
                </div>


                <div style={{paddingTop: '20px', paddingBottom: '0px'}}>
                    <p style={{paddingLeft: '40px'}}>
                        Please select whether the color map should be calculated based on the input or the output.</p>
                    <ul style={{listStyleType: 'none'}} onChange={this.setRadioButton.bind(this)} className='text'>
                        <li><input type="radio" value="input" name="function" id="inputRadio"
                                   checked={this.state.colorCoding === 'input'}/>
                            <label for="inputRadio" id="weightingRadio">Input</label>
                        </li>
                        <li><input type="radio" value="output" name="function" id="outputRadio"
                                   checked={this.state.colorCoding === 'output'}/>
                            <label for="outputRadio" id="weightingRadio">Output</label>
                        </li>
                    </ul>
                </div>

                <div style={{paddingTop: '20px', paddingBottom: '30px'}}>

                    <div style={{display: 'inline-block', paddingLeft: '20px', width: '21%'}}>
                        <Plot
                            data={[{
                                x: this.state.pca_x_input,
                                y: this.state.pca_y_input,
                                text: this.state.text,
                                hoverinfo: "text",
                                type: 'scatter',
                                mode: 'markers',
                                marker: {color: this.state.colorList}
                            }]}
                            layout={{
                                width: 270,
                                height: 270,
                                title: 'PCA of Input distribution',
                                padding: 0,
                                margin: {
                                    r: 20, t: 60, l: 40, b: 40
                                }
                            }}
                        />
                    </div>

                    <div style={{paddingLeft: '10px', display: 'inline-block', width: '55.5%', verticalAlign: 'top'}}>
                        {resultValue.map((element) => (
                            (element)))}
                    </div>


                    <div style={{display: 'inline-block', width: '21%'}}>
                        <Plot
                            data={[{
                                x: this.state.pca_x_output,
                                y: this.state.pca_y_output,
                                type: 'scatter',
                                mode: 'markers',
                                text: this.state.text,
                                hoverinfo: "text",
                                marker: {color: this.state.colorList}
                            }]}
                            layout={{
                                width: 270, height: 270, title: 'PCA of Output distribution', padding: 0,
                                margin: {
                                    r: 20, t: 60, l: 40, b: 40
                                }
                            }}
                        />
                    </div>
                </div>


                <div>
                    <div style={{
                        width: '98%',
                        paddingLeft: '50px',
                        //overflowY: 'scroll',
                        //height: '900px',
                        height: '700px',
                        display: 'inline-block'
                    }}>
                        <Table bordered responsive size="sm">
                            <thead>
                            <tr>
                                <th>Rank</th>
                                <th>ID</th>
                                <th>Color</th>
                                <th>Summary&nbsp;Score <button id={this.state.btnActiveColor === "summary" ? "sortActive" : "sort"} style={{display: 'inline'}} onClick={() => {
                                        this.handleSortSummary()
                                    }}><img src={process.env.PUBLIC_URL + 'images/sortIconImage.png'}
                                            width={'10px'}/>
                                    </button> </th>
                                <th>Score&nbsp;Symbol</th>
                                <th>Weighted&nbsp;Score <button id={this.state.btnActiveColor === "weighted" ? "sortActive" : "sort"} style={{display: 'inline'}} onClick={() => {
                                        this.handleSortWeighted()
                                    }}><img src={process.env.PUBLIC_URL + 'images/sortIconImage.png'}
                                            width={'10px'}/>
                                    </button> </th>
                                <th>Weighted&nbsp;Score&nbsp;Symbol</th>
                                <th>Impact <button id={this.state.btnActiveColor === "impact" ? "sortActive" : "sort"} style={{display: 'inline'}} onClick={() => {
                                        this.handleSortImpact()
                                    }}><img src={process.env.PUBLIC_URL + 'images/sortIconImage.png'}
                                            width={'10px'}/>
                                    </button> </th>
                                <th>Impact&nbsp;Symbol</th>
                                {this.state.sliderValues.map(element => (
                                <th>{element.id}</th>
                                ))}
                            </tr>
                            </thead>

                            <tbody>
                            {result.map((element) => (
                                (element)))}
                            </tbody>
                        </Table>
                    </div>
                    <div style={{display: 'inline-block', paddingLeft: '20px'}}>
                    </div>
                    <div style={{
                        width: '98%',
                        paddingLeft: '50px',
                        display: 'inline-block'
                    }}><ul className="pagination">{pageNavigationLeft}{pageSelection}{pageNavigationRight}</ul>
                    </div>
                </div>
            </>
        )
    }
}

export default Weighting;