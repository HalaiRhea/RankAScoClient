import React from 'react';
import {
    ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Line, ResponsiveContainer
} from 'recharts';

class ASFDashboard extends React.Component {
    constructor(props) {
        super(props);

        const ranking = this.props.location.state?.ranking || [];

        this.state = {
            ranking: ranking,
            attributes: [
                'bedrooms',
                'bathrooms',
                'price',
                'review_scores_rating'
            ],
            functions: [
                'Linear',
                'Non-linear',
                'Continuous',
                'Discontinuous',
            ],
        };
    }

    getScatterData(attribute) {
        const { ranking } = this.state;
        return ranking.map((item, index) => ({
            rank: index + 1,
            value: parseFloat(item[attribute]),
            id: item.id
        }));
    }


    getLinearRegressionLine(data) {
        if (data.length === 0) return [];

        const n = data.length;
        const sumX = data.reduce((acc, p) => acc + p.rank, 0);
        const sumY = data.reduce((acc, p) => acc + p.value, 0);
        const sumXY = data.reduce((acc, p) => acc + p.rank * p.value, 0);
        const sumX2 = data.reduce((acc, p) => acc + p.rank * p.rank, 0);

        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;

        const minX = Math.min(...data.map(p => p.rank));
        const maxX = Math.max(...data.map(p => p.rank));

        return [
            { rank: minX, value: slope * minX + intercept },
            { rank: maxX, value: slope * maxX + intercept }
        ];
    }

    getQuadraticRegressionLine(data) {
        if (data.length === 0) return [];

        const n = data.length;
        const sumX = data.reduce((acc, p) => acc + p.rank, 0);
        const sumX2 = data.reduce((acc, p) => acc + p.rank ** 2, 0);
        const sumX3 = data.reduce((acc, p) => acc + p.rank ** 3, 0);
        const sumX4 = data.reduce((acc, p) => acc + p.rank ** 4, 0);
        const sumY = data.reduce((acc, p) => acc + p.value, 0);
        const sumXY = data.reduce((acc, p) => acc + p.rank * p.value, 0);
        const sumX2Y = data.reduce((acc, p) => acc + p.rank ** 2 * p.value, 0);

        const matrix = [
            [sumX4, sumX3, sumX2],
            [sumX3, sumX2, sumX],
            [sumX2, sumX, n]
        ];
        const rhs = [sumX2Y, sumXY, sumY];

        const det = (m) =>
            m[0][0] * (m[1][1]*m[2][2] - m[1][2]*m[2][1])
        - m[0][1] * (m[1][0]*m[2][2] - m[1][2]*m[2][0])
        + m[0][2] * (m[1][0]*m[2][1] - m[1][1]*m[2][0]);

        const detA = det([
            [rhs[0], matrix[0][1], matrix[0][2]],
            [rhs[1], matrix[1][1], matrix[1][2]],
            [rhs[2], matrix[2][1], matrix[2][2]]
        ]);
        const detB = det([
            [matrix[0][0], rhs[0], matrix[0][2]],
            [matrix[1][0], rhs[1], matrix[1][2]],
            [matrix[2][0], rhs[2], matrix[2][2]]
        ]);
        const detC = det([
            [matrix[0][0], matrix[0][1], rhs[0]],
            [matrix[1][0], matrix[1][1], rhs[1]],
            [matrix[2][0], matrix[2][1], rhs[2]]
        ]);

        const a = detA / det(matrix);
        const b = detB / det(matrix);
        const c = detC / det(matrix);

        const linePoints = [];
        const minX = 1;
        const maxX = 5;
        const step = (maxX - minX) / 100;
        for (let x = minX; x <= maxX; x += step) {
            linePoints.push({ rank: x, value: a*x*x + b*x + c });
        }

        return linePoints;
    }

    getContinuousRegressionLine(data) {
        if (data.length < 4) return [];

        const seg1 = data.slice(0, 3);
        const seg2 = data.slice(2, 5);

        const line1 = this.getLinearRegressionLine(seg1);

        const line2Raw = this.getLinearRegressionLine(seg2);

        const y1_end = line1[line1.length - 1].value;
        const y2_start = line2Raw[0].value;
        const delta = y1_end - y2_start;

        const line2 = line2Raw.map(p => ({ rank: p.rank, value: p.value + delta }));

        const combinedLine = [
            ...line1,
            ...line2.slice(1) 
        ];

        return combinedLine;
    }

