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
        delay: Math.random() * 0.8, // Задержка от 0 до 0.8 секунд
        duration: 1.8 + Math.random() * 1.2, // Длительность от 1.8 до 3 секунд
        size: 20 + Math.random() * 24, // Размер от 20px до 44px
        rotation: -30 + Math.random() * 60, // Вращение от -30 до 30 градусов
      }))
    );

    // Убираем эффект после завершения анимации
    const timer = setTimeout(() => {
      onComplete?.();
    }, 3200);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-50">
      {fires.map((fire) => (
        <div
          key={fire.id}
          className="absolute animate-float-up"
          style={{
            left: `${fire.x}%`,
            bottom: "-5%",
            animationDelay: `${fire.delay}s`,
            animationDuration: `${fire.duration}s`,
            fontSize: `${fire.size}px`,
            transform: `rotate(${fire.rotation}deg)`,
          }}
        >
          🔥
        </div>
      ))}
    </div>
  );
}
