import { useState } from "react";

/**
 * Картинка с фолбэком: 404 или пустой src → плейсхолдер с первой буквой
 * названия вместо битой иконки. Повторных запросов не создаёт.
 */
export default function SafeImage({ src, alt = "", className = "", style }) {
  const [failed, setFailed] = useState(false);

  // сброс состояния при смене src
  const [prevSrc, setPrevSrc] = useState(src);
  if (src !== prevSrc) {
    setPrevSrc(src);
    setFailed(false);
  }

  if (!src || failed) {
    return (
      <div
        className={className}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          color: "#fafafa",
          fontWeight: 700,
          fontSize: 28,
          userSelect: "none",
          ...style,
        }}
        role="img"
        aria-label={alt}
        title={alt}
      >
        {alt ? alt[0].toUpperCase() : ""}
      </div>
    );
  }

  return (
    <img
      className={className}
      style={style}
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}
