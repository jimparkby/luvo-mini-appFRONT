import { useState, useEffect, useRef } from "react";
import { useFeeds } from "../api/feed";

const BATCH_SIZE = 10;

export const useFeedBuffer = () => {
  const [cards, setCards] = useState([]);
  const [offset, setOffset] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hasMoreCards, setHasMoreCards] = useState(true);
  const isFirstLoad = useRef(true);
  const seenUserIds = useRef(new Set()); // Отслеживаем просмотренных пользователей

  // При первой загрузке передаем refresh=true, потом false
  const refresh = offset === 0 && isFirstLoad.current;
  const { data, isLoading, isFetching } = useFeeds(BATCH_SIZE, offset, refresh);

  useEffect(() => {
    if (data?.length) {
      // Фильтруем дубликаты на клиенте
      const uniqueCards = data.filter(card => {
        if (seenUserIds.current.has(card.user_id)) {
          return false; // Пропускаем дубликаты
        }
        seenUserIds.current.add(card.user_id);
        return true;
      });

      if (uniqueCards.length > 0) {
        setCards((prev) => [...prev, ...uniqueCards]);
      }

      // Если получили меньше карточек, чем запрашивали, значит больше нет
      if (data.length < BATCH_SIZE) {
        setHasMoreCards(false);
      } else if (uniqueCards.length === 0) {
        // Если все карточки были дубликатами, запрашиваем следующую порцию
        setOffset((prev) => prev + BATCH_SIZE);
      }

      // После первой загрузки ставим флаг в false
      if (isFirstLoad.current) {
        isFirstLoad.current = false;
      }
    } else if (data?.length === 0) {
      // Если получили пустой массив, больше карточек нет
      setHasMoreCards(false);
      // После первой загрузки ставим флаг в false
      if (isFirstLoad.current) {
        isFirstLoad.current = false;
      }
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
