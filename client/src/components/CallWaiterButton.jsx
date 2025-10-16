import api from "../api/http";

export default function CallWaiterButton({ tableId }) {
    const call =async () => {
        try{
            await api.post('/api/tables/call-waiter', { tableId: tableId });
            alert('A waiter has been notified and will assist you shortly.');
        }catch (err) {
            alert('Could not notify waiter. Please try again.');
        }
    }
    return <button onClick={call} style={btn}>Call Waiter</button>
}

// Add styles as needed
const btn = {padding: '10px 14px', borderRadius: 8, border: '1px solid #333', cursor: 'pointer'};