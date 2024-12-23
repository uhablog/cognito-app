require('dotenv').config(); // dotenvをロード
const express = require('express');
const axios = require('axios');
const querystring = require('querystring');
const app = express();
const PORT = 8000;

// Cognitoのエンドポイント
const AUTH_URL = `${process.env.COGNITO_DOMAIN}/oauth2/authorize`;
const TOKEN_URL = `${process.env.COGNITO_DOMAIN}/oauth2/token`;

// 静的ファイルの提供
app.use(express.static('public'));

// 特定のエンドポイントでindex.htmlを返す
app.get('/', (req, res) => {
  console.log(`COGNITO_DOMAIN: ${process.env.COGNITO_DOMAIN}`);
  console.log('test');
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 1. ログインリクエスト
app.get('/login', (req, res) => {
  const loginUrl = `${AUTH_URL}?${querystring.stringify({
    response_type: 'code',
    client_id: process.env.COGNITO_CLIENT_ID,
    redirect_uri: process.env.REDIRECT_URI,
    scope: 'openid profile',
  })}`;

  console.log(`loginUrl: ${loginUrl}`);
  res.redirect(loginUrl);
});

// 2. コールバック処理
app.get('/callback', async (req, res) => {
  const code = req.query.code;

  if (!code) {
    return res.status(400).send('Authorization code is missing');
  } else {
    console.log(`コードを受け取りました: ${code}`);
  }

  try {
    // 3. トークン取得リクエスト
    const response = await axios.post(
      TOKEN_URL,
      querystring.stringify({
        grant_type: 'authorization_code',
        client_id: process.env.COGNITO_CLIENT_ID,
        redirect_uri: process.env.REDIRECT_URI,
        code,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    // 4. アクセストークンを表示
    console.log({
      accessToken: response.data.access_token,
      idToken: response.data.id_token,
      refreshToken: response.data.refresh_token,
    });
    res.redirect('http://localhost:8000/');
  } catch (error) {
    console.error('Error exchanging code for tokens:', error.response?.data || error.message);
    res.status(500).send('Failed to exchange authorization code for tokens');
  }
});

// ログアウトエンドポイント
app.get('/logout', (req, res) => {
  const logoutUrl = `${process.env.COGNITO_DOMAIN}/logout?${querystring.stringify({
    client_id: process.env.COGNITO_CLIENT_ID,
    logout_uri: process.env.LOGOUT_REDIRECT_URI,
  })}`;
  res.redirect(logoutUrl);
});

// Auth0ログアウト
app.get('/oidc/logout', (req, res) => {
  const oidcLogoutUrl = `${process.env.AUTH0_DOMAIN}/oidc/logout?${querystring.stringify({
    client_id: process.env.AUTH0_CLIENT_ID,
    post_logout_redirect_uri: process.env.LOGOUT_REDIRECT_URI
  })}`;
  res.redirect(oidcLogoutUrl);
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
