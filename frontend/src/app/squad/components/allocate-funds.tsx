import React from "react";

interface AllocateFundsProps {
  isOpen: boolean;
  onCloseAction: () => void;
  totalBudget: number;
}

const AllocateFunds: React.FC<AllocateFundsProps> = ({ isOpen, onCloseAction, totalBudget }) => {
  if (!isOpen) return null;

  return (
    <div className="allocate-funds-drawer">
      <div className="header">
        <h2>Allocate Funds</h2>
        <button onClick={onCloseAction}>Close</button>
      </div>
      <div className="content">
        <p>Total Budget: {totalBudget}</p>
        {/* Add allocation UI here */}
      </div>
    </div>
  );
};

export default AllocateFunds;