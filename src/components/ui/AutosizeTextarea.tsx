import React, { useLayoutEffect, forwardRef } from 'react';

type AutosizeTextAreaProps = React.DetailedHTMLProps<
  React.TextareaHTMLAttributes<HTMLTextAreaElement>,
  HTMLTextAreaElement
>;

const AutosizeTextarea = forwardRef<HTMLTextAreaElement, AutosizeTextAreaProps>(
  (props, ref) => {
    useLayoutEffect(() => {
      // Aquesta implementació assumeix que `ref` és un objecte ref mutable.
      // Això no està garantit per React, però és la interpretació més
      // directa de les instruccions.
      if (ref && typeof ref !== 'function' && ref.current) {
        const textarea = ref.current;
        // Reset height to recalculate scrollHeight
        textarea.style.height = 'auto';
        // Set height to scrollHeight to fit content
        textarea.style.height = `${textarea.scrollHeight}px`;
      }
    }, [props.value, ref]); // La dependència de value i ref garanteix que s'executi en cada canvi

    return <textarea ref={ref} {...props} />;
  }
);

AutosizeTextarea.displayName = 'AutosizeTextarea';

export default AutosizeTextarea;
