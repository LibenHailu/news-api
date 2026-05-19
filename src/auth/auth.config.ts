export default () => ({
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret',
    expiresIn: process.env.JWT_EXPIRES || process.env.JWT_EXPIRES_IN || '1h',
  },
});
