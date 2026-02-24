import { API_URL } from "@/constants";
import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "@/utils/axios.util";

const NO_RETRY_DETAILS = [
  "Недостаточно пользователей",
  "Для участия в батлах нужно выбрать локацию",
  "Победитель не найден",
  "Победитель из другой локации",
];

export const useDuelPair = (winnerId, step, enabled = true) =>
  useQuery({
    queryKey: ["duel-pair", winnerId, step],
    queryFn: async () => {
      const { data } = await axiosInstance.get(`${API_URL}/battle/pair`, {
        params: { winner_id: winnerId },
      });
      return data;
    },
    enabled,
    retry: (failureCount, error) => {
      if (NO_RETRY_DETAILS.includes(error?.response?.data?.detail)) {
        return false;
      }
      return failureCount < 3;
    },
  });
