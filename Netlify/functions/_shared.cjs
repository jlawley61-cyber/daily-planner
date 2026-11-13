const crypto=require('node:crypto');
const {getStore}=require('@netlify/blobs');
const BASE='https://oauth2.googleapis.com/token';
const COOKIE='planner_session';
const json=(code,body,headers={})=>({statusCode:code,headers:{'Content-Type':'application/json','Cache-Control':'no-store',...headers},body:JSON.stringify(body)});
function env(){for(const k of ['GOOGLE_CLIENT_ID','GOOGLE_CLIENT_SECRET','GOOGLE_REDIRECT_URI','ALLOWED_GOOGLE_EMAIL','SESSION_SECRET','TOKEN_ENCRYPTION_KEY'])if(!process.env[k])throw Error('Missing server configuration: '+k);return process.env;}
const b64=s=>Buffer.from(s).toString('base64url');
const mac=s=>crypto.createHmac('sha256',env().SESSION_SECRET).update(s).digest('base64url');
function sign(data){const s=b64(JSON.stringify(data));return s+'.'+mac(s)}
function verify(value){if(!value)return null;const [s,sig]=value.split('.');if(!s||!sig)return null;const expected=mac(s);if(sig.length!==expected.length||!crypto.timingSafeEqual(Buffer.from(sig),Buffer.from(expected)))return null;const d=JSON.parse(Buffer.from(s,'base64url').toString());return d.exp>Date.now()?d:null}
function cookie(event,name){const raw=event.headers.cookie||event.headers.Cookie||'';return raw.split(';').map(x=>x.trim()).find(x=>x.startsWith(name+'='))?.slice(name.length+1)||''}
function secureCookie(name,value,maxAge){return `${name}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`}
function store(){return getStore('planner-oauth-tokens')}
function key(email){return 'user-'+crypto.createHash('sha256').update(email.toLowerCase()).digest('hex')}
function enc(value){const iv=crypto.randomBytes(12),secret=Buffer.from(env().TOKEN_ENCRYPTION_KEY,'base64');if(secret.length!==32)throw Error('TOKEN_ENCRYPTION_KEY must be a base64-encoded 32-byte key');const cipher=crypto.createCipheriv('aes-256-gcm',secret,iv);const ciphertext=Buffer.concat([cipher.update(value,'utf8'),cipher.final()]);return [iv,cipher.getAuthTag(),ciphertext].map(x=>x.toString('base64')).join('.')}
function dec(value){const [i,t,c]=value.split('.').map(x=>Buffer.from(x,'base64'));const decipher=crypto.createDecipheriv('aes-256-gcm',Buffer.from(env().TOKEN_ENCRYPTION_KEY,'base64'),i);decipher.setAuthTag(t);return Buffer.concat([decipher.update(c),decipher.final()]).toString('utf8')}
async function exchange(data){const res=await fetch(BASE,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams(data)});const body=await res.json();if(!res.ok)throw Error('Google token exchange failed: '+(body.error||res.status));return body}
async function access(event){const user=verify(cookie(event,COOKIE));if(!user||user.email.toLowerCase()!==env().ALLOWED_GOOGLE_EMAIL.toLowerCase())return null;const saved=await store().get(key(user.email),{type:'json'});if(!saved?.refresh)return null;const tokens=await exchange({client_id:env().GOOGLE_CLIENT_ID,client_secret:env().GOOGLE_CLIENT_SECRET,refresh_token:dec(saved.refresh),grant_type:'refresh_token'});return {user,token:tokens.access_token}}
module.exports={json,env,sign,verify,cookie,secureCookie,store,key,enc,exchange,access,COOKIE};
