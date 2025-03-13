// components\Yugioh\PriceHistoryChart.js
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function PriceHistoryChart( { priceHistory } ) {
    if ( !Array.isArray( priceHistory ) || priceHistory.length === 0 ) {
        return <p className="text-white">Loading price history...</p>;
    }

    // Format data for better display
    const formattedData = priceHistory.map( entry => ( {
        date: new Date( entry.date ).toLocaleDateString(),
        price: entry.price,
    } ) );

    return (
        <ResponsiveContainer className={ " text-black" } width="100%" height={ 450 }>
            <LineChart data={ formattedData }>
                <XAxis dataKey="date" tick={ { fill: "white" } } />
                <YAxis tick={ { fill: "white" } } />
                <Tooltip />
                <Line type="monotone" dataKey="price" stroke="#40c528" />
            </LineChart>
        </ResponsiveContainer>
    );
}