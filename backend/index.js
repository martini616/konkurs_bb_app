// --- Konfiguracja na samej górze ---
require('dotenv').config(); // Ładuje zmienne z pliku .env
const { GoogleGenerativeAI } = require('@google/generative-ai');

// --- Importy ---
const express = require('express');
const cors = require('cors');
const db = require('./db');

// --- Inicjalizacja ---
const app = express();
const PORT = 3001;
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY); // Inicjalizacja AI z kluczem

// --- Middleware ---
app.use(cors());
app.use(express.json());


// --- Endpointy API ---

// Endpoint testowy
app.get('/', (req, res) => res.send('Serwer działa!'));

// Endpoint do pobierania pytań
app.get('/api/pytania', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM Pytania ORDER BY pytanie_id');
    res.json(rows);
  } catch (err) {
    console.error('Błąd pobierania pytań:', err);
    res.status(500).json({ error: 'Błąd serwera.' });
  }
});

// --- NOWY ENDPOINT DO SPRAWDZANIA ODPOWIEDZI ---
app.post('/api/sprawdz-odpowiedz', async (req, res) => {
  // 1. Odbierz dane wysłane z frontendu
  const { pytanieId, odpowiedzUzytkownika } = req.body;

  try {
    // 2. Pobierz z naszej bazy wzorcowe odpowiedzi dla tego pytania
    const [wzorcoweOdpowiedzi] = await db.query('SELECT tresc_odpowiedzi FROM Odpowiedzi WHERE pytanie_id = ?', [pytanieId]);
    const [pytanieTresc] = await db.query('SELECT tresc FROM Pytania WHERE pytanie_id = ?', [pytanieId]);

    if (pytanieTresc.length === 0) {
      return res.status(404).json({ error: 'Nie znaleziono pytania.' });
    }
    
    // 3. Przygotuj prompt (instrukcję) dla AI
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = `
      Jesteś surowym, ale sprawiedliwym egzaminatorem w konkursie wiedzy o historii Bielska-Białej. Twoim zadaniem jest ocena odpowiedzi użytkownika.

      KONTEKST:
      - Pytanie: "${pytanieTresc[0].tresc}"
      - Wzorcowe, poprawne informacje to: "${wzorcoweOdpowiedzi.map(o => o.tresc_odpowiedzi).join(', ')}"
      - Odpowiedź użytkownika do oceny: "${odpowiedzUzytkownika}"

      ZADANIE:
      Przeanalizuj odpowiedź użytkownika i zwróć swoją ocenę. Twoja odpowiedź MUSI być poprawnym obiektem JSON i niczym więcej. Nie dodawaj żadnych znaków przed ani po obiekcie JSON, ani żadnych wyjaśnień.

      STRUKTURA JSON:
      {
        "ocena": "poprawna" | "częściowo poprawna" | "błędna",
        "komentarz": "Krótkie, zwięzłe uzasadnienie twojej oceny w języku polskim. Wyjaśnij, dlaczego odpowiedź jest dobra lub co jest w niej nie tak.",
        "brakujace_informacje": ["tablica stringów z kluczowymi informacjami, których użytkownik nie zawarł, jeśli odpowiedź nie jest w pełni poprawna. Jeśli wszystko jest ok, zwróć pustą tablicę []"]
      }

      PRZYKŁAD ODPOWIEDZI JSON:
      {
        "ocena": "częściowo poprawna",
        "komentarz": "Użytkownik poprawnie zidentyfikował jedną postać, ale pominął drugą.",
        "brakujace_informacje": ["Podanie imienia drugiej postaci"]
      }
    `;

    // 4. Wyślij zapytanie do Gemini API
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // 5. Oczyść odpowiedź z "opakowania" Markdown i odeślij do frontendu
    try {
      // Znajdź pierwszy '{' i ostatni '}' w odpowiedzi
      const firstBracket = text.indexOf('{');
      const lastBracket = text.lastIndexOf('}');
      // Wyciągnij sam tekst JSON
      const jsonText = text.substring(firstBracket, lastBracket + 1);

      // Sparsuj oczyszczony tekst i odeślij
      res.json(JSON.parse(jsonText));

    } catch (parseError) {
      console.error("Błąd parsowania JSON od Gemini:", parseError);
      // Jeśli coś pójdzie nie tak z czyszczeniem, poinformuj frontend
      res.status(500).json({ error: "Otrzymano nieprawidłowy format odpowiedzi od AI." });
    }

  } catch (error) {
    console.error("Błąd podczas komunikacji z Gemini API:", error);
    res.status(500).json({ error: "Błąd serwera AI." });
  }
});


// Uruchomienie serwera
app.listen(PORT, () => {
  console.log(`✅ Serwer uruchomiony na http://localhost:${PORT}`);
});