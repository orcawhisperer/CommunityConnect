require('dotenv').config({ path: '../.env' }); // Ensure .env is loaded from the backend directory
const app = require('./app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
