import React from 'react';
import { Link } from "react-router-dom";
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

class Ranking extends React.Component {

    constructor(props) {
        super(props);

        const allData = this.props.location.state?.data || [];

        this.state = {
        items: allData.map((item, index) => ({
            ...item,
            key: `${item.itemId}-${index}`,
        })),
        };


        this.onDragEnd = this.onDragEnd.bind(this);
        this.navigateNext = this.navigateNext.bind(this);
    }

    onDragEnd(result) {
        if (!result.destination) return;
        const items = Array.from(this.state.items);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);
        this.setState({ items });
    }

    navigateNext() {
        const path = {
            pathname: '/ASFDashboard',
            state: {
                ranking: this.state.items, 
            },
        };

        this.props.history.push(path);
    }

    render() {
        const { items } = this.state;

        return (
            <>
                <div className='largeHeader'>
                    <h1 style={{display: 'inline'}}>Ranking</h1>
                    <div style={{ display: 'inline', float: 'right', marginRight: '5%' }}>
                        <button
                            className='nextButton button'
                            type="button"
                            onClick={this.navigateNext}
                        >
                            Next
                        </button>
                    </div>
                    <div style={{ display: 'inline', float: 'right', marginRight: '5%' }}>
                        <Link to={{ pathname: '/home' }}>
                            <button className='nextButton button' type="button">Back</button>
                        </Link>
                    </div>
                </div>

                <div style={{ padding: '2rem' }}>
                    <p className='text'>
                        Drag and drop the items below to rank them from <strong>least</strong> to <strong>most</strong> preferred.
                    </p>

                    <DragDropContext onDragEnd={this.onDragEnd}>
                        <Droppable droppableId="rankingList" direction="horizontal">
                            {(provided) => (
                                <div
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                    style={{
                                        display: 'flex',
                                        gap: '1rem',
                                        overflowX: 'auto',
                                        padding: '1rem',
                                        border: '1px solid #ccc',
                                        borderRadius: '12px',
                                        backgroundColor: '#f9f9f9',
                                    }}
                                >
                                    {items.map((item, index) => (
                                        <Draggable key={item.key} draggableId={item.key} index={index}>
                                            {(provided) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    {...provided.dragHandleProps}
                                                    style={{
                                                        userSelect: 'none',
                                                        padding: '1rem',
                                                        width: '220px',
                                                        border: '1px solid #ddd',
                                                        borderRadius: '12px',
                                                        backgroundColor: 'white',
                                                        boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                                                        ...provided.draggableProps.style,
                                                    }}
                                                >
                                                    <h3>ID: {item.itemId}</h3>
                                                    <p><strong>Base Rent:</strong> {item.baseRent}</p>
                                                    <p><strong>Year Constructed:</strong> {item.yearConstructed}</p>
                                                    <p><strong>Living Space:</strong> {item.livingSpace}</p>
                                                    <p><strong>Number of Rooms:</strong> {item.noRooms}</p>
                                                </div>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                    </DragDropContext>
                </div>
            </>
        );
    }
}

export default Ranking;
