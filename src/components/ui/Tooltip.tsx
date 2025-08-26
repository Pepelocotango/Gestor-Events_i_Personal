import React, { cloneElement, ReactElement } from 'react';

interface TooltipProps {
  text: string;
  children: ReactElement;
}

const Tooltip: React.FC<TooltipProps> = ({ text, children }) => {
  const childWithTooltip = cloneElement(children, {
    'data-tooltip-text': text,
    className: `${children.props.className || ''} has-tooltip`.trim(),
  });

  return childWithTooltip;
};

export default Tooltip;
