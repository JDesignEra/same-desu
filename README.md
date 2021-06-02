**same-desu** is a Discord bot that is build for personal use in a server with a group of friends.

## Initial Setup
1. Ensure that you have Node installed, preferably Node **14.16.0** or higher.
    * Node can be downloaded at: <a href="https://nodejs.org/en/download/">https://nodejs.org/en/download/</a>
2. Install required packages with `npm i`.
3. Ensure that `.env` file is in the root directory with the following contents:
```.env
TOKEN = <Discord Bot Token>
APP_ID = <Discord App ID>
GUILD_ID = <Your Discord Server Guild ID>

SQLITE_FILENAME = <SQLite DB Filename>.sqlite

STATUS_MSG = <Status Message>
STATUS_TYPE = <PLAYING | STREAMING | LISTENING | WATCHING>
EMBED_HOST_FOOTER = <Embed Message Footer Text>

DATABASE = <Database Name>
DB_USERNAME = <Database Username>
DB_PASSWORD = <Database Password>

OXFORD_DICT_ID = <OxFord Dictionary API ID>
OXFORD_DICT_KEY = <OxFord Dictionary API Key>

RAPID_API_KEY = <RapidAPI API Key>

DEEPL_API_KEY = <DeepL API Key>
```

## How to Run?
`npm start`