import { Navigate, Route, Routes } from "react-router-dom";
import { AuthenticatedRoute, UnauthenticatedRoute } from "../components";
import {
  FeedPage,
  LikesPage,
  DuelsPage,
  RatingPage,
  LoadingPage,
  ProfilePage,
  RegistrationPage,
  OtherProfilePage,
  PrivacyPolicyPage,
} from "../pages";

export const Router = () => {
  return (
    <Routes>
      <Route element={<UnauthenticatedRoute />}>
        <Route path="/registration" element={<RegistrationPage />} />
      </Route>

      <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />

      <Route element={<AuthenticatedRoute />}>
        <Route path="/feed" element={<FeedPage />} />
        <Route path="/likes" element={<LikesPage />} />
        <Route path="/duels" element={<DuelsPage />} />
        <Route path="/rating" element={<RatingPage />} />
        <Route path="/loading" element={<LoadingPage />} />
        <Route path="/user-profile" element={<ProfilePage />} />
        <Route path="/other-profile/:id" element={<OtherProfilePage />} />

        <Route path="*" element={<Navigate to="/feed" replace />} />
      </Route>
    </Routes>
  );
};
