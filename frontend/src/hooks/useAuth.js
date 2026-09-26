import { useSelector } from 'react-redux';

const useAuth = () => {
  const { user, accessToken, role, isAuthenticated, loading, error } = useSelector(
    (state) => state.auth
  );

  return {
    user,
    accessToken,
    role,
    isAuthenticated,
    loading,
    error,
  };
};

export default useAuth;
