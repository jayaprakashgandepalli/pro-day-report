const { google } = require('googleapis');
const http = require('http');
const url = require('url');

const keys = {
  client_id: 'your_client_id',
  client_secret: 'your_client_secret',
  redirect_uris: ['http://localhost:3000/oauth2callback'],
};

async function main() {
  const oAuth2Client = new google.auth.OAuth2(
    keys.client_id,
    keys.client_secret,
    keys.redirect_uris[0]
  );

  const authorizeUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: 'https://www.googleapis.com/auth/drive.file',
    prompt: 'consent' // Forces it to return a refresh token every time
  });

  console.log('\n======================================================');
  console.log('1. Click or copy-paste this link into your browser:');
  console.log('======================================================\n');
  console.log(authorizeUrl);
  console.log('\n======================================================');
  
  const server = http.createServer(async (req, res) => {
    try {
      if (req.url.indexOf('/oauth2callback') > -1) {
        const qs = new url.URL(req.url, 'http://localhost:3000').searchParams;
        const code = qs.get('code');
        
        console.log('\nReceived code from Google! Exchanging for tokens...');
        res.end('Authentication successful! You can close this tab and go back to the chat.');
        server.destroy();
        
        const { tokens } = await oAuth2Client.getToken(code);
        
        console.log('\n======================================================');
        console.log('✅ SUCCESS! HERE IS YOUR REFRESH TOKEN:');
        console.log('======================================================\n');
        console.log(tokens.refresh_token);
        console.log('\n======================================================');
        console.log('Please copy the refresh token and send it in the chat.');
        
        process.exit(0);
      }
    } catch (e) {
      console.error(e);
      res.end('Error! Check console.');
    }
  });

  server.listen(3000, () => {
    console.log('Waiting for you to log in (Server listening on port 3000)...');
  });

  // Polyfill for destroy
  server.destroy = function() {
    this.close();
  };
}

main().catch(console.error);
