import { API_URL } from "@/constants";
import { queryClient } from "@/main";
import { axiosInstance } from "@/utils/axios.util";
import { useMutation, useQuery } from "@tanstack/react-query";

export const useLiked = () =>
  useMutation({
    mutationFn: (userId) =>
      axiosInstance.post(`${API_URL}/interactions/like/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feeds"] });
    },
  });

export const useFeeds = (limit = 5, offset = 0, refresh = false) => {
  return useQuery({
    queryKey: ["feeds", offset, limit, refresh],
    queryFn: async () => {
      const { data } = await axiosInstance.get(`${API_URL}/feed/`, {
        params: { limit, offset, refresh },
      });
      return data;
    },
    staleTime: 0,
    gcTime: 0,
  });
};

export const useFeedView = () =>
  useMutation({
    mutationFn: (userId) =>
      axiosInstance.post(`${API_URL}/interactions/view/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feeds"] });
    },
  });
