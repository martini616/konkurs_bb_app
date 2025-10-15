// 1. Ładujemy nasz klucz API z pliku .env
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

// 2. Inicjalizujemy klienta AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 3. Główna funkcja, która pobierze i wyświetli modele
async function discoverModels() {
  console.log('--- 🚀 Rozpoczynam wyszukiwanie modeli AI ---');
  try {
    // To jest "magiczna" funkcja, o której mówił błąd
    const result = await genAI.ListModels();
    
    console.log('\n✅ Znaleziono modele, które wspierają metodę "generateContent":\n');

    // Przechodzimy przez każdy znaleziony model
    for (const model of result.models) {
      // Interesują nas tylko te modele, które potrafią generować treść (jak w naszym quizie)
      if (model.supportedGenerationMethods.includes('generateContent')) {
        // Wyświetlamy pełną nazwę modelu
        console.log(`- ${model.name}`);
      }
    }

    console.log('\n---');
    console.log('💡 Skopiuj jedną z powyższych nazw (np. models/gemini-1.5-flash-latest) i wklej ją do pliku index.js.');

  } catch (error) {
    console.error("❌ Wystąpił błąd podczas listowania modeli:", error);
  }
  console.log('--- Zakończono wyszukiwanie ---');
}

// 4. Uruchamiamy naszą funkcję
discoverModels();