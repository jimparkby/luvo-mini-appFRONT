import { API_URL } from "@/constants";
import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "@/utils/axios.util";

export const useRating = (status = null) => {
  return useQuery({
    queryKey: ["rating", status],
    queryFn: async () => {
      const params = status ? `?status=${status}` : '';
      const { data } = await axiosInstance.get(`${API_URL}/interactions/top${params}`);
      return data;
    },
  });
};
