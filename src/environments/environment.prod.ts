export const environment = {
  production: true,
  // Chemin relatif : Nginx proxifie /api/ → NestJS:3000 dans le conteneur Docker
  apiUrl: '/api',
};
