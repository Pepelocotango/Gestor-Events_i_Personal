import React, { useLayoutEffect, useRef, forwardRef, useImperativeHandle } from 'react';

type AutosizeTextAreaProps = React.DetailedHTMLProps<
  React.TextareaHTMLAttributes<HTMLTextAreaElement>,
  HTMLTextAreaElement
>;

const AutosizeTextarea = forwardRef<HTMLTextAreaElement, AutosizeTextAreaProps>(
  (props, ref) => {
    const innerRef = useRef<HTMLTextAreaElement>(null);

    // Exposar la ref interna a la ref externa si existeix
    useImperativeHandle(ref, () => innerRef.current as HTMLTextAreaElement);

    useLayoutEffect(() => {
      if (innerRef.current) {
        const textarea = innerRef.current;
        // Reset height to recalculate scrollHeight
        textarea.style.height = 'auto';
        // Set height to scrollHeight to fit content
        textarea.style.height = `${textarea.scrollHeight}px`;
      }
    }, [props.value]); // La dependència de value garanteix que s'executi en cada canvi de text

    return (
      <textarea 
        ref={innerRef} 
        {...props} 
        style={{ ...props.style, overflow: 'hidden' }} // Evitem scrollbars interns mentre s'ajusta
      />
    );
  }
);

AutosizeTextarea.displayName = 'AutosizeTextarea';

export default AutosizeTextarea;
