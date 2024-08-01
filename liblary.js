const passport = require('passport');
const passportTelegram = require('passport-telegram-official').Strategy;
const User = require.main.require('./src/user');
const meta = require.main.require('./src/meta');
const nconf = require('nconf');

const plugin = {};

plugin.init = function(params, callback) {
  function render(req, res) {
    res.render('admin/plugins/telegram-sso', {});
  }

  params.router.get('/admin/plugins/telegram-sso', params.middleware.admin.buildHeader, render);
  params.router.get('/api/admin/plugins/telegram-sso', render);

  callback();
};

plugin.getStrategy = function(strategies, callback) {
  meta.settings.get('telegram-sso', function(err, settings) {
    if (!err && settings && settings['telegram-id'] && settings['telegram-secret']) {
      passport.use(new passportTelegram({
        clientID: settings['telegram-id'],
        clientSecret: settings['telegram-secret'],
        callbackURL: nconf.get('url') + '/auth/telegram/callback'
      }, function(accessToken, refreshToken, profile, done) {
        plugin.login(profile.id, profile.username, profile.photos[0].value, function(err, user) {
          done(err, user);
        });
      }));

      strategies.push({
        name: 'telegram',
        url: '/auth/telegram',
        callbackURL: '/auth/telegram/callback',
        icon: 'fa-telegram',
        scope: ''
      });
    }

    
    callback(null, strategies);
  });
};

plugin.login = function(telegramID, username, picture, callback) {
  User.getUidByOAuthid('telegram', telegramID, function(err, uid) {
    if (err) {
      return callback(err);
    }

    if (!uid) {
      const success = function(uid) {
        User.setUserField(uid, 'telegramid', telegramID);
        User.setUserField(uid, 'picture', picture);
        User.setUserField(uid, 'gravatarpicture', picture);
        User.setUserField(uid, 'email:confirmed', 1);
        User.setUserField(uid, 'username', username);
        User.setUserField(uid, 'displayname', username);

        callback(null, { uid: uid });
      };

      User.create({ username: username, email: username + '@telegram.com' }, function(err, uid) {
        if (err) {
          return callback(err);
        }

        success(uid);
      });
    } else {
      callback(null, { uid: uid });
    }
  });
};

plugin.handleLogin = function(data, callback) {
  data.redirect = nconf.get('url') + '/auth/telegram';
  callback(null, data);
};

module.exports = plugin;
