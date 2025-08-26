import React from "react";
import Plot from "react-plotly.js";
import {colorChart, colorChartBackground} from "./HelperComponents";

//This plot is shown in the Attribute Overview page
//For every Category, a plot exists that shows the histogram of categories
class CategoricalPlotSmall extends React.Component {
    constructor(props) {
        super(props)

        this.state = {
            data: this.props.data
        }
    };

    render() {
        let x = []
        let y = []

        //Make a map containing all categories and the counts of items per category
        this.props.data.forEach(function (category) {
            x.push(category.name);
            y.push(category.data[0]);
        });

        return <>
            <Plot
                data={[
                    {
                        type: 'bar', x: y, text: x, hovertemplate: '<b>%{text}:</b> %{x} <extra></extra>',
                        marker: {color: colorChart}, orientation: 'h'
                    },
                ]}
                layout={{
                    title: '',
                    hovermode: 'closest',
                    width: 250,
                    height: 180,
                    paper_bgcolor: colorChartBackground,
                    plot_bgcolor: colorChartBackground,
                    padding: 0,
                    margin: {
                        r: 5, t: 20, l: 10, b: 5
                    },
                    yaxis: {showticklabels: false},
                    xaxis: {showticklabels: false}
                }
                }
            />
        </>
    }
}

export default CategoricalPlotSmall;