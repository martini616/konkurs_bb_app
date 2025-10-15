const { Pool } = require('pg');
require('dotenv').config();

// Ta konfiguracja automatycznie użyje zmiennej DATABASE_URL,
// którą dostarczy nam Render. Nie musimy nic więcej robić!
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Jeśli Render będzie wymagał połączenia SSL (co jest standardem)
  ssl: {
    rejectUnauthorized: false
  }
});

// Eksportujemy pulę połączeń
module.exports = {
  query: (text, params) => pool.query(text, params),
};
    
