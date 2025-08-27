import React, { ReactElement } from 'react';

interface TooltipProps {
  text: string;
  children: ReactElement;
}

const Tooltip: React.FC<TooltipProps> = ({ text, children }) => {
  // En lloc de clonar, embolcallem el fill amb un contenidor.
  // Això ens dóna un control total sobre el context de solapament.
  return (
    <div className="relative inline-block isolate">
      {children}
      <span className="tooltip-text">
        {text}
      </span>
    </div>
  );
};

export default Tooltip;
