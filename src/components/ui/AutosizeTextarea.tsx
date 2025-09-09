import React, { useLayoutEffect, useRef } from 'react';

type AutosizeTextAreaProps = React.DetailedHTMLProps<
  React.TextareaHTMLAttributes<HTMLTextAreaElement>,
  HTMLTextAreaElement
>;

const AutosizeTextarea: React.FC<AutosizeTextAreaProps> = (props) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      // Reset height to recalculate scrollHeight
      textarea.style.height = 'auto';
      // Set height to scrollHeight to fit content
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [props.value]); // Dependency on value ensures it runs on every content change

  return <textarea ref={textareaRef} {...props} />;
};

export default AutosizeTextarea;
