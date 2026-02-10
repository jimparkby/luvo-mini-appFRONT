import { API_URL } from "@/constants";
import { axiosInstance } from "@/utils/axios.util";
import { useQuery, useMutation } from "@tanstack/react-query";

export const useProfileViews = () =>
  useQuery({
    queryKey: ["profile-views"],
    queryFn: async () => {
      const { data } = await axiosInstance.get(`${API_URL}/interactions/views`);
      return data;
    },
  });

export const useDetailedView = () =>
  useMutation({
    mutationFn: (userId) =>
      axiosInstance.post(
        `${API_URL}/interactions/view/${userId}?detailed=true`
      ),
  });
