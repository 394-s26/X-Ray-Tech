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
  </br>
  </br>
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

#### Landing Page

The landing page introduces X-Ray Tech and explains how it helps Illinois x-ray
technologists stay compliant with their ARRT and IEMA continuing education. Visitors
can see what the app does and what it offers before committing to anything. From here
they can move straight into signing in or creating an account.

<p align="center">
  <img width="1461" height="879" alt="Screenshot 2026-06-10 at 6 37 53 PM" src="https://github.com/user-attachments/assets/23f47edd-3ec9-4ec8-b3c8-f3a3c4d833a6" />
</p>

#### Dashboard

The dashboard is the home base where a technologist sees their overall compliance at a
glance. It shows progress toward the 24 credit requirement for both ARRT and IEMA,
along with countdowns to the next cycle deadlines. Visual credit bars and donuts make
it easy to tell how many credits are still needed and how much time remains. From here
a user can jump into adding certificates, reviewing cycles, or managing their account.

<p align="center">
  <img width="1460" height="879" alt="Screenshot 2026-06-10 at 6 41 02 PM" src="https://github.com/user-attachments/assets/4deafee0-75eb-4386-8227-0e8664db700a" />
</p>

#### Add Certificates

Users add a certificate by uploading a photo or PDF, and the app reads it
automatically with OCR to pull out the course, date, category, and credit value. The
extracted details are shown for review so a user can confirm or correct anything before
saving. Certificates can still be saved when the image upload allowance is reached,
falling back to a placeholder without losing any data. Once saved, a certificate is
ready to be applied to the right license later.

<p align="center">
  <img width="1104" height="850" alt="Screenshot 2026-06-10 at 7 07 44 PM" src="https://github.com/user-attachments/assets/e0d39d64-78e1-4850-a36d-e1b2944a6af7" />
</p>

#### Certificate Reporting

Certificate reporting is where users apply their saved certificates to the current ARRT
and IEMA cycles. Each certificate appears as a toggle that counts or uncounts it toward
a license, making it simple to see exactly what is being credited. The app enforces the
single use per license rule while still allowing one certificate to count across one
ARRT and one IEMA cycle. This gives technologists full control over how their credits
are distributed.

<p align="center">
  <img width="1464" height="879" alt="Screenshot 2026-06-10 at 6 45 01 PM" src="https://github.com/user-attachments/assets/551dae5e-5fd8-4096-9cee-2640254de8ab" />
</p>

#### Browse Certificates

The browse page helps technologists discover new certifications they can complete to
earn more credits. Each option includes a short description so users understand what a
certification covers before pursuing it. This makes it easier to plan ahead and close
any remaining gap toward the 24 credit requirement. It turns compliance from a reactive
chore into something a user can actively work toward.

<p align="center">
  <img width="1462" height="881" alt="Screenshot 2026-06-10 at 6 45 31 PM" src="https://github.com/user-attachments/assets/ed243037-e686-4569-adc9-e76836e0ce61" />
</p>

#### View and Manage Team

Team management lets administrators oversee a group of technologists in one place. Users
can create a team or join an existing one with a shareable team code, and admins can
regenerate that code when needed. The view shows each member with their combined ARRT
and IEMA compliance status, so a manager can quickly spot who is falling behind. This
keeps an entire department on track without checking each person individually.

<p align="center">
  <img src="docs/images/team-management.png" alt="Team management" width="720">
</p>

#### Notifications

X-Ray Tech keeps users informed with both in-app and push notifications about upcoming
deadlines. A notification bell surfaces recent alerts, and desktop or mobile push
reminders reach users even when the app is closed. Reminders are timed around cycle
deadlines so a technologist never misses a reporting window. Users stay aware of what
needs attention without having to log in and check manually.

<p align="center">
  <img width="387" height="545" alt="Screenshot 2026-06-10 at 6 49 12 PM" src="https://github.com/user-attachments/assets/97f805bc-c192-41ff-8256-964c6973c01c" />
  <img width="1170" height="1737" alt="IMG_1038" src="https://github.com/user-attachments/assets/11694ac8-e80c-4456-b74f-222934b090c2" />
</p>

#### Available Certificates

The available certificates page lets users browse and manage all of their certificates
organized by issuing agency. From here a technologist can review what they have on file
and open any certificate to see its full details.

<p align="center">
  <img width="1207" height="881" alt="Screenshot 2026-06-10 at 6 55 42 PM" src="https://github.com/user-attachments/assets/ef71c05c-4ca0-4be3-b032-9e6e673492a4" />
</p>

#### License Cycles

The license cycles view tracks ARRT and IEMA separately, each with its own anchor,
deadline, and crediting rules. Users can see exactly where each cycle stands and how
applied certificates count toward the 24 credit requirement.

<p align="center">
  <img width="1207" height="813" alt="Screenshot 2026-06-10 at 6 59 46 PM" src="https://github.com/user-attachments/assets/12eccdc5-a756-4048-b9ae-7604bd0c030d" />
</p>

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
