import querystring from 'querystring';
import https from 'https';
import { URL } from 'url';
import assert from 'assert';

const ContentType = {
    JSON: 'application/json'
};

const HttpVerb = {
    POST: 'POST',
    GET: 'GET',
};

const Environment = {
    SANDBOX: 'https://secure.snd.payu.com',
    PRODUCTION: 'https://secure.payu.com',
};

const request = ({ url, json, params, body, ...rest } = { method: 'GET', json: true }) => {
  const uri = new URL(`${url}${params ? '?' + querystring.stringify(params) : ''}`);
  return new Promise((resolve, reject) => {
    const req = https.request({ host: uri.host, path: `${uri.pathname}${uri.search}`, ...rest }, (resp) => {
      let data = '';
      resp.setEncoding('utf8');
      resp.on('data', (chunk) => {
        data += chunk;
      });
    
      resp.on('end', () => {
        resolve(json ? JSON.parse(data) : data);
      });
    
    }).on("error", (err) => {
      console.log(err);
      reject("Error: " + err.message);
    });

    if (body) {
      req.write(json ? JSON.stringify(body) : body);
    }

    req.end();
  })
};
const post = (url, body, options = {}) => request({ url, body, ...options, ...{ method: HttpVerb.POST } });

const environment = Environment[(process.env.PAYU_ENVIRONMENT ? process.env.PAYU_ENVIRONMENT : 'sandbox').toUpperCase()];

var authorize = async ({ clientId, clientSecret, grantType }) => {
  try {
    const response = await post(
      `${environment}/pl/standard/user/oauth/authorize`,
      null,
      {
        json: true,
        params: {
          client_secret: clientSecret,
          grant_type: grantType,
          client_id: clientId
        }
      }
    );

    return {
      accessToken: response.access_token,
      tokenType: response.token_type,
      expiresIn: response.expires_in,
      grantType: response.grant_type
    }
  } catch (ex) {
    console.error(ex.message);
  }
};

const { PAYU_CLIENT_NOTIFY_SITE_URL, PAYU_CLIENT_ID } = process.env;

var order = async ({ accessToken, description }) => {
  assert.ok(accessToken, 'accessToken should not be empty');
  assert.ok(description, 'description should not be empty');

  try {
    return await post(
      `${environment}/api/v2_1/orders`,
      {
        notifyUrl: PAYU_CLIENT_NOTIFY_SITE_URL,
        merchantPosId: PAYU_CLIENT_ID,
        ...description,
      },
      {
        json: true,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': ContentType.JSON,
        },
      }
    )

  } catch (response) {
    return response.error
  }
};

export { authorize, order };