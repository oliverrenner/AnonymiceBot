const VERIFICATION_COMMAND = 'join';
const APPLICATION_PORT = '3010';
const VERIFICATION_HOST = 'http://localhost:3010';
const VERIFICATION_PATH = ''; // if there is a path, apiUrlSignIn in app.js needs to be adopted!
const VERICICATION_BASE_URL = `${VERIFICATION_HOST}${VERIFICATION_PATH}/verification-page`;
const VERIFICATION_TIMEOUT_MINUTES = 30;
const SESSION_SECRET = 'mouse-bot-discord-aXk1PxlAxLpwXl!2098x';

module.exports = {
    APPLICATION_PORT,
    VERIFICATION_COMMAND,
    VERIFICATION_HOST,
    VERICICATION_BASE_URL,
    VERIFICATION_TIMEOUT_MINUTES,
    SESSION_SECRET
}
