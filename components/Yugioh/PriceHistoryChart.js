import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function PriceHistoryChart( { priceHistory = [] } ) {
    if ( !Array.isArray( priceHistory ) || priceHistory.length === 0 ) {
        return <p className="text-center text-gray-400">No price history available.</p>;
    }

    return (
        <ResponsiveContainer className={ "glass text-shadow align-middle" } width="100%" height={ 350 }>
            <LineChart data={ priceHistory }>
                <XAxis dataKey="date" tick={ { fill: "white" } } />
                <YAxis tick={ { fill: "white" } } />
                <Tooltip />
                <Line type="monotone" dataKey="price" stroke="#8884d8" />
            </LineChart>
        </ResponsiveContainer>
    );
}
