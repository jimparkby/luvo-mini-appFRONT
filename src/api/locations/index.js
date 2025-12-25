import { API_URL } from "@/constants";
import { queryClient } from "@/main";
import { axiosInstance } from "@/utils/axios.util";
import { useMutation, useQuery } from "@tanstack/react-query";

export const useCountries = () => {
  return useQuery({
    queryKey: ["locations", "countries"],
    queryFn: async () => {
      const { data } = await axiosInstance.get(
        `${API_URL}/locations/countries`
      );
      return data;
    },
  });
};

export const useCities = (country) => {
  return useQuery({
    queryKey: ["locations", "cities", country],
    queryFn: async () => {
      if (!country) return [];
      const { data } = await axiosInstance.get(
        `${API_URL}/locations/cities?country=${encodeURIComponent(country)}`
      );
      return data;
    },
    enabled: !!country,
  });
};

export const useDistricts = (country, city) => {
  return useQuery({
    queryKey: ["locations", "districts", country, city],
    queryFn: async () => {
      if (!country || !city) return [];
      const { data } = await axiosInstance.get(
        `${API_URL}/locations/districts?country=${encodeURIComponent(
          country
        )}&city=${encodeURIComponent(city)}`
      );
      return data;
    },
    enabled: !!country && !!city,
  });
};

export const useUpdateUserLocation = () => {
  return useMutation({
    mutationFn: (locationData) =>
      axiosInstance.put(`${API_URL}/users/me/location`, locationData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["userLocation"] });
    },
  });
};
