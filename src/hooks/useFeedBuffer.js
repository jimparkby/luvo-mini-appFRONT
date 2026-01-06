import { useState, useEffect } from "react";
import { useFeeds } from "../api/feed";

const BATCH_SIZE = 10;

export const useFeedBuffer = () => {
  const [cards, setCards] = useState([]);
  const [offset, setOffset] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hasMoreCards, setHasMoreCards] = useState(true);

  const { data, isLoading, isFetching } = useFeeds(BATCH_SIZE, offset);

  useEffect(() => {
    if (data?.length) {
      setCards((prev) => [...prev, ...data]);
      // Если получили меньше карточек, чем запрашивали, значит больше нет
      if (data.length < BATCH_SIZE) {
        setHasMoreCards(false);
      }
    } else if (data?.length === 0) {
      // Если получили пустой массив, больше карточек нет
      setHasMoreCards(false);
    }
  }, [data]);

  useEffect(() => {
    const isAtEnd = currentIndex === cards.length - 1;
    if (isAtEnd && !isFetching && hasMoreCards) {
      setOffset((prev) => prev + BATCH_SIZE);
    }
  }, [currentIndex, cards.length, isFetching, hasMoreCards]);

  return {
    cards,
    currentIndex,
    setCurrentIndex,
    isLoading: isLoading && cards.length === 0,
    hasMoreCards,
  };
};
