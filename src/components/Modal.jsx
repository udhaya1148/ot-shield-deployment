import React from "react";

const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-gray-500 bg-opacity-50 flex justify-center items-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white p-6 rounded-lg shadow-lg max-w-3xl w-full"
        onClick={(e) => e.stopPropagation()} // Prevent click event from propagating to the overlay
      >
        {children}
      </div>
    </div>
  );
};

export default Modal;
