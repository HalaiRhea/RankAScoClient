import React from "react";
import Plot from 'react-plotly.js';
import {colorChart, colorChartBackground} from "./HelperComponents";

//This plot is shown in the ASF Creation view
//It shows the input distribution of the selected attribute
class NumericalPlot extends React.Component {
    constructor(props) {
        super(props)

        this.state = {
            name: this.props.name,
            min: Math.min.apply(Math, this.props.data),
            max: Math.max.apply(Math, this.props.data),
            data: this.props.data,

        }
    };

    render() {
        return <>
            <Plot
                data={[
                    {type: 'histogram', x: this.props.data, marker: {color: colorChart}},
                ]}
                layout={{
                    width: 500,
                    height: 450,
                    title: this.props.name,
                    paper_bgcolor: colorChartBackground,
                    plot_bgcolor: colorChartBackground,
                    padding: 0,
                    margin: {
                        r: 30, t: 60, l: 40, b: 40
                    }
                }}
            />
        </>
    }
}

export default NumericalPlot;