    getNonContinuousRegressionLine(data) {
        if (data.length < 4) return [];

        const seg1 = data.slice(0, 3);
        const seg2 = data.slice(2, 5);

        const line1 = this.getLinearRegressionLine(seg1);
        const line2 = this.getLinearRegressionLine(seg2);

        const combinedLine = [
            ...line1,
            ...line2 
        ];

        return combinedLine;
    }




    renderChart(attribute, funcType) {
        const data = this.getScatterData(attribute);
        let regressionLine = [];
        if (funcType === 'Linear') {
            regressionLine = this.getLinearRegressionLine(data);
        } else if (funcType === 'Non-linear') {
            regressionLine = this.getQuadraticRegressionLine(data);
        } else if (funcType === 'Continuous') {
            regressionLine = this.getContinuousRegressionLine(data);
        } else if (funcType === 'Discontinuous') {
            regressionLine = this.getNonContinuousRegressionLine(data);
        }


        return (
            <div style={{ width: '200px', height: '150px' }}>
                <ScatterChart width={200} height={150}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                        type="number"
                        dataKey="rank"
                        name="Rank"
                        domain={[1, 5]}
                        tickCount={5}
                        label={{ value: "Rank", position: "insideBottomRight", offset: -5 }}
                    />
                    <YAxis
                        type="number"
                        dataKey="value"
                        name={attribute}
                        label={{ value: attribute, angle: -90, position: "insideLeft" }}
                    />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                    <Scatter name={attribute} data={data} fill="#8884d8" />
                    {regressionLine.length > 0 && (
                        <Scatter
                            name="Regression"
                            data={regressionLine}
                            line={{ stroke: funcType === 'Linear' ? '#ff7300' : '#00b300', strokeWidth: 2 }}
                            fill="none"
                        />
                    )}
                </ScatterChart>
            </div>
        );
    }

    render() {
        const { ranking, attributes, functions } = this.state;

        return (
            <div style={{ display: 'flex', minHeight: '100vh' }}>
                <div
                    style={{
                        width: '280px',
                        backgroundColor: '#f5f5f5',
                        borderRight: '2px solid #ccc',
                        padding: '1.5rem',
                    }}
                >
                    <h2 style={{ marginBottom: '1rem' }}>Ranking</h2>
                    <ol style={{ listStyleType: 'decimal', paddingLeft: '1.5rem' }}>
                        {ranking.map((item, index) => (
                            <li
                                key={index}
                                style={{
                                    backgroundColor: 'white',
                                    border: '1px solid #ddd',
                                    borderRadius: '8px',
                                    padding: '0.5rem',
                                    marginBottom: '0.5rem',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                }}
                            >
                                <strong>ID:</strong> {item.id}
                            </li>
                        ))}
                    </ol>
                </div>

                <div style={{ flexGrow: 1, padding: '2rem' }}>
                    <h1>ASF Dashboard</h1>
                    <div style={{ overflowX: 'auto', marginTop: '2rem' }}>
                        <table
                            style={{
                                width: '100%',
                                borderCollapse: 'collapse',
                                textAlign: 'center',
                            }}
                        >
                            <thead>
                                <tr>
                                    <th
                                        style={{
                                            borderBottom: '2px solid #ccc',
                                            textAlign: 'left',
                                            padding: '0.75rem',
                                        }}
                                    >
                                        Attribute
                                    </th>
                                    {functions.map((func, index) => (
                                        <th
                                            key={index}
                                            style={{
                                                borderBottom: '2px solid #ccc',
                                                padding: '0.75rem',
                                            }}
                                        >
                                            {func}
                                        </th>
                                    ))}
                                </tr>
                            </thead>

                            <tbody>
                                {attributes.map((attr, rowIndex) => (
                                    <tr key={rowIndex}>
                                        <td
                                            style={{
                                                borderBottom: '1px solid #ddd',
                                                textAlign: 'left',
                                                padding: '0.75rem',
                                                fontWeight: 'bold',
                                            }}
                                        >
                                            {attr}
                                        </td>

                                        {functions.map((func, colIndex) => (
                                            <td
                                                key={colIndex}
                                                style={{
                                                    borderBottom: '1px solid #ddd',
                                                    borderLeft: '1px solid #eee',
                                                    padding: '0.75rem',
                                                    height: '170px',
                                                    backgroundColor: '#fafafa',
                                                }}
                                            >
                                                {this.renderChart(attr, func)}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    }
}

export default ASFDashboard;
