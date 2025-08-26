import React from "react";

//The following constants are used for rendering the x- and y-axis in charts
export const Axis = ({from, to}) => (
    <line
        x1={from.x}
        y1={from.y }
        x2={to.x}
        y2={to.y }
        stroke="rgb(0, 0, 0)"
        strokeWidth={2}
    />
);


export const DashedAxis = ({from, to}) => (
    <line
        x1={from.x}
        y1={from.y}
        x2={to.x}
        y2={to.y}
        stroke="rgb(0, 0, 0)"
        strokeWidth={2}
        strokeDasharray="5,5"
    />
);

export const Arrow = ({from, to}) => (
    <>
        <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7"
                    refX="0" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7"/>
            </marker>
        </defs>
        <defs>
            <marker id="startarrow" markerWidth="10" markerHeight="7"
                    refX="10" refY="3.5" orient="auto">
                <polygon points="10 0, 10 7, 0 3.5"/>
            </marker>
        </defs>
        <line
            x1={from.x}
            y1={from.y}
            x2={to.x}
            y2={to.y}
            stroke="rgb(0, 0, 0)"
            strokeWidth={2}
            markerEnd="url(#arrowhead)"
            markerStart="url(#startarrow)"
        />
    </>
);
//-----------------------------------------------------------

//The following constants are used for rendering ASFs
export const ConnectingLine = ({from, to}) => (
    <line
        x1={from.x}
        y1={from.y}
        x2={to.x}
        y2={to.y}
        stroke='rgb(0, 0, 0)'
        strokeDasharray="5,5"
        strokeWidth={2}
    />
);

export const Curve = ({instructions}) => (
    <path
        d={instructions}
        fill="none"
        stroke="rgb(0, 0, 0)"
        strokeWidth={5}
    />
);

//Handle for normal points
export const LargeHandle = ({coordinates, onMouseDown}) => (
    <ellipse
        cx={coordinates.x}
        cy={coordinates.y}
        rx={15}
        ry={15}
        fill="#1b42f2"
        onMouseDown={onMouseDown}
        style={{cursor: '-webkit-grab'}}
    />
);

//Handle for control points
export const SmallHandle = ({coordinates, onMouseDown}) => (
    <ellipse
        cx={coordinates.x}
        cy={coordinates.y}
        rx={12}
        ry={12}
        fill="#1b42f2"
        strokeWidth={2}
        onMouseDown={onMouseDown}
        style={{cursor: '-webkit-grab'}}
    />
);

export const LargeHandleCategorical = ({coordinates, onMouseDown}) => (
    <>
        <ellipse
            cx={coordinates.x}
            cy={coordinates.y}
            rx={15}
            ry={15}
            fill="#1b42f2"
            strokeWidth={3}
            onMouseDown={onMouseDown}
            style={{cursor: '-webkit-grab'}}
        />
    </>
);

// HoverText for ASF

export const HoverText = ({coordinates, y_text}) => (
    <>
        <text font-size="3em" x={coordinates.x + 20} y={coordinates.y} fill='#1b42f2'>
        {y_text}
        </text>
    </>
);

//-----------------------------------------------------------

//The following constant is used for the minified ASF version
export const TinyCurve = ({instructions}) => (
    <path
        d={instructions}
        fill="none"
        stroke={colorChart}
        strokeWidth={2}
    />
);
//-----------------------------------------------------------

//The following constants contain all attributes for the two data sets
export const numericalRome = ['host_response_rate', 'accommodates', 'bathrooms', 'bedrooms', 'price', 'minimum_nights', 'maximum_nights', 'number_of_reviews', 'review_scores_rating', 'review_scores_cleanliness', 'review_scores_location']
export const categoricalRome = ['neighbourhood', 'property_type', 'room_type']

//-----------------------------------------------------------

//The following constants are used for the symbols in the ranking overview
export const BarSymbolNegative = ({score}) => (
    <>
        <svg
            key={score}
            //ref={node => (this.node = node)}
            style={{
                display: 'inline',
                width: '110',
                height: '50',
                marginBottom: '0'
            }}
        >
            <line
                x1={0}
                y1={50}
                x2={100}
                y2={50}
                stroke="rgb(0, 0, 0)"
                strokeWidth={2}
            />
            <rect className="zwei" x={getStartValue(score)} y={17} width={score} height={25} fill="rgb(255, 0, 0)"/>
            <line
                x1={50}
                y1={10}
                x2={50}
                y2={50}
                stroke="rgb(0, 0, 0)"
                strokeWidth={2}
            />
        </svg>
    </>
);

export const BarSymbolPositive = ({score}) => (
    <>
        <svg
            key={score}
            //ref={node => (this.node = node)}
            style={{
                display: 'inline',
                width: '110',
                height: '50',
                marginBottom: '0'
            }}
        >
            <line
                x1={0}
                y1={50}
                x2={100}
                y2={50}
                stroke="rgb(0, 0, 0)"
                strokeWidth={2}
            />
            <rect className="zwei" x={50} y={17} width={score} height={25} fill="rgb(0, 191, 0)"/>
            <line
                x1={50}
                y1={10}
                x2={50}
                y2={50}
                stroke="rgb(0, 0, 0)"
                strokeWidth={2}
            />
        </svg>
    </>
);

export const BarSymbolImpact = ({score}) => (
    <>
        <svg
            key={score}
            //ref={node => (this.node = node)}
            style={{
                display: 'inline',
                width: '110',
                height: '50',
                marginBottom: '0'
            }}
        >
            <line
                x1={0}
                y1={50}
                x2={100}
                y2={50}
                stroke="rgb(0, 0, 0)"
                strokeWidth={2}
            />
            <rect className="zwei" x={0} y={17} width={score} height={25} fill="rgb(0, 191, 0)"/>
            <line
                x1={1}
                y1={10}
                x2={1}
                y2={50}
                stroke="rgb(0, 0, 0)"
                strokeWidth={2}
            />
        </svg>
    </>
);

function getStartValue(score) {
    return 50 - score;
}
//------------------------------------------------------------
//Some fixed color values
export const colorChart = '#ec2c74';
export const colorChartBackground = '#FAFAFA';