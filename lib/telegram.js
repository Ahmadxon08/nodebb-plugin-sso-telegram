const passport = require('passport');
const TelegramStrategy = require('passport-telegram-official').Strategy;
const User = require.main.require('./src/user');
const meta = require.main.require('./src/meta');
const nconf = require('nconf');

passport.use(new TelegramStrategy({
  clientID: 'YOUR_TELEGRAM_BOT_ID',
  clientSecret: 'YOUR_TELEGRAM_BOT_SECRET',
  callbackURL: nconf.get('url') + '/auth/telegram/callback'
}, function(accessToken, refreshToken, profile, done) {
  User.getUidByOAuthid('telegram', profile.id, function(err, uid) {
    if (err) {
      return done(err);
    }


    

    if (!uid) {
      User.create({ username: profile.username, email: profile.username + '@telegram.com' }, function(err, uid) {
        if (err) {
          return done(err);
        }

        User.setUserField(uid, 'telegramid', profile.id);
        done(null, uid);
      });
    } else {
      done(null, uid);
    }
  });
}));

module.exports = passport;
