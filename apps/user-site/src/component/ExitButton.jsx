import { useRef, useEffect } from "react";
import { gsap } from "gsap";

function ExitButton({ onLogout }) {
  const btnRef = useRef(null);
  const arrowRef = useRef(null);

  useEffect(() => {
    const btn = btnRef.current;
    const arrow = arrowRef.current;

    const enter = () => {
      gsap.to(arrow, { x: 3, duration: 0.25, ease: "power2.out" });
      gsap.to(btn, { backgroundColor: "#eef2f6", duration: 0.2 });
    };
    const leave = () => {
      gsap.to(arrow, { x: 0, duration: 0.25, ease: "power2.out" });
      gsap.to(btn, { backgroundColor: "#f8f9fb", duration: 0.2 });
    };

    btn.addEventListener("mouseenter", enter);
    btn.addEventListener("mouseleave", leave);
    return () => {
      btn.removeEventListener("mouseenter", enter);
      btn.removeEventListener("mouseleave", leave);
    };
  }, []);

  return (
    <button
      ref={btnRef}
      onClick={onLogout}
      aria-label="Выйти из аккаунта"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 16px",
        borderRadius: 999, // единая капсула
        border: "1px solid #e1e5ea",
        background: "#f8f9fb", // светлый, не конкурирует с табами
        color: "#4a5568",
        fontSize: 14,
        fontWeight: 500,
        cursor: "pointer",
        transition: "border-color 0.2s",
        lineHeight: 1,
      }}
    >
      {/* Иконка двери со стрелкой — стандарт logout */}
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
      </svg>
      {/* Стрелка сдвигается на hover — показывает направление */}
      <svg
        ref={arrowRef}
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="5" y1="12" x2="19" y2="12" />
        <polyline points="12 5 19 12 12 19" />
      </svg>
      <span>Выйти</span>
    </button>
  );
}

export default ExitButton;
