import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const PriceHistoryChart = ( { selectedVersion, priceHistory } ) => {
    if ( !Array.isArray( priceHistory ) || priceHistory.length === 0 ) {
        return <p className="text-white">No price history available for this version.</p>;
    }

    // ✅ Ensure data is sorted and formatted correctly
    const today = new Date().toISOString().split( "T" )[ 0 ]; // Get today's date

    const formattedData = priceHistory.map( entry => ( {
        date: new Date( entry.date ).toISOString().split( "T" )[ 0 ], // Standardize date
        price: entry.price
    } ) )
        .sort( ( a, b ) => new Date( a.date ) - new Date( b.date ) );

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
                    <Line type="monotone" dataKey="price" stroke="#40c528" />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

export default PriceHistoryChart;
