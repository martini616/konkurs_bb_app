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