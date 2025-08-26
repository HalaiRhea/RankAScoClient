import React from 'react'
import {Arrow, Axis, LargeHandleCategorical} from "../HelperComponents";
import {viewBoxWidth} from "./ASFHelperFunctions";

class NonEquidistant extends React.PureComponent {
    constructor(props) {
        super(props);

        this.state = {
            xAxisStart: {x: 100, y: 200 + this.props.categories.length * 100},
            xAxisEnd: {x: 3200, y: 200 + this.props.categories.length * 100},
            yAxisStart: {x: 1650, y: 100},
            yAxisEnd: {x: 1650, y: 200 + this.props.categories.length * 100},

            points: [],

            draggingPointId: null,
            key: 0,
        };
    }

    /**
     * Helper method that sets the id of the point that is being dragged
     * @param {number} id The id of the point that is being dragged at the moment
     */
    handleMouseDown(id) {
        this.setState({draggingPointId: id});
    }

    /**
     * Helper method that removes the id from the state when no point is dragged
     */
    handleMouseUp() {
        this.setState({draggingPointId: null});
    }

    /**
     * Life-cycle method that initializes all axes and categories and sets them as state
     */
    componentWillMount() {
        let points = [];
        let categories = this.props.categories;
        let yDifference = (this.state.yAxisStart.y - this.state.yAxisEnd.y) / (categories.length);
        let i;

        //Check if some points were initialized from the options
        //If this is the case, the points are reloaded from the option
        if (this.props.points.length === 0) {
            for (i = 0; i < categories.length; i++) {
                let point = {
                    x: 1650,
                    y: 100 - i * yDifference,
                    id: 'startPoint' + i,
                    normalizedX: 0,
                    normalizedY: 0,
                    category: categories[i]
                }
                points.push(point);
            }
        }
        //If no points were loaded, they are now initalized
        else {
            for (i = 0; i < categories.length; i++) {
                let value = this.props.points.filter(element => element.category === categories[i])[0].x
                let point = {
                    x: value,
                    y: 100 - i * yDifference,
                    id: 'startPoint' + i,
                    normalizedX: 0,
                    normalizedY: 0,
                    category: categories[i]
                }
                points.push(point);
            }
        }
        this.setState({points: points}, () => this.props.handler(points))
    }

    /**
     * Handles drag and drops of categories along the x-axis
     * @param {Object} categoryXCoordinate The x-coordinate of the category that is being dragged
     */
    handleMouseMove(categoryXCoordinate) {

        //If no point is dragged, the method is called by mistake and returns
        if (!this.state.draggingPointId) {
            return;
        }

        //Calculate the coordinates in the rectangle
        const svgRect = this.node.getBoundingClientRect();
        const svgX = categoryXCoordinate.clientX - svgRect.left;

        let viewBoxX = svgX * viewBoxWidth / svgRect.width;
        let points = this.state.points;

        //Check if the point lies within the boundaries
        if (viewBoxX < 100) {
            viewBoxX = 100;
        }
        if (viewBoxX > 3200) {
            viewBoxX = 3200;
        }

        //Update the point in the state
        let index = points.findIndex(element => element.id === this.state.draggingPointId);
        let point = points[index]

        point = {
            x: viewBoxX, y: point.y, id: point.id, category: point.category, normalizedX: 0, normalizedY: 0,
        }
        points[index] = point;

        this.setState({key: Math.random(), points: points}, () => this.props.handler(points));
    }


    render() {
        const {xAxisStart, xAxisEnd, yAxisStart, yAxisEnd, points,} = this.state;

        //Create the labels on the x-axis for the ASF
        let resultValue = [<Arrow id={"xAxis"} from={xAxisStart} to={xAxisEnd}/>,
            <Axis id={"yAxis"} from={yAxisStart} to={yAxisEnd}/>,
            <text x="1635" y={260 + this.props.categories.length * 100} fontSize="50px">0</text>,
            <text x="82" y={260 + this.props.categories.length * 100} fontSize="50px">less preferred</text>,
            <text x="2880" y={260 + this.props.categories.length * 100} fontSize="50px">more preferred</text>,
        ];

        //Create labels for all categories
        let i;
        for (i = 0; i < points.length; i++) {
            let startPoint = points[i];
            resultValue.push(<LargeHandleCategorical id={"handle" + i} coordinates={startPoint} onMouseDown={
                () => this.handleMouseDown(startPoint.id, false)} category={startPoint.category}
            />)
            let name = startPoint.category === '' ? 'Missing' : startPoint.category
            resultValue.push(<text x={startPoint.x + 27} y={startPoint.y + 15} fontSize="50px">{name}</text>)
        }

        return (
            <div style={{paddingLeft: '50px'}}>
                <p className='text' style={{paddingLeft: '0px', paddingRight: '10px'}}>
                    Please drag the categories to the left or right to express your preferences.
                    Left means a category is less preferred and right means a category is more preferred.</p>
                <svg
                    key={this.state.key}
                    ref={node => (this.node = node)}
                    viewBox={`0 0 ${viewBoxWidth} ${300 + this.props.categories.length * 100}`}
                    onMouseMove={ev => this.handleMouseMove(ev)}
                    onMouseUp={() => this.handleMouseUp()}
                    onMouseLeave={() => this.handleMouseUp()}
                    style={{
                        overflow: 'visible',
                        width: '80%',
                        display: 'inline',
                        paddingRight: '10px',
                        paddingLeft: '0px',
                    }}
                >
                    {resultValue.map((element) => (
                        (element)))}
                </svg>
            </div>
        );
    }
}

export default NonEquidistant;