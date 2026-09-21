export const checkIdentity = async () => {
  const response = await fetch(`${import.meta.env.VITE_API_PATH}/auth/check-identity`, {
    method: 'GET',
    credentials: 'include'
  });
  const data = await response.json();
  console.log(data)
  return data;
};

  
