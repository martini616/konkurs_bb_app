require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const express = require('express');
const cors = require('cors');
const db = require('./db'); // Importujemy nowe połączenie

const app = express();
// Render sam ustawi port w zmiennej środowiskowej
const PORT = process.env.PORT || 3001; 
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.send('Serwer działa!'));

app.get('/api/pytania', async (req, res) => {
  try {
    // Składnia PostgreSQL jest taka sama, ale zmieniamy sposób wywołania
    const { rows } = await db.query('SELECT * FROM "Pytania" ORDER BY pytanie_id');
    res.json(rows);
  } catch (err) {
    console.error('Błąd pobierania pytań:', err);
    res.status(500).json({ error: 'Błąd serwera.' });
  }
});

// --- NOWY ENDPOINT DO TESTOWANIA POŁĄCZENIA Z BAZĄ ---
app.get('/api/test-db', async (req, res) => {
  console.log('--- Rozpoczynam test połączenia z bazą danych... ---');
  try {
    // Wykonaj proste zapytanie, które zawsze powinno działać
    const result = await db.query('SELECT NOW()');
    
    // Jeśli zapytanie się powiodło, wyślij komunikat o sukcesie
    console.log('✅ Połączenie z bazą danych jest POPRAWNE!');
    res.status(200).json({ 
      status: 'Sukces', 
      message: 'Połączenie z bazą danych działa poprawnie.',
      czasSerweraBazy: result.rows[0].now 
    });
  } catch (err) {
    // Jeśli wystąpił błąd, wyślij szczegółowe informacje
    console.error('❌ BŁĄD KRYTYCZNY: Nie można połączyć się z bazą danych!', err);
    res.status(500).json({ 
      status: 'Błąd', 
      message: 'Nie udało się połączyć z bazą danych.',
      errorDetails: err.message
    });
  }
});

app.post('/api/sprawdz-odpowiedz', async (req, res) => {
  const { pytanieId, odpowiedzUzytkownika } = req.body;
  try {
    // Zmiana składni z "?" na "$1" dla zapytań parametryzowanych w PostgreSQL
    const wzorcoweResult = await db.query('SELECT tresc_odpowiedzi FROM "Odpowiedzi" WHERE pytanie_id = $1', [pytanieId]);
    const pytanieResult = await db.query('SELECT tresc FROM "Pytania" WHERE pytanie_id = $1', [pytanieId]);
    
    const wzorcoweOdpowiedzi = wzorcoweResult.rows;
    const pytanieTresc = pytanieResult.rows;

    // ... (reszta kodu z Gemini bez zmian) ...

  } catch (error) {
    // ... (obsługa błędów bez zmian) ...
  }
});

app.listen(PORT, () => {
  console.log(`✅ Serwer uruchomiony na porcie ${PORT}`);
});