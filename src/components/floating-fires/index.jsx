import { useEffect, useState } from "react";

export function FloatingFires({ onComplete }) {
  const [fires, setFires] = useState([]);

  useEffect(() => {
    // Генерируем 50-70 огоньков с разными позициями и задержками для насыщенного эффекта
    const fireCount = 50 + Math.floor(Math.random() * 21);

    setFires(
      Array.from({ length: fireCount }, (_, i) => ({
        id: i,
        x: Math.random() * 100, // От 0% до 100% ширины экрана
        delay: Math.random() * 1, // Задержка от 0 до 1 секунды для более плавного появления
        duration: 2 + Math.random() * 1, // Длительность от 2 до 3 секунд
        size: 20 + Math.random() * 24, // Размер от 20px до 44px
      }))
    );

    // Убираем эффект после завершения анимации
    const timer = setTimeout(() => {
      onComplete?.();
    }, 3500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-50">
      {fires.map((fire) => (
        <div
          key={fire.id}
          className="absolute animate-float-up-smooth"
          style={{
            left: `${fire.x}%`,
            bottom: "-5%",
            animationDelay: `${fire.delay}s`,
            animationDuration: `${fire.duration}s`,
            fontSize: `${fire.size}px`,
          }}
        >
          🔥
        </div>
      ))}
    </div>
  );
}
