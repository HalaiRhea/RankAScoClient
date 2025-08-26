import React from "react";
import Plot from "react-plotly.js";
import {colorChart, colorChartBackground} from "./HelperComponents";

//This plot is shown in the Attribute Overview page
//For every numerical attribute, a plot exists that shows the histogram of attribute values
class NumericalPlotSmall extends React.Component {
    constructor(props) {
        super(props)

        this.state = {
            data: this.props.data,
            min: Math.min.apply(Math, this.props.data),
            max: Math.max.apply(Math, this.props.data),
        }
    };


    render() {

        return <>
            <Plot
                data={[
                    {type: 'histogram', x: this.props.data, marker: {color: colorChart}},
                ]}
                layout={{
                    title: '',
                    width: 250,
                    height: 180,
                    paper_bgcolor: colorChartBackground,
                    plot_bgcolor: colorChartBackground,
                    padding: 0,
                    margin: {
                        r: 30, t: 20, l: 35, b: 20
                    },
                    xaxis: {tickvals: [this.state.min, this.state.max], ticktext: [this.state.min, this.state.max]}
                }
                }
            />
        </>
    }
}

export default NumericalPlotSmall;