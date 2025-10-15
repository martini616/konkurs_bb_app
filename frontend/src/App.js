import React, { useState, useEffect } from 'react';
import './App.css';

// --- NOWA, BEZPIECZNA OBSŁUGA URL ---
// Bierzemy adres ze zmiennej, a na wszelki wypadek usuwamy ostatni ukośnik, jeśli istnieje.
const API_BASE_URL = (process.env.REACT_APP_API_URL || 'http://localhost:3001').replace(/\/$/, "");

function App() {
  const [pytania, setPytania] = useState([]);
  const [aktualnePytanieIndex, setAktualnePytanieIndex] = useState(0);
  
  const [odpowiedz, setOdpowiedz] = useState('');
  const [wynik, setWynik] = useState(null);
  const [ladowanie, setLadowanie] = useState(false);
  
  const [punkty, setPunkty] = useState(0);

  useEffect(() => {
    // Używamy nowej, bezpiecznej zmiennej
    fetch(`${API_BASE_URL}/api/pytania`)
      .then(response => response.json())
      .then(data => {
        // --- POCZĄTEK ZMIANY ---
        // Filtrujemy dane, aby zostawić tylko pytania z odpowiedzią pojedynczą
        const pytaniaPojedyncze = data.filter(p => p.typ_odpowiedzi === 'pojedyncza');
        setPytania(pytaniaPojedyncze);
        // --- KONIEC ZMIANY ---
      })
      .catch(error => console.error('Błąd pobierania danych:', error));
  }, []);

  const handleSprawdzOdpowiedz = async () => {
    if (!odpowiedz.trim()) {
      alert('Wpisz odpowiedź!');
      return;
    }

    setLadowanie(true);
    setWynik(null);

    const aktualnePytanie = pytania[aktualnePytanieIndex];

    try {
      const response = await fetch(`${API_BASE_URL}/api/sprawdz-odpowiedz`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pytanieId: aktualnePytanie.pytanie_id,
          odpowiedzUzytkownika: odpowiedz,
        }),
      });
      const data = await response.json();
      setWynik(data);

      if (data.ocena === 'poprawna') {
        setPunkty(prevPunkty => prevPunkty + aktualnePytanie.punkty);
      } else if (data.ocena === 'częściowo poprawna') {
        setPunkty(prevPunkty => prevPunkty + Math.ceil(aktualnePytanie.punkty / 2));
      }

    } catch (error) {
      console.error("Błąd sprawdzania odpowiedzi:", error);
      alert("Wystąpił błąd komunikacji z serwerem.");
    } finally {
      setLadowanie(false);
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
        <div className="naglowek-info">
          <h1>Pytanie #{aktualnePytanieIndex + 1} / {pytania.length}</h1>
          <h2 className="punkty-info">Zdobyte punkty: {punkty}</h2>
        </div>
        
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
            disabled={wynik !== null}
          />
          
          {wynik ? (
            <button className="sprawdz-button" onClick={handleNastepnePytanie}>Następne pytanie</button>
          ) : (
            <button className="sprawdz-button" onClick={handleSprawdzOdpowiedz} disabled={ladowanie}>
              {ladowanie ? 'Sprawdzanie...' : 'Sprawdź'}
            </button>
          )}
        </div>

        {wynik && (
          <div className="wynik-container">
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


