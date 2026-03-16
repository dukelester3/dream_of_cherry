// script const
var clientId =
  "d40535ac09aac0ef32f8a23b8bb8e04bc2e8f9d6b0981fa98a16d0382f558d83";
var ratAccountId = "1804";
var configPath =
  "https://cdn.rmc.contents.rakuten.co.jp/sdk/webcx-web-blocks-createjs-config-settings/config/config.json";
var pitariUrl =
  "https://jp.rakuten-static.com/1/grp/banner/js/Pitari_create.js";
var LOCAL_STORAGE_KEY =
  "RMCCX_BLOCKS_STORAGE_1.3.0_d40535ac09aac0ef32f8a23b8bb8e04bc2e8f9d6b0981fa98a16d0382f558d83_CAMPAIGN_TRIGGERS";

async function getConfig() {
  const response = await fetch(configPath);
  const config = await response.json();
  return config;
}

function doesHostnameMatch(hostnameList = []) {
  return hostnameList.find((hostname) => hostname === location.hostname);
}

function isValidVisit(visit) {
  if (typeof visit !== "object" || visit === null) {
    return false;
  }

  if (
    visit.hasOwnProperty("campaignId") &&
    typeof visit.campaignId !== "string"
  ) {
    return false;
  }

  if (
    visit.hasOwnProperty("totalVisits") &&
    typeof visit.totalVisits !== "number"
  ) {
    return false;
  }

  return true;
}

function isValidSession(session) {
  if (typeof session !== "object" || session === null) {
    return false;
  }

  if (session.hasOwnProperty("start") && typeof session.start !== "number") {
    return false;
  }

  if (session.hasOwnProperty("end") && typeof session.end !== "number") {
    return false;
  }

  return true;
}

function isValidVisits(visits) {
  if (!Array.isArray(visits)) {
    return false;
  }

  for (const visit of visits) {
    if (!isValidVisit(visit)) {
      return false;
    }
  }

  return true;
}

function isValidSessions(sessions) {
  if (!Array.isArray(sessions)) {
    return false;
  }

  for (const session of sessions) {
    if (!isValidSession(session)) {
      return false;
    }
  }

  return true;
}

function isValidLocalStorageSchema(data) {
  if (typeof data !== "object" || data === null) {
    return false;
  }

  for (const url in data) {
    if (!data.hasOwnProperty(url)) {
      continue;
    }

    const siteData = data[url];

    if (siteData.visits && !isValidVisits(siteData.visits)) {
      return false;
    }

    if (siteData.sessions && !isValidSessions(siteData.sessions)) {
      return false;
    }
  }

  return true;
}

function resolveLocalStorageData(data) {
  if (!isValidLocalStorageSchema(data)) {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    return;
  }
  return;
}

async function generateScripts() {
  const config = await getConfig();
  const hostnameList = config.hostnameList;
  const jssdkUrl = config.jssdkUrl;
  const jssdkKey = config.jssdkKey;

  // GORA specific
  if (doesHostnameMatch(["gora.golf.rakuten.co.jp"])) {
    // Clear local storage incase of invalid data
    var localStorageData = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (localStorageData) {
      resolveLocalStorageData(localStorageData);
    }
  }

  if (doesHostnameMatch(hostnameList)) {
    var script = document.createElement("script");
    script.async = true;
    script.defer = true;
    script.id = jssdkKey;
    script.src = jssdkUrl;
    script.dataset.clientId = clientId;
    script.dataset.ratAccountId = ratAccountId;
    script.dataset.backupSdkSrc = pitariUrl;
    script.dataset.ratApiAccountSrc = "https://rat.rakuten.co.jp";

    document.body.appendChild(script);

    return;
  }

  var script = document.createElement("script");
  script.async = true;
  script.defer = true;
  script.src = pitariUrl;
  document.body.appendChild(script);
}

generateScripts();
