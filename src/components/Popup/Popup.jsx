import React, { useEffect } from "react";
import styles from "./Popup.module.css";

const Popup = ({
  isPopupOpened,
  setIsPopupOpened,
  forbidClosing = false,
  children,
  className,
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !forbidClosing) {
        setIsPopupOpened(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [forbidClosing]);

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
