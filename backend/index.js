require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;

// --- SEKCJA DIAGNOSTYCZNA ---
// Sprawdzamy, czy klucz API został wczytany.
if (!process.env.GEMINI_API_KEY) {
  console.error('❌ KRYTYCZNY BŁĄD: Brak klucza GEMINI_API_KEY w zmiennych środowiskowych!');
} else {
  console.log('✅ Klucz API Gemini został wczytany.');
}
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// --- KONIEC SEKCJI DIAGNOSTYCZNEJ ---


app.use(cors());
app.use(express.json());


app.get('/', (req, res) => res.send('Serwer działa!'));
app.get('/api/pytania', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM "Pytania" ORDER BY pytanie_id');
    res.json(rows);
  } catch (err) {
    console.error('Błąd pobierania pytań:', err);
    res.status(500).json({ error: 'Błąd serwera.' });
  }
});


// Zaktualizowany endpoint sprawdzania odpowiedzi z pełnym logowaniem
app.post('/api/sprawdz-odpowiedz', async (req, res) => {
  console.log('\n--- Odebrano zapytanie /api/sprawdz-odpowiedz ---');
  const { pytanieId, odpowiedzUzytkownika } = req.body;
  console.log(`[LOG] ID Pytania: ${pytanieId}, Odpowiedź: "${odpowiedzUzytkownika}"`);

  try {
    console.log('[LOG] Krok 1: Pobieranie danych z bazy...');
    const wzorcoweResult = await db.query('SELECT tresc_odpowiedzi FROM "Odpowiedzi" WHERE pytanie_id = $1', [pytanieId]);
    const pytanieResult = await db.query('SELECT tresc FROM "Pytania" WHERE pytanie_id = $1', [pytanieId]);
    console.log('[LOG] Krok 1: Dane z bazy pobrane pomyślnie.');

    const wzorcoweOdpowiedzi = wzorcoweResult.rows;
    const pytanieTresc = pytanieResult.rows;

    const modelName = "gemini-2.5-flash"; 
    console.log(`[LOG] Krok 2: Przygotowywanie promptu dla modelu ${modelName}...`);
    const model = genAI.getGenerativeModel({ model: modelName });
    const prompt = `
      Jesteś surowym, ale sprawiedliwym egzaminatorem w konkursie wiedzy o historii Bielska-Białej. Twoim zadaniem jest ocena odpowiedzi użytkownika.
      KONTEKST:
      - Pytanie: "${pytanieTresc[0].tresc}"
      - Wzorcowe, poprawne informacje to: "${wzorcoweOdpowiedzi.map(o => o.tresc_odpowiedzi).join(', ')}"
      - Odpowiedź użytkownika do oceny: "${odpowiedzUzytkownika}"
      ZADANIE:
      Zwróć odpowiedź TYLKO w formacie JSON.
      STRUKTURA JSON: {"ocena": "poprawna" | "częściowo poprawna" | "błędna", "komentarz": "Uzasadnienie.", "brakujace_informacje": ["Lista braków."]}
    `;
    console.log('[LOG] Krok 2: Prompt przygotowany.');

    console.log('[LOG] Krok 3: Wysyłanie zapytania do Gemini API...');
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    console.log('[LOG] Krok 3: Otrzymano odpowiedź od Gemini!');
    
    console.log('[LOG] Krok 4: Parsowanie odpowiedzi JSON...');
    const firstBracket = text.indexOf('{');
    const lastBracket = text.lastIndexOf('}');
    const jsonText = text.substring(firstBracket, lastBracket + 1);
    const parsedJson = JSON.parse(jsonText);
    console.log('[LOG] Krok 4: Parsowanie zakończone sukcesem.');
    
    console.log('[LOG] Krok 5: Wysyłanie odpowiedzi do frontendu...');
    res.json(parsedJson);
    console.log('--- Zakończono przetwarzanie zapytania pomyślnie ---');

  } catch (error) {
    console.error("❌ BŁĄD KRYTYCZNY podczas sprawdzania odpowiedzi:", error);
    res.status(500).json({ error: "Wystąpił wewnętrzny błąd serwera." });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Serwer uruchomiony na porcie ${PORT}`);
});

