import React, { useState, useRef, ReactElement, useLayoutEffect } from 'react';
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
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<number | null>(null);

  const handleMouseEnter = (e: React.MouseEvent) => {
    const target = e.currentTarget as HTMLElement;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = window.setTimeout(() => {
      const rect = target.getBoundingClientRect();
      // Set initial position - this will be adjusted by useLayoutEffect
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

  useLayoutEffect(() => {
    if (isVisible && tooltipRef.current) {
      const tooltipElement = tooltipRef.current;
      const tooltipRect = tooltipElement.getBoundingClientRect();

      const PADDING = 10; // 10px padding from the window edges

      let newLeft = position.left;

      // The tooltip's left edge is at `position.left - tooltipRect.width / 2` because of the CSS transform
      const tooltipVisualLeft = position.left - tooltipRect.width / 2;
      if (tooltipVisualLeft < PADDING) {
        // It's overflowing the left edge.
        // We adjust `position.left` so that the visual left edge is at PADDING.
        newLeft = PADDING + tooltipRect.width / 2;
      }

      // The tooltip's right edge is at `position.left + tooltipRect.width / 2`
      const tooltipVisualRight = position.left + tooltipRect.width / 2;
      if (tooltipVisualRight > window.innerWidth - PADDING) {
        // It's overflowing the right edge.
        // We adjust `position.left` so that the visual right edge is at `window.innerWidth - PADDING`.
        newLeft = window.innerWidth - PADDING - tooltipRect.width / 2;
      }

      if (newLeft !== position.left) {
        setPosition(prev => ({ ...prev, left: newLeft }));
      }
    }
  }, [isVisible, position.left]); // Rerun effect if visibility or horizontal position changes

  const triggerElement = React.cloneElement(children, {
    ...children.props,
    ref: childRef,
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
  });

  const tooltipContent = isVisible && (
    <div
      ref={tooltipRef}
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
