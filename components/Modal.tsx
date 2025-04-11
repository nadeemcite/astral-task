import React from "react";

interface ModalProps {
  isOpen: boolean;
  onClose?: () => void;
  title?: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div
          className="fixed inset-0 bg-black opacity-50 pl-4 text-xl"
          onClick={onClose}
        ></div>

        <div className="relative bg-white rounded-lg shadow-xl p-6 z-10">
          <div className="flex justify-between items-center mb-4">
            {title && (
              <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
            )}
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 focus:outline-none"
              aria-label="Close modal"
            >
              &times;
            </button>
          </div>

          <div>{children}</div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
