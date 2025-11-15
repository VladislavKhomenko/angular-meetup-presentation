import { defineConfig } from 'slidev'

export default defineConfig({
  colorSchema: 'light',
  routerMode: 'hash', // Используем hash mode для GitHub Pages
  vite: {
    base: '/angular-meetup-presentation/',
  },
})


