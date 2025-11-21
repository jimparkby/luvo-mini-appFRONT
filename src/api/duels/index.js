import { API_URL } from "@/constants";
import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "@/utils/axios.util";

export const useDuelPair = (winnerId, step) =>
  useQuery({
    queryKey: ["duel-pair", winnerId, step],
    queryFn: async () => {
      const { data } = await axiosInstance.get(`${API_URL}/battle/pair`, {
        params: { winner_id: winnerId },
      });
      return data;
    },
  });
