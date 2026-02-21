"use client";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const PriceHistoryChart = ( { selectedVersion, priceHistory } ) => {
    if ( !Array.isArray( priceHistory ) || priceHistory.length === 0 ) {
        return <p className="text-white">No price history available for this version.</p>;
    }

    const today = new Date().toISOString().split( "T" )[ 0 ]; // Get today's date
    const byDay = new Map();

    priceHistory
        .map( ( entry ) => ( {
            timestamp: new Date( entry?.date ),
            price: Number( entry?.price ),
        } ) )
        .filter( ( entry ) => !Number.isNaN( entry.timestamp.getTime() ) && Number.isFinite( entry.price ) )
        .sort( ( a, b ) => a.timestamp - b.timestamp )
        .forEach( ( entry ) => {
            const day = entry.timestamp.toISOString().split( "T" )[ 0 ];
            byDay.set( day, entry.price );
        } );

    const formattedData = Array.from( byDay.entries() ).map( ( [ date, price ] ) => ( {
        date,
        price,
    } ) );

    // ✅ Ensure today's price is included
    if ( !formattedData.some( entry => entry.date === today ) ) {
        const lastPrice = formattedData.length > 0 ? formattedData[ formattedData.length - 1 ].price : null;
        if ( lastPrice !== null ) {
            formattedData.push( { date: today, price: lastPrice } ); // Carry forward latest price if no new update
        }
    }

    return (
        <div>
            <h3 className="text-white text-shadow text-lg font-bold mb-2">
                { selectedVersion }
            </h3>
            <ResponsiveContainer className={ "text-black" } width={ `100%` } height={ 450 }>
                <LineChart data={ formattedData }>
                    <XAxis
                        dataKey="date"
                        tick={ { fill: "white" } }
                        tickFormatter={ ( tick ) => new Date( tick ).toLocaleDateString( "en-US", { month: "short", day: "numeric" } ) }
                    />
                    <YAxis tick={ { fill: "white" } } />
                    <Tooltip />
                    <Line type="monotone" dataKey="price" stroke="#34d399" strokeWidth={ 2 } dot={ false } isAnimationActive={ true } />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

export default PriceHistoryChart;
