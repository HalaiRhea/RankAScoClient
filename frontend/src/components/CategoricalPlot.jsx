import React from "react";
import Plot from "react-plotly.js";
import {colorChart, colorChartBackground} from "./HelperComponents";

//This plot is shown in the ASF Creation view
//It shows the input distribution of the selected attribute
class CategoricalPlot extends React.Component {
    constructor(props) {
        super(props)

        this.state = {
            data: this.props.data,
            x: this.props.x,
            y: this.props.y
        }
    };

    render() {
        return <>
            <Plot
                data={[
                    {type: 'bar', x: this.state.x, y: this.state.y, mode: 'markers', marker: {color: colorChart}},
                ]}
                layout={{
                    title: this.props.name,
                    width: 500,
                    height: 450,
                    paper_bgcolor: colorChartBackground,
                    plot_bgcolor: colorChartBackground,
                    xaxis:{type: "category", autorange: true, automargin: true},
                    // yaxis: {automargin: true},
                    padding: 0,
                    margin: {
                        r: 30, t: 60, l: 40, b: 40
                    }
                }}
            />
        </>
    }
}

export default CategoricalPlot;