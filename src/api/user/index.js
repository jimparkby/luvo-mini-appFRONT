import { API_URL } from "@/constants";
import { queryClient } from "@/main";
import { axiosInstance } from "@/utils/axios.util";
import { useMutation, useQuery } from "@tanstack/react-query";

export const useCreateUser = () =>
  useMutation({
    mutationFn: (body) =>
      axiosInstance.post(`${API_URL}/users/`, body, {
        headers: { "Content-Type": "multipart/form-data" },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

export const useUser = () => {
  return useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const { data } = await axiosInstance.get(`${API_URL}/users/me`);
      return data;
    },
  });
};

export const useUpdateUser = () => {
  return useMutation({
    mutationFn: (body) => axiosInstance.put(`${API_URL}/users/me`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
};

export const useOtherUser = (id) => {
  return useQuery({
    queryKey: ["users", "other", id],
    queryFn: async () => {
      const { data } = await axiosInstance.get(`${API_URL}/users/${id}`);
      return data;
    },
  });
};

export const useVerifyFace = () =>
  useMutation({
    mutationFn: async (file) => {
      const formData = new FormData();
      formData.append("photo", file);
      const { data } = await axiosInstance.post(
        `${API_URL}/photos/verify-face`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      return data;
    },
  });

export const useCreateUserPhoto = () =>
  useMutation({
    mutationFn: (body) =>
      axiosInstance.post(`${API_URL}/photos/`, body, {
        headers: { "Content-Type": "multipart/form-data" },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["photos"] });
    },
  });

export const useUserPhotos = () => {
  return useQuery({
    queryKey: ["photos"],
    queryFn: async () => {
      const { data } = await axiosInstance.get(`${API_URL}/photos/`);
      return data;
    },
  });
};

export const useDeleteUserPhoto = () =>
  useMutation({
    mutationFn: (photoId) =>
      axiosInstance.delete(`${API_URL}/photos/${photoId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["photos"] });
    },
  });
