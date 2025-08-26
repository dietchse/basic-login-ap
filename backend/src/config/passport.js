const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Log callbackURL untuk debugging
const callbackURL = process.env.GOOGLE_CALLBACK_URL;
console.log('Google OAuth Callback URL:', callbackURL);

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: callbackURL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log('Google OAuth Profile:', profile);
        let user = await prisma.user.findUnique({
          where: { email: profile.emails[0].value },
          include: { role: true },
        });

        const profilePicture = profile.photos && profile.photos[0] ? profile.photos[0].value : null;
        console.log('Profile Picture from Google:', profilePicture);

        if (!user) {
          user = await prisma.user.create({
            data: {
              email: profile.emails[0].value,
              name: profile.displayName,
              googleId: profile.id,
              roleId: 2,
              profilePicture: profilePicture,
              isVerified: true,
            },
            include: { role: true },
          });
          console.log('Created new user with googleId:', user.googleId, 'and profilePicture:', user.profilePicture);
        } else if (!user.googleId || !user.profilePicture) {
          user = await prisma.user.update({
            where: { email: profile.emails[0].value },
            data: {
              googleId: profile.id,
              profilePicture: profilePicture,
            },
            include: { role: true },
          });
          console.log('Updated user with googleId:', user.googleId, 'and profilePicture:', user.profilePicture);
        }

        const userData = {
          id: user.id,
          email: user.email,
          displayName: user.name,
          googleId: user.googleId,
          role: user.role.name,
          profilePicture: user.profilePicture,
        };
        console.log('User Data Before Token Generation:', userData);
        return done(null, userData);
      } catch (err) {
        console.error('Google OAuth Error:', err);
        return done(err, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  console.log('Serializing User:', user.id);
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: { role: true },
    });
    if (!user) {
      console.log('User not found during deserialization:', id);
      return done(null, null);
    }
    const userData = {
      id: user.id,
      email: user.email,
      displayName: user.name,
      googleId: user.googleId,
      role: user.role.name,
      profilePicture: user.profilePicture,
    };
    console.log('Deserialized User:', userData);
    done(null, userData);
  } catch (err) {
    console.error('Deserialize User Error:', err);
    done(err, null);
  }
});