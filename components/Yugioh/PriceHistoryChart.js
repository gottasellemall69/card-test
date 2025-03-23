import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function PriceHistoryChart( { selectedVersion, priceHistory } ) {
    if ( !Array.isArray( priceHistory ) || priceHistory.length === 0 ) {
        return <p className="text-white">No price history available for this version.</p>;
    }

    // Ensure data is sorted and formatted correctly
    const formattedData = [ ...priceHistory ]
        .map( entry => ( {
            rawDate: new Date( entry.date ), // Keep raw date for sorting
            date: new Date( entry.date ).toLocaleDateString( "en-US", { month: "short", day: "numeric" } ), // Ex: Mar 17
            price: entry.price
        } ) )
        .sort( ( a, b ) => a.rawDate - b.rawDate ); // Sort using raw dates


    return (
        <div>
            <h3 className="text-white text-lg font-bold mb-2">
                Price History for: { selectedVersion }
            </h3>
            <ResponsiveContainer className={ "text-black" } width="100%" height={ 450 }>
                <LineChart data={ formattedData }>
                    <XAxis dataKey="date" tick={ { fill: "white" } } />
                    <YAxis tick={ { fill: "white" } } />
                    <Tooltip />
                    <Line type="monotone" dataKey="price" stroke="#40c528" />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
