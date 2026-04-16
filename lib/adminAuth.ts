// Hardcoded admin credentials
const ADMIN_CREDENTIALS = {
  email: process.env.ADMIN_EMAIL || 'admin@Maids For Care.com',
  id: 'admin_hardcoded_id',
  role: 'admin',
};

export const verifyAdminToken = (token: string): any => {
  try {
    // Parse the JSON token (new format)
    const decoded = JSON.parse(token);
    
    // Check if it's the hardcoded admin
    if (decoded && decoded.id === ADMIN_CREDENTIALS.id && decoded.isHardcodedAdmin) {
      return {
        userId: ADMIN_CREDENTIALS.id,
        email: ADMIN_CREDENTIALS.email,
        role: ADMIN_CREDENTIALS.role,
        isHardcodedAdmin: true,
      };
    }
    
    return null;
  } catch (error) {
    return null;
  }
};

export const isHardcodedAdmin = (userId: string): boolean => {
  return userId === ADMIN_CREDENTIALS.id;
};