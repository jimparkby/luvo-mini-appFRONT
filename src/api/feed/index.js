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

        return oldData.map((user) => {
          if (user.user_id === userId) {
            return {
              ...user,
              is_liked: response.data.liked, // Используем статус из ответа
            };
          }
          return user;
        });
      });
    },
  });

export const useFeeds = (limit = 5, offset = 0) => {
  return useQuery({
    queryKey: ["feeds", offset, limit],
    queryFn: async () => {
      const { data } = await axiosInstance.get(`${API_URL}/feed/`, {
        params: { limit, offset },
      });
      return data;
    },
  });
};

export const useFeedView = () =>
  useMutation({
    mutationFn: (userId) =>
      axiosInstance.post(`${API_URL}/interactions/view/${userId}`),
    // Убираем invalidateQueries - просмотр не должен сбрасывать кеш ленты
  });
