import { useState, useEffect } from "react";
import { useFeeds } from "../api/feed";

const BATCH_SIZE = 10;

export const useFeedBuffer = () => {
  const [cards, setCards] = useState([]);
  const [offset, setOffset] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const { data, isLoading, isFetching } = useFeeds(BATCH_SIZE, offset);

  useEffect(() => {
    if (data?.length) {
      setCards((prev) => [...prev, ...data]);
      // Если получили меньше, чем запрашивали - это конец
      if (data.length < BATCH_SIZE) {
        setHasMore(false);
      }
    } else if (data?.length === 0) {
      setHasMore(false);
    }
  }, [data]);

  useEffect(() => {
    const isAtEnd = currentIndex === cards.length - 1;
    if (isAtEnd && !isFetching && hasMore) {
      setOffset((prev) => prev + BATCH_SIZE);
    }
  }, [currentIndex, cards.length, isFetching, hasMore]);

  // Функция для обновления is_liked в карточке
  const updateCardLikeStatus = (userId, isLiked) => {
    setCards((prev) =>
      prev.map((card) =>
        card.user_id === userId ? { ...card, is_liked: isLiked } : card
      )
    );
  };

  return {
    cards,
    currentIndex,
    setCurrentIndex,
    isLoading: isLoading && cards.length === 0,
    hasMore,
    updateCardLikeStatus,
  };
};
