import React, { ReactNode, useEffect } from "react";
import styles from "./Popup.module.css";

interface PopupProps {
  isPopupOpened: boolean;
  setIsPopupOpened: (value: boolean) => void;
  forbidClosing?: boolean;
  children: ReactNode;
  className?: string;
}

const Popup: React.FC<PopupProps> = ({
  isPopupOpened,
  setIsPopupOpened,
  forbidClosing = false,
  children,
  className = "",
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !forbidClosing) {
        setIsPopupOpened(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [forbidClosing, setIsPopupOpened]);

  return (
    <div
      className={`${styles.wrapper} ${isPopupOpened && styles.wrapperActive} ${className}`}
      onClick={() => {
        if (!forbidClosing) setIsPopupOpened(false);
      }}
    >
      <div
        className={styles.content}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default Popup;
