import React from 'react'
import {Arrow, LargeHandleCategorical} from "../HelperComponents";
import {viewBoxWidth} from "./ASFHelperFunctions";

class Equidistant extends React.PureComponent {
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
     * Helper method that calls when mouse is left SVG
     */
     handleMouseLeave() {
        console.log("Mouse up")
     }

    /**
     * Helper method that sets the id of the point that is being dragged
     * @param {number} id The id of the point that is being dragged at the moment
     */
    handleMouseDown(id) {
        this.setState({draggingPointId: id});
    }

    /**
     * Helper method that finds closest docking point and removes the id from the state when no point is dragged
     */
    handleMouseUp() {

        //If no point is dragged, the method is called by mistake and returns
        if (!this.state.draggingPointId) {
            return;
        }

        // //Calculate the position of the point in the rectangle
        let points = this.state.points
        //Find the point just moved
        let index = points.findIndex(element => element.id === this.state.draggingPointId);
        let point = points[index]
        let viewBoxX = point.x

        // Find the closest docking point
        viewBoxX = 100 + this.findClosestDockingPoint(viewBoxX)

        //Update point to dock to nearest docking point
        point = {
            x: viewBoxX, y: point.y, id: point.id, category: point.category, normalizedX: 0, normalizedY: 0,
        }
        points[index] = point;

        // Save the final docked point position
        this.setState({key: Math.random(), points: points}, () => this.props.handler(points));

        // Reset dragging point
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
                    x: 100,
                    y: 100 - i * yDifference,
                    id: 'startPoint' + i,
                    normalizedX: 0,
                    normalizedY: 0,
                    category: categories[i]
                }
                points.push(point);
            }
        }
        //If no points were loaded, they are now initialized
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

        //Calculate the position of the point in the rectangle
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

        // Code for docking point as soon as mouse moved

         viewBoxX = 100 + this.findClosestDockingPoint(viewBoxX)

        //Update the point in the state
        let index = points.findIndex(element => element.id === this.state.draggingPointId);
        let point = points[index]

        point = {
            x: viewBoxX, y: point.y, id: point.id, category: point.category, normalizedX: 0, normalizedY: 0,
        }
        points[index] = point;

        console.log(points[index].x)

        //Only change the position of the circle, do not update the histogram while moving
        this.setState({key: Math.random(), points: points})

        // Uncomment for enabling docking at mouse move instead of mouse up
        //this.setState({key: Math.random(), points: points}, () => this.props.handler(points));
    }

    /**
     * Find the closest docking point aka fixed position on the x-axis
     * @param {number} viewBoxX The x-coordinate value of the category being dragged
     * @return {number} The position of the closest docking point
     */
    findClosestDockingPoint(viewBoxX) {
        let xValue;
        let xDistance = 3118 / (this.props.categories.length - 1);

        let remainder = Math.floor(viewBoxX / xDistance);

        if (viewBoxX - (remainder * xDistance) < 0.5 * xDistance) {
            xValue = remainder * xDistance;
        } else {
            xValue = (1 + remainder) * xDistance;
        }
        console.log("Closest",xValue)
        return xValue
    }


    render() {
        const {xAxisStart, xAxisEnd, yAxisStart, yAxisEnd, points,} = this.state;
        //Create the labels on the x-axis for the ASF
        let resultValue = [<Arrow id={"xAxis"} from={xAxisStart} to={xAxisEnd}/>,
            <text x="82" y={260 + this.props.categories.length * 100} fontSize="50px">1 </text>,
            <text x="82" y={310 + this.props.categories.length * 100} fontSize="50px">(less preferred) </text>,
            <text x="3182" y={260 + this.props.categories.length * 100}
                  fontSize="50px">{this.props.categories.length}</text>,
            <text x="2870" y={310 + this.props.categories.length * 100} fontSize="50px">(more preferred)</text>,
        ];

        //Create labels for all categories
        let i;
        for (i = 1; i < this.props.categories.length - 1; i++) {
            let xDistance = 3100 / (this.props.categories.length - 1);
            if (i < 9){
                resultValue.push(<text x={xDistance * (i) + 85 + i} y={260 + this.props.categories.length * 100}
                                       fontSize="50px">{i + 1}</text>,)
            } else {
                resultValue.push(<text x={xDistance * (i) + 80 + i} y={260 + this.props.categories.length * 100} width={50}
                                       fontSize="50px">{i + 1}</text>,)
            }
            // Uncomment for dashed lines
            // resultValue.push(<line x1={xDistance * (i) + 100} x2={xDistance * (i) + 100} y1={yAxisEnd.y} y2={yAxisStart.y - 100} stroke="black" strokeDasharray={"40 5"} />)
        }

        //Create point aka handles with functionality for all categories
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
                    Please drag the categories to the right or left for expressing your preferences.
                    Left means a category is less preferred and right means a category is more preferred.</p>
                <p className='text' style={{paddingLeft: '0px', paddingRight: '10px'}}>
                    Categories can only be placed on the indicated points.</p>
                <svg
                    key={this.state.key}
                    ref={node => (this.node = node)}
                    viewBox={`0 0 ${viewBoxWidth} ${300 + this.props.categories.length * 100}`}
                    onMouseMove={ev => this.handleMouseMove(ev)}
                    onMouseUp={() => this.handleMouseUp()}
                    onMouseLeave={() => this.handleMouseLeave()}
                    style={{
                        overflow: 'visible',
                        width: '80%',
                        display: 'inline',
                        paddingRight: '10px',
                        paddingLeft: '0px',
                        marginLeft: '0px',
                    }}
                >
                    {resultValue.map((element) => (
                        (element)))}
                </svg>
            </div>
        );
    }
}

export default Equidistant;