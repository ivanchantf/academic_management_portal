export const logout=async (followUp:()=>{})=>{
    try {
      await fetch(`${import.meta.env.VITE_API_PATH}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      followUp()
    }
}