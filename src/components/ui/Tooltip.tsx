import React, { useState, useRef, ReactElement } from 'react';
import ReactDOM from 'react-dom';

interface TooltipProps {
  text: string;
  children: ReactElement;
  /** Milliseconds to wait before showing the tooltip */
  delay?: number;
}

const Tooltip: React.FC<TooltipProps> = ({ text, children, delay = 500 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const childRef = useRef<HTMLElement>(null);
  const timeoutRef = useRef<number | null>(null);

  const handleMouseEnter = (e: React.MouseEvent) => {
    // Pass the element that the mouse entered to the positioning function
    const target = e.currentTarget as HTMLElement;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = window.setTimeout(() => {
      const rect = target.getBoundingClientRect();
      setPosition({
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX + rect.width / 2,
      });
      setIsVisible(true);
    }, delay);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  // We need to clone the element to attach our own refs and event handlers.
  // This is a robust way to handle different types of children.
  const triggerElement = React.cloneElement(children, {
    ...children.props,
    ref: childRef,
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
  });

  // The actual tooltip content that will be portaled.
  const tooltipContent = isVisible && (
    <div
      className="tooltip-portal"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      {text}
    </div>
  );

  return (
    <>
      {triggerElement}
      {typeof window !== 'undefined' && ReactDOM.createPortal(tooltipContent, document.body)}
    </>
  );
};

export default Tooltip;
