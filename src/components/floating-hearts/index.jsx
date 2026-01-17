import { useEffect, useState } from "react";
import { Heart } from "lucide-react";

export function FloatingHearts() {
  const [hearts, setHearts] = useState([]);

  useEffect(() => {
    setHearts(
      Array.from({ length: 8 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 5,
        duration: 8 + Math.random() * 6,
        size: 12 + Math.random() * 16,
        opacity: 0.1 + Math.random() * 0.15,
      }))
    );
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {hearts.map((heart) => (
        <div
          key={heart.id}
          className="absolute text-red-500 animate-float-up"
          style={{
            left: `${heart.x}%`,
            bottom: "-5%",
            animationDelay: `${heart.delay}s`,
            animationDuration: `${heart.duration}s`,
            opacity: heart.opacity,
          }}
        >
          <Heart
            style={{ width: heart.size, height: heart.size }}
            fill="currentColor"
          />
        </div>
      ))}
    </div>
  );
}
