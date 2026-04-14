export const isDev = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV || (process.defaultApp || /node_modules[\\/]electron[\\/]dist[\\/]/.test(process.execPath));
