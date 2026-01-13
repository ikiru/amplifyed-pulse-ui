import React from "react";

/**
 * MessageInputBar
 * 
 * Reusable message input form for both TrainerView and AudienceInput.
 * Provides a text input and submit button.
 * 
 * @param {object} props
 * @param {string} props.value - Current input value
 * @param {function} props.onChange - Handler for input changes
 * @param {function} props.onSubmit - Handler for form submission
 * @param {string} props.placeholder - Input placeholder text
 */
export function MessageInputBar({
  value,
  onChange,
  onSubmit,
  placeholder = "Type a message...",
}) {
  return (
    <form className="message-input-bar" onSubmit={onSubmit}>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
      <button type="submit">Send</button>
    </form>
  );
}
