import { useState, useEffect } from "react";
import { useFeeds } from "../api/feed";

const BATCH_SIZE = 10;

export const useFeedBuffer = () => {
  const [cards, setCards] = useState([]);
  const [offset, setOffset] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);

  const { data, isLoading, isFetching } = useFeeds(BATCH_SIZE, offset);

  useEffect(() => {
    if (data?.length) {
      setCards((prev) => [...prev, ...data]);
    }
  }, [data]);

  useEffect(() => {
    const isAtEnd = currentIndex === cards.length - 1;
    if (isAtEnd && !isFetching) {
      setOffset((prev) => prev + BATCH_SIZE);
    }
  }, [currentIndex, cards.length, isFetching]);

  return {
    cards,
    currentIndex,
    setCurrentIndex,
    isLoading: isLoading && cards.length === 0,
  };
};
