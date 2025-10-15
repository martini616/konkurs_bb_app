// Importujemy sterownik mysql2
const mysql = require('mysql2');

// Tworzymy połączenie z bazą danych
// Uzupełnij te dane zgodnie ze swoją konfiguracją XAMPP
const connection = mysql.createConnection({
  host: 'localhost',      // Adres serwera bazy danych (zazwyczaj 'localhost')
  user: 'root',           // Nazwa użytkownika (domyślnie w XAMPP to 'root')
  password: '',            // Hasło (domyślnie w XAMPP jest puste)
  database: 'konkurs_wiedzy_bb' // Nazwa Twojej bazy danych
});

// Eksportujemy połączenie, aby można go było używać w innych plikach
module.exports = connection.promise();