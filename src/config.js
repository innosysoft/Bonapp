const config = {
  API_URL: process.env.NODE_ENV === 'production' 
    ? 'https://api.bonapp.dev' 
    : 'https://api.bonapp.dev'
};

export default config;
