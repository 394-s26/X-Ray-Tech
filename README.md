<!-- Improved compatibility of back to top link: See: https://github.com/othneildrew/Best-README-Template/pull/73 -->
<a id="readme-top"></a>

<!-- PROJECT SHIELDS -->
[![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]



<!-- PROJECT LOGO -->
<br />
<div align="center">
  <a href="https://github.com/394-s26/X-Ray-Tech">
    <img src="public/logoNoBg.png" alt="X-Ray Tech Logo" width="80" height="80">
  </a>

<h3 align="center">X-Ray Tech</h3>

  <p align="center">
    Continuing-education credit tracking for Illinois x-ray technologists — automatically reads CE certificates and manages ARRT &amp; IEMA license cycles.
    <br />
    <a href="https://github.com/394-s26/X-Ray-Tech"><strong>Explore the docs »</strong></a>
    <br />
    <br />
    <a href="https://xraytech.web.app">View Demo</a>
    &middot;
    <a href="https://github.com/394-s26/X-Ray-Tech/issues/new?labels=bug">Report Bug</a>
    &middot;
    <a href="https://github.com/394-s26/X-Ray-Tech/issues/new?labels=enhancement">Request Feature</a>
  </p>
</div>



<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
      <ul>
        <li><a href="#key-features">Key Features</a></li>
        <li><a href="#built-with">Built With</a></li>
      </ul>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#license-ce-logic">License CE Logic</a></li>
    <li><a href="#project-structure">Project Structure</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#team">Team</a></li>
    <li><a href="#acknowledgments">Acknowledgments</a></li>
  </ol>
</details>



<!-- ABOUT THE PROJECT -->
## About The Project

**X-Ray Tech** is a web application that helps Illinois x-ray technologists stay
compliant with their continuing-education (CE) requirements. Techs in Illinois
maintain **two separate credentials** — **ARRT** (national) and **IEMA** (state) —
each requiring **24 CE credits every 2 years**, but with different cycle windows,
deadlines, and crediting rules.

Tracking this by hand is error-prone. X-Ray Tech lets a user upload a photo or PDF
of a CE certificate, automatically extracts the relevant details with OCR, validates
the certificate's category, and applies the credits to the correct ARRT and IEMA
cycles — including the edge cases around birth-month windows, probation periods, and
single-use-per-license rules.

This project was built for **CS 394: Agile Software Engineering** at Northwestern
University.

### Key Features

- 📄 **Automatic certificate parsing** — upload a photo or PDF and OCR (Tesseract.js +
  PDF.js) extracts the course, date, category, and credit value.
- 🗂️ **Dual-license cycle tracking** — independently tracks ARRT and IEMA cycles with
  their distinct anchors, deadlines, and crediting rules.
- ✅ **Category validation** — only counts Category A / A+ certificates toward the
  24-credit requirement.
- 🔁 **Double-dip handling** — applies one certificate across one ARRT and one IEMA
  cycle while enforcing single-use-per-license.
- 🔔 **Notifications** — in-app and desktop/push notifications for upcoming deadlines.
- 👥 **Team management** — administrators can manage technologists and view compliance
  status across a team.
- 🔐 **Authentication & permissions** — Firebase Auth (email/password + Google Sign-In)
  with a role-based permissions system.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

### Built With

* [![React][React.js]][React-url]
* [![TypeScript][TypeScript]][TypeScript-url]
* [![Vite][Vite.js]][Vite-url]
* [![Tailwind][Tailwind]][Tailwind-url]
* [![Firebase][Firebase]][Firebase-url]

Additional libraries: **Tesseract.js** & **PDF.js** (certificate OCR), **GSAP**
(animations), **React Router**, and **Python Cloud Functions** for server-side
certificate extraction.

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- GETTING STARTED -->
## Getting Started

Follow these steps to get a local copy up and running.

### Prerequisites

* **Node.js** (v18+) and **npm**
  ```sh
  npm install npm@latest -g
  ```
* A **Firebase project** with Firestore, Authentication, Storage, and Cloud Functions
  enabled.
* The **Firebase CLI** (used for local emulation and deployment)
  ```sh
  npm install -g firebase-tools
  ```

### Installation

1. Clone the repo
   ```sh
   git clone https://github.com/394-s26/X-Ray-Tech.git
   cd X-Ray-Tech
   ```
2. Install NPM packages
   ```sh
   npm install
   ```
3. Configure your Firebase environment variables. Copy the example file and fill in
   the values from your Firebase Console (**Project Settings > General > Your apps >
   Web app > SDK setup and configuration**):
   ```sh
   cp .env.example .env
   ```
   ```env
   VITE_FIREBASE_API_KEY=your-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   VITE_FIREBASE_APP_ID=your-app-id
   ```
4. Start the development server
   ```sh
   npm run dev
   ```

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- USAGE EXAMPLES -->
## Usage

Available npm scripts:

| Command | Description |
|---|---|
| `npm run dev` | Start the Vite development server with HMR |
| `npm run build` | Type-check and build the production bundle to `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint over the project |

**Typical flow:** sign in → complete account setup (birth month + accreditation date,
which anchor the ARRT and IEMA cycles) → upload a CE certificate → review the
OCR-extracted details → save, and the credits are automatically applied to the
appropriate license cycle(s). The dashboard then shows progress toward the
24-credit requirement and flags upcoming deadlines.

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- LICENSE CE LOGIC -->
## License CE Logic

The core domain logic — how ARRT and IEMA cycles differ — is documented in
[license_ce_logic.md](license_ce_logic.md). Key differences at a glance:

| Rule | ARRT | IEMA |
|---|---|---|
| Cycle anchor | Birth month | Accreditation month |
| Final-month CEs count? | **No** | **Yes** (if reported by deadline) |
| Formal CE probation | 6 months, isolated points pool | None documented |
| Points required | 24 | 24 |
| Accepted CE category | A or A+ | A or A+ |
| Cert reuse within same license | Not allowed | Not allowed |
| Cert reuse across licenses | Allowed (one ARRT + one IEMA) | Allowed (one ARRT + one IEMA) |

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- PROJECT STRUCTURE -->
## Project Structure

```
/src
  /components    # React components, one per file
  /pages         # Route-level pages
  /hooks         # Custom React hooks
  /services      # Firebase & external API calls (OCR, parsing, cycle logic)
  /contexts      # React context providers (e.g. theme)
  /types         # TypeScript types and interfaces
  /utils         # Shared pure functions and helpers
  /styles        # Component- and page-level CSS (Tailwind @apply)
/functions        # Firebase Cloud Functions (TypeScript — email, FCM, scheduled)
/functions-python # Python Cloud Functions (certificate extraction)
/design-system    # Design tokens and shared UI reference
/public           # Static assets (favicon, service worker, logos)
```

Conventions for this codebase are documented in
[.github/agent-instructions.md](.github/agent-instructions.md) — all Firebase and
network calls live in `/src/services/`, components never import the Firebase SDK
directly, and the app uses a string-based permissions system.

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- CONTRIBUTING -->
## Contributing

Contributions are welcome. To propose a change:

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

Please make sure your code passes `npm run lint` and `npm run build` before opening a
PR.

### Top contributors:

<a href="https://github.com/394-s26/X-Ray-Tech/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=394-s26/X-Ray-Tech" alt="contrib.rocks image" />
</a>

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- TEAM -->
## Team

Built by the CS 394 X-Ray Tech team at Northwestern University:

- **Adnan Alhabian**
- **Yusuf Ozdemir**
- **Azan Malik**
- **Fiorelli Wong**
- **Aidan Zea**

Project Link: [https://github.com/394-s26/X-Ray-Tech](https://github.com/394-s26/X-Ray-Tech)

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- ACKNOWLEDGMENTS -->
## Acknowledgments

* [CS 394: Agile Software Engineering](https://www.mccormick.northwestern.edu/computer-science/) — Northwestern University
* [ARRT — American Registry of Radiologic Technologists](https://www.arrt.org)
* [IEMA — Illinois Emergency Management Agency, Division of Nuclear Safety](https://iema.illinois.gov/)
* [Best-README-Template](https://github.com/othneildrew/Best-README-Template)

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- MARKDOWN LINKS & IMAGES -->
[contributors-shield]: https://img.shields.io/github/contributors/394-s26/X-Ray-Tech.svg?style=for-the-badge
[contributors-url]: https://github.com/394-s26/X-Ray-Tech/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/394-s26/X-Ray-Tech.svg?style=for-the-badge
[forks-url]: https://github.com/394-s26/X-Ray-Tech/network/members
[stars-shield]: https://img.shields.io/github/stars/394-s26/X-Ray-Tech.svg?style=for-the-badge
[stars-url]: https://github.com/394-s26/X-Ray-Tech/stargazers
[issues-shield]: https://img.shields.io/github/issues/394-s26/X-Ray-Tech.svg?style=for-the-badge
[issues-url]: https://github.com/394-s26/X-Ray-Tech/issues
[React.js]: https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB
[React-url]: https://react.dev/
[TypeScript]: https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white
[TypeScript-url]: https://www.typescriptlang.org/
[Vite.js]: https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white
[Vite-url]: https://vite.dev/
[Tailwind]: https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white
[Tailwind-url]: https://tailwindcss.com/
[Firebase]: https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black
[Firebase-url]: https://firebase.google.com/
