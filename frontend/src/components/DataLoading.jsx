import React from 'react';
import Papa from 'papaparse';
import {Link} from "react-router-dom";

//This page loads the data and shows the user, how many items were loaded
//If the user is happy with the loaded data, he can move on to the attribute overview
//If the user is not happy, he can go back to the home screen and load another data set
class DataLoading extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            dataSet: [],
            loaded: false,
        };
        this.navigate = this.navigate.bind(this);
    }

    /**
     * Life-cycle method that initializes the data load
     */
    componentWillMount() {
        this.getData();
    }

    /**
     * Fetches the CSV file asynchronous
     */

    async fetchCsv() {
        //The file name is passed via props
        const response = await fetch(this.props.location.state.filename, {method: 'get', headers: {'content-type': 'text/csv;charset=UTF-8'}});
        if(response.status !== 200) {
            console.log("There is a problem with loading the CSV file", "Response code is:", response.status)
        }
        const result = await response.text()
        return result
    }

    /**
     * Load all the data from a CSV file and parses all items as JSON
     */

    // Old way of parsing data (chunk was not needed, but keeping in case new code is not scalable to millions of lines)
    async getData() {
        const self = this;
        let dataList = [];
        Papa.parse(await this.fetchCsv(),
            {
                delimiter: ',',
                header: true,
                dynamicTyping: true, //commenting as it breaks the scoring categorical function

                chunkSize: 1024 * 1024 * 11,
                chunk: function (result, parser) {
                    //Since the data set is too large to be loaded in one run, the parser needs to pause and the data
                    //must be concatenated into one list
                    parser.pause();
                    dataList = dataList.concat(result.data)
                    parser.resume();
                },
                transform: function(value, column){

                    // If the values are boolean then keep them as a string 

                    if(value === "TRUE"){
                        value = "True value"
                    }
                    else if(value === "FALSE"){
                        value = "False value"
                    }

                    return value

                },
                //When the whole file is loaded, the data list is updated
                complete: function () {
                    console.log('finished');
                    self.updateData(dataList);
                    self.setState({dataSet: dataList});
                    console.log("Complete",dataList.length)
                }
            });
    }

    /**
     * Helper method that combines the intermediate result and adds all data chunks to one object
     */
    concatData(data) {
        let totalResult = this.state.dataSet.concat(data);
        this.setState({dataSet: totalResult});
    }

    updateData() {
        //TODO check if can be removed
        console.log("Data loaded")
    }

    /**
     * When the user clicks on the next button, he should be navigated to the attribute overview
     * and all data should be passed as props
     */
    navigate() {
        let result = [];
        let loaded = this.state.dataSet;
        loaded.splice(-1, 1);
        loaded.forEach(element => {
                result.push({id: element.id})
            }
        )

        let path = {
            pathname: '/datasetAttributes',
            state: {
                data: this.state.dataSet,
                overallResult: result,
                selectedAttributes: [],
                options: {},
                categorical: this.props.location.state.categorical,
                numerical: this.props.location.state.numerical,
            }
        }

        this.props.history.push(path);
    }

    render() {
        return (
            <>
                <div className='largeHeader'><h1 style={{display: 'inline'}}>Data Loading</h1>
                    <div style={{display: 'inline', float: 'right', marginRight: '5%'}}>
                        <button className='nextButton button' type="button" onClick={this.navigate}>Next</button>
                    </div>
                    <div style={{display: 'inline', float: 'right', marginRight: '5%'}}>
                        <Link to={{
                            pathname: '/home',
                        }}>
                            <button className='nextButton button' type="button">Back</button>
                        </Link>
                    </div>
                </div>
                <div style={{display: 'inline'}}>
                    <p className='text'>So far there have been {this.state.dataSet.length - 1} items loaded. Please click
                        next when the loading has finished.</p>
                    <p className='text'>If you want to choose another data set, click Back.</p>
                </div>
                <div style={{paddingBottom: '40%'}}>
                </div>
            </>
        );
    }
}

export default DataLoading;