import { useState, useEffect, useRef } from "react";
import { useFeeds } from "../api/feed";

const BATCH_SIZE = 10;

export const useFeedBuffer = () => {
  const [cards, setCards] = useState([]);
  const [offset, setOffset] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const recommendedCountRef = useRef(null);

  const { data, isLoading, isFetching } = useFeeds(BATCH_SIZE, offset);

  useEffect(() => {
    if (data?.users?.length) {
      // Сохраняем recommended_count из первого ответа
      if (recommendedCountRef.current === null) {
        recommendedCountRef.current = data.recommended_count;
      }
      setCards((prev) => [...prev, ...data.users]);
      if (data.users.length < BATCH_SIZE) {
        setHasMore(false);
      }
    } else if (data && data.users?.length === 0) {
      if (recommendedCountRef.current === null) {
        recommendedCountRef.current = data.recommended_count;
      }
      setHasMore(false);
    }
  }, [data]);

  useEffect(() => {
    const isAtEnd = currentIndex === cards.length - 1;
    if (isAtEnd && !isFetching && hasMore) {
      setOffset((prev) => prev + BATCH_SIZE);
    }
  }, [currentIndex, cards.length, isFetching, hasMore]);

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
    recommendedCount: recommendedCountRef.current ?? 0,
  };
};
