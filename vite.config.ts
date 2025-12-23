export default defineConfig({
  base: '/rbac-configurator/',
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:4000',
    },
  },
})
