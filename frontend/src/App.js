import React, { useState, useEffect } from 'react';
import './App.css';

// Adres API bierzemy ze zmiennej środowiskowej
const API_URL = process.env.REACT_APP_API_URL;

function App() {
  const [pytania, setPytania] = useState([]);
  const [aktualnePytanieIndex, setAktualnePytanieIndex] = useState(0);
  
  // --- NOWE STANY ---
  // Do przechowywania tekstu wpisywanego przez użytkownika
  const [odpowiedz, setOdpowiedz] = useState('');
  // Do przechowywania wyniku od AI
  const [wynik, setWynik] = useState(null);
  // Do pokazywania animacji ładowania podczas sprawdzania
  const [ladowanie, setLadowanie] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/pytania`)
      .then(response => response.json())
      .then(data => setPytania(data))
      .catch(error => console.error('Błąd pobierania danych:', error));
  }, []);

  // --- NOWA FUNKCJA DO SPRAWDZANIA ---
  const handleSprawdzOdpowiedz = async () => {
    if (!odpowiedz.trim()) {
      alert('Wpisz odpowiedź!');
      return;
    }

    setLadowanie(true); // Pokaż ładowanie
    setWynik(null); // Zresetuj stary wynik

    const aktualnePytanie = pytania[aktualnePytanieIndex];

    try {
      const response = await fetch(`${API_URL}/api/sprawdz-odpowiedz`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pytanieId: aktualnePytanie.pytanie_id,
          odpowiedzUzytkownika: odpowiedz,
        }),
      });
      const data = await response.json();
      setWynik(data); // Zapisz wynik od AI w stanie
    } catch (error) {
      console.error("Błąd sprawdzania odpowiedzi:", error);
      alert("Wystąpił błąd komunikacji z serwerem.");
    } finally {
      setLadowanie(false); // Ukryj ładowanie
    }
  };

  const handleNastepnePytanie = () => {
    setWynik(null);
    setOdpowiedz('');
    setAktualnePytanieIndex(prevIndex => (prevIndex + 1) % pytania.length);
  };
  
  if (pytania.length === 0) return <div>Ładowanie...</div>;

  const aktualnePytanie = pytania[aktualnePytanieIndex];

  return (
    <div className="App">
      <header className="App-header">
        <h1>Pytanie #{aktualnePytanieIndex + 1} / {pytania.length}</h1>
        <div className="progress-bar-container">
            <div className="progress-bar" style={{ width: `${((aktualnePytanieIndex + 1) / pytania.length) * 100}%` }}></div>
        </div>
        
        <div className="pytanie-container">
          <h2 className="pytanie-tresc">{aktualnePytanie.tresc}</h2>
          <p className="pytanie-punkty">Liczba punktów: {aktualnePytanie.punkty}</p>
        </div>

        <div className="odpowiedz-container">
          <textarea 
            className="odpowiedz-input" 
            placeholder="Wpisz swoją odpowiedź..."
            value={odpowiedz}
            onChange={(e) => setOdpowiedz(e.target.value)}
            disabled={wynik !== null} // Zablokuj pole po sprawdzeniu
          />
          
          {/* Pokazujemy przycisk "Sprawdź" lub "Następne pytanie" w zależności od sytuacji */}
          {wynik ? (
            <button className="sprawdz-button" onClick={handleNastepnePytanie}>Następne pytanie</button>
          ) : (
            <button className="sprawdz-button" onClick={handleSprawdzOdpowiedz} disabled={ladowanie}>
              {ladowanie ? 'Sprawdzanie...' : 'Sprawdź'}
            </button>
          )}
        </div>

        {/* --- NOWA SEKCJA DO WYŚWIETLANIA WYNIKU --- */}
        {wynik && (
          <div className="wynik-container">
            {/* Używamy optional chaining (?.) i sprawdzamy, czy ocena istnieje */}
            {wynik.ocena ? (
              <h3>Ocena: <span className={`ocena-${wynik.ocena.replace(/\s+/g, '-')}`}>{wynik.ocena}</span></h3>
            ) : (
              <h3>Otrzymano odpowiedź od AI:</h3>
            )}
            <p><strong>Komentarz AI:</strong> {wynik.komentarz || 'Brak komentarza.'}</p>
            {wynik.brakujace_informacje && wynik.brakujace_informacje.length > 0 && (
              <div>
                <strong>Warto dodać:</strong>
                <ul>
                  {wynik.brakujace_informacje.map((info, index) => <li key={index}>{info}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}

      </header>
    </div>
  );
}

export default App;