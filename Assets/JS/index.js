let datiQuiz = [];
let indiceDomandaCorrente = 0;
let punteggio = 0;
let domandeSbagliate = [];
const numDomandeTotali = 15;

const containerQuiz = document.querySelector('.container');
const startButton = document.getElementById('start');

async function loadQuizData()
{
    try
    {
        // PERCORSO CORRETTO:
        // Usciamo da 'Subpages' con '..', entriamo in 'Assets', poi 'Data'
        const percorsoJSON = "../Assets/Data/Domande_quiz.json";

        const response = await fetch(percorsoJSON);

        if (!response.ok) {
            throw new Error("Non trovo il file JSON. Status: " +  response.status);
        }

        const data = await response.json();
        // Mescoliamo le domande
        return data.domande.sort(() => Math.random() - 0.5).slice(0, numDomandeTotali);
    }
    catch (error)
    {
        alert("Errore critico: " + error.message + "\n\nAssicurati di usare 'Live Server' su VS Code!");
        console.error(error);
        return null;
    }
}

// Avvio al click del bottone "Inizia"
if (startButton)
{
    startButton.addEventListener('click', async (e) => {
        e.preventDefault();
        const caricati = await loadQuizData();
        if (caricati)
        {
            datiQuiz = caricati;
            // Nascondiamo gli elementi della intro se presenti
            const intro = document.querySelector('.containerIndex');
            if (intro) intro.style.display = 'none';
            startButton.style.display = 'none';
            mostraDomanda();
        }
    });
}

function mostraDomanda()
{
    const q = datiQuiz[indiceDomandaCorrente];
    containerQuiz.innerHTML = `
        <div id="quiz-form">
            <div class="quizQuestion">
                <h3 style="color: #930101;">Domanda ${indiceDomandaCorrente + 1} di ${numDomandeTotali}</h3>
                <p style="font-weight:bold; margin-bottom: 20px;">${q.Domanda}</p>
            </div>
            <div id="options">
                ${['A', 'B', 'C', 'D'].map(opt => `
                    <label class="option-container" id="label-${opt}" style="display:block; padding:12px; border:2px solid #58c7ff; margin:8px 0; border-radius:10px; cursor:pointer; background: white; transition: 0.2s;">
                        <input type="radio" name="answer" value="${opt}"> <strong>${opt}:</strong> ${q[opt]}
                    </label>
                `).join('')}
            </div>

            <button class="btScopri" id="btn-invio" style="margin-top:20px; width: 100%;">Invia Risposta</button>
            
            <div id="box-spiegazione" style="display:none; margin-top:20px; padding:15px; background:#f0f8ff; border: 1px solid #58c7ff; border-radius:10px;">
                <p id="testo-spiegazione" style="font-style: italic;"></p>
                <a id="link-fonte" target="_blank" style="color:#930101; font-weight:bold; text-decoration: underline;">Approfondisci sulla fonte ufficiale</a>
                <br>
                <button class="btScopri" id="btn-next" style="margin-top:15px; background: #930101; color: white;">Prossima Domanda</button>
            </div>
        </div>
    `;

    document.getElementById('btn-invio').onclick = controllaRisposta;
}

function controllaRisposta()
{
    const selezionata = document.querySelector('input[name="answer"]:checked');

    if (!selezionata)
    {
        alert("Seleziona una delle opzioni!");
        return;
    }

    const q = datiQuiz[indiceDomandaCorrente];
    const corretta = q.Corretta;
    const rispostaUtente = selezionata.value;

    document.querySelectorAll('input[name="answer"]').forEach(i => i.disabled = true);
    document.getElementById('btn-invio').style.display = 'none';

    // Feedback visivo
    const labelCorretta = document.getElementById("label-" + corretta);
    labelCorretta.style.background = "#d4edda";
    labelCorretta.style.borderColor = "#28a745";

    if (rispostaUtente !== corretta)
    {
        const labelSbagliata = document.getElementById("label-" + rispostaUtente);
        labelSbagliata.style.background = "#f8d7da";
        labelSbagliata.style.borderColor = "#dc3545";
        domandeSbagliate.push(q);
    }
    else
    {
        punteggio++;
    }

    // Spiegazione e Fetch
    const box = document.getElementById('box-spiegazione');
    box.style.display = 'block';
    document.getElementById('testo-spiegazione').innerText = q.Spiegazione;
    document.getElementById('link-fonte').href = q.Fonte;

    fetchSpiegazioneDallaFonte(q.Fonte);

    document.getElementById('btn-next').onclick = () => {
        indiceDomandaCorrente++;
        if (indiceDomandaCorrente < datiQuiz.length)
        {
            mostraDomanda();
        }
        else
        {
            mostraRisultati();
        }
    };
}

async function fetchSpiegazioneDallaFonte(url)
{
    try
    {
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
        const res = await fetch(proxyUrl);
        const data = await res.json();
        const parser = new DOMParser();
        const doc = parser.parseFromString(data.contents, 'text/html');
        const meta = doc.querySelector('meta[name="description"]');
        if (meta && meta.getAttribute('content'))
        {
            document.getElementById('testo-spiegazione').innerText = meta.getAttribute('content');
        }
    }
    catch (e)
    {
        // Resta il testo di q.Spiegazione se la fetch fallisce
    }
}

function mostraRisultati()
{
    const perc = Math.round((punteggio / numDomandeTotali) * 100);
    containerQuiz.innerHTML = `
        <div class="box1">
            <h2 style="font-size: 2.5rem;">Risultato Finale</h2>
            <p style="font-size: 1.5rem;">Hai totalizzato <strong>${punteggio}</strong> su ${numDomandeTotali}</p>
            <h1 style="font-size: 5rem; margin: 20px 0;">${perc}%</h1>
            <div style="display:flex; flex-direction: column; gap: 15px;">
                <button class="back" onclick="location.reload()">Riprova il Quiz</button>
                <button class="back" style="background:#444" onclick="window.location.href='../index.html'">Torna alla Home</button>
            </div>
        </div>
    `;
}
