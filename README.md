<div align="center">
  <h1>♟️ Hero Chess</h1>
  
  <p>
    A premium, real-time multiplayer chess platform built with Next.js, featuring a stunning glassmorphic UI, real-time online play, and a built-in AI opponent.
  </p>

  <p>
    <strong><a href="https://hero-chess-next-js-project-wp8k.vercel.app/" target="_blank">🎮 Play the Live Demo</a></strong>
  </p>
</div>

---

## ✨ Features

- **🌐 Real-Time Online Multiplayer**: Challenge other online players instantly. Moves and chat sync in real-time powered by Pusher WebSockets.
- **🤖 Play vs Computer**: Test your skills against an integrated AI opponent with three difficulty levels (Easy, Medium, Hard).
- **👥 Local Pass & Play**: Play against a friend on the same device with an elegant, responsive UI.
- **💬 Live Chat & Emojis**: Trash talk or send GG's with integrated real-time chat and emoji support during online matches.
- **🏆 Global Leaderboards & Stats**: Track your wins, losses, and match history stored securely in MongoDB.
- **🔐 Secure Authentication**: Seamless user accounts powered by Better Auth.
- **🎨 Premium UI/UX**: Butter-smooth animations powered by Framer Motion, with a modern, glassmorphic dark-mode aesthetic built using Tailwind CSS.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Chess Engine**: [chess.js](https://github.com/jhlywa/chess.js)
- **Real-Time WebSockets**: [Pusher](https://pusher.com/)
- **Database**: [MongoDB](https://www.mongodb.com/)
- **Authentication**: [Better Auth](https://better-auth.com/)

---

## 🚀 Getting Started

Follow these instructions to get a copy of the project up and running on your local machine.

### Prerequisites
- Node.js 18+
- MongoDB Database URI
- Pusher Account (for real-time multiplayer functionality)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/MIRJAKARIYA/hero-chess-next-js-project.git
   cd hero-chess-next-js-project
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Environment Variables**
   Create a `.env` file in the root directory and add the following keys. Replace the placeholder values with your own API keys:
   ```env
   MONGODB_URI="your_mongodb_connection_string"
   BETTER_AUTH_SECRET="your_random_secret_string"
   BETTER_AUTH_URL="http://localhost:3000"

   # Pusher Credentials
   NEXT_PUBLIC_PUSHER_KEY="your_pusher_key"
   PUSHER_APP_ID="your_pusher_app_id"
   PUSHER_SECRET="your_pusher_secret"
   NEXT_PUBLIC_PUSHER_CLUSTER="your_pusher_cluster"
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open the app**
   Navigate to [http://localhost:3000](http://localhost:3000) in your browser to see the application.

---

## 🎮 How to Play Online
1. Create an account and log in.
2. Navigate to the **Play Online** lobby.
3. You will see a list of active users. Click **Challenge** on an available player.
4. Once they accept, you will both be instantly redirected to the live match arena.
5. Good luck, and don't forget to use the chat!

---

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/MIRJAKARIYA/hero-chess-next-js-project/issues) if you want to contribute.

---

## 📝 License
This project is open source and available under the [MIT License](LICENSE).
