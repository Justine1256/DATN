interface StatusTabsProps {
    selectedStatus: string;
    onStatusChange: (status: string) => void;
}

const StatusTabs: React.FC<StatusTabsProps> = ({ selectedStatus, onStatusChange }) => {
    const statuses = [
        'Pending Processing', 'Processing', 'Processed', 'Ready for Shipment',
        'Shipping', 'Delivered', 'Cancelled by Customer', 'Cancelled by Seller',
        'Cancelled – Payment Failed', 'Cancelled – Customer Refused Delivery',
        'Unpaid', 'Paid – Reconciliation Pending', 'Reconciled', 'Return Requested',
        'Return Approved', 'Return Rejected', 'Returning', 'Return Checking', 'Refunded',
    ];

    return (
        <div className="my-4 flex gap-4">
            {statuses.map((status) => (
                <button
                    key={status}
                    className={`px-4 py-2 rounded ${selectedStatus === status ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                    onClick={() => onStatusChange(status)}
                >
                    {status}
                </button>
            ))}
        </div>
    );
};

export default StatusTabs;
