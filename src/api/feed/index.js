import { API_URL } from "@/constants";
import { queryClient } from "@/main";
import { axiosInstance } from "@/utils/axios.util";
import { useMutation, useQuery } from "@tanstack/react-query";

export const useLiked = () =>
  useMutation({
    mutationFn: (userId) =>
      axiosInstance.post(`${API_URL}/interactions/like/${userId}`),
    onSuccess: (response, userId) => {
      // Обновляем is_liked в кеше для всех feed запросов
      queryClient.setQueriesData({ queryKey: ["feeds"] }, (oldData) => {
        if (!oldData) return oldData;

        return {
          ...oldData,
          users: oldData.users.map((user) => {
            if (user.user_id === userId) {
              return {
                ...user,
                is_liked: response.data.liked,
              };
            }
            return user;
          }),
        };
      });
    },
  });

export const useFeeds = (limit = 5, offset = 0, seed = null) => {
  return useQuery({
    queryKey: ["feeds", offset, limit, seed],
    queryFn: async () => {
      const params = { limit, offset };
      if (seed !== null) params.seed = seed;
      const { data } = await axiosInstance.get(`${API_URL}/feed/`, { params });
      return data;
    },
  });
};

export const useSuperlikeStatus = () =>
  useQuery({
    queryKey: ["superlike-status"],
    queryFn: async () => {
      const { data } = await axiosInstance.get(`${API_URL}/interactions/superlike-status`);
      return data;
    },
  });

export const useSuperLike = () =>
  useMutation({
    mutationFn: (userId) =>
      axiosInstance.post(`${API_URL}/interactions/superlike/${userId}`),
    onSuccess: (response) => {
      // Обновляем кеш статуса суперлайков
      if (response.data.superlike_remaining != null) {
        queryClient.setQueryData(["superlike-status"], (old) => {
          if (!old) return old;
          return {
            ...old,
            used: old.used + 1,
            remaining: response.data.superlike_remaining,
          };
        });
      }
    },
  });

export const useFeedView = () =>
  useMutation({
    mutationFn: (userId) =>
      axiosInstance.post(`${API_URL}/interactions/view/${userId}`),
    // Убираем invalidateQueries - просмотр не должен сбрасывать кеш ленты
  });
