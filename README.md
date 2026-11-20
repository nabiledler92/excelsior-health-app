# سِرّ · Sirr — Your health. Your pace.

A bilingual (English / Arabic) hackathon prototype that gives men a private, low-pressure first step into fertility assessment. It walks through a short check-in, optional learning, a simulated home-test journey (patient → courier → lab → clinician), and a scripted "Ask Sirr" conversational concept.

**Live demo:** https://sirr-demo.jollytree-ef416752.eastus2.azurecontainerapps.io

> **Prototype only.** Every person, booking, lab measurement and clinical review is synthetic. No real sign-in, courier, lab, clinician, AI model or payment is connected, and the educational copy has not been clinically reviewed. Do not enter real personal or health information.

## Highlights

- **Private check-in** — five questions that end in an explained next step, with an urgent-symptom path that bypasses ordinary booking.
- **Connected care demo** — book a simulated home test, hand the sample to a courier, accept it at the lab, enter synthetic measurements, and release the report only after clinician approval.
- **Learn** — an interactive three-station visual (Signals / Production / Pathway) and short illustrated video guides in English and Arabic with captions. On desktop the guides open in a contained player; on mobile they fill the screen.
- **Ask Sirr** — a clearly labelled conversational *concept* using local topic matching (no LLM), with boundaries for diagnosis, personal results and medication questions.
- **Bilingual, RTL-aware UI** and presenter shortcuts for running a three-minute demo.

## Run locally

Static site, no build step and no API keys.

```sh
python3 -m http.server 8765 --bind 127.0.0.1
```

Open http://127.0.0.1:8765 (serve over HTTP rather than opening the file directly).

Or with Docker:

```sh
docker compose up -d --build   # http://localhost:8080
```

## Three-minute demo

1. On Welcome choose **Find my next step** and answer five questions.
2. Choose **Book a home test → Continue to booking → Continue with demo patient**, then confirm pickup and collection.
3. Under **Demo controls**, advance the sample through **Dispatch** and accept it at the **Lab**; fill synthetic measurements and send for clinician review.
4. Switch to **Clinician** and **Approve & release demo report**, then view it in **Patient → Results**.
5. Explore **Learn** and **Ask Sirr** from the bottom navigation.

## Tests

```sh
node tests/demo-scenarios.cjs
node tests/unified-scenarios.cjs
node tests/chat-scenarios.cjs
```

## Project structure

| Path | Purpose |
|---|---|
| `index.html`, `styles.css` | App shell and responsive UI |
| `js/app.js` | Patient screens, staff queues, navigation, media handling |
| `js/journey.js` | Five-question check-in and explanation routes |
| `js/state.js` | Synthetic in-browser store, handoff guards, clinician approval |
| `js/chat.js` | Scripted Ask Sirr replies and safety boundaries |
| `js/learn-visual.js` | Interactive Learn schematic |
| `js/i18n.js`, `js/videos.js`, `media/` | Translations, video config, guides, captions and posters |
| `Dockerfile`, `nginx.conf` | nginx container used for the Azure deployment |

## Deployment

The live demo runs as an nginx container on Azure Container Apps (East US 2), scaled to zero when idle.

## Credits

Sirr was built as a team hackathon project. This showcase is based on the team repository [syamil-commit/men_hack](https://github.com/syamil-commit/men_hack). Scene artwork was AI-generated and narration uses synthetic text-to-speech voices; neither represents real patients or clinicians.